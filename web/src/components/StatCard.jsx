import useCountUp from '../lib/useCountUp'

export default function StatCard({ label, value, icon, accent = 'gold', suffix = '' }) {
  const [display, ref] = useCountUp(typeof value === 'number' ? value : 0)

  return (
    <div ref={ref} className={`stat-card glass-panel accent-${accent}`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__body">
        <p className="stat-card__value">
          {typeof value === 'number' ? display : value ?? '—'}
          {suffix}
        </p>
        <p className="stat-card__label text-dim">{label}</p>
      </div>
    </div>
  )
}
