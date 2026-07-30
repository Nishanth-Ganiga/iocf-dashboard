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
export function normalizeName(value) {
  if (!value || typeof value !== 'string') return null
  const stripped = value.replace(/\s*\([^)]*\)\s*$/, '').trim()
  return stripped ? stripped.toLowerCase() : null
}

// A board's "Chairman:"/"CEO:" cell occasionally credits more than one
// person with the same office in a single string (South Africa's sheet
// reads "Chairman: Srinidhi & Donald Baghwar", no CEO) — split on the
// common joiners so each person is recognized as their own office-holder
// rather than one unmatched combined name.
export function splitOfficeHolders(value) {
  if (!value || typeof value !== 'string') return []
  return value.split(/\s*(?:&|,|\/|\band\b)\s*/i).map((s) => s.trim()).filter(Boolean)
}

export function findHomeBoard(data, name) {
  const key = normalizeName(name)
  if (!key || !data) return null
  for (const b of data.boards || []) {
    if (splitOfficeHolders(b.chairman).some((n) => normalizeName(n) === key)) return { board: b, role: 'Chairman' }
    if (splitOfficeHolders(b.ceo).some((n) => normalizeName(n) === key)) return { board: b, role: 'CEO' }
    if ((b.players || []).some((p) => normalizeName(p) === key)) return { board: b, role: null }
  }
  return null
}

// Full edit distance between two strings — used, like in
// playerAchievements.js, to tolerate a one-character typo/variant between a
// roster entry's name and the board roster's canonical spelling.
function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

// Many franchise-squad lines only carry a shortened first name ("Arnab" for
// "Arnab Sarkar", "Nasrullah - Pak" for "Nasrullah Kapri") — the sheet's own
// shorthand, not a parsing bug. normalizeName() only strips a trailing
// "(...)" once; this also peels off a trailing "- XYZ" board suffix so the
// leftover is just the person's name.
export function cleanEntryKey(rawName) {
  let text = normalizeName(rawName) || ''
  let m
  while ((m = text.match(/\s*-\s*[a-z]+\s*$/))) {
    text = text.slice(0, m.index).trim()
  }
  return text
}

export function shortNameMatches(entryKey, otherKey) {
  if (!entryKey || !otherKey) return false
  if (entryKey === otherKey) return true
  if (entryKey.length >= 3 && (otherKey.includes(entryKey) || entryKey.includes(otherKey))) return true
  if (entryKey.length >= 4 && levenshtein(entryKey, otherKey) <= 1) return true
  // A name can also be recorded with its words reordered or a middle name
  // dropped ("Ahsan Siddiqui" for the roster's "Siddiqui Ahsan", "Princhi
  // Bora" for "Princhi Pratim Bora") — safe to trust once every word in the
  // shorter name also appears as a whole word in the other, since the
  // caller already restricts this to one board's own candidate pool and
  // requires the match to be unique there.
  const entryTokens = entryKey.split(/\s+/).filter(Boolean)
  const otherTokens = otherKey.split(/\s+/).filter(Boolean)
  if (entryTokens.length >= 2 && otherTokens.length >= 2 && entryTokens.every((t) => otherTokens.includes(t))) {
    return true
  }
  return false
}

// A handful of franchise-roster shorthand spellings don't come close
// enough to the full name for shortNameMatches to trust automatically
// ("Ajk"/"AKJ" vs "Ajikumar" is neither a prefix nor a 1-typo variant) —
// and loosening that check generally would risk conflating them with an
// unrelated player who has a similarly-spelled name on the same board
// (Australia's own roster also has a distinct "Arjun Akj"). Each entry
// below is a specific shorthand -> full-name pairing manually verified
// against the underlying sheets (same team/league context, same board
// tag), not a guessed rule.
const KNOWN_NAME_ALIASES = {
  'anand ajk': 'anand ajikumar',
  'anand akj': 'anand ajikumar',
}

function resolveKnownAlias(rawName) {
  return KNOWN_NAME_ALIASES[cleanEntryKey(rawName)] || null
}

// Every name tied to a board (players + Chairman/CEO, who occasionally get
// picked into franchise squads too) — the candidate pool a shortened roster
// name is allowed to resolve against.
export function boardCandidateNames(data, boardName) {
  const board = (data.boards || []).find((b) => b.name === boardName)
  if (!board) return []
  return [...(board.players || []), ...splitOfficeHolders(board.chairman), ...splitOfficeHolders(board.ceo)]
}

// A shortened roster entry only resolves to `targetKey` if it carries
// exactly one board tag, that tag is the target's own home board (known in
// advance — not guessed), and within that one board's full name list the
// target is the *only* candidate the shortened name plausibly matches.
// That last check is what keeps this safe from cross-board or
// same-board-different-player false positives, at the cost of leaving a
// genuinely ambiguous shortened name unresolved rather than guessing.
function resolvesToTarget(data, entryName, targetKey, homeBoardName) {
  if (!homeBoardName) return false
  const tags = extractBoardTags(entryName)
  if (tags.length !== 1 || tags[0] !== homeBoardName) return false
  const entryKey = cleanEntryKey(entryName)
  if (!entryKey) return false
  const candidates = boardCandidateNames(data, homeBoardName)
  const matches = candidates.filter((c) => shortNameMatches(entryKey, normalizeName(c)))
  return matches.length === 1 && normalizeName(matches[0]) === targetKey
}

// Every franchise-league team this player was picked into, across every
// league — a player can appear in more than one league's roster. Tries an
// exact name match first, then a known verified alias, then falls back to
// the shortened-name resolver above so squads picked under a
// first-name-only/shorthand entry still link back to the right player.
export function findFranchiseSquads(data, name) {
  const key = normalizeName(name)
  if (!key || !data) return []
  const home = findHomeBoard(data, name)
  const homeBoardName = home?.board?.name || null
  const squads = []
  for (const league of data.franchiseLeagues || []) {
    for (const [teamName, team] of Object.entries(league.teams || {})) {
      const entry = (team.players || []).find(
        (p) =>
          normalizeName(p.name) === key ||
          resolveKnownAlias(p.name) === key ||
          resolvesToTarget(data, p.name, key, homeBoardName)
      )
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
//
// Afghanistan was dissolved and replaced by Qatar as an IOCF board — the
// same players (Anas Asim, Saad Rizwan, Huzaifa Imran, Adnan Khalid...)
// now sit on Qatar's roster, confirmed against Qatar's actual player list.
// A future Afghanistan board will be a distinct, newly-formed entity, so
// "Afg"/"Afghanistan" tags on existing records are mapped to Qatar rather
// than left to point at a board that no longer has any roster to resolve
// against.
const BOARD_TAG_ALIASES = {
  afg: 'Qatar', afghanistan: 'Qatar',
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

export function extractBoardTags(rawName) {
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
