// Renders a board's real mascot artwork (statically served from
// public/mascots/, see boardIdentity.js's `mascotImage` field) — replaces
// the emoji glyph every board used to fall back to before real mascot
// illustrations existed for all 14 boards (including New Zealand's kiwi,
// which previously needed a hand-drawn SVG shape since Unicode has no
// kiwi-bird emoji; now it just uses its own artwork like everyone else).
//
// Inline in plain HTML text flow (Boards.jsx, BoardDetail.jsx) — sized in
// px (not em, since <img> doesn't scale off font-size the way a text
// glyph would) and vertically nudged to sit on the text baseline.
export default function MascotIcon({ identity, size = 20 }) {
  if (!identity?.mascotImage) return null
  return (
    <img
      src={identity.mascotImage}
      alt={identity.mascotName || 'mascot'}
      width={size}
      height={size}
      style={{ display: 'inline-block', verticalAlign: '-0.3em', objectFit: 'contain' }}
      loading="lazy"
    />
  )
}
