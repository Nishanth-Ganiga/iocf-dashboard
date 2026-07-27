// Derives a player's "IOCF Badges" — a cabinet of earned honors computed
// purely from data already surfaced elsewhere (the achievements index and
// the franchise-squad/board profile), no new fields or fabrication. Each
// badge is a simple, explainable rule over that existing data; if the rule
// doesn't hold the badge just doesn't appear — nothing is inferred beyond
// what the sheets actually recorded.
function countTitle(achievements, titles) {
  const set = new Set(titles)
  return achievements.filter((a) => set.has(a.title)).length
}

function hasTitle(achievements, titles) {
  return countTitle(achievements, titles) > 0
}

// The Fair Play trophy has no dedicated league field (unlike champion/
// runnerUp) — it only shows up as a team-level award row (winner is the
// team name, `team`/`board` both null). Title spelling varies per league.
const FAIR_PLAY_TITLES = new Set(['Fair Play Award', 'Spirit of Crown (Fair Play Award)'])

// Team names vary between a league's `teams` roster keys and its
// `champion`/`runnerUp`/award-`winner` strings — not just casing (one
// column ALL CAPS, another Title Case for the same team), but occasionally
// a shortened form of the same club (e.g. "Hyderabad Kings" vs the
// roster's "HYDERABAD KINGSMEN"). A safe tolerance: same word count, and
// every word pair either identical or one a >=4-char prefix of the other —
// enough to bridge real sheet variants without conflating two different teams.
export function sameTeam(a, b) {
  if (!a || !b) return false
  const na = a.trim().toLowerCase()
  const nb = b.trim().toLowerCase()
  if (na === nb) return true
  const wa = na.split(/\s+/)
  const wb = nb.split(/\s+/)
  if (wa.length !== wb.length) return false
  return wa.every((w, i) => {
    const v = wb[i]
    if (w === v) return true
    const [short, long] = w.length <= v.length ? [w, v] : [v, w]
    return short.length >= 4 && long.startsWith(short)
  })
}

// Resolves whether a franchise team won the Champion/Runner-up/Fair Play
// trophy for its league — used both to badge a player and to tag their
// squad card, so both surfaces stay in sync from one source of truth.
export function teamHonorFor(data, leagueId, team) {
  const league = (data.franchiseLeagues || []).find((l) => l.id === leagueId)
  if (!league || !team) return null
  if (sameTeam(league.champion, team)) return 'champion'
  if (sameTeam(league.runnerUp, team)) return 'runner-up'
  const fairPlayWinner = (league.awards || []).find((a) => FAIR_PLAY_TITLES.has(a.award) && !a.team)?.winner
  if (sameTeam(fairPlayWinner, team)) return 'fair-play'
  return null
}

// Buckets an achievement's `source` string into the underlying competition
// type rather than the exact league/edition — used by the All-Format Star
// badge so 3 honors in 3 different franchise leagues don't count the same
// as honors spread across 3 genuinely different kinds of competition.
function achievementFormat(source, loneWarrior) {
  if (source.startsWith('T20 World Cup')) return 'T20 World Cup'
  if (source.startsWith('Hall of Fame ·')) return 'Hall of Fame'
  if (source === 'World Test Championship') return 'World Test Championship'
  if (loneWarrior?.name && source === loneWarrior.name) return 'Lone Warrior'
  if (source.includes('Lone Warrior')) return 'Lone Warrior'
  if (source.includes('Emerging Talent')) return 'Emerging Talent League'
  return 'Franchise League'
}

// Auction credits assigned to a franchise pick swing widely (300 to
// 80,000 across every roster on record) — 25,000+ sits around the top 5%
// of real picks, high enough to single out a genuine marquee-money buy
// rather than an arbitrary round number.
const BIG_MONEY_THRESHOLD = 25000

// Emerging Talent League squad rosters only ever record a bare first name
// (occasionally with an "(Exp)" experience tag, stripped like every other
// trailing-parenthetical suffix elsewhere in this codebase) — so matching
// is name-only, same tolerance as the rest of the badge/profile lookups.
function normalizeName(value) {
  if (!value || typeof value !== 'string') return null
  const stripped = value.replace(/\s*\([^)]*\)\s*$/, '').trim()
  return stripped ? stripped.toLowerCase() : null
}

function isEmergingTalentPick(data, name) {
  const key = normalizeName(name)
  if (!key) return false
  const squads = data.emergingTalentLeague?.squads || {}
  return Object.values(squads).some((roster) =>
    (roster || []).some((entry) => normalizeName(entry) === key)
  )
}

