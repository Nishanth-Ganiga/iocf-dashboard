import { Link } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import './TrophyCabinet.css'

const TROPHY_PREVIEW_COUNT = 3

// Trophy Cabinet — recent champions recap (from data.tournaments) plus a
// full trophy-count leaderboard across every board (from data.boards).
export default function TrophyCabinet() {
  const { data, loading, error } = useDashboard()

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const { tournaments = [], boards = [] } = data

  const champions = tournaments.filter((t) => t.champion)
  const boardsByTrophies = [...boards].sort(
    (a, b) => (b.trophiesCount ?? 0) - (a.trophiesCount ?? 0)
  )

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Hall of Champions</p>
              <h2>Recent Champions</h2>
            </div>
          </div>

          {champions.length === 0 ? (
            <div className="empty-state">No champions crowned yet.</div>
          ) : (
            <div className="card-grid">
              {champions.map((t) => (
                <Link key={t.id} to={`/tournaments/${t.id}`} className="entity-card glass-panel">
                  <div className="entity-card__top">
                    <Badge name={t.champion} size={52} />
                    <div>
                      <p className="entity-card__title">{t.champion}</p>
                      <p className="entity-card__meta">champions of {t.name}</p>
                    </div>
                  </div>
                  {t.runnerUp && (
                    <p className="entity-card__meta">Runner-up: {t.runnerUp}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">All-Time Standings</p>
              <h2>Trophy Cabinet by Board</h2>
            </div>
          </div>

          {boardsByTrophies.length === 0 ? (
            <div className="empty-state">No boards recorded yet.</div>
          ) : (
            <div className="card-grid">
              {boardsByTrophies.map((b, i) => {
                const count = b.trophiesCount ?? 0
                const trophies = b.trophies || []
                const preview = trophies.slice(0, TROPHY_PREVIEW_COUNT)
                const extra = trophies.length - preview.length
                const isEmpty = count === 0
                return (
                  <div
                    key={b.id}
                    className={`entity-card glass-panel trophy-card${isEmpty ? ' trophy-card--empty' : ''}`}
                  >
                    <div className="entity-card__top">
                      <span className="trophy-card__rank">#{i + 1}</span>
                      <Badge name={b.name} size={48} glow={!isEmpty} />
                      <div>
                        <Link to={`/boards/${b.id}`} className="trophy-card__name">
                          {b.name}
                        </Link>
                        <p className="entity-card__meta">Ranking #{b.ranking}</p>
                      </div>
                    </div>
                    <div className="trophy-card__count">
                      🏆 <span>{count}</span>
                      <span className="text-faint trophy-card__count-label">
                        {count === 1 ? 'trophy' : 'trophies'}
                      </span>
                    </div>
                    {preview.length > 0 ? (
                      <ul className="trophy-card__list">
                        {preview.map((name, idx) => (
                          <li key={idx}>{name}</li>
                        ))}
                        {extra > 0 && <li className="trophy-card__more">+{extra} more</li>}
                      </ul>
                    ) : (
                      <p className="trophy-card__none text-faint">No trophies won yet.</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
