// Flag + mascot identity for each of the 14 active IOCF boards, keyed by
// the exact `board.name` string the API returns (see server/data.py's
// BOARD_SHEETS display names) — not the landing page's longer display
// names, which differ slightly ("New Zealand" vs "Newzealand" etc.).
//
// Purely decorative/identity data — the mascot has no gameplay meaning,
// it's what the board's supporters are known as, same idea as national
// sports teams having an animal nickname.
export const BOARD_IDENTITY = {
  Australia: { flag: '🇦🇺', mascot: '🦘', mascotName: 'Kangaroo' },
  Bangladesh: { flag: '🇧🇩', mascot: '🐅', mascotName: 'Bengal Tiger' },
  England: { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', mascot: '🦁', mascotName: 'Lion' },
  India: { flag: '🇮🇳', mascot: '🐘', mascotName: 'Elephant' },
  Italy: { flag: '🇮🇹', mascot: '🐺', mascotName: 'Roman Wolf' },
  Netherlands: { flag: '🇳🇱', mascot: '🦊', mascotName: 'Fox' },
  Newzealand: { flag: '🇳🇿', mascot: '🥝', mascotName: 'Kiwi' },
  Pakistan: { flag: '🇵🇰', mascot: '🦅', mascotName: 'Falcon' },
  Qatar: { flag: '🇶🇦', mascot: '🐎', mascotName: 'Arabian Horse' },
  Scotland: { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', mascot: '🦄', mascotName: 'Unicorn' },
  'South Africa': { flag: '🇿🇦', mascot: '🦏', mascotName: 'Rhino' },
  Srilanka: { flag: '🇱🇰', mascot: '🐻', mascotName: 'Bear' },
  UAE: { flag: '🇦🇪', mascot: '🐪', mascotName: 'Camel' },
  'West Indies': { flag: '🌴', mascot: '🦈', mascotName: 'Shark' },
}

// Boards not in the map (e.g. a dismantled/archived board with an
// unrecognized name) fall back to a plain shield - never render nothing.
const FALLBACK = { flag: '🏳️', mascot: '🏏', mascotName: null }

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
