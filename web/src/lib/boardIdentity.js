// Flag + mascot identity for each of the 14 active IOCF boards, keyed by
// the exact `board.name` string the API returns (see server/data.py's
// BOARD_SHEETS display names) — not the landing page's longer display
// names, which differ slightly ("New Zealand" vs "Newzealand" etc.).
//
// `flagCode` is a real flag-icons (github.com/lipis/flag-icons) class
// suffix — rendered as an actual crisp SVG flag image via CSS
// background-image (`.fi .fi-<code>`), not an emoji glyph. England and
// Scotland use flag-icons' UK-subdivision codes (gb-eng/gb-sct) rather
// than the GB union flag, since those are the boards' actual flags.
// West Indies has no ISO country code (it's a multi-nation team, not a
// sovereign state) — flagCode is null and Badge falls back to the palm
// emoji for it.
//
// Purely decorative/identity data — the mascot has no gameplay meaning,
// it's what the board's supporters are known as, same idea as national
// sports teams having an animal nickname.
export const BOARD_IDENTITY = {
  Australia: { flagCode: 'au', flagEmoji: '🇦🇺', mascot: '🦘', mascotName: 'Kangaroo' },
  Bangladesh: { flagCode: 'bd', flagEmoji: '🇧🇩', mascot: '🐅', mascotName: 'Bengal Tiger' },
  England: { flagCode: 'gb-eng', flagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', mascot: '🦁', mascotName: 'Lion' },
  India: { flagCode: 'in', flagEmoji: '🇮🇳', mascot: '🐘', mascotName: 'Elephant' },
  Italy: { flagCode: 'it', flagEmoji: '🇮🇹', mascot: '🐺', mascotName: 'Roman Wolf' },
  Netherlands: { flagCode: 'nl', flagEmoji: '🇳🇱', mascot: '🦊', mascotName: 'Fox' },
  Newzealand: { flagCode: 'nz', flagEmoji: '🇳🇿', mascot: '🥝', mascotName: 'Kiwi' },
  Pakistan: { flagCode: 'pk', flagEmoji: '🇵🇰', mascot: '🦅', mascotName: 'Falcon' },
  Qatar: { flagCode: 'qa', flagEmoji: '🇶🇦', mascot: '🐎', mascotName: 'Arabian Horse' },
  Scotland: { flagCode: 'gb-sct', flagEmoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', mascot: '🦄', mascotName: 'Unicorn' },
  'South Africa': { flagCode: 'za', flagEmoji: '🇿🇦', mascot: '🦏', mascotName: 'Rhino' },
  Srilanka: { flagCode: 'lk', flagEmoji: '🇱🇰', mascot: '🐻', mascotName: 'Bear' },
  UAE: { flagCode: 'ae', flagEmoji: '🇦🇪', mascot: '🐪', mascotName: 'Camel' },
  'West Indies': { flagCode: null, flagEmoji: '🌴', mascot: '🦈', mascotName: 'Shark' },
}

// Boards not in the map (e.g. a dismantled/archived board with an
// unrecognized name) fall back to a plain shield - never render nothing.
const FALLBACK = { flagCode: null, flagEmoji: '🏳️', mascot: '🏏', mascotName: null }

export function identityFor(name = '') {
  return BOARD_IDENTITY[name] || FALLBACK
}

// Unlike identityFor(), returns undefined for anything that isn't one of
// the 14 known boards - used by <Badge> to decide whether to layer a
// flag/mascot onto a badge at all. Badge renders boards, players,
// stadiums and tournaments alike; a player or stadium name will never
// collide with a board name, so this lookup alone is enough to keep the
// decoration board-only without threading an explicit `type` prop through
// every call site.
export function knownBoardIdentity(name = '') {
  return BOARD_IDENTITY[name]
}
