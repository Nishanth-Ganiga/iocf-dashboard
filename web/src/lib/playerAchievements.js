// Cross-references a player's name against every award/honor mentioned
// anywhere else in the dashboard payload — there's no single "player
// achievements" collection in the workbook; honors are scattered across
// the T20 World Cup awards table, every franchise league's own awards +
// match-by-match Man of the Match/Best Batsman/Best Bowler columns, the
// Hall of Fame cards, WTC completed matches, the Emerging Talent League's
// match MOTMs, and the Lone Warrior's champion/runner-up — so this builds
// one lookup index by scanning all of them once.
//
// Matching is exact-string by default (case-insensitive, trimmed, with a
// trailing "(XXX)" board/team-code suffix stripped). Some award/Hall of
// Fame rows spell or truncate a name differently than the board roster
// does ("Molly Steephan" vs roster's "Molly Stephan", "Chappy" vs roster's
// "Chappy MK") — but every one of those rows also names the single board
// the honor belongs to (`award.board` / Hall of Fame's `country`). When
// that's true, resolveNameOnBoard below is allowed to fuzzy-resolve the
// name, but ONLY against that one board's own roster (+ chairman/CEO), and
// only when exactly one candidate matches (substring containment, else
// edit-distance <= 1) — never across boards, never with more than one
// candidate. That keeps this codebase's "never fabricate — omit rather
// than guess" rule intact while fixing genuine typos/nicknames instead of
// silently dropping them.
import { splitOfficeHolders, cleanEntryKey, shortNameMatches, extractBoardTags, boardCandidateNames, resolveKnownAlias } from './playerProfile'

function normalizeName(value) {
  if (!value || typeof value !== 'string') return null
  const stripped = value.replace(/\s*\([^)]*\)\s*$/, '').trim()
  return stripped ? stripped.toLowerCase() : null
}

// Same as normalizeName, but also peels off a trailing "- XYZ" board-tag
// suffix (as cleanEntryKey does in playerProfile.js). resolvePoolName
// resolves a shortened match-honor name to a team roster's own full entry
// — but that roster entry can itself still carry its board tag ("Ram
// Thakkar - NZ"), so without this the achievement would get filed under a
// key nothing ever looks it up by (every other lookup here uses a bare
// board-roster name with no tag), silently hiding the honor from that
// player's profile. Also applies playerProfile.js's own manually-verified
// shorthand aliases ("anand ajk"/"anand akj" -> "anand ajikumar") so every
// spelling of the same person's name files under one canonical key instead
// of splitting their honors across several.
function normalizeResolvedName(value) {
  if (!value || typeof value !== 'string') return null
  const key = cleanEntryKey(value)
  if (!key) return null
  return resolveKnownAlias(key) || key
}

// Full Levenshtein edit distance — names here are short (a few words at
// most) and each board roster only has a few dozen entries, so the plain
// O(n*m) DP table is more than fast enough.
function levenshtein(a, b) {
  const la = a.length
  const lb = b.length
  if (la === 0) return lb
  if (lb === 0) return la
  let prev = Array.from({ length: lb + 1 }, (_, j) => j)
  for (let i = 1; i <= la; i++) {
    const cur = [i]
    for (let j = 1; j <= lb; j++) {
      cur[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j - 1], prev[j], cur[j - 1])
    }
    prev = cur
  }
  return prev[lb]
}

// One entry per board: normalized name -> canonical display name, built
// from that board's roster plus its Chairman/CEO (who occasionally turn up
// as award winners too).
function buildBoardRosterIndex(boards) {
  const index = new Map()
  for (const b of boards || []) {
    const boardKey = normalizeName(b.name)
    if (!boardKey) continue
    const members = new Map()
    const add = (raw) => {
      const key = normalizeName(raw)
      if (key && !members.has(key)) members.set(key, raw.trim())
    }
    for (const n of splitOfficeHolders(b.chairman)) add(n)
    for (const n of splitOfficeHolders(b.ceo)) add(n)
    for (const p of b.players || []) add(p)
    index.set(boardKey, members)
  }
  return index
}

// Resolves a raw award/achievement name to the board roster's canonical
// spelling, scoped strictly to the single board the record itself names.
// Returns null (leave unresolved) unless exactly one roster member
// matches — never guesses across boards or between multiple candidates.
function resolveNameOnBoard(boardRosterIndex, rawName, boardName) {
  const key = normalizeName(rawName)
  const boardKey = normalizeName(boardName)
  if (!key || !boardKey) return null
  const members = boardRosterIndex.get(boardKey)
  if (!members) return null
  if (members.has(key)) return members.get(key)

  const contains = []
  for (const [memberKey, display] of members) {
    if (memberKey.includes(key) || key.includes(memberKey)) contains.push(display)
  }
  if (contains.length === 1) return contains[0]

  const close = []
  for (const [memberKey, display] of members) {
    if (levenshtein(memberKey, key) <= 1) close.push(display)
  }
  if (close.length === 1) return close[0]

  return null
}

