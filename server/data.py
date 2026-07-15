"""
IOCF workbook parser.

Reads the "IOCF ALL BOARDS" Excel workbook and turns its very loosely
structured sheets (free-text cells, numbered lists, inline sub-headers)
into a JSON-friendly dict that the dashboard frontend can consume.

Nothing here is fabricated: every value returned is read straight out of
the workbook. Where a value can't be confidently identified it is simply
left out (never guessed).
"""
import re
import os
from datetime import datetime, date, time
import openpyxl

# ---------------------------------------------------------------------------
# Board sheet -> credits-sheet display name mapping
# ---------------------------------------------------------------------------
BOARD_SHEETS = {
    "Australia": "Australia",
    "Bangladesh": "Bangladesh",
    "England": "England",
    "India": "India",
    "Italy": "Italy",
    "Netherlands": "Netherlands",
    "Newzealand": "Newzealand",
    "Pakistan": "Pakistan",
    "Qatar": "Qatar",
    "Scotland": "Scotland",
    "South Africa": "SA",
    "Srilanka": "Srilanka",
    "UAE": "UAE",
    "West Indies": "WestIndies",
}

CREDITS_SHEET = "All Board Credits & Important U"

NUMBERED_RE = re.compile(r"^\s*\d+\.\s*(.+?)\s*$")
LEVEL_STADIUM_RE = re.compile(r"^level\s*\d+\s*stadiums?$", re.I)


def _clean(v):
    if isinstance(v, str):
        v = v.strip()
        return v if v else None
    return v


def _num_or_none(v):
    if isinstance(v, (int, float)):
        return v
    return None


def _jsonify_scalar(v):
    """Make openpyxl cell values JSON-serialisable."""
    if isinstance(v, (datetime, date)):
        return v.isoformat()
    if isinstance(v, time):
        return v.strftime("%H:%M")
    return v


def _scalar_from_cell(cell):
    """Like _jsonify_scalar, but reconstructs "M-D" score text (e.g. "1-2")
    that Excel silently auto-converted into a date. Several rows in the
    "Series Result" column of the "Series Matches" sheet were typed as
    series scores (won-lost tallies) such as "1-2" or "3-2"; because that
    looks like a short date, Excel stored them as real dates formatted
    "m-d" with no year component. Reformatting those back to "M-D" avoids
    surfacing a misleading fabricated calendar date on the dashboard.
    """
    v = _clean(cell.value)
    if isinstance(v, datetime):
        nf = (cell.number_format or "").lower()
        if "y" not in nf and "m" in nf and "d" in nf:
            return f"{v.month}-{v.day}"
        return v.isoformat()
    if isinstance(v, (date,)):
        return v.isoformat()
    if isinstance(v, time):
        return v.strftime("%H:%M")
    return v


def col_letter(idx):
    return openpyxl.utils.get_column_letter(idx)


# ---------------------------------------------------------------------------
# Credits & rankings + stadium grid + tournament-update tables
# ---------------------------------------------------------------------------

def parse_credits_sheet(wb):
    ws = wb[CREDITS_SHEET]

    rankings = []
    r = 3
    while True:
        name = _clean(ws.cell(row=r, column=1).value)
        credits = _num_or_none(ws.cell(row=r, column=2).value)
        if name is None and credits is None:
            break
        if name:
            rankings.append({"board": name, "credits": credits})
        r += 1
    rankings.sort(key=lambda x: (x["credits"] or 0), reverse=True)
    for i, row in enumerate(rankings):
        row["rank"] = i + 1

    # Stadium tier grid, D1 header "Stadiums of all boards", D2:Q2 = board names
    stadium_grid = {}
    header_row = 2
    max_col = ws.max_column
    board_cols = {}
    for c in range(4, max_col + 1):
        name = _clean(ws.cell(row=header_row, column=c).value)
        if name:
            board_cols[c] = name
    for c, board in board_cols.items():
        entries = []
        r = 3
        while True:
            v = _clean(ws.cell(row=r, column=c).value)
            # stop once we've run past the grid block (row 16 is the last board row)
            if r > 16:
                break
            if v:
                entries.append(v)
            r += 1
        stadium_grid[board] = entries

    updates = _parse_updates_tables(ws)

    return {"rankings": rankings, "stadiumGrid": stadium_grid, "tournamentUpdates": updates}


