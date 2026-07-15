// Shared helpers: badge color/initials generation for boards, tournaments
// & stadiums that have no logo image in the workbook, plus small
// formatting utilities used across the dashboard.

const PALETTE = [
  ['#d4af37', '#f5cf5c'], // gold
  ['#34e0ff', '#1c8fa8'], // neon blue
  ['#7c5cff', '#c084fc'], // violet
  ['#34e0a1', '#1c9a72'], // emerald
  ['#ff8a5c', '#ff5470'], // coral
  ['#5ca7ff', '#2f5fd6'], // sky
]

function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function colorsFor(name = '') {
  const idx = hashString(name) % PALETTE.length
  return PALETTE[idx]
}

const STOPWORDS = new Set(['of', 'the', 'and', '&', 'league', 'cup', 'trophy', 'international'])

export function initialsFor(name = '', max = 3) {
  const words = name
    .replace(/[()]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w.toLowerCase()))
  if (words.length === 0) return name.slice(0, 2).toUpperCase()
  if (words.length === 1) return words[0].slice(0, Math.min(3, max)).toUpperCase()
  return words
    .slice(0, max)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

// Common 2-3 letter codes for the 14 IOCF boards read out of the workbook -
// falls back to auto-initials for anything else (tournaments, stadiums).
const BOARD_CODES = {
  Australia: 'AUS',
  Bangladesh: 'BAN',
  England: 'ENG',
  India: 'IND',
  Italy: 'ITA',
  Netherlands: 'NED',
  Newzealand: 'NZ',
  Pakistan: 'PAK',
  Qatar: 'QAT',
  Scotland: 'SCO',
  'South Africa': 'SA',
  Srilanka: 'SL',
  UAE: 'UAE',
  'West Indies': 'WI',
}

export function boardCode(name = '') {
  return BOARD_CODES[name] || initialsFor(name, 2)
}

export function formatNumber(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

export function formatCredits(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  return `${sign}${formatNumber(abs)}`
}

export function slugify(str = '') {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