function pushAchievement(index, name, achievement, boardRosterIndex, boardName) {
  const resolved = boardRosterIndex && boardName
    ? resolveNameOnBoard(boardRosterIndex, name, boardName)
    : null
  const key = normalizeResolvedName(resolved || name)
  if (!key) return
  if (!index.has(key)) index.set(key, [])
  index.get(key).push(achievement)
}

// Award winner/board fields occasionally credit more than one person at
// once ("Arnab Sarkar & Nasrullah Kapri" / "Australia & Pakistan", Big Bash
// League 2026's Most Sixes) — same "&"/","/"and" joiners splitOfficeHolders
// already handles for board Chairman/CEO fields. When the winner and board
// strings split into the same count, each person is paired with their own
// board so both still get correctly board-scoped resolution; otherwise
// (board doesn't name one per winner) each split name falls back to
// unscoped resolution against the whole player pool.
function pushAwardAchievement(index, winner, board, achievement, boardRosterIndex, singleBoardOnly) {
  const winners = splitOfficeHolders(winner)
  if (winners.length <= 1) {
    pushAchievement(index, winner, achievement, singleBoardOnly ? boardRosterIndex : null, board)
    return
  }
  const boards = splitOfficeHolders(board)
  const pairedBoards = boards.length === winners.length ? boards : null
  winners.forEach((w, i) => {
    const b = pairedBoards ? pairedBoards[i] : null
    pushAchievement(index, w, achievement, b && singleBoardOnly ? boardRosterIndex : null, b)
  })
}

function boardRosterNames(boardRosterIndex, boardName) {
  const key = normalizeName(boardName)
  if (!key) return []
  const members = boardRosterIndex.get(key)
  return members ? [...members.values()] : []
}

// A bare "Ram" honor entry is ambiguous against Newzealand's roster (also
// has Gautam Shankara Ram, Ramith Acharya, Tukaram Parabat) — confirmed by
// hand that every such entry means Ram Thakkar specifically, so this skips
// the multi-candidate ambiguity check for that one name. Still only
// applies when Ram Thakkar is actually in the match's own candidate pool —
// never resolved outside the pool it was confirmed against.
const KNOWN_HONOR_ALIASES = {
  ram: 'ram thakkar',
}

// Shared by resolvePoolName, upgradeToBoardCanonical and the global
// fallback below. shortNameMatches is symmetric (it also matches a fuller
// name down to a shorter one), but a franchise team's own roster entry is
// often the shortened form ("Chiranjibi" for "Chiranjibi Samal") — within a
// single match/squad's own small candidate pool, only ever widen a raw
// honor name to a fuller candidate, never shrink an already-fuller name
// down to the roster's shorthand, or a genuine full name gets clobbered
// into an unrelated shorter roster spelling there. `allowShrink` lifts that
// restriction for the untagged global-fallback case below, where the
// candidate pool is every board's entire roster rather than one match's —
// requiring a match to be unique across that whole pool is itself enough
// of a safety bar to allow matching in either direction (this is exactly
// what recovers "Shibasis Nayak" for the board roster's bare "Shibasis").
// `entryKeyOrRaw` may be a raw name or an already-cleaned key.
function resolveUniqueCandidate(entryKeyOrRaw, candidateNames, alreadyKey, allowShrink) {
  const entryKey = alreadyKey ? entryKeyOrRaw : cleanEntryKey(entryKeyOrRaw)
  if (!entryKey || !candidateNames || !candidateNames.length) return null
  const matches = candidateNames.filter((c) => {
    const candidateKey = cleanEntryKey(c)
    return (allowShrink || candidateKey.length >= entryKey.length) && shortNameMatches(entryKey, candidateKey)
  })
  return matches.length === 1 ? matches[0] : null
}

// Match-honor fields ("Bhavin Kumar (LS)") only ever belong to one of the
// two sides that actually played that match — a much narrower, safer
// candidate pool than a whole board/team roster.
function resolvePoolName(rawName, poolNames) {
  const entryKey = cleanEntryKey(rawName)
  if (!entryKey || !poolNames || !poolNames.length) return null

  const alias = KNOWN_HONOR_ALIASES[entryKey]
  if (alias) {
    const aliased = poolNames.find((c) => cleanEntryKey(c) === alias)
    if (aliased) return aliased
  }

  return resolveUniqueCandidate(entryKey, poolNames, true)
}

