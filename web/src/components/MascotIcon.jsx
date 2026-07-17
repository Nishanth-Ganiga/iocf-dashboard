// Most boards' mascot is representable as a single emoji character
// (identity.mascot), but Unicode has no kiwi-bird emoji — 🥝 is the
// fruit, not the flightless bird New Zealand actually uses as its
// cricket mascot. Rather than mislabel the fruit as the bird, this
// renders a small kiwi silhouette (round body, long downward-curved
// beak — the bird's most recognizable trait) for New Zealand
// specifically, and falls back to the plain emoji for every other board.
//
// Two render paths, since the mascot shows up in two different contexts:
//   - MascotIcon: inline in plain HTML text flow (Boards.jsx,
//     BoardDetail.jsx) - a nested <svg> sized in 1em works fine here.
//   - KiwiBirdPath: raw SVG path/shape markup meant to be dropped
//     directly into BoardCrest's existing shield <svg> canvas (which
//     uses a fixed 0-100 viewBox, not em units) in place of the mascot
//     <text> character - exported separately since a nested <svg> would
//     need its own transform math to sit correctly inside that canvas.
export function KiwiBirdPath({ x = 50, y = 55, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} aria-label="Kiwi bird">
      <ellipse cx="2" cy="0" rx="15" ry="13" fill="#6b4a2f" />
      <path
        d="M-11 -2 C-20 -3 -24 -5 -24 -6 C-24 -7 -20 -6.5 -11 -4.5"
        fill="none"
        stroke="#3d2a1a"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="-6" cy="-6" r="2" fill="#1a1108" />
      <ellipse cx="10" cy="14" rx="3" ry="1.5" fill="#3d2a1a" />
      <ellipse cx="-4" cy="15" rx="3" ry="1.5" fill="#3d2a1a" />
    </g>
  )
}

function KiwiBirdIcon({ size = '1em' }) {
  return (
    <svg
      viewBox="-26 -20 52 40"
      width={size}
      height={size}
      style={{ display: 'inline-block', verticalAlign: '-0.15em' }}
      role="img"
      aria-label="Kiwi bird"
    >
      <KiwiBirdPath x={0} y={0} scale={1} />
    </svg>
  )
}

export default function MascotIcon({ identity, size = '1em' }) {
  if (identity?.mascotName === 'Kiwi Bird') {
    return <KiwiBirdIcon size={size} />
  }
  return identity?.mascot ?? null
}
