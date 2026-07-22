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
        })
      }
    }
  }
  return squads
}
