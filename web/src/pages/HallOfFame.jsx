import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { IconHallOfFame, IconAward } from '../lib/icons'
import './HallOfFame.css'

// IOCF Hall of Fame — period-by-period "best players" cards straight out
// of the workbook's "IOCF Cards" sheet (data.hallOfFame). Each card covers
// one time window (e.g. "Jan - March 2026") and names a Best Batsman/Best
// Bowler (sometimes more) per card, each with their board and the
// statline that earned them the honor.
export default function HallOfFame() {
  const { data, loading, error } = useDashboard()

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const { hallOfFame = [] } = data

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">IOCF Legends</p>
              <h2><IconHallOfFame className="hof-header-icon" aria-hidden="true" /> Hall of Fame</h2>
            </div>
          </div>

          {hallOfFame.length === 0 ? (
            <div className="empty-state">No Hall of Fame cards recorded yet.</div>
          ) : (
            <div className="card-grid hof-grid">
              {hallOfFame.map((card, i) => (
                <div key={i} className="entity-card glass-panel hof-card">
                  <p className="hof-card__name">{card.name}</p>
                  {card.subtitle && <p className="text-faint hof-card__subtitle">{card.subtitle}</p>}
                  <div className="hof-card__players">
                    {card.players.map((p, j) => (
                      <div key={j} className="hof-card__player">
                        <Badge name={p.name} size={40} rounded="square" />
                        <div>
                          <p className="hof-card__player-name">{p.name}</p>
                          <p className="text-faint hof-card__player-meta">{p.country}</p>
                        </div>
                        <div className="hof-card__player-award">
                          <span className="pill hof-card__award-pill">
                            <IconAward aria-hidden="true" /> {p.award}
                          </span>
                          {p.achievement && (
                            <p className="text-faint hof-card__achievement">{p.achievement}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
