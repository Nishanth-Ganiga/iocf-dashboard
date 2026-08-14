import { cleanEntryKey, shortNameMatches, boardCandidateNames } from './playerProfile'
import {
  IconMedal, IconBat, IconWicketKing, IconStarsStack, IconSpecialistAward, IconEarth,
  IconGlobe, IconChampion, IconTrophy, IconFairPlay, IconCredits, IconDuel, IconCaptain,
  IconGem, IconPurse, IconJourney, IconRisingStar, IconCrown, IconHallOfFame, IconDualRole,
  IconTestPurist,
} from './icons'

// One icon per badge key — shared by PlayerDetail.jsx's badge cabinet and
// Achievers.jsx's Top Badge Holders leaderboard, so both surfaces render
// the exact same icon for a given badge.
export const BADGE_ICONS = {
  'serial-winner': IconMedal,
  'run-machine': IconBat,
  'wicket-king': IconWicketKing,
  'award-magnet': IconStarsStack,
  'specialist-award': IconSpecialistAward,
  'world-champion': IconEarth,
  'world-cup-hero': IconGlobe,
  'continental-champion': IconEarth,
  'franchise-champion': IconChampion,
  'franchise-serial-champion': IconTrophy,
  'franchise-runner-up': IconMedal,
  'franchise-fair-play': IconFairPlay,
  'big-money-buy': IconCredits,
  'player-of-tournament': IconTrophy,
  'lone-warrior-champion': IconDuel,
  'lone-warrior-finalist': IconDuel,
  'all-format-star': IconStarsStack,
  'captains-armband': IconCaptain,
  'vice-captains-armband': IconCaptain,
  'marquee-signing': IconGem,
  'direct-signing': IconPurse,
  'franchise-veteran': IconJourney,
  'multi-board-journeyman': IconJourney,
  'rising-star': IconRisingStar,
  'womens-global-league': IconGlobe,
  'player-executive': IconCrown,
  'hall-of-famer': IconHallOfFame,
  'dual-role': IconDualRole,
  'test-purist': IconTestPurist,
}

// Derives a player's "IOCF Badges" — a cabinet of earned honors computed
// purely from data already surfaced elsewhere (the achievements index and
// the franchise-squad/board profile), no new fields or fabrication. Each
// badge is a simple, explainable rule over that existing data; if the rule
// doesn't hold the badge just doesn't appear — nothing is inferred beyond
// what the sheets actually recorded.
//
// Every badge carries, alongside its short `detail` summary, a `criteria`
// (the general rule anyone would need to meet) and `evidence` (the exact
// facts *this* player's data satisfied it with) — the click-through detail
// view in PlayerDetail.jsx renders both so "why did I get this?" always has
// a concrete, traceable answer.
function describeAchievement(a) {
  return `${a.title}${a.detail ? ` — ${a.detail}` : ''} (${a.source})`
}

// The Fair Play trophy has no dedicated league field (unlike champion/
// runnerUp) — it only shows up as a team-level award row (winner is the
// team name, `team`/`board` both null). Title spelling varies per league.
const FAIR_PLAY_TITLES = new Set(['Fair Play Award', 'Spirit of Crown (Fair Play Award)'])

// Every franchise league (and the T20 World Cup) hands out its own set of
// specialist-skill awards on top of Man of the Match/Best Batsman/Best
// Bowler — Most Sixes, Emerging Player, Purple/Orange Cap, Best Captain,
// etc. Titles are reused verbatim across leagues but a few leagues rename
// them with their own flavour text (Kiwi Crown League's "The Thunder
// Striker (Most Sixes)", IPL's plain "Purple Cap"), so this groups every
// variant spelling under one badge rather than shipping a near-empty
// single-purpose badge per exact title. "Best Captain"/"Player of the
// Tournament"-family and Fair Play titles already have their own badges,
// so they're deliberately excluded here to avoid double-counting.
const SPECIALIST_AWARD_TITLES = new Set([
  'Most Sixes',
  'The Thunder Striker (Most Sixes)',
  'Emerging Player',
  'Rise of the crown (Emerging Player)',
  'Purple Cap',
  'Orange Cap',
  'Economical Bowler',
  'Best Economy',
  'Best Young Player',
  'Fastest Century',
  'Fastest Fifty',
  'Highest Individual Score',
  'Most Fours',
  'Most Maidens',
  'Most Dot Balls',
  'Best Bat Average',
  'Best Bowl Figure',
  'Best Captain',
])