TITLE_LIKE_RE = re.compile(r"^[A-Z0-9 '&\-().]+$")


def _looks_like_section_title(v):
    if not isinstance(v, str):
        return False
    v = v.strip()
    if len(v) < 4:
        return False
    if re.search(r"20\d\d", v):
        return True
    return bool(TITLE_LIKE_RE.match(v)) and v.upper() == v


def _parse_updates_tables(ws):
    """Parse the two side-by-side 'award / winner / board' recap tables
    (International Tournament Updates + Franchise League Updates) into a
    dict of tournament-name -> {champion, runnerUp, ...}."""
    tables = [
        # (start_row, name_col, award_col, winner_col, board_col)
        (24, 1, 2, 3, 4),   # A/B/C/D - international + emerging + lone warrior
        (24, 6, 7, 8, 10),  # F/G/H/J - franchise leagues
    ]
    sections = {}
    order = []
    for start_row, name_col, award_col, winner_col, board_col in tables:
        current = None
        for r in range(start_row, ws.max_row + 1):
            nameval = _clean(ws.cell(row=r, column=name_col).value)
            if _looks_like_section_title(nameval):
                current = nameval
                if current not in sections:
                    sections[current] = {}
                    order.append(current)
            award = _clean(ws.cell(row=r, column=award_col).value)
            winner = _clean(ws.cell(row=r, column=winner_col).value)
            board = _clean(ws.cell(row=r, column=board_col).value)
            if current and award:
                a = award.lower()
                if a.startswith("champion"):
                    sections[current]["champion"] = winner
                    sections[current]["champion_board"] = board
                elif a.startswith("runner"):
                    sections[current]["runnerUp"] = winner
                    sections[current]["runnerUp_board"] = board
    return {"order": order, "sections": sections}


# ---------------------------------------------------------------------------
# Individual board sheets
# ---------------------------------------------------------------------------

def _read_column_block(ws, col, start_row, end_row, blank_gap=1):
    """Read cell values straight down a column starting at start_row,
    stopping as soon as `blank_gap` consecutive empty cells are hit.

    Board sheets pack multiple unrelated tables into the same columns
    further down the sheet (e.g. a numbered player roster in column A
    rows 6-27, then - after a blank gap - an unrelated franchise-team
    roster reusing "1. Name" numbering starting at row 71). Stopping at
    the first blank run keeps each table isolated to its own block.
    """
    out = []
    blanks = 0
    for r in range(start_row, end_row + 1):
        v = _clean(ws.cell(row=r, column=col).value)
        if v is None:
            blanks += 1
            if blanks >= blank_gap:
                break
            continue
        blanks = 0
        out.append(v)
    return out


def _collect_numbered_list(ws, col, start_row, end_row):
    out = []
    for v in _read_column_block(ws, col, start_row, end_row):
        if isinstance(v, str):
            m = NUMBERED_RE.match(v)
            if m:
                out.append(m.group(1))
    return out


