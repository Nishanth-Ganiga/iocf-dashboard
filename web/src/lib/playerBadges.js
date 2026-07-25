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

// Builds leagueId -> champion team name, so franchise-championship badges
// can compare a player's own squad team against it exactly.
function buildChampionMap(data) {
  const map = new Map()
  for (const league of data.franchiseLeagues || []) {
    if (league.champion) map.set(league.id, league.champion)
  }
  return map
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
  const championMap = buildChampionMap(data)
  const championSquad = squads.find((s) => championMap.get(s.leagueId) === s.team)
  if (championSquad) {
    badges.push({ key: 'franchise-champion', label: 'Franchise Champion', detail: `${championSquad.team} — ${championSquad.league}` })
  }
  if (hasTitle(achievements, ['Player of the Tournament', 'Man of the Tournament', 'Crowned Warrior (Player of the Tournament)'])) {
    badges.push({ key: 'player-of-tournament', label: 'Player of the Tournament', detail: 'Named Player/Man of the Tournament' })
  }
  if (hasTitle(achievements, ['Fair Play Award', 'Spirit of Crown (Fair Play Award)'])) {
    badges.push({ key: 'fair-play', label: 'Fair Play Icon', detail: 'Recognized for the Fair Play Award' })
  }
  const loneWarrior = data.loneWarrior
  if (loneWarrior?.champion === name) {
    badges.push({ key: 'lone-warrior-champion', label: 'Lone Warrior Champion', detail: loneWarrior.name || 'IOCF Lone Warrior' })
  } else if (loneWarrior?.runnerUp === name) {
    badges.push({ key: 'lone-warrior-finalist', label: 'Lone Warrior Finalist', detail: loneWarrior.name || 'IOCF Lone Warrior' })
  }

  // --- Career / role badges -------------------------------------------------
  if (squads.some((s) => s.role === 'Captain')) {
    badges.push({ key: 'captains-armband', label: "Captain's Armband", detail: 'Named Captain of a franchise squad' })
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

  // --- Legacy badge ----------------------------------------------------------
  if (achievements.some((a) => a.source.startsWith('Hall of Fame ·'))) {
    badges.push({ key: 'hall-of-famer', label: 'IOCF Hall of Famer', detail: 'Inducted into the Hall of Fame' })
  }

  return badges
}
