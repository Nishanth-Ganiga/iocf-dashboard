import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import FlagIcon from '../components/FlagIcon'
import { knownBoardIdentity } from '../lib/boardIdentity'
import { IconTrophy } from '../lib/icons'
import './BoardRankings.css'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

function formatNumber(v, decimals = 0) {
  if (v == null) return '—'
  return v.toLocaleString(undefined, { maximumFractionDigits: decimals })
}

// Official IOCF points-based performance ranking — one table per format
// (T10, T20, Club, ODI, 100 Balls, Test) plus an Overall table, straight
// from the workbook's own "Board Rankings" sheet: League Score (60% —
// win-percentage based) + Tournament Score (40% — champion/runner-up
// bonuses) = Points, which is what each table is sorted by. This is a
// different ranking from the credits balance that powers Credits Ranking.
export default function BoardRankings() {
  const { data, loading, error } = useDashboard()
  const [activeId, setActiveId] = useState(null)

  const boardRankings = data?.boardRankings || []
  const boardById = useMemo(
    () => new Map((data?.boards || []).map((b) => [b.name, b])),
    [data]
  )

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  if (boardRankings.length === 0) {
    return (
      <div className="page-enter">
        <div className="container">
          <section className="page-section">
            <div className="section-header">
              <div>
                <p className="section-header__eyebrow">Official Points System</p>
                <h2>Board Rankings</h2>
              </div>
            </div>
            <div className="empty-state">No board ranking data recorded yet.</div>
          </section>
        </div>
      </div>
    )
  }

  const active = boardRankings.find((t) => t.id === activeId) || boardRankings[boardRankings.length - 1]
  const maxPoints = Math.max(1, ...active.table.map((r) => r.points ?? 0))

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Official Points System</p>
              <h2>Board Rankings</h2>
            </div>
          </div>
          <p className="text-faint board-rankings-caption">
            League Score (win-percentage, 60% weight) + Tournament Score (champion/runner-up
            bonuses, 40% weight) = Points — the workbook's own performance ranking, separate
            from the credits balance behind Credits Ranking.
          </p>

          <div className="board-rankings-tabs">
            {boardRankings.map((t) => (
              <button
                key={t.id}
                className={`board-rankings-tab${t.id === active.id ? ' is-active' : ''}`}
                onClick={() => setActiveId(t.id)}
              >
                {t.name.replace(' Ranking', '').replace(' Board', '')}
              </button>
            ))}
          </div>

          <div className="board-rankings-list">
            {active.table.map((row) => {
              const board = boardById.get(row.board)
              const identity = knownBoardIdentity(row.board)
              const medal = MEDALS[row.rank]
              const share = row.points != null ? Math.max(2, (row.points / maxPoints) * 100) : 2
              const RowTag = board ? Link : 'div'
              return (
                <RowTag
                  key={row.board}
                  {...(board ? { to: `/boards/${board.id}` } : {})}
                  className={`glass-panel board-rankings-row${medal ? ' board-rankings-row--top' : ''}`}
                >
                  <div
                    className="board-rankings-row__bar"
                    style={{ width: `${share}%` }}
                    aria-hidden="true"
                  />
                  <div className="board-rankings-row__head">
                    <span className={`board-rankings-row__rank${medal ? ' board-rankings-row__rank--medal' : ''}`}>
                      {medal || `#${row.rank}`}
                    </span>
                    <Badge name={row.board} size={48} />
                    <div className="board-rankings-row__title">
                      <span className="board-rankings-row__name">
                        {identity && <FlagIcon identity={identity} className="board-rankings-row__flag" />}
                        {row.board}
                      </span>
                      <span className="text-faint board-rankings-row__credits">
                        {formatNumber(row.points, 1)} points
                      </span>
                    </div>
                  </div>
                  <div className="board-rankings-row__details">
                    <div className="board-rankings-row__stat">
                      <span className="text-faint">Matches Played</span>
                      <b>{formatNumber(row.matchesPlayed)}</b>
                    </div>
                    <div className="board-rankings-row__stat">
                      <span className="text-faint">Matches Won</span>
                      <b>{formatNumber(row.matchesWon)}</b>
                    </div>
                    <div className="board-rankings-row__stat">
                      <span className="text-faint">Winning Rate</span>
                      <b>{row.winningRate != null ? `${formatNumber(row.winningRate, 1)}%` : '—'}</b>
                    </div>
                    <div className="board-rankings-row__stat">
                      <span className="text-faint">League Score</span>
                      <b>{formatNumber(row.leagueScore, 1)}</b>
                    </div>
                    <div className="board-rankings-row__stat">
                      <span className="text-faint">Tournament Score</span>
                      <b>{formatNumber(row.tournamentScore, 1)}</b>
                    </div>
                    {row.honors && (
                      <div className="board-rankings-row__stat board-rankings-row__stat--honors">
                        <span className="text-faint"><IconTrophy aria-hidden="true" /> Honors</span>
                        <b>{row.honors}</b>
                      </div>
                    )}
                  </div>
                </RowTag>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