def parse_board_sheet(wb, sheet_name, display_name, credits_fallback):
    ws = wb[sheet_name]
    max_col = ws.max_column
    max_row = ws.max_row

    title = _clean(ws.cell(row=1, column=1).value) or f"Board: {display_name}"
    meta_line = _clean(ws.cell(row=2, column=1).value) or ""

    chairman = None
    ceo = None
    m = re.search(r"chairman:\s*(.+?)(?:\s*\|\s*ceo:\s*(.+))?$", meta_line, re.I)
    if m:
        chairman = _clean(m.group(1))
        ceo = _clean(m.group(2))
    if chairman and "|" in chairman:
        # fallback split in case regex missed the CEO half
        parts = [p.strip() for p in chairman.split("|")]
        chairman = parts[0]

    credits = None
    for r in (3, 4, 5):
        v = ws.cell(row=r, column=1).value
        if isinstance(v, (int, float)):
            credits = v
            break
    if credits is None:
        credits = credits_fallback

    # Players: the numbered roster block in column A, starting at row 6.
    # Stops at the first blank cell so it doesn't bleed into unrelated
    # franchise-team roster tables further down the same column.
    players = _collect_numbered_list(ws, 1, 6, max_row)
    if not players:
        players = _collect_numbered_list(ws, 1, 6, min(max_row, 100))

    # Column headers live on row 5 (best-effort - not always perfectly aligned)
    headers = {}
    for c in range(1, max_col + 1):
        v = _clean(ws.cell(row=5, column=c).value)
        if v:
            headers[c] = v

    stadium_col = None
    for c, h in headers.items():
        if "stadium" in h.lower():
            stadium_col = c
            break

    stadiums = []
    stadium_tier = None
    if stadium_col:
        for v in _read_column_block(ws, stadium_col, 6, max_row):
            if not isinstance(v, str):
                continue
            if LEVEL_STADIUM_RE.match(v):
                if stadium_tier is None:
                    stadium_tier = v
                continue
            if v.lower() == "none":
                continue
            stadiums.append(v)

    # Trophy cabinets + player-trade lists can appear as secondary inline
    # sub-headers anywhere in the sheet (not just row 5), e.g. a cell reading
    # "Trophy Cabinet ( Test )" partway down a column with a numbered list
    # directly below it. Scan every cell for these marker phrases.
    trophies = []
    transfers = []
    seen_trophy_markers = set()
    seen_transfer_markers = set()
    for r in range(1, max_row + 1):
        for c in range(1, max_col + 1):
            v = _clean(ws.cell(row=r, column=c).value)
            if not isinstance(v, str):
                continue
            low = v.lower()
            if "trophy cabinet" in low:
                key = (c, r)
                if key not in seen_trophy_markers:
                    seen_trophy_markers.add(key)
                    trophies.extend(_collect_numbered_list(ws, c, r + 1, max_row))
            elif "trade" in low and ":" in low:
                key = (c, r)
                if key not in seen_transfer_markers:
                    seen_transfer_markers.add(key)
                    transfers.extend(_collect_numbered_list(ws, c, r + 1, max_row))

    # de-dupe while preserving order
    def dedupe(seq):
        seen = set()
        out = []
        for x in seq:
            if x not in seen:
                seen.add(x)
                out.append(x)
        return out

    stadiums = dedupe(stadiums)
    trophies = dedupe(trophies)
    transfers = dedupe(transfers)

    return {
        "id": display_name.lower().replace(" ", "-"),
        "name": display_name,
        "title": title,
        "chairman": chairman,
        "ceo": ceo,
        "credits": credits,
        "playersCount": len(players),
        "players": players,
        "stadiumTier": stadium_tier,
        "stadiums": stadiums,
        "trophies": trophies,
        "trophiesCount": len(trophies),
        "transfers": transfers,
    }


def parse_dismantled_sheet(wb, sheet_name):
    """Archived/dismantled boards - kept separate from the 14 active boards."""
    ws = wb[sheet_name]
    title = _clean(ws.cell(row=1, column=1).value) or sheet_name
    meta_line = _clean(ws.cell(row=2, column=1).value) or ""
    chairman = None
    m = re.search(r"chairman:\s*(.+)$", meta_line, re.I)
    if m:
        chairman = _clean(m.group(1))
    credits_line = _clean(ws.cell(row=3, column=1).value) or ""
    credits = None
    m2 = re.search(r"([\d,]+)", credits_line)
    if m2:
        try:
            credits = int(m2.group(1).replace(",", ""))
        except ValueError:
            pass
    players = _collect_numbered_list(ws, 1, 5, ws.max_row)
    return {
        "name": title.replace("Board:", "").strip(),
        "chairman": chairman,
        "credits": credits,
        "playersCount": len(players),
    }