export function computeBadges(data, name, { home, squads, achievements, boards }) {
  const badges = []

  // --- Performance badges ------------------------------------------------
  const motm = countTitle(achievements, ['Man of the Match'])
  if (motm >= 3) {
    badges.push({ key: 'serial-winner', label: 'Serial Match-Winner', detail: `${motm} Man of the Match awards` })
  }
  const bestBat = countTitle(achievements, ['Best Batsman'])
  if (bestBat >= 3) {
    badges.push({ key: 'run-machine', label: 'Run Machine', detail: `${bestBat} Best Batsman honors` })
  }
  const bestBowl = countTitle(achievements, ['Best Bowler'])
  if (bestBowl >= 3) {
    badges.push({ key: 'wicket-king', label: 'Wicket King', detail: `${bestBowl} Best Bowler honors` })
  }
  if (achievements.length >= 5) {
    badges.push({ key: 'award-magnet', label: 'Award Magnet', detail: `${achievements.length} career honors` })
  }

  // --- Tournament badges ---------------------------------------------------
  const wcChampionBoard = data.t20WorldCup?.champion
  if (wcChampionBoard && home?.board?.name === wcChampionBoard) {
    badges.push({ key: 'world-champion', label: 'World Champion Board', detail: `Represents ${wcChampionBoard} — T20 World Cup 2026 champions` })
  }
  if (achievements.some((a) => a.source === 'T20 World Cup 2026' || a.source.startsWith('T20 World Cup 2026 ·'))) {
    badges.push({ key: 'world-cup-hero', label: 'World Cup Hero', detail: 'Named in a T20 World Cup 2026 award or match honor' })
  }
  const championSquads = squads.filter((s) => teamHonorFor(data, s.leagueId, s.team) === 'champion')
  if (championSquads.length >= 1) {
    badges.push({ key: 'franchise-champion', label: 'Franchise Champion', detail: `${championSquads[0].team} — ${championSquads[0].league}` })
  }
  if (championSquads.length >= 2) {
    badges.push({ key: 'franchise-serial-champion', label: 'Serial Champion', detail: `Won ${championSquads.length} franchise league titles` })
  }
  const runnerUpSquad = squads.find((s) => teamHonorFor(data, s.leagueId, s.team) === 'runner-up')
  if (runnerUpSquad) {
    badges.push({ key: 'franchise-runner-up', label: 'Franchise Runner-up', detail: `${runnerUpSquad.team} — ${runnerUpSquad.league}` })
  }
  const fairPlaySquad = squads.find((s) => teamHonorFor(data, s.leagueId, s.team) === 'fair-play')
  if (fairPlaySquad) {
    badges.push({ key: 'franchise-fair-play', label: 'Fair Play Squad', detail: `${fairPlaySquad.team} — ${fairPlaySquad.league}` })
  }
  const bigMoneyPick = squads.find((s) => s.credits != null && s.credits >= BIG_MONEY_THRESHOLD)
  if (bigMoneyPick) {
    badges.push({ key: 'big-money-buy', label: 'Big-Money Buy', detail: `Picked by ${bigMoneyPick.team} for ${bigMoneyPick.credits.toLocaleString()} credits` })
  }
  if (hasTitle(achievements, ['Player of the Tournament', 'Man of the Tournament', 'Crowned Warrior (Player of the Tournament)'])) {
    badges.push({ key: 'player-of-tournament', label: 'Player of the Tournament', detail: 'Named Player/Man of the Tournament' })
  }
  const loneWarrior = data.loneWarrior
  if (loneWarrior?.champion === name) {
    badges.push({ key: 'lone-warrior-champion', label: 'Lone Warrior Champion', detail: loneWarrior.name || 'IOCF Lone Warrior' })
  } else if (loneWarrior?.runnerUp === name) {
    badges.push({ key: 'lone-warrior-finalist', label: 'Lone Warrior Finalist', detail: loneWarrior.name || 'IOCF Lone Warrior' })
  }

  // A career honor can only come from a handful of distinct competition
  // types (T20 World Cup, a franchise league, Hall of Fame, WTC, Emerging
  // Talent League, Lone Warrior) — grouping by type rather than by exact
  // `source` string means winning honors in 3 different franchise leagues
  // doesn't count as "all-format" the way winning across 3 genuinely
  // different competitions should.
  const formats = new Set(achievements.map((a) => achievementFormat(a.source, loneWarrior)))
  if (formats.size >= 3) {
    badges.push({ key: 'all-format-star', label: 'All-Format Star', detail: `Honored across ${formats.size} different competitions` })
  }

  // --- Career / role badges -------------------------------------------------
  if (squads.some((s) => s.role === 'Captain')) {
    badges.push({ key: 'captains-armband', label: "Captain's Armband", detail: 'Named Captain of a franchise squad' })
  }
  if (squads.some((s) => s.role === 'Vice-Captain')) {
    badges.push({ key: 'vice-captains-armband', label: "Vice-Captain's Armband", detail: 'Named Vice-Captain of a franchise squad' })
  }
  if (squads.some((s) => s.role === 'Marquee')) {
    badges.push({ key: 'marquee-signing', label: 'Marquee Signing', detail: 'Picked as a Marquee player' })
  }
  if (squads.some((s) => s.role === 'Direct Signing')) {
    badges.push({ key: 'direct-signing', label: 'Direct Signing', detail: 'Picked as a Direct Signing' })
  }
  if (squads.length >= 3) {
    badges.push({ key: 'franchise-veteran', label: 'Franchise Veteran', detail: `${squads.length} franchise league squads` })
  }
  if (boards.length > 1) {
    badges.push({ key: 'multi-board-journeyman', label: 'Multi-Board Journeyman', detail: `Represented ${boards.length} boards` })
  }
  if (isEmergingTalentPick(data, name)) {
    badges.push({ key: 'rising-star', label: 'Rising Star', detail: `Picked in the ${data.emergingTalentLeague.name} squad` })
  }
  if ((home?.role === 'Chairman' || home?.role === 'CEO') && squads.length > 0) {
    badges.push({ key: 'player-executive', label: 'Player-Executive', detail: `${home.role} of ${home.board.name} and an active franchise player` })
  }

  // --- Legacy badge ----------------------------------------------------------
  if (achievements.some((a) => a.source.startsWith('Hall of Fame ·'))) {
    badges.push({ key: 'hall-of-famer', label: 'IOCF Hall of Famer', detail: 'Inducted into the Hall of Fame' })
  }

  return badges
}