// A franchise team's own squad listing is often itself a shortened/tagged
// entry ("Gopi(Ind)") rather than the player's home-board canonical name
// ("Gopikrishnan SV") — resolvePoolName can only match against what the
// pool actually contains, so once it lands on a squad-shorthand entry that
// carries exactly one board tag, chase that tag back to the named board's
// own roster (same tag-resolution findFranchiseSquads already trusts) and
// upgrade to the canonical spelling when exactly one candidate matches
// there too.
//
// Some squad entries carry no tag at all ("Shibasis Nayak", a fuller/typo'd
// name with nothing marking which board it's from) — without a tag to scope
// the search, this falls back to matching against every board's roster at
// once, only trusting it when exactly one candidate anywhere matches. A tag
// naming more than one board (ambiguous) or a board-roster name straight
// from rosterForBoard (which never carries a tag to begin with, and is
// already canonical) both correctly fall through to a no-op.
function upgradeToBoardCanonical(data, resolvedName, globalCandidateNames) {
  const tags = extractBoardTags(resolvedName)
  if (tags.length === 1) {
    const candidates = boardCandidateNames(data, tags[0])
    return resolveUniqueCandidate(resolvedName, candidates)
  }
  if (tags.length === 0) {
    return resolveUniqueCandidate(resolvedName, globalCandidateNames, false, true)
  }
  return null
}

// Falls back to a global uniqueness check across every board's own roster
// (players + Chairman/CEO) when the match's own two-sided pool has no
// candidate at all — e.g. a player traded off the roster a Schedule string
// still names for a historical fixture. Only trusted when exactly one
// candidate across all 14 boards matches; ambiguous names (multiple boards
// or multiple same-board players) correctly stay unresolved.
function resolveGlobalName(rawName, globalCandidateNames) {
  return resolveUniqueCandidate(rawName, globalCandidateNames, false, true)
}

// Strips wrapper text around a playoff Schedule string ("Qualifier 1:
// Hyderabad Kingsmen vs Lahore Qalandars", "Eliminator(Welsh vs
// Sunrisers)", "Grand Final: RR vs KKR") down to the bare "A vs B" before
// the two team names are parsed out.
function stripPlayoffPrefix(schedule) {
  const match = schedule.match(/^(?:Qualifier\s*\d*|Eliminator|Grand Final|Finals?|Q\d|SF\d*|E)\s*[:(]\s*(.*?)\)?$/i)
  return match ? match[1] : schedule
}

// Splits a match's Schedule string into its two team/board names. One real
// row ("Sunrisers Leeds vs vs MI London") has an accidental double "vs" —
// collapsed before splitting. Returns null rather than guessing if the
// string doesn't parse into exactly two names.
function splitScheduleTeams(schedule) {
  if (!schedule || typeof schedule !== 'string') return null
  const collapsed = stripPlayoffPrefix(schedule.trim()).replace(/\bvs\s+vs\b/i, 'vs')
  const parts = collapsed.split(/\bvs\b/i).map((p) => p.trim()).filter(Boolean)
  return parts.length === 2 ? parts : null
}

// Strips everything but word characters/spaces/"&" (this also drops CPL's
// emoji flag suffixes, e.g. "Antigua & Barbuda Falcons 🇦🇬") and lowercases,
// so team names compare the same way regardless of decoration.
function cleanTeamName(s) {
  return (s || '').replace(/[^\w\s&]/gu, '').trim().toLowerCase()
}

// Word-by-word closeness for team names: exact, or the shorter word is a
// meaningful (>=4 char) prefix of the longer, or a 1-typo variant at that
// length, or a 2-typo variant once the shorter word is long enough (>=7)
// that a 2-edit gap still can't collide with an unrelated word — needed
// for KCL's "Welllinton"/"Wellington" and "Barbodas"/"Barbados".
function wordsClose(a, b) {
  if (a === b) return true
  const [short, long] = a.length <= b.length ? [a, b] : [b, a]
  if (short.length >= 4 && long.startsWith(short)) return true
  if (short.length >= 4 && levenshtein(a, b) <= 1) return true
  if (short.length >= 7 && levenshtein(a, b) <= 2) return true
  return false
}