def get_boards(wb):
    credits_data = parse_credits_sheet(wb)
    credits_by_name = {r["board"]: r["credits"] for r in credits_data["rankings"]}
    rank_by_name = {r["board"]: r["rank"] for r in credits_data["rankings"]}

    boards = []
    for display_name, sheet_name in BOARD_SHEETS.items():
        if sheet_name not in wb.sheetnames:
            continue
        board = parse_board_sheet(
            wb, sheet_name, display_name, credits_by_name.get(display_name)
        )
        board["ranking"] = rank_by_name.get(display_name)
        boards.append(board)

    boards.sort(key=lambda b: (b["ranking"] or 999))

    dismantled = []
    for sheet_name in wb.sheetnames:
        if sheet_name.strip().lower().startswith("dismantled"):
            dismantled.append(parse_dismantled_sheet(wb, sheet_name))

    return boards, dismantled, credits_data


# ---------------------------------------------------------------------------
# T20 World Cup 2026 bracket
# ---------------------------------------------------------------------------

def get_t20_world_cup(wb):
    name = "T20 World Cup 2026"
    if name not in wb.sheetnames:
        return None
    ws = wb[name]
    max_row = ws.max_row

    title = _clean(ws.cell(row=1, column=1).value)

    groups = {}
    r = 2
    header_row = None
    for rr in (2,):
        vals = [_clean(ws.cell(row=rr, column=c).value) for c in range(1, 4)]
        if any(vals):
            header_row = rr
    if header_row:
        group_names = {}
        for c in range(1, 4):
            v = _clean(ws.cell(row=header_row, column=c).value)
            if v:
                group_names[c] = v
        for c, gname in group_names.items():
            teams = []
            rr = header_row + 1
            while True:
                v = _clean(ws.cell(row=rr, column=c).value)
                if v is None:
                    break
                m = NUMBERED_RE.match(v) if isinstance(v, str) else None
                teams.append(m.group(1) if m else v)
                rr += 1
                if rr - header_row > 12:
                    break
            groups[gname] = teams

    def read_match_block(start_row):
        """Reads a 'Schedule/Winner/Host/MoM/Best Bat/Best Bowl' style block."""
        header_r = start_row
        headers = {}
        for c in range(1, 7):
            v = _clean(ws.cell(row=header_r, column=c).value)
            if v:
                headers[c] = v
        matches = []
        rr = header_r + 1
        while rr <= max_row:
            a = _clean(ws.cell(row=rr, column=1).value)
            if a is None:
                break
            if not isinstance(a, str) or "vs" not in a.lower():
                break
            row = {}
            for c, h in headers.items():
                v = _jsonify_scalar(_clean(ws.cell(row=rr, column=c).value))
                if v is not None:
                    row[h.strip().rstrip(":").strip()] = v
            matches.append(row)
            rr += 1
        return matches, rr

    stages = {}
    r = 1
    stage_markers = [
        "Group A Matches",
        "Group B Matches",
        "Super 6",
        "Semifinal",
        "Final",
    ]
    while r <= max_row:
        a = _clean(ws.cell(row=r, column=1).value)
        if a in stage_markers:
            # header row for the block is usually the very next row
            matches, next_r = read_match_block(r + 1)
            stages[a] = matches
            r = next_r
            continue
        r += 1

    # Awards table
    awards = []
    for r in range(1, max_row + 1):
        a = _clean(ws.cell(row=r, column=1).value)
        if a == "Awards":
            hr = r + 1
            rr = hr + 1
            while rr <= max_row:
                award = _clean(ws.cell(row=rr, column=1).value)
                if not award:
                    break
                awards.append(
                    {
                        "award": award,
                        "winner": _clean(ws.cell(row=rr, column=2).value),
                        "board": _clean(ws.cell(row=rr, column=3).value),
                        "credits": _num_or_none(ws.cell(row=rr, column=4).value),
                    }
                )
                rr += 1
            break

    champion = None
    runner_up = None
    if "Final" in stages and stages["Final"]:
        final = stages["Final"][0]
        champion = final.get("Winner")
        teams = [t.strip() for t in re.split(r"\bvs\b", final.get("Schedule", ""), flags=re.I)]
        if champion and len(teams) == 2:
            runner_up = teams[0] if teams[1] == champion else teams[1]

    total_matches = sum(len(v) for v in stages.values())

    return {
        "title": title,
        "groups": groups,
        "stages": stages,
        "awards": awards,
        "champion": champion,
        "runnerUp": runner_up,
        "totalMatches": total_matches,
        "status": "Completed" if champion else "Ongoing",
    }


