import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import './Players.css'

// Hard cap on rendered cards so a broad/empty search never dumps the full
// ~335-row grid onto the DOM at once — narrowing the search (or picking a
// board) always reveals more.
const MAX_RESULTS = 200

// Players module — there is no standalone "players" collection in the
// workbook; every player only exists nested inside their board's roster
// (`board.players`, plain name strings). This page flattens every board's
// roster into one searchable directory of { name, board } rows.
export default function Players() {
  const { data, loading, error } = useDashboard()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [boardFilter, setBoardFilter] = useState('All')

  useEffect(() => {
    if (location.state?.query) setQuery(location.state.query)
  }, [location.state])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const { boards = [] } = data

  const allPlayers = []
  for (const b of boards) {
    for (const name of b.players || []) {
      allPlayers.push({ name, board: b.name, boardId: b.id })
    }
  }

  const q = query.trim().toLowerCase()
  const filtered = allPlayers.filter((p) => {
    if (boardFilter !== 'All' && p.board !== boardFilter) return false
    if (q && !p.name.toLowerCase().includes(q)) return false
    return true
  })

  const visible = filtered.slice(0, MAX_RESULTS)
  const truncated = filtered.length > visible.length

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Every Registered Roster</p>
              <h2>Players</h2>
            </div>
            <input
              type="text"
              className="players-search"
              placeholder="Search players by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="players-chips">
            <button
              className={`players-chip${boardFilter === 'All' ? ' is-active' : ''}`}
              onClick={() => setBoardFilter('All')}
            >
              All Boards
            </button>
            {boards.map((b) => (
              <button
                key={b.id}
                className={`players-chip${boardFilter === b.name ? ' is-active' : ''}`}
                onClick={() => setBoardFilter(boardFilter === b.name ? 'All' : b.name)}
              >
                {b.name}
              </button>
            ))}
          </div>

          <p className="players-caption text-faint">
            {filtered.length === allPlayers.length
              ? `${allPlayers.length} players`
              : `${filtered.length} matching ${query ? `"${query}"` : boardFilter}`}
            {' · '}Rosters are sourced from IOCF Boards (board.players is the source of truth —
            not cross-referenced against franchise league / emerging talent squads).
            {truncated && ` Showing first ${MAX_RESULTS} — narrow your search to see more.`}
          </p>

          {filtered.length === 0 ? (
            <div className="empty-state">
              No players match {query ? `"${query}"` : 'the selected board'}.
            </div>
          ) : (
            <div className="players-grid">
              {visible.map((p, i) => (
                <div key={`${p.name}-${i}`} className="players-card glass-panel">
                  <Badge name={p.name} size={40} rounded="square" />
                  <div className="players-card__text">
                    <p className="players-card__name">{p.name}</p>
                    <Link to={`/boards/${p.boardId}`} className="players-card__board text-faint">
                      {p.board}
                    </Link>
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
