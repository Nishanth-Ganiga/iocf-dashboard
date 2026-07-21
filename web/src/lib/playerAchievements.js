// Cross-references a player's name against every award/honor mentioned
// anywhere else in the dashboard payload — there's no single "player
// achievements" collection in the workbook; honors are scattered across
// the T20 World Cup awards table, every franchise league's own awards +
// match-by-match Man of the Match/Best Batsman/Best Bowler columns, the
// Hall of Fame cards, WTC completed matches, the Emerging Talent League's
// match MOTMs, and the Lone Warrior's champion/runner-up — so this builds
// one lookup index by scanning all of them once.
//
// Matching is exact-string only (case-insensitive, trimmed, with a
// trailing "(XXX)" board/team-code suffix stripped) — never fuzzy. Several
// award fields only give a first name ("Ram") rather than the full roster
// name ("Ram Thakkar"), and a couple of spellings genuinely differ between
// sheets ("Molly Stephan" vs "Molly Steephan"); fuzzy-matching those would
// risk crediting the wrong player, so this deliberately under-counts
// rather than guesses, consistent with the rest of this codebase's
// "never fabricate — omit rather than guess" approach to messy source data.
function normalizeName(value) {
  if (!value || typeof value !== 'string') return null
  const stripped = value.replace(/\s*\([^)]*\)\s*$/, '').trim()
  return stripped ? stripped.toLowerCase() : null
}

function pushAchievement(index, name, achievement) {
  const key = normalizeName(name)
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

  const wc = data.t20WorldCup
  if (wc) {
    for (const a of wc.awards || []) {
      pushAchievement(index, a.winner, {
        source: 'T20 World Cup 2026',
        title: a.award,
        detail: a.board,
        credits: a.credits,
      })
    }
    for (const [stage, matches] of Object.entries(wc.stages || {})) {
      for (const m of matches) {
        addMatchHonors(index, `T20 World Cup 2026 · ${stage}`, m, m.Schedule)
      }
    }
  }

  for (const league of data.franchiseLeagues || []) {
    for (const a of league.awards || []) {
      pushAchievement(index, a.winner, {
        source: league.name,
        title: a.award,
        detail: a.team || a.board,
        credits: a.credits,
      })
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
      })
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
