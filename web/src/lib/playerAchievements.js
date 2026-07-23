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
function normalizeName(value) {
  if (!value || typeof value !== 'string') return null
  const stripped = value.replace(/\s*\([^)]*\)\s*$/, '').trim()
  return stripped ? stripped.toLowerCase() : null
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
    if (b.chairman) add(b.chairman)
    if (b.ceo) add(b.ceo)
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
  const key = normalizeName(resolved || name)
  if (!key) return
  if (!index.has(key)) index.set(key, [])
  index.get(key).push(achievement)
}

// A match/fixture row's Man of the Match / Best Batsman / Best Bowler
// fields — the exact key spelling varies slightly between sheets ("Man of
// the match" vs "Man of the Match"), so both are checked.
const MATCH_HONOR_FIELDS = [
  ['Man of the Match', 'Man of the Match'],
  ['Man of the match', 'Man of the Match'],
  ['Best Batsman', 'Best Batsman'],
  ['Best Bowler', 'Best Bowler'],
]

function addMatchHonors(index, source, match, detail) {
  for (const [field, title] of MATCH_HONOR_FIELDS) {
    if (match[field]) {
      pushAchievement(index, match[field], { source, title, detail })
    }
  }
}

// Builds the full name -> achievements[] index once from the whole
// dashboard payload. Cheap enough to rebuild whenever `data` changes
// (a few hundred rows at most) — callers should still wrap this in
// useMemo keyed on `data` to avoid rebuilding on every render.
export function buildAchievementsIndex(data) {
  const index = new Map()
  if (!data) return index

  const boardRosterIndex = buildBoardRosterIndex(data.boards)

  const wc = data.t20WorldCup
  if (wc) {
    for (const a of wc.awards || []) {
      pushAchievement(index, a.winner, {
        source: 'T20 World Cup 2026',
        title: a.award,
        detail: a.board,
        credits: a.credits,
      }, boardRosterIndex, a.board)
    }
    for (const [stage, matches] of Object.entries(wc.stages || {})) {
      for (const m of matches) {
        addMatchHonors(index, `T20 World Cup 2026 · ${stage}`, m, m.Schedule)
      }
    }
  }

  for (const league of data.franchiseLeagues || []) {
    for (const a of league.awards || []) {
      // Team-level trophies (Champions/Runners-up/Fair Play) carry a team
      // name rather than a player name and have no `team` field of their
      // own — only player awards get board-scoped resolution.
      pushAchievement(index, a.winner, {
        source: league.name,
        title: a.award,
        detail: a.team || a.board,
        credits: a.credits,
      }, a.team ? boardRosterIndex : null, a.board)
    }
    for (const m of league.matches || []) {
      addMatchHonors(index, league.name, m, m.Schedule)
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

  const wtcMatches = data.fixtures?.tests?.completedMatches || []
  for (const m of wtcMatches) {
    const detail = m['Test Name'] || [m['Hosting Board'], m['Opponents']].filter(Boolean).join(' vs ')
    addMatchHonors(index, 'World Test Championship', m, detail)
  }

  const etl = data.emergingTalentLeague
  if (etl) {
    for (const m of etl.matches || []) {
      if (m.motm) {
        pushAchievement(index, m.motm, {
          source: etl.name || 'Emerging Talent League 2026',
          title: 'Man of the Match',
          detail: [m.host, m.opponent].filter(Boolean).join(' vs '),
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