// IPL's Schedule strings use 2-4 letter team tags (MI, CSK, RCB...) that
// bear no textual resemblance to the full team name, so word-closeness
// alone can't resolve them — every other league's tags are either full/
// near-full names or initials that already fuzzy-match. Verified against
// this workbook's own IPL roster, including its "GT"/"PKBS" spellings.
const FRANCHISE_TAG_ALIASES = {
  mi: 'mumbai indians',
  csk: 'chennai super kings',
  rcb: 'royal challengers bengaluru',
  kkr: 'kolkata knight riders',
  dc: 'delhi capitals',
  pbks: 'punjab kings',
  pkbs: 'punjab kings',
  rr: 'rajasthan royals',
  srh: 'sunrisers hyderabad',
  gt: 'gujrat titans',
  lsg: 'lucknow super gaints',
}

// Afghanistan was dissolved as an IOCF board and replaced by Qatar — WTC
// completed-match rows and the T20 World Cup's Group B still name
// "Afghanistan" as the Hosting Board/Opponent/participant verbatim (that's
// the historical record, left untouched), but resolving it against the
// current 14-board list must land on Qatar so those match honors join
// Qatar's own roster/candidate pool instead of going unresolved. A future,
// newly-formed Afghanistan board would be a distinct entity — this alias
// only fires when the schedule text says "Afghanistan" and is unrelated to
// however that future board's own records get parsed.
const BOARD_NAME_ALIASES = {
  afghanistan: 'qatar',
}

// Resolves a team/board name parsed out of a Schedule string against the
// known list for that league/tournament — exact match first, then the IPL
// tag-alias table, then word-by-word fuzzy matching. Only trusts the fuzzy
// pass when exactly one known name matches, same "never guess" rule as
// every other resolver in this codebase.
function resolveTeamName(name, knownNames) {
  const target = cleanTeamName(name)
  if (!target || !knownNames || !knownNames.length) return null
  for (const known of knownNames) {
    if (cleanTeamName(known) === target) return known
  }
  const boardAlias = BOARD_NAME_ALIASES[target]
  if (boardAlias) {
    const aliased = knownNames.find((known) => cleanTeamName(known) === boardAlias)
    if (aliased) return aliased
  }
  const alias = FRANCHISE_TAG_ALIASES[target]
  if (alias) {
    const aliased = knownNames.find((known) => cleanTeamName(known) === alias)
    if (aliased) return aliased
  }
  const targetWords = target.split(/\s+/).filter(Boolean)
  const candidates = knownNames.filter((known) => {
    const knownWords = cleanTeamName(known).split(/\s+/).filter(Boolean)
    return targetWords.length <= knownWords.length && targetWords.every((w, i) => wordsClose(w, knownWords[i]))
  })
  return candidates.length === 1 ? candidates[0] : null
}

// A match/fixture row's Man of the Match / Best Batsman / Best Bowler
// fields — the exact key spelling varies slightly between sheets ("Man of
// the match" vs "Man of the Match"), so both are checked. `candidatePool`,
// when given, is the roster of the two sides that actually played this
// match — honor names are tried against it first so shortened/typo'd
// entries ("Bhavin Kumar (LS)") still resolve to the real roster spelling.
const MATCH_HONOR_FIELDS = [
  ['Man of the Match', 'Man of the Match'],
  ['Man of the match', 'Man of the Match'],
  ['Best Batsman', 'Best Batsman'],
  ['Best Bowler', 'Best Bowler'],
]

function addMatchHonors(index, source, match, detail, candidatePool, data, globalCandidateNames) {
  for (const [field, title] of MATCH_HONOR_FIELDS) {
    const raw = match[field]
    if (!raw) continue
    let resolved = candidatePool ? resolvePoolName(raw, candidatePool) : null
    if (resolved) {
      resolved = upgradeToBoardCanonical(data, resolved, globalCandidateNames) || resolved
    } else {
      resolved = resolveGlobalName(raw, globalCandidateNames)
    }
    pushAchievement(index, resolved || raw, { source, title, detail })
  }
}

// Flattens buildBoardRosterIndex's per-board maps into one list of every
// board's canonical player/Chairman/CEO names — the global fallback pool
// for match honors whose own scoped candidate pool comes up empty.
function flattenRosterIndex(boardRosterIndex) {
  const list = []
  for (const members of boardRosterIndex.values()) list.push(...members.values())
  return list
}

// Builds the two-sided player-name candidate pool for a match's Schedule
// string, resolving each parsed team/board name against `knownNames` and
// pulling their rosters from `rosterFor`. Returns null (fall back to
// unscoped resolution) unless the Schedule parses cleanly into exactly two
// names AND both resolve uniquely — never guesses a pool from a partial
// parse.
function matchCandidatePool(schedule, knownNames, rosterFor) {
  const teams = splitScheduleTeams(schedule)
  if (!teams) return null
  const [a, b] = teams
  const resolvedA = resolveTeamName(a, knownNames)
  const resolvedB = resolveTeamName(b, knownNames)
  if (!resolvedA || !resolvedB) return null
  return [...rosterFor(resolvedA), ...rosterFor(resolvedB)]
}