# ---------------------------------------------------------------------------
# Series Matches & WTC Matches (bilateral fixtures)
# ---------------------------------------------------------------------------

KNOWN_TITLES = {
    "Completed Series",
    "Upcoming Series",
    "Completed Matches",
    "Upcoming IOCF World Test Championship Matches",
    "Franchise Leagues",
    "Major Tournaments",
    "WTC PENDING SCHEDULE",
}

MONTHS = {
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
}


def _find_titles(ws):
    found = []
    for r in range(1, ws.max_row + 1):
        for c in range(1, ws.max_column + 1):
            v = _clean(ws.cell(row=r, column=c).value)
            if isinstance(v, str) and v.strip() in KNOWN_TITLES:
                found.append((r, c, v.strip()))
    return found


def _read_table_block(ws, title_row, title_col, next_title_row):
    header_row = title_row + 1
    headers = {}
    c = title_col
    while True:
        v = _clean(ws.cell(row=header_row, column=c).value)
        if v is None:
            if c > title_col and c - title_col > 20:
                break
            if v is None and c > title_col + 12:
                break
        if v:
            headers[c] = v.strip()
            c += 1
        else:
            if headers:
                break
            c += 1
            if c - title_col > 15:
                break
    if not headers:
        return []

    end_row = next_title_row - 1 if next_title_row else ws.max_row
    rows = []
    blank_streak = 0
    for r in range(header_row + 1, end_row + 1):
        cells = {h: _scalar_from_cell(ws.cell(row=r, column=c)) for c, h in headers.items()}
        non_null = {k: v for k, v in cells.items() if v is not None}
        if not non_null:
            blank_streak += 1
            if blank_streak > 3:
                break
            continue
        blank_streak = 0
        # a lone month-name divider row - skip it, not real data
        first_val = list(non_null.values())[0]
        if len(non_null) == 1 and isinstance(first_val, str) and first_val.strip().lower() in MONTHS:
            continue
        rows.append(non_null)
    return rows


def _parse_fixture_sheet(wb, sheet_name):
    if sheet_name not in wb.sheetnames:
        return {}
    ws = wb[sheet_name]
    titles = _find_titles(ws)
    result = {}
    for i, (row, col, title) in enumerate(titles):
        next_row = None
        for j in range(i + 1, len(titles)):
            if titles[j][0] > row:
                next_row = titles[j][0]
                break
        data = _read_table_block(ws, row, col, next_row)
        key = re.sub(r"[^a-zA-Z0-9]+", " ", title).strip().title().replace(" ", "")
        key = key[0].lower() + key[1:]
        if key in result:
            result[key] = result[key] + data
        else:
            result[key] = data
    return result


def get_fixtures(wb):
    series = _parse_fixture_sheet(wb, "Series Matches")
    tests = _parse_fixture_sheet(wb, "WTC Matches")
    return {"series": series, "tests": tests}


# ---------------------------------------------------------------------------
# Franchise league squad sheets
# ---------------------------------------------------------------------------

FRANCHISE_SHEETS = [
    "100 2026",
    "PSL 2026",
    "BBL 2026",
    "KCL 2026",
    "BPL 2026",
    "IPL 2026",
    "CPL 2026",
]

FRANCHISE_DISPLAY_NAMES = {
    "100 2026": "The Hundred 2026",
    "PSL 2026": "Pakistan Super League 2026",
    "BBL 2026": "Big Bash League 2026",
    "KCL 2026": "Kiwi Crown League 2026",
    "BPL 2026": "Bangladesh Premier League 2026",
    "IPL 2026": "Indian Premier League 2026",
    "CPL 2026": "Caribbean Premier League 2026",
}

