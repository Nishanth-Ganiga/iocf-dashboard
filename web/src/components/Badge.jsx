import { colorsFor, initialsFor } from '../lib/badges'

// Generates a premium gold/neon initials badge in place of a missing
// board/tournament/stadium logo image (the workbook has no image assets).
export default function Badge({ name, code, size = 48, rounded = 'circle', glow = true }) {
  // Default params only cover `undefined`, not an explicit `null` — several
  // workbook fields (e.g. a fixture's host board) can legitimately be null
  // when that cell was blank, so normalize here rather than trust callers.
  const safeName = name || '?'
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
