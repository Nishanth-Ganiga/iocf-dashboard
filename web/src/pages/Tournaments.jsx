import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { IconChampion } from '../lib/icons'
import './Tournaments.css'

const STATUSES = ['Completed', 'Ongoing', 'Upcoming']

// Tournaments module — every T20 World Cup, franchise league, continental
// cup and knockout in the workbook, filterable by category and status.
export default function Tournaments() {
  const { data, loading, error } = useDashboard()
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')

  const tournaments = data?.tournaments || []

  // Derive the distinct categories present in the data, in first-seen order,
  // so this stays correct if the workbook adds/removes tournament categories.
  // Depends on data?.tournaments (not the `tournaments` fallback binding
  // above) so the memo doesn't recompute every render off a fresh `[]`.
  const categories = useMemo(() => {
    const seen = []
    for (const t of data?.tournaments || []) {
      if (!seen.includes(t.category)) seen.push(t.category)
    }
    return seen
  }, [data])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const filtered = tournaments.filter((t) => {
    if (category !== 'All' && t.category !== category) return false
    if (status !== 'All' && t.status !== status) return false
    return true
  })

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Cricket's Grandest Stages</p>
              <h2>Tournaments</h2>
            </div>
          </div>

          <div className="tournaments-filters">
            <div className="tournaments-filter-row">
              <FilterChip label="All" active={category === 'All'} onClick={() => setCategory('All')} />
              {categories.map((c) => (
                <FilterChip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
              ))}
            </div>
            <div className="tournaments-filter-row">
              <FilterChip label="All Statuses" active={status === 'All'} onClick={() => setStatus('All')} />
              {STATUSES.map((s) => (
                <FilterChip key={s} label={s} active={status === s} onClick={() => setStatus(s)} />
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">No tournaments match these filters.</div>
          ) : (
            <div className="card-grid">
              {filtered.map((t) => (
                <div key={t.id} className="entity-card glass-panel">
                  <div className="entity-card__top">
                    <Badge name={t.name} size={52} />
                    <div>
                      <p className="entity-card__title">{t.name}</p>
                      <p className="entity-card__meta">{t.category} · Season {t.season}</p>
                    </div>
                  </div>
                  <span className={`pill pill-status-${t.status.toLowerCase()}`}>{t.status}</span>
                  {t.champion && (
                    <p className="entity-card__meta tournaments-card__champion">
                      <IconChampion className="tournaments-card__champion-icon" aria-hidden="true" />
                      Champion: {t.champion}
                      {t.runnerUp ? ` · Runner-up: ${t.runnerUp}` : ''}
                    </p>
                  )}
                  <Link to={`/tournaments/${t.id}`} className="btn btn-outline-gold tournaments-card__cta">
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      className={`tournaments-chip${active ? ' is-active' : ''}`}
      onClick={onClick}
    >
      <span className="tournaments-chip__label">{label}</span>
    </button>
  )
}