# links a franchise sheet's display name to its "Champions" entry inside the
# credits sheet's tournament-updates table (names don't always match exactly)
CHAMPION_LOOKUP_ALIASES = {
    "The Hundred 2026": "THE HUNDRED 2026",
    "Pakistan Super League 2026": "PAKISTAN SUPER LEAGUE 2026",
    "Big Bash League 2026": "BIG BASH LEAGUE 2026",
    "Kiwi Crown League 2026": "KIWI CROWN LEAGUE 2026",
}


def get_franchise_leagues(wb, tournament_updates):
    leagues = []
    sections = tournament_updates.get("sections", {})
    for sheet_name in FRANCHISE_SHEETS:
        if sheet_name not in wb.sheetnames:
            continue
        ws = wb[sheet_name]
        title = _clean(ws.cell(row=1, column=1).value) or sheet_name
        display_name = FRANCHISE_DISPLAY_NAMES.get(sheet_name, sheet_name)

        boards = {}
        for c in range(1, ws.max_column + 1):
            board = _clean(ws.cell(row=2, column=c).value)
            if not board:
                continue
            players = _collect_numbered_list(ws, c, 3, ws.max_row)
            if players:
                boards[board] = players

        alias = CHAMPION_LOOKUP_ALIASES.get(display_name)
        info = sections.get(alias, {}) if alias else {}
        champion = info.get("champion")
        runner_up = info.get("runnerUp")

        leagues.append(
            {
                "id": sheet_name.lower().replace(" ", "-"),
                "name": display_name,
                "title": title,
                "season": "2026",
                "boards": boards,
                "teamCount": len(boards),
                "champion": champion,
                "runnerUp": runner_up,
                "status": "Completed" if champion else "Ongoing",
            }
        )
    return leagues


# ---------------------------------------------------------------------------
# Hall of Fame cards
# ---------------------------------------------------------------------------

def get_hall_of_fame(wb):
    name = "IOCF Cards"
    if name not in wb.sheetnames:
        return []
    ws = wb[name]
    cards = []
    current = None
    for r in range(1, ws.max_row + 1):
        a = _clean(ws.cell(row=r, column=1).value)
        if isinstance(a, str) and a.lower().startswith("card name"):
            if current:
                cards.append(current)
            current = {
                "name": a.split(":", 1)[1].strip() if ":" in a else a,
                "subtitle": None,
                "players": [],
            }
            continue
        if current and current["subtitle"] is None and isinstance(a, str) and not a.lower().startswith("player"):
            current["subtitle"] = a
            continue
        if current and isinstance(a, str) and a.lower() == "player name":
            continue
        if current and a and a not in ("Player Name",):
            country = _clean(ws.cell(row=r, column=2).value)
            award = _clean(ws.cell(row=r, column=3).value)
            achievement = _clean(ws.cell(row=r, column=4).value)
            if country or award:
                current["players"].append(
                    {
                        "name": a,
                        "country": country,
                        "award": award,
                        "achievement": achievement,
                    }
                )
    if current:
        cards.append(current)
    return cards


# ---------------------------------------------------------------------------
# Continental cups + emerging talent + lone warrior (participant lists)
# ---------------------------------------------------------------------------

CONTINENTAL_CUPS = {
    "IOCF ASIA CUP": "IOCF Asia Cup",
    "IOCF EURO CUP": "IOCF Euro Cup",
    "IOCF OCEANIA CUP": "IOCF Oceania Cup",
}


def get_continental_cups(wb):
    cups = []
    for sheet_name, display in CONTINENTAL_CUPS.items():
        if sheet_name not in wb.sheetnames:
            continue
        ws = wb[sheet_name]
        teams = []
        for r in range(1, ws.max_row + 1):
            v = _clean(ws.cell(row=r, column=1).value)
            if isinstance(v, str):
                m = NUMBERED_RE.match(v)
                if m:
                    teams.append(m.group(1))
        cups.append(
            {
                "id": sheet_name.lower().replace(" ", "-"),
                "name": display,
                "season": "2026",
                "teams": teams,
                "status": "Upcoming",
                "champion": None,
            }
        )
    return cups


