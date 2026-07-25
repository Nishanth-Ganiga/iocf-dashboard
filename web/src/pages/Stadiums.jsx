import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { IconStadium } from '../lib/icons'
import './Stadiums.css'

// Stadiums module — like Players, there is no standalone "stadiums"
// collection; every venue lives inside `board.stadiums` as a raw string,
// occasionally suffixed with "|"-separated status tags e.g.
// "Optus Stadium | Free T20 WC". Flatten every board's list into
// { name, tags, board, boardId } rows for a single searchable directory.
export default function Stadiums() {
  const { data, loading, error } = useDashboard()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [boardFilter, setBoardFilter] = useState('All')
  const [tagFilter, setTagFilter] = useState('All')
  const [tierFilter, setTierFilter] = useState('All')

  useEffect(() => {
    if (location.state?.query) setQuery(location.state.query)
  }, [location.state])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const { boards = [] } = data

  const allStadiums = []
  for (const b of boards) {
    for (const raw of b.stadiums || []) {
      const [name, ...tags] = raw.split('|').map((s) => s.trim())
      allStadiums.push({
        name,
        tags: tags.filter(Boolean),
        board: b.name,
        boardId: b.id,
        tier: b.stadiumTier || null,
      })
    }
  }

  const allTags = [...new Set(allStadiums.flatMap((s) => s.tags))].sort()
  const allTiers = [...new Set(allStadiums.map((s) => s.tier).filter(Boolean))].sort()

  const q = query.trim().toLowerCase()
  const filtered = allStadiums.filter((s) => {
    if (boardFilter !== 'All' && s.board !== boardFilter) return false
    if (tagFilter !== 'All' && !s.tags.includes(tagFilter)) return false
    if (tierFilter !== 'All' && s.tier !== tierFilter) return false
    if (q && !s.name.toLowerCase().includes(q)) return false
    return true
  })


  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Venues Across Every Board</p>
              <h2>Stadiums</h2>
            </div>
            <input
              type="text"
              className="stadiums-search"
              placeholder="Search stadiums by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="stadiums-chips">
            <button
              className={`stadiums-chip${boardFilter === 'All' ? ' is-active' : ''}`}
              onClick={() => setBoardFilter('All')}
            >
              All Boards
            </button>
            {boards.map((b) => (
              <button
                key={b.id}
                className={`stadiums-chip${boardFilter === b.name ? ' is-active' : ''}`}
                onClick={() => setBoardFilter(boardFilter === b.name ? 'All' : b.name)}
              >
                {b.name}
              </button>
            ))}
          </div>

          {allTiers.length > 0 && (
            <div className="stadiums-chips">
              <button
                className={`stadiums-chip stadiums-chip--tier${tierFilter === 'All' ? ' is-active' : ''}`}
                onClick={() => setTierFilter('All')}
              >
                All Tiers
              </button>
              {allTiers.map((tier) => (
                <button
                  key={tier}
                  className={`stadiums-chip stadiums-chip--tier${tierFilter === tier ? ' is-active' : ''}`}
                  onClick={() => setTierFilter(tierFilter === tier ? 'All' : tier)}
                >
                  {tier}
                </button>
              ))}
            </div>
          )}

          {allTags.length > 0 && (
            <div className="stadiums-chips">
              <button
                className={`stadiums-chip stadiums-chip--tag${tagFilter === 'All' ? ' is-active' : ''}`}
                onClick={() => setTagFilter('All')}
              >
                All Tags
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`stadiums-chip stadiums-chip--tag${tagFilter === tag ? ' is-active' : ''}`}
                  onClick={() => setTagFilter(tagFilter === tag ? 'All' : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          <p className="stadiums-caption text-faint">
            {filtered.length === allStadiums.length
              ? `${allStadiums.length} stadiums`
              : `${filtered.length} matching`}
            {' · '}Venues are sourced from each board's IOCF stadium list (board.stadiums is the
            source of truth).
          </p>

          {filtered.length === 0 ? (
            <div className="empty-state">
              No stadiums match the selected filters.
            </div>
          ) : (
            <div className="stadiums-grid">
              {filtered.map((s, i) => (
                <div key={`${s.name}-${i}`} className="stadiums-card glass-panel">
                  <div className="entity-card__top">
                    <span className="stadiums-card__badge">
                      <Badge name={s.name} size={44} rounded="square" />
                    </span>
                    <div>
                      <p className="entity-card__title">
                        <IconStadium className="stadiums-card__title-icon" aria-hidden="true" /> {s.name}
                      </p>
                      <Link
                        to={`/boards/${s.boardId}`}
                        className="entity-card__meta stadiums-card__home"
                      >
                        Home of {s.board}
                      </Link>
                    </div>
                  </div>
                  {(s.tier || s.tags.length > 0) && (
                    <div className="stadiums-card__tags">
                      {s.tier && <span className="pill pill-stadium-tier">{s.tier}</span>}
                      {s.tags.map((tag, ti) => (
                        <span key={ti} className="pill pill-stadium-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
