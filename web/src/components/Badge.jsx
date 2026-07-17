import { colorsFor, initialsFor } from '../lib/badges'
import { knownBoardIdentity } from '../lib/boardIdentity'
import FlagIcon from './FlagIcon'

// Generates a premium gold/neon initials badge in place of a missing
// board/tournament/stadium logo image (the workbook has no image assets).
// For the 14 known IOCF boards, layers the board's flag + official mascot
// as small corner emblems on top of the initials — see boardIdentity.js.
// Every other name (players, stadiums, tournaments, unrecognized/archived
// boards) renders exactly as before.
export default function Badge({ name, code, size = 48, rounded = 'circle', glow = true }) {
  // Default params only cover `undefined`, not an explicit `null` — several
  // workbook fields (e.g. a fixture's host board) can legitimately be null
  // when that cell was blank, so normalize here rather than trust callers.
  const safeName = name || '?'
  const [c1, c2] = colorsFor(safeName)
  const label = code || initialsFor(safeName)
  const borderRadius = rounded === 'circle' ? '50%' : 'var(--radius-md)'
  const identity = knownBoardIdentity(safeName)
  // Below this size the flag/mascot emblems would overlap the initials
  // illegibly (they're rendered at a fraction of the badge size), so skip
  // them on the smallest badge instances (e.g. player chips, search rows).
  const showEmblems = identity && size >= 32

  return (
    <div
      className="ioc-badge"
      style={{
        position: 'relative',
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
      aria-label={identity ? `${safeName} — ${identity.mascotName}` : safeName}
      title={identity ? `${safeName} (${identity.mascotName})` : safeName}
    >
      {label}
      {showEmblems && (
        <>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -size * 0.08,
              right: -size * 0.1,
              width: size * 0.4,
              height: size * 0.3,
              lineHeight: 1,
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.25)',
            }}
          >
            <FlagIcon identity={identity} />
          </span>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: -size * 0.1,
              left: -size * 0.1,
              fontSize: size * 0.4,
              lineHeight: 1,
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
            }}
          >
            {identity.mascot}
          </span>
        </>
      )}
    </div>
  )
}
