import { colorsFor, initialsFor } from '../lib/badges'
import { knownBoardIdentity } from '../lib/boardIdentity'
import BoardCrest from './BoardCrest'
import FlagIcon from './FlagIcon'

// Generates a badge for boards, players, stadiums & tournaments — none of
// which have a real logo image in the workbook. For the 14 known IOCF
// boards, renders a procedurally-built shield crest (see BoardCrest.jsx:
// the board's real national colors, its mascot, its short code) as a
// stand-in team logo, used identically everywhere a board's Badge appears
// (Boards, Board Detail, Dashboard, Rankings, Credits, Transfers, Trophy
// Cabinet, Fixtures, Contact, Global Search, Tournament Detail). Every
// other name (players, stadiums, tournaments, unrecognized/archived
// boards) still renders the original initials-circle.
export default function Badge({ name, code, size = 48, rounded = 'circle', glow = true }) {
  // Default params only cover `undefined`, not an explicit `null` — several
  // workbook fields (e.g. a fixture's host board) can legitimately be null
  // when that cell was blank, so normalize here rather than trust callers.
  const safeName = name || '?'
  const identity = knownBoardIdentity(safeName)

  if (identity) {
    // Flag emblem only at larger sizes - below this it would overlap the
    // crest illegibly (it's rendered at a fraction of the badge size).
    const showFlag = size >= 32
    return (
      <div
        className="ioc-badge ioc-badge--crest"
        style={{
          position: 'relative',
          width: size,
          height: size,
          filter: glow ? `drop-shadow(0 0 10px ${identity.crest.primary}66)` : 'none',
          flexShrink: 0,
        }}
        aria-label={`${safeName} — ${identity.mascotName}`}
        title={`${safeName} (${identity.mascotName})`}
      >
        <BoardCrest name={safeName} identity={identity} size={size} />
        {showFlag && (
          <span
            aria-hidden="true"
            className="ioc-badge__flag"
            style={{ width: size * 0.32, height: size * 0.24 }}
          >
            <FlagIcon identity={identity} />
          </span>
        )}
      </div>
    )
  }

  const [c1, c2] = colorsFor(safeName)
  const label = code || initialsFor(safeName)
  const borderRadius = rounded === 'circle' ? '50%' : 'var(--radius-md)'

  return (
    <div
      className="ioc-badge"
      style={{
        width: size,
        height: size,
        borderRadius,
        background: `linear-gradient(145deg, ${c1}22, ${c2}11)`,
        border: `1.5px solid ${c1}66`,
        boxShadow: glow ? `0 0 16px ${c1}33, inset 0 0 12px ${c2}22` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontWeight: 700,
        letterSpacing: '0.02em',
        color: c1,
        fontSize: size * 0.32,
      }}
      aria-label={safeName}
      title={safeName}
    >
      {label}
    </div>
  )
}
