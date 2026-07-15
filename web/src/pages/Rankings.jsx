import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { formatCredits } from '../lib/badges'
import './Rankings.css'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

// Credits leaderboard — data.rankings is already sorted rank 1 first; we
// just cross-reference each entry against data.boards to get a routable id.
export default function Rankings() {
  const { data, loading, error } = useDashboard()
  const [query, setQuery] = useState('')

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const { rankings = [], boards = [] } = data
  const boardById = new Map(boards.map((b) => [b.name, b]))

  const q = query.trim().toLowerCase()
  const filteredRankings = q
    ? rankings.filter((r) => r.board.toLowerCase().includes(q))
    : rankings

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Credits Leaderboard</p>
              <h2>Rankings</h2>
            </div>
            <input
              type="text"
              className="rankings-search"
              placeholder="Search boards by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {filteredRankings.length === 0 ? (
            <div className="empty-state">No boards match "{query}".</div>
          ) : (
            <div className="glass-panel rankings-table">
              {filteredRankings.map((r) => {
                const board = boardById.get(r.board)
                const medal = MEDALS[r.rank]
                return (
                  <div
                    key={r.board}
                    className={`rankings-row${medal ? ' rankings-row--top' : ''}`}
                  >
                    <div className={`rankings-row__rank${medal ? ` rankings-row__rank--${r.rank}` : ''}`}>
                      {medal || `#${r.rank}`}
                    </div>
                    <Badge name={r.board} size={44} />
                    {board ? (
                      <Link to={`/boards/${board.id}`} className="rankings-row__name">
                        {r.board}
                      </Link>
                    ) : (
                      <span className="rankings-row__name">{r.board}</span>
                    )}
                    <div className="rankings-row__credits">
                      <span className="text-faint">Credits</span>
                      <b>{formatCredits(r.credits)}</b>
                    </div>
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