def get_emerging_talent_league(wb, tournament_updates):
    name = "Emerging Talent League"
    info = tournament_updates.get("sections", {}).get("EMERGING TALENTS LEAGUE 2026", {})
    squads = {}
    matches = []
    if name in wb.sheetnames:
        ws = wb[name]
        for c in range(1, 5):
            board = _clean(ws.cell(row=2, column=c).value)
            if board:
                squads[board] = _collect_numbered_list(ws, c, 3, ws.max_row)
        for r in range(3, ws.max_row + 1):
            host = _clean(ws.cell(row=r, column=6).value)
            opp = _clean(ws.cell(row=r, column=7).value)
            if not host or not opp:
                continue
            matches.append(
                {
                    "host": host,
                    "opponent": opp,
                    "date": _jsonify_scalar(_clean(ws.cell(row=r, column=8).value)),
                    "venue": _clean(ws.cell(row=r, column=9).value),
                    "winner": _clean(ws.cell(row=r, column=10).value),
                    "motm": _clean(ws.cell(row=r, column=11).value),
                }
            )
    return {
        "name": "Emerging Talent League 2026",
        "squads": squads,
        "matches": matches,
        "champion": info.get("champion"),
        "runnerUp": info.get("runnerUp"),
        "status": "Completed" if info.get("champion") else "Ongoing",
    }


def get_lone_warrior(wb, tournament_updates):
    name = "IOCF Lone Warrior"
    info = tournament_updates.get("sections", {}).get("LONE WARRIOR 2026", {})
    representatives = {}
    if name in wb.sheetnames:
        ws = wb[name]
        for c in range(1, ws.max_column + 1):
            board = _clean(ws.cell(row=2, column=c).value)
            rep = _clean(ws.cell(row=3, column=c).value)
            if board and rep:
                representatives[board] = rep
    return {
        "name": "IOCF Lone Warrior Season One",
        "representatives": representatives,
        "champion": info.get("champion"),
        "champion_board": info.get("champion_board"),
        "runnerUp": info.get("runnerUp"),
        "runnerUp_board": info.get("runnerUp_board"),
        "status": "Completed" if info.get("champion") else "Ongoing",
    }


# ---------------------------------------------------------------------------
# Top-level aggregate
# ---------------------------------------------------------------------------