// Builds the full name -> achievements[] index once from the whole
// dashboard payload. Cheap enough to rebuild whenever `data` changes
// (a few hundred rows at most) — callers should still wrap this in
// useMemo keyed on `data` to avoid rebuilding on every render.
export function buildAchievementsIndex(data) {
  const index = new Map()
  if (!data) return index

  const boardRosterIndex = buildBoardRosterIndex(data.boards)
  const boardNames = (data.boards || []).map((b) => b.name)
  const rosterForBoard = (boardName) => boardRosterNames(boardRosterIndex, boardName)
  const globalCandidateNames = flattenRosterIndex(boardRosterIndex)

  const wc = data.t20WorldCup
  if (wc) {
    for (const a of wc.awards || []) {
      pushAwardAchievement(index, a.winner, a.board, {
        source: 'T20 World Cup 2026',
        title: a.award,
        detail: a.board,
        credits: a.credits,
      }, boardRosterIndex, true)
    }
    for (const [stage, matches] of Object.entries(wc.stages || {})) {
      for (const m of matches) {
        const pool = matchCandidatePool(m.Schedule, boardNames, rosterForBoard)
        addMatchHonors(index, `T20 World Cup 2026 · ${stage}`, m, m.Schedule, pool, data, globalCandidateNames)
      }
    }
  }

  for (const league of data.franchiseLeagues || []) {
    const teamNames = Object.keys(league.teams || {})
    const rosterForTeam = (teamName) => (league.teams[teamName]?.players || []).map((p) => p.name)
    for (const a of league.awards || []) {
      // Team-level trophies (Champions/Runners-up/Fair Play) carry a team
      // name rather than a player name and have no `team` field of their
      // own — only player awards get board-scoped resolution.
      pushAwardAchievement(index, a.winner, a.board, {
        source: league.name,
        title: a.award,
        detail: a.team || a.board,
        credits: a.credits,
      }, boardRosterIndex, Boolean(a.team))
    }
    for (const m of league.matches || []) {
      const pool = matchCandidatePool(m.Schedule, teamNames, rosterForTeam)
      addMatchHonors(index, league.name, m, m.Schedule, pool, data, globalCandidateNames)
    }
  }

  for (const card of data.hallOfFame || []) {
    for (const p of card.players || []) {
      pushAchievement(index, p.name, {
        source: `Hall of Fame · ${card.name}`,
        title: p.award,
        detail: p.achievement,
      }, boardRosterIndex, p.country)
    }
  }

  const wtcMatches = data.fixtures?.tests?.worldTestChampionshipCompletedMatches || []
  for (const m of wtcMatches) {
    const detail = m['Test Name'] || [m['Hosting Board'], m['Opponents']].filter(Boolean).join(' vs ')
    const schedule = [m['Hosting Board'], m['Opponents']].filter(Boolean).join(' vs ')
    const pool = matchCandidatePool(schedule, boardNames, rosterForBoard)
    addMatchHonors(index, 'World Test Championship', m, detail, pool, data, globalCandidateNames)
  }

  const etl = data.emergingTalentLeague
  if (etl) {
    for (const m of etl.matches || []) {
      if (m.motm) {
        const schedule = [m.host, m.opponent].filter(Boolean).join(' vs ')
        const pool = matchCandidatePool(schedule, boardNames, rosterForBoard)
        const resolved = pool ? resolvePoolName(m.motm, pool) : null
        const finalResolved = resolved
          ? upgradeToBoardCanonical(data, resolved, globalCandidateNames) || resolved
          : resolveGlobalName(m.motm, globalCandidateNames)
        pushAchievement(index, finalResolved || m.motm, {
          source: etl.name || 'Emerging Talent League 2026',
          title: 'Man of the Match',
          detail: schedule,
        })
      }
    }
  }

  const loneWarrior = data.loneWarrior
  if (loneWarrior) {
    if (loneWarrior.champion) {
      pushAchievement(index, loneWarrior.champion, {
        source: loneWarrior.name || 'IOCF Lone Warrior',
        title: 'Champion',
      })
    }
    if (loneWarrior.runnerUp) {
      pushAchievement(index, loneWarrior.runnerUp, {
        source: loneWarrior.name || 'IOCF Lone Warrior',
        title: 'Runner-up',
      })
    }
  }

  return index
}

export function getAchievementsFor(index, name) {
  const key = normalizeName(name)
  if (!key) return []
  return index.get(key) || []
}