// Team names vary between a league's `teams` roster keys and its
// `champion`/`runnerUp`/award-`winner` strings — not just casing (one
// column ALL CAPS, another Title Case for the same team), but occasionally
// a shortened form of the same club (e.g. "Hyderabad Kings" vs the
// roster's "HYDERABAD KINGSMEN"), and CPL's team-name headers carry a
// trailing country flag emoji ("Jamaica Kingsmen 🇯🇲") that the
// champion/runnerUp/awards columns don't repeat — stripped before
// comparing so it doesn't get counted as an extra "word" and fail the
// word-count check below. A safe tolerance otherwise: same word count,
// and every word pair either identical or one a >=4-char prefix of the
// other — enough to bridge real sheet variants without conflating two
// different teams.
const TRAILING_EMOJI_RE = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\s]+$/u

export function sameTeam(a, b) {
  if (!a || !b) return false
  const na = a.trim().toLowerCase().replace(TRAILING_EMOJI_RE, '')
  const nb = b.trim().toLowerCase().replace(TRAILING_EMOJI_RE, '')
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

function emergingTalentBoards(data, name) {
  const key = normalizeName(name)
  if (!key) return []
  const squads = data.emergingTalentLeague?.squads || {}
  return Object.entries(squads)
    .filter(([, roster]) => (roster || []).some((entry) => normalizeName(entry) === key))
    .map(([board]) => board)
}

// Womens Global League squad rosters use the same "Name (C)" captain-tag
// format as everywhere else — normalizeName's trailing-parenthetical strip
// already handles it, same as Emerging Talent League above.
function womensGlobalLeagueBoards(data, name) {
  const key = normalizeName(name)
  if (!key) return []
  const squads = data.womensGlobalLeague?.squads || {}
  return Object.entries(squads)
    .filter(([, roster]) => (roster || []).some((entry) => normalizeName(entry) === key))
    .map(([board]) => board)
}

// A player's name can independently show up in a board's `umpires` list too
// (same board or a different one — umpiring assignments aren't restricted
// to your own board). Exact-spelling matches are checked globally, same as
// before. On top of that, umpire lists commonly record only a shortened
// first name ("Akshay" for "Akshay Varnam", "Noor" for "Mohammad Noor") —
// the same shorthand already handled for franchise squads in
// playerProfile.js. That shorthand is only trusted when it resolves to
// exactly one candidate (player/Chairman/CEO) on the SAME board the umpire
// is listed under — never guessed across boards — which is what kept the
// franchise-squad resolver safe and applies just as well here.
function boardsUmpiredFor(data, name) {
  const key = normalizeName(name)
  if (!key) return []
  const boards = []
  for (const b of data.boards || []) {
    const umpires = b.umpires || []
    if (umpires.some((u) => normalizeName(u.name) === key)) {
      boards.push(b.name)
      continue
    }
    const candidates = boardCandidateNames(data, b.name)
    const fuzzyMatch = umpires.some((u) => {
      const entryKey = cleanEntryKey(u.name)
      if (!entryKey) return false
      const matches = candidates.filter((c) => shortNameMatches(entryKey, normalizeName(c)))
      return matches.length === 1 && normalizeName(matches[0]) === key
    })
    if (fuzzyMatch) boards.push(b.name)
  }
  return boards
}

export function computeBadges(data, name, { home, squads, achievements, boards }) {
  const badges = []

  // --- Performance badges ------------------------------------------------
  const motmAchievements = achievements.filter((a) => a.title === 'Man of the Match')
  if (motmAchievements.length >= 3) {
    badges.push({
      key: 'serial-winner',
      label: 'Serial Match-Winner',
      detail: `${motmAchievements.length} Man of the Match awards`,
      criteria: 'Awarded to players with 3 or more Man of the Match honors across their career.',
      evidence: motmAchievements.map(describeAchievement),
    })
  }
  const bestBatAchievements = achievements.filter((a) => a.title === 'Best Batsman')
  if (bestBatAchievements.length >= 3) {
    badges.push({
      key: 'run-machine',
      label: 'Run Machine',
      detail: `${bestBatAchievements.length} Best Batsman honors`,
      criteria: 'Awarded to players with 3 or more Best Batsman honors across their career.',
      evidence: bestBatAchievements.map(describeAchievement),
    })
  }
  const bestBowlAchievements = achievements.filter((a) => a.title === 'Best Bowler')
  if (bestBowlAchievements.length >= 3) {
    badges.push({
      key: 'wicket-king',
      label: 'Wicket King',
      detail: `${bestBowlAchievements.length} Best Bowler honors`,
      criteria: 'Awarded to players with 3 or more Best Bowler honors across their career.',
      evidence: bestBowlAchievements.map(describeAchievement),
    })
  }
  if (achievements.length >= 5) {
    badges.push({
      key: 'award-magnet',
      label: 'Award Magnet',
      detail: `${achievements.length} career honors`,
      criteria: 'Awarded to players who have accumulated 5 or more career honors of any kind.',
      evidence: achievements.map(describeAchievement),
    })
  }
  const specialistAchievements = achievements.filter((a) => SPECIALIST_AWARD_TITLES.has(a.title))
  if (specialistAchievements.length > 0) {
    badges.push({
      key: 'specialist-award',
      label: 'Specialist Award',
      detail: specialistAchievements[0].title,
      criteria: 'Awarded to players named winner of a specialist-skill award (Most Sixes, Emerging Player, Purple/Orange Cap, Best Captain, and similar) in any competition.',
      evidence: specialistAchievements.map(describeAchievement),
    })
  }
  const testAchievements = achievements.filter(
    (a) => a.source === 'World Test Championship' && ['Man of the Match', 'Best Batsman', 'Best Bowler'].includes(a.title)
  )
  if (testAchievements.length >= 2) {
    badges.push({
      key: 'test-purist',
      label: 'Test Purist',
      detail: `${testAchievements.length} World Test Championship match honors`,
      criteria: 'Awarded to players with 2 or more Man of the Match/Best Batsman/Best Bowler honors specifically from World Test Championship matches.',
      evidence: testAchievements.map(describeAchievement),
    })
  }

  // --- Tournament badges ---------------------------------------------------
  const wcChampionBoard = data.t20WorldCup?.champion
  if (wcChampionBoard && home?.board?.name === wcChampionBoard) {
    badges.push({
      key: 'world-champion',
      label: 'World Champion Board',
      detail: `Represents ${wcChampionBoard} — T20 World Cup 2026 champions`,
      criteria: "Awarded to every player of the national board that won the T20 World Cup 2026.",
      evidence: [`${wcChampionBoard} won the T20 World Cup 2026`, `${name} represents ${wcChampionBoard}`],
    })
  }
  const worldCupAchievements = achievements.filter(
    (a) => a.source === 'T20 World Cup 2026' || a.source.startsWith('T20 World Cup 2026 ·')
  )
  if (worldCupAchievements.length > 0) {
    badges.push({
      key: 'world-cup-hero',
      label: 'World Cup Hero',
      detail: 'Named in a T20 World Cup 2026 award or match honor',
      criteria: 'Awarded to players named in any T20 World Cup 2026 award or match honor.',
      evidence: worldCupAchievements.map(describeAchievement),
    })
  }
  const continentalCupWins = (data.continentalCups || []).filter(
    (cup) => cup.champion && home?.board?.name === cup.champion
  )
  if (continentalCupWins.length > 0) {
    badges.push({
      key: 'continental-champion',
      label: 'Continental Champion',
      detail: `Represents ${continentalCupWins[0].champion} — ${continentalCupWins[0].name} champions`,
      criteria: 'Awarded to every player of the national board that won a continental cup (Asia/Euro/Oceania Cup).',
      evidence: continentalCupWins.map((cup) => `${cup.champion} won the ${cup.name}`),
    })
  }
  const championSquads = squads.filter((s) => teamHonorFor(data, s.leagueId, s.team) === 'champion')
  if (championSquads.length >= 1) {
    badges.push({
      key: 'franchise-champion',
      label: 'Franchise Champion',
      detail: `${championSquads[0].team} — ${championSquads[0].league}`,
      criteria: "Awarded to every player of a franchise squad that won its league's title.",
      evidence: championSquads.map((s) => `${s.team} — Champions, ${s.league}`),
    })
  }
  if (championSquads.length >= 2) {
    badges.push({
      key: 'franchise-serial-champion',
      label: 'Serial Champion',
      detail: `Won ${championSquads.length} franchise league titles`,
      criteria: 'Awarded to players who have won the title with 2 or more different franchise squads.',
      evidence: championSquads.map((s) => `${s.team} — Champions, ${s.league}`),
    })
  }
  const runnerUpSquad = squads.find((s) => teamHonorFor(data, s.leagueId, s.team) === 'runner-up')
  if (runnerUpSquad) {
    badges.push({
      key: 'franchise-runner-up',
      label: 'Franchise Runner-up',
      detail: `${runnerUpSquad.team} — ${runnerUpSquad.league}`,
      criteria: "Awarded to every player of a franchise squad that finished runner-up in its league.",
      evidence: [`${runnerUpSquad.team} — Runner-up, ${runnerUpSquad.league}`],
    })
  }
  const fairPlaySquad = squads.find((s) => teamHonorFor(data, s.leagueId, s.team) === 'fair-play')
  if (fairPlaySquad) {
    badges.push({
      key: 'franchise-fair-play',
      label: 'Fair Play Squad',
      detail: `${fairPlaySquad.team} — ${fairPlaySquad.league}`,
      criteria: "Awarded to every player of a franchise squad that won its league's Fair Play award.",
      evidence: [`${fairPlaySquad.team} — Fair Play, ${fairPlaySquad.league}`],
    })
  }
  const bigMoneyPicks = squads.filter((s) => s.credits != null && s.credits >= BIG_MONEY_THRESHOLD)
  if (bigMoneyPicks.length > 0) {
    badges.push({
      key: 'big-money-buy',
      label: 'Big-Money Buy',
      detail: `Picked by ${bigMoneyPicks[0].team} for ${bigMoneyPicks[0].credits.toLocaleString()} credits`,
      criteria: `Awarded to players picked for ${BIG_MONEY_THRESHOLD.toLocaleString()}+ credits in a franchise auction — around the top 5% of real auction prices.`,
      evidence: bigMoneyPicks.map((s) => `${s.team} (${s.league}) — ${s.credits.toLocaleString()} credits`),
    })
  }
  const potAchievements = achievements.filter((a) =>
    ['Player of the Tournament', 'Man of the Tournament', 'Crowned Warrior (Player of the Tournament)'].includes(a.title)
  )
  if (potAchievements.length > 0) {
    badges.push({
      key: 'player-of-tournament',
      label: 'Player of the Tournament',
      detail: 'Named Player/Man of the Tournament',
      criteria: 'Awarded to players named Player/Man of the Tournament in any competition.',
      evidence: potAchievements.map(describeAchievement),
    })
  }
  const loneWarrior = data.loneWarrior
  if (loneWarrior?.champion === name) {
    badges.push({
      key: 'lone-warrior-champion',
      label: 'Lone Warrior Champion',
      detail: loneWarrior.name || 'IOCF Lone Warrior',
      criteria: 'Awarded to the champion of the Lone Warrior individual competition.',
      evidence: [`${loneWarrior.name || 'IOCF Lone Warrior'} — Champion`],
    })
  } else if (loneWarrior?.runnerUp === name) {
    badges.push({
      key: 'lone-warrior-finalist',
      label: 'Lone Warrior Finalist',
      detail: loneWarrior.name || 'IOCF Lone Warrior',
      criteria: 'Awarded to the runner-up of the Lone Warrior individual competition.',
      evidence: [`${loneWarrior.name || 'IOCF Lone Warrior'} — Runner-up`],
    })
  }

  // A career honor can only come from a handful of distinct competition
  // types (T20 World Cup, a franchise league, Hall of Fame, WTC, Emerging
  // Talent League, Lone Warrior) — grouping by type rather than by exact
  // `source` string means winning honors in 3 different franchise leagues
  // doesn't count as "all-format" the way winning across 3 genuinely
  // different competitions should.
  const formatCounts = new Map()
  for (const a of achievements) {
    const f = achievementFormat(a.source, loneWarrior)
    formatCounts.set(f, (formatCounts.get(f) || 0) + 1)
  }
  if (formatCounts.size >= 3) {
    badges.push({
      key: 'all-format-star',
      label: 'All-Format Star',
      detail: `Honored across ${formatCounts.size} different competitions`,
      criteria: 'Awarded to players honored across 3 or more genuinely different competition types (not just different editions of the same league).',
      evidence: [...formatCounts.entries()].map(([f, n]) => `${f} — ${n} honor${n > 1 ? 's' : ''}`),
    })
  }

  // --- Career / role badges -------------------------------------------------
  const captainSquads = squads.filter((s) => s.role === 'Captain')
  if (captainSquads.length > 0) {
    badges.push({
      key: 'captains-armband',
      label: "Captain's Armband",
      detail: 'Named Captain of a franchise squad',
      criteria: 'Awarded to players named Captain of any franchise league squad.',
      evidence: captainSquads.map((s) => `Captain — ${s.team}, ${s.league}`),
    })
  }
  const viceCaptainSquads = squads.filter((s) => s.role === 'Vice-Captain')
  if (viceCaptainSquads.length > 0) {
    badges.push({
      key: 'vice-captains-armband',
      label: "Vice-Captain's Armband",
      detail: 'Named Vice-Captain of a franchise squad',
      criteria: 'Awarded to players named Vice-Captain of any franchise league squad.',
      evidence: viceCaptainSquads.map((s) => `Vice-Captain — ${s.team}, ${s.league}`),
    })
  }
  const marqueeSquads = squads.filter((s) => s.role === 'Marquee')
  if (marqueeSquads.length > 0) {
    badges.push({
      key: 'marquee-signing',
      label: 'Marquee Signing',
      detail: 'Picked as a Marquee player',
      criteria: 'Awarded to players picked with Marquee status in any franchise league squad.',
      evidence: marqueeSquads.map((s) => `Marquee — ${s.team}, ${s.league}`),
    })
  }
  const directSquads = squads.filter((s) => s.role === 'Direct Signing')
  if (directSquads.length > 0) {
    badges.push({
      key: 'direct-signing',
      label: 'Direct Signing',
      detail: 'Picked as a Direct Signing',
      criteria: 'Awarded to players picked as a Direct Signing in any franchise league squad.',
      evidence: directSquads.map((s) => `Direct Signing — ${s.team}, ${s.league}`),
    })
  }
  if (squads.length >= 3) {
    badges.push({
      key: 'franchise-veteran',
      label: 'Franchise Veteran',
      detail: `${squads.length} franchise league squads`,
      criteria: 'Awarded to players picked into 3 or more franchise league squads across their career.',
      evidence: squads.map((s) => `${s.team} — ${s.league}`),
    })
  }
  if (boards.length > 1) {
    badges.push({
      key: 'multi-board-journeyman',
      label: 'Multi-Board Journeyman',
      detail: `Represented ${boards.length} boards`,
      criteria: 'Awarded to players who have represented more than one national board (home board plus franchise-squad board tags).',
      evidence: boards,
    })
  }
  const etlBoards = emergingTalentBoards(data, name)
  if (etlBoards.length > 0) {
    badges.push({
      key: 'rising-star',
      label: 'Rising Star',
      detail: `Picked in the ${data.emergingTalentLeague.name} squad`,
      criteria: 'Awarded to players picked into an Emerging Talent League squad roster.',
      evidence: etlBoards.map((b) => `Picked in ${b}'s Emerging Talent League squad`),
    })
  }
  const wglBoards = womensGlobalLeagueBoards(data, name)
  if (wglBoards.length > 0) {
    badges.push({
      key: 'womens-global-league',
      label: 'Womens Global League',
      detail: `Picked in the ${data.womensGlobalLeague.name} squad`,
      criteria: 'Awarded to players picked into a Womens Global League squad roster.',
      evidence: wglBoards.map((b) => `Picked in ${b}'s Womens Global League squad`),
    })
  }
  const umpireBoards = boardsUmpiredFor(data, name)
  if (umpireBoards.length > 0) {
    badges.push({
      key: 'dual-role',
      label: 'Dual Role: Player & Umpire',
      detail: `Also officiates as an umpire for ${umpireBoards.join(', ')}`,
      criteria: 'Awarded to players whose name also appears on a board’s umpire list.',
      evidence: umpireBoards.map((b) => `Listed as an umpire for ${b}`),
    })
  }
  if ((home?.role === 'Chairman' || home?.role === 'CEO') && squads.length > 0) {
    badges.push({
      key: 'player-executive',
      label: 'Player-Executive',
      detail: `${home.role} of ${home.board.name} and an active franchise player`,
      criteria: 'Awarded to a board Chairman/CEO who is also actively picked in a franchise league squad.',
      evidence: [`${home.role} of ${home.board.name}`, ...squads.map((s) => `Also plays for ${s.team} — ${s.league}`)],
    })
  }

  // --- Legacy badge ----------------------------------------------------------
  const hallOfFameAchievements = achievements.filter((a) => a.source.startsWith('Hall of Fame ·'))
  if (hallOfFameAchievements.length > 0) {
    badges.push({
      key: 'hall-of-famer',
      label: 'IOCF Hall of Famer',
      detail: 'Inducted into the Hall of Fame',
      criteria: 'Awarded to players inducted into the IOCF Hall of Fame.',
      evidence: hallOfFameAchievements.map(describeAchievement),
    })
  }

  return badges
}
