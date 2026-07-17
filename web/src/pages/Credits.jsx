import { Link } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { formatCredits } from '../lib/badges'
import { IconCredits } from '../lib/icons'
import './Credits.css'

// Credits economy view — deeper than Rankings: total federation credit
// pool up top, then every board's balance with a relative credit-strength
// bar (no charting lib installed, so a plain div width% bar).
export default function Credits() {
  const { data, loading, error } = useDashboard()

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const { stats, boards = [] } = data

  const sortedBoards = [...boards].sort(
    (a, b) => (b.credits ?? -Infinity) - (a.credits ?? -Infinity)
  )
  const maxCredits = sortedBoards.reduce(
    (max, b) => (typeof b.credits === 'number' && b.credits > max ? b.credits : max),
    0
  )

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Federation Treasury</p>
              <h2>Credits</h2>
            </div>
          </div>
          <div className="glass-panel credits-hero">
            <div className="credits-hero__icon">
              <IconCredits />
            </div>
            <div>
              <p className="credits-hero__label text-dim">Total Credits Across IOCF</p>
              <p className="credits-hero__value gradient-heading">
                {formatCredits(stats?.totalCredits)}
              </p>
              <p className="credits-hero__sub text-faint">
                Combined balance held by all {stats?.totalBoards ?? boards.length} active boards
              </p>
            </div>
          </div>
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Board Balances</p>
              <h2>Credit Standings</h2>
            </div>
          </div>

          {sortedBoards.length === 0 ? (
            <div className="empty-state">No board credit data recorded yet.</div>
          ) : (
            <div className="credits-list">
              {sortedBoards.map((b, i) => {
                const hasCredits = typeof b.credits === 'number'
                const pct = hasCredits && maxCredits > 0
                  ? Math.max(0, (b.credits / maxCredits) * 100)
                  : 0
                return (
                  <Link key={b.id} to={`/boards/${b.id}`} className="glass-panel credits-row">
                    <span className="credits-row__rank">#{i + 1}</span>
                    <Badge name={b.name} size={48} />
                    <div className="credits-row__body">
                      <div className="credits-row__top">
                        <span className="credits-row__name">{b.name}</span>
                        <span className="credits-row__value">{formatCredits(b.credits)}</span>
                      </div>
                      <div className="credits-row__bar-track">
                        <div
                          className="credits-row__bar-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="credits-row__ranking">Rank #{b.ranking}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
