import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { IconUmpire } from '../lib/icons'
import './UmpireRankings.css'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

function formatNumber(v, decimals = 0) {
  if (v == null) return '—'
  return v.toLocaleString(undefined, { maximumFractionDigits: decimals })
}

// Global points-based umpire leaderboard, built from the per-board umpire
// activity data every board sheet carries (category, matches, credits,
// points per series/tournament/franchise league officiated). Umpires who
// appear on more than one board's sheet under the exact same name are
// merged into a single ranked entry with combined totals.
export default function UmpireRankings() {
  const { data, loading, error } = useDashboard()

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const rankings = data.umpireRankings || []

  if (rankings.length === 0) {
    return (
      <div className="page-enter">
        <div className="container">
          <section className="page-section">
            <div className="section-header">
              <div>
                <p className="section-header__eyebrow">Officiating Corps</p>
                <h2>Umpire Rankings</h2>
              </div>
            </div>
            <div className="empty-state">No umpire ranking data recorded yet.</div>
          </section>
        </div>
      </div>
    )
  }

  const maxPoints = Math.max(1, ...rankings.map((r) => r.totalPoints ?? 0))

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Officiating Corps</p>
              <h2>Umpire Rankings</h2>
            </div>
          </div>
          <p className="text-faint umpire-rankings-caption">
            Ranked by total points earned officiating series, tournaments and franchise
            leagues across every board — built straight from each board's umpire records.
          </p>

          <div className="umpire-rankings-list">
            {rankings.map((row) => {
              const medal = MEDALS[row.rank]
              const share = row.totalPoints != null ? Math.max(2, (row.totalPoints / maxPoints) * 100) : 2
              return (
                <div key={row.name} className={`glass-panel umpire-rankings-row${medal ? ' umpire-rankings-row--top' : ''}`}>
                  <div
                    className="umpire-rankings-row__bar"
                    style={{ width: `${share}%` }}
                    aria-hidden="true"
                  />
                  <div className="umpire-rankings-row__head">
                    <span className={`umpire-rankings-row__rank${medal ? ' umpire-rankings-row__rank--medal' : ''}`}>
                      {medal || `#${row.rank}`}
                    </span>
                    <span className="umpire-rankings-row__icon"><IconUmpire /></span>
                    <div className="umpire-rankings-row__title">
                      <span className="umpire-rankings-row__name">{row.name}</span>
                      <span className="text-faint umpire-rankings-row__boards">
                        {row.boards.map((b, i) => (
                          <span key={i} className="umpire-rankings-row__board-chip">
                            <Badge name={b} size={20} /> {b}
                          </span>
                        ))}
                      </span>
                    </div>
                    <div className="umpire-rankings-row__points">
                      <span className="text-faint">Points</span>
                      <b>{formatNumber(row.totalPoints, 1)}</b>
                    </div>
                  </div>
                  <div className="umpire-rankings-row__details">
                    <div className="umpire-rankings-row__stat">
                      <span className="text-faint">Total Credits</span>
                      <b>{formatNumber(row.totalCredits)}</b>
                    </div>
                    {row.activities.map((a, i) => (
                      <div key={i} className="umpire-rankings-row__stat">
                        <span className="text-faint">{a.category}{row.boards.length > 1 ? ` (${a.board})` : ''}</span>
                        <b>{formatNumber(a.points, 0)} pts</b>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
