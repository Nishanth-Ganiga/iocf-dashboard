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
// `crest` gives each board's procedurally-generated logo (see
// BoardCrest.jsx) its own two-tone palette drawn from the board's actual
// national/team colors, rather than the generic hash-based palette every
// other badge (players, stadiums, tournaments) uses — a real team crest
// wouldn't recolor itself based on a hash of its own name.
//
// `mascotImage` is each board's real mascot artwork (statically served
// from public/mascots/ — see FlagIcon.jsx's comment for why static assets
// live under public/ rather than the repo's top-level Images/ folder).
// Every known board has one; `mascotName` is the plain-text label shown
// alongside it (MascotIcon.jsx renders mascotImage, never falls back to
// an emoji glyph).
//
// `instagram` is each board's real, official Instagram page (as given by
// the user) — used to render a working "Contact this board" button
// wherever a board is shown in detail (Contact directory, BoardDetail).
//
// Purely decorative/identity data — the mascot has no gameplay meaning,
// it's what the board's supporters are known as, same idea as national
// sports teams having an animal nickname.
export const BOARD_IDENTITY = {
  Australia: {
    flagCode: 'au', flagEmoji: '🇦🇺', mascotName: 'Kangaroo',
    mascotImage: '/mascots/australia.png',
    crest: { primary: '#006B3C', secondary: '#FFCC00' },
    instagram: 'https://www.instagram.com/cricketaustralia_oc?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  },
  Bangladesh: {
    flagCode: 'bd', flagEmoji: '🇧🇩', mascotName: 'Bengal Tiger',
    mascotImage: '/mascots/bangladesh.png',
    crest: { primary: '#006a4e', secondary: '#f42a41' },
    instagram: 'https://www.instagram.com/bangladeshoc_iocf?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  },
  England: {
    flagCode: 'gb-eng', flagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', mascotName: 'Lion',
    mascotImage: '/mascots/england.png',
    crest: { primary: '#12225c', secondary: '#c8102e' },
    instagram: 'https://www.instagram.com/england_onlinecricket?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  },
  India: {
    flagCode: 'in', flagEmoji: '🇮🇳', mascotName: 'Elephant',
    mascotImage: '/mascots/india.png',
    crest: { primary: '#1a3fa0', secondary: '#ff9933' },
    instagram: 'https://www.instagram.com/iocb_oc?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  },
  Italy: {
    flagCode: 'it', flagEmoji: '🇮🇹', mascotName: 'Roman Wolf',
    mascotImage: '/mascots/italy.png',
    crest: { primary: '#008C45', secondary: '#CD212A' },
    instagram: 'https://www.instagram.com/italy_oc?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  },
  Netherlands: {
    flagCode: 'nl', flagEmoji: '🇳🇱', mascotName: 'Fox',
    mascotImage: '/mascots/netherlands.png',
    crest: { primary: '#ff6c2f', secondary: '#21468b' },
    instagram: 'https://www.instagram.com/boardnetherlands?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  },
  Newzealand: {
    flagCode: 'nz', flagEmoji: '🇳🇿', mascotName: 'Kiwi Bird',
    mascotImage: '/mascots/newzealand.png',
    crest: { primary: '#0a0a0a', secondary: '#c0c0c0' },
    instagram: 'https://www.instagram.com/newzealand_oc?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  },
  Pakistan: {
    flagCode: 'pk', flagEmoji: '🇵🇰', mascotName: 'Falcon',
    mascotImage: '/mascots/pakistan.png',
    crest: { primary: '#01411c', secondary: '#f5f5f5' },
    instagram: 'https://www.instagram.com/pakistan_oc?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  },
  Qatar: {
    flagCode: 'qa', flagEmoji: '🇶🇦', mascotName: 'Arabian Horse',
    mascotImage: '/mascots/qatar.png',
    crest: { primary: '#8a1538', secondary: '#f5f5f5' },
    instagram: 'https://www.instagram.com/iocf_qatar?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  },
  Scotland: {
    flagCode: 'gb-sct', flagEmoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', mascotName: 'Unicorn',
    mascotImage: '/mascots/scotland.png',
    crest: { primary: '#0065bd', secondary: '#f5f5f5' },
    instagram: 'https://www.instagram.com/scotland_oc?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  },
  'South Africa': {
    flagCode: 'za', flagEmoji: '🇿🇦', mascotName: 'Rhino',
    mascotImage: '/mascots/south-africa.png',
    crest: { primary: '#007749', secondary: '#ffb612' },
    instagram: 'https://www.instagram.com/cric.sa_oc?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  },
  Srilanka: {
    flagCode: 'lk', flagEmoji: '🇱🇰', mascotName: 'Bear',
    mascotImage: '/mascots/srilanka.png',
    crest: { primary: '#8d153a', secondary: '#ffb700' },
    instagram: 'https://www.instagram.com/srilankaoc?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  },
  UAE: {
    flagCode: 'ae', flagEmoji: '🇦🇪', mascotName: 'Camel',
    mascotImage: '/mascots/uae.png',
    crest: { primary: '#00732f', secondary: '#ff0000' },
    instagram: 'https://www.instagram.com/uae_iocf?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  },
  'West Indies': {
    flagCode: null, flagEmoji: '🌴', mascotName: 'Shark',
    mascotImage: '/mascots/west-indies.png',
    crest: { primary: '#7b0028', secondary: '#ffd700' },
    instagram: 'https://www.instagram.com/westindiesoc?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  },
}

// Boards not in the map (e.g. a dismantled/archived board with an
// unrecognized name) fall back to a plain shield - never render nothing.
const FALLBACK = { flagCode: null, flagEmoji: '🏳️', mascotName: null }

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