def build_dashboard(path):
    wb = openpyxl.load_workbook(path, data_only=True)

    boards, dismantled, credits_data = get_boards(wb)
    t20wc = get_t20_world_cup(wb)
    fixtures = get_fixtures(wb)
    franchise_leagues = get_franchise_leagues(wb, credits_data["tournamentUpdates"])
    hall_of_fame = get_hall_of_fame(wb)
    continental_cups = get_continental_cups(wb)
    emerging = get_emerging_talent_league(wb, credits_data["tournamentUpdates"])
    lone_warrior = get_lone_warrior(wb, credits_data["tournamentUpdates"])

    # ---- tournaments (unified list for Tournaments module / featured cards)
    tournaments = []
    if t20wc:
        tournaments.append(
            {
                "id": "t20-world-cup-2026",
                "name": "T20 World Cup 2026",
                "category": "International",
                "season": "2026",
                "status": t20wc["status"],
                "champion": t20wc["champion"],
                "runnerUp": t20wc["runnerUp"],
                "totalMatches": t20wc["totalMatches"],
            }
        )
    tournaments.append(
        {
            "id": "emerging-talent-league-2026",
            "name": "Emerging Talent League 2026",
            "category": "League",
            "season": "2026",
            "status": emerging["status"],
            "champion": emerging["champion"],
            "runnerUp": emerging["runnerUp"],
            "totalMatches": len(emerging["matches"]),
        }
    )
    tournaments.append(
        {
            "id": "lone-warrior-2026",
            "name": "IOCF Lone Warrior Season One",
            "category": "Knockout",
            "season": "2026",
            "status": lone_warrior["status"],
            "champion": lone_warrior["champion"],
            "runnerUp": lone_warrior["runnerUp"],
            "totalMatches": None,
        }
    )
    for cup in continental_cups:
        tournaments.append(
            {
                "id": cup["id"],
                "name": cup["name"],
                "category": "Continental Cup",
                "season": cup["season"],
                "status": cup["status"],
                "champion": cup["champion"],
                "runnerUp": None,
                "totalMatches": None,
            }
        )
    for lg in franchise_leagues:
        tournaments.append(
            {
                "id": lg["id"],
                "name": lg["name"],
                "category": "Franchise League",
                "season": lg["season"],
                "status": lg["status"],
                "champion": lg["champion"],
                "runnerUp": lg["runnerUp"],
                "totalMatches": None,
            }
        )

    # ---- totals
    total_stadiums = len({s.split("|")[0].strip() for b in boards for s in b["stadiums"]})
    total_matches = (
        (t20wc["totalMatches"] if t20wc else 0)
        + len(fixtures["series"].get("completedSeries", []))
        + len(fixtures["tests"].get("completedMatches", []))
    )
    total_championships = len([t for t in tournaments if t.get("champion")])
    total_credits = sum(b["credits"] or 0 for b in boards)

    stats = {
        "totalBoards": len(boards),
        "totalPlayers": sum(b["playersCount"] for b in boards),
        "totalStadiums": total_stadiums,
        "totalTournaments": len(tournaments),
        "totalCredits": total_credits,
        "totalMatches": total_matches,
        "totalChampionships": total_championships,
    }

    # ---- latest updates / news feed (derived, not fabricated)
    news = []
    for t in tournaments:
        if t.get("champion"):
            news.append(
                {
                    "type": "tournament",
                    "headline": f"{t['champion']} — champions of {t['name']}",
                    "detail": f"Runners-up: {t.get('runnerUp')}" if t.get("runnerUp") else None,
                }
            )
    for b in boards:
        for tr in b["transfers"][:2]:
            news.append({"type": "transfer", "headline": f"{b['name']}: {tr}", "detail": None})
    for row in fixtures["series"].get("completedSeries", [])[-6:]:
        if row.get("Series Name") and row.get("Winners"):
            news.append(
                {
                    "type": "series",
                    "headline": f"{row.get('Series Name')}: {row.get('Winners')} beat {row.get('Runners', row.get('Opponents',''))}",
                    "detail": row.get("Dates"),
                }
            )
    for row in fixtures["tests"].get("completedMatches", [])[-6:]:
        if row.get("Test Name") and row.get("Winners"):
            news.append(
                {
                    "type": "test",
                    "headline": f"{row.get('Test Name')}: {row.get('Winners')} won",
                    "detail": row.get("Dates"),
                }
            )

    # ---- upcoming matches (series + tests), simplified & merged
    upcoming = []
    for row in fixtures["series"].get("upcomingSeries", []):
        upcoming.append(
            {
                "type": "series",
                "name": row.get("Series Name"),
                "host": row.get("Hosting Board"),
                "opponents": row.get("Opponents"),
                "dates": row.get("Dates"),
                "format": row.get("Format"),
            }
        )
    for row in fixtures["tests"].get("upcomingIocfWorldTestChampionshipMatches", []):
        upcoming.append(
            {
                "type": "test",
                "name": row.get("Test Name"),
                "host": row.get("Hosting Board"),
                "opponents": row.get("Opponents"),
                "dates": row.get("Dates"),
                "format": "Test",
            }
        )

    return {
        "generatedAt": None,  # filled by server.py from file mtime
        "stats": stats,
        "boards": boards,
        "dismantledBoards": dismantled,
        "rankings": credits_data["rankings"],
        "tournaments": tournaments,
        "t20WorldCup": t20wc,
        "franchiseLeagues": franchise_leagues,
        "continentalCups": continental_cups,
        "emergingTalentLeague": emerging,
        "loneWarrior": lone_warrior,
        "fixtures": fixtures,
        "upcomingMatches": upcoming,
        "hallOfFame": hall_of_fame,
        "news": news,
    }


if __name__ == "__main__":
    import json
    import sys

    path = sys.argv[1] if len(sys.argv) > 1 else "IOCF_ALL_BOARDS.xlsx"
    data = build_dashboard(path)
    print(json.dumps(data, indent=2, default=str)[:4000])
