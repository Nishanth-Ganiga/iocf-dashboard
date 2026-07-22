// Resolves everything the dashboard knows about a single player by exact
// name match: their home board (+ office, if they're a Chairman/CEO who
// also plays), every franchise-league squad they've been picked into (with
// role/credits from that league's own roster), and reuses
// buildAchievementsIndex/getAchievementsFor for their honors list.
//
// Exact-match only, consistent with playerAchievements.js — this file
// leans on the same "(XXX)" suffix stripped, case-insensitive comparison
// so a franchise squad line like "Ram Thakkar(NZ)" still resolves to the
// board roster's "Ram Thakkar".
function normalizeName(value) {
  if (!value || typeof value !== 'string') return null
  const stripped = value.replace(/\s*\([^)]*\)\s*$/, '').trim()
  return stripped ? stripped.toLowerCase() : null
}

export function findHomeBoard(data, name) {
  const key = normalizeName(name)
  if (!key || !data) return null
  for (const b of data.boards || []) {
    if (normalizeName(b.chairman) === key) return { board: b, role: 'Chairman' }
    if (normalizeName(b.ceo) === key) return { board: b, role: 'CEO' }
    if ((b.players || []).some((p) => normalizeName(p) === key)) return { board: b, role: null }
  }
  return null
}

// Every franchise-league team this player was picked into, across every
// league — a player can appear in more than one league's roster.
export function findFranchiseSquads(data, name) {
  const key = normalizeName(name)
  if (!key || !data) return []
  const squads = []
  for (const league of data.franchiseLeagues || []) {
    for (const [teamName, team] of Object.entries(league.teams || {})) {
      const entry = (team.players || []).find((p) => normalizeName(p.name) === key)
      if (entry) {
        squads.push({
          league: league.name,
          leagueId: league.id,
          team: teamName,
          role: entry.role,
          credits: entry.credits,
          note: entry.note,
          boards: extractBoardTags(entry.name),
        })
      }
    }
  }
  return squads
}

// Franchise-squad roster lines often carry a "(XXX)" or "- XXX" suffix
// denoting which national board that pick actually represents (a player
// can be picked by a franchise team from a country other than their own
// board — e.g. "Ram Thakkar(NZ)", "Hashir - Scot", "Adithya(SA) - Trade
// (41k)"). Only tokens that unambiguously resolve to one of the 14 active
// IOCF boards are mapped; role abbreviations ("c", "vc", "ds"...), trade
// values ("41k"), and unrecognized codes are left out rather than guessed
// — consistent with this codebase's "omit, never fabricate" rule.
const BOARD_TAG_ALIASES = {
  aus: 'Australia', australia: 'Australia',
  ban: 'Bangladesh', bd: 'Bangladesh', bangladesh: 'Bangladesh',
  eng: 'England', england: 'England',
  ind: 'India', india: 'India',
  ita: 'Italy', italy: 'Italy',
  ned: 'Netherlands', nl: 'Netherlands', netherlands: 'Netherlands',
  nz: 'Newzealand', newzealand: 'Newzealand',
  pak: 'Pakistan', pakistan: 'Pakistan',
  qatar: 'Qatar', qaatr: 'Qatar', qat: 'Qatar',
  scot: 'Scotland', scotland: 'Scotland',
  sa: 'South Africa',
  sl: 'Srilanka', srilanka: 'Srilanka',
  uae: 'UAE',
  wi: 'West Indies', westindies: 'West Indies',
}

function tagToBoard(tag) {
  const key = tag.toLowerCase().replace(/[^a-z]/g, '')
  return BOARD_TAG_ALIASES[key] || null
}

function extractBoardTags(rawName) {
  if (!rawName) return []
  const boards = new Set()
  for (const paren of rawName.match(/\(([^)]+)\)/g) || []) {
    for (const part of paren.slice(1, -1).split(/[-\s]+/)) {
      const b = tagToBoard(part)
      if (b) boards.add(b)
    }
  }
  const trailing = rawName.match(/-\s*([A-Za-z]+)\s*$/)
  if (trailing) {
    const b = tagToBoard(trailing[1])
    if (b) boards.add(b)
  }
  return [...boards]
}

// Union of a player's home board and every board tag found across their
// franchise squads — the full "teams played for" set, home board first.
export function representedBoards(home, squads) {
  const boards = []
  const seen = new Set()
  const add = (name) => {
    if (name && !seen.has(name)) {
      seen.add(name)
      boards.push(name)
    }
  }
  if (home) add(home.board.name)
  for (const s of squads) for (const b of s.boards) add(b)
  return boards
}
