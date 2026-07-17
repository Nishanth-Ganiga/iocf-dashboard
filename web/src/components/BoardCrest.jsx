import { boardCode } from '../lib/badges'
import { KiwiBirdPath } from './MascotIcon'

// A procedurally-built shield crest for one of the 14 known IOCF boards -
// there's no real board logo artwork available (no image-gen tool, no
// fetchable stock art in this environment), so this stands in as a
// genuine "team crest" rather than a plain initials circle: a shield
// silhouette filled with the board's real national colors, the board's
// mascot centered large, and (at large enough render sizes) its short
// code in a ribbon along the base - the same layout language real
// sports-team crests use.
//
// Pure SVG (crisp at any size, no image request) - `identity` is the
// BOARD_IDENTITY entry (must have `.crest`), `size` is the render box in
// px, matching how <Badge> already sizes itself. Below ~34px the code
// ribbon's text stops being legible (it's rendered at a fixed fraction of
// the shield regardless of `size`, since SVG scales as one unit), so it's
// dropped entirely rather than shipping a blurry sub-pixel label - the
// mascot alone reads better at a glance at small sizes anyway.
const RIBBON_MIN_SIZE = 34

export default function BoardCrest({ name, identity, size = 48 }) {
  const { primary, secondary } = identity.crest
  const code = boardCode(name)
  const gradientId = `crest-grad-${name.replace(/[^a-zA-Z0-9]/g, '')}`
  const showRibbon = size >= RIBBON_MIN_SIZE

  return (
    <svg
      viewBox="0 0 100 116"
      width={size}
      height={size}
      className="board-crest"
      role="img"
      aria-label={`${name} crest`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={secondary} stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Shield outline */}
      <path
        d="M50 2 L94 16 V56 C94 86 74 104 50 114 C26 104 6 86 6 56 V16 Z"
        fill={`url(#${gradientId})`}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="2.5"
      />
      {/* Inner hairline for a two-layer "embossed" crest look */}
      <path
        d="M50 9 L87 21 V56 C87 82 70 98 50 107 C30 98 13 82 13 56 V21 Z"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.5"
      />

      {/* Mascot - shifted up to leave room for the ribbon when it's
          shown, otherwise centered in the full shield body. New Zealand's
          mascot is a real SVG shape (KiwiBirdPath) instead of a <text>
          emoji character - there's no kiwi-bird emoji in Unicode, only
          the kiwi-fruit one, which would mislabel the mascot. */}
      {identity.mascotName === 'Kiwi Bird' ? (
        <KiwiBirdPath x={50} y={showRibbon ? 52 : 60} scale={showRibbon ? 1.15 : 1.4} />
      ) : (
        <text
          x="50"
          y={showRibbon ? 52 : 60}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={showRibbon ? 42 : 50}
        >
          {identity.mascot}
        </text>
      )}

      {showRibbon && (
        <>
          <rect x="14" y="90" width="72" height="18" rx="4" fill="rgba(5,7,13,0.55)" />
          <text
            x="50"
            y="99.5"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="12"
            fontWeight="700"
            letterSpacing="1"
            fill="#fff"
            fontFamily="'Rajdhani', sans-serif"
          >
            {code}
          </text>
        </>
      )}
    </svg>
  )
}
