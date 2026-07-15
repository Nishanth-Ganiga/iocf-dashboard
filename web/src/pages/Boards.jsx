import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { formatCredits } from '../lib/badges'
import './Boards.css'

// Cricket Boards module — every active national board as a clickable card,
// plus a small archive of dismantled/former boards at the bottom.
export default function Boards() {
  const { data, loading, error } = useDashboard()
  const [query, setQuery] = useState('')

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const { boards = [], dismantledBoards = [] } = data
  const q = query.trim().toLowerCase()
  const filteredBoards = q ? boards.filter((b) => b.name.toLowerCase().includes(q)) : boards

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Governing Bodies</p>
              <h2>Cricket Boards</h2>
            </div>
            <input
              type="text"
              className="boards-search"
              placeholder="Search boards by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {filteredBoards.length === 0 ? (
            <div className="empty-state">No boards match "{query}".</div>
          ) : (
            <div className="card-grid">
              {filteredBoards.map((b) => (
                <div key={b.id} className="entity-card glass-panel">
                  <div className="entity-card__top">
                    <Badge name={b.name} size={56} />
                    <div>
                      <p className="entity-card__title">{b.name}</p>
                      <p className="entity-card__meta">Chairman: {b.chairman || '—'}</p>
                      <p className="entity-card__meta">CEO: {b.ceo || '—'}</p>
                    </div>
                  </div>
                  <div className="entity-card__stats">
                    <div className="entity-card__stat">
                      <span className="text-faint">Credits</span>
                      <b>{formatCredits(b.credits)}</b>
                    </div>
                    <div className="entity-card__stat">
                      <span className="text-faint">Ranking</span>
                      <b>#{b.ranking}</b>
                    </div>
                  </div>
                  <Link to={`/boards/${b.id}`} className="btn btn-outline-gold boards-card__cta">
                    View Board
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Archive</p>
              <h2>Dismantled Boards</h2>
            </div>
          </div>

          {dismantledBoards.length === 0 ? (
            <div className="empty-state">No dismantled boards on record.</div>
          ) : (
            <div className="card-grid boards-dismantled-grid">
              {dismantledBoards.map((b, i) => (
                <div key={i} className="entity-card glass-panel boards-dismantled-card">
                  <span className="pill boards-archived-pill">Archived</span>
                  <div className="entity-card__top">
                    <Badge name={b.name} size={44} glow={false} />
                    <div>
                      <p className="entity-card__title">{b.name}</p>
                      <p className="entity-card__meta">Chairman: {b.chairman || '—'}</p>
                    </div>
                  </div>
                  <div className="entity-card__stats">
                    <div className="entity-card__stat">
                      <span className="text-faint">Credits</span>
                      <b>{formatCredits(b.credits)}</b>
                    </div>
                    <div className="entity-card__stat">
                      <span className="text-faint">Players</span>
                      <b>{b.playersCount ?? '—'}</b>
                    </div>
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
