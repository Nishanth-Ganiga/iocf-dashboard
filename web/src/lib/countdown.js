// Best-effort "in ~N days" label from free-text dates like "8th July" or
// "6th - 10th Jan" — parses the FIRST day+month it finds against the
// current real year. Never fabricates a countdown if parsing fails.
const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
]

export function parseCountdown(dateText) {
  try {
    const match = dateText.match(/(\d{1,2})\w*\s*([A-Za-z]+)/)
    if (!match) return null
    const day = parseInt(match[1], 10)
    const monthAbbrev = match[2].slice(0, 3).toLowerCase()
    const monthIdx = MONTHS.indexOf(monthAbbrev)
    if (monthIdx === -1 || day < 1 || day > 31) return null

    const now = new Date()
    let year = now.getFullYear()
    let target = new Date(year, monthIdx, day)
    // If that date already passed this year by more than a week, assume next year.
    const diffDays = Math.round((target - now) / 86400000)
    if (diffDays < -7) {
      target = new Date(year + 1, monthIdx, day)
    }
    const finalDiff = Math.round((target - now) / 86400000)
    return { label: finalDiff < 0 ? 'happening now' : finalDiff === 0 ? 'today' : `in ~${finalDiff} day${finalDiff === 1 ? '' : 's'}`, days: finalDiff }
  } catch {
    return null
  }
}

// Picks the soonest upcoming fixture out of a list of {dates, ...} rows —
// used for the "Next Big Match" ticker. Rows whose dates cannot be parsed
// are ignored rather than guessed at; if every row is unparseable, returns
// null and the ticker simply does not render.
export function nextUpcomingMatch(matches) {
  let best = null
  let bestDays = Infinity
  for (const m of matches) {
    if (!m.dates) continue
    const countdown = parseCountdown(m.dates)
    if (!countdown) continue
    if (countdown.days < bestDays) {
      bestDays = countdown.days
      best = { ...m, countdown: countdown.label }
    }
  }
  return best
}
