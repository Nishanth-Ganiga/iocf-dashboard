import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import FlagIcon from '../components/FlagIcon'
import MascotIcon from '../components/MascotIcon'
import { formatCredits } from '../lib/badges'
import { knownBoardIdentity } from '../lib/boardIdentity'
import { IconInstagram, IconUmpire, IconGlobe, IconBoard as IconGrid, IconTrophy, IconCredits, IconChampion } from '../lib/icons'
import './Boards.css'

// Cricket Boards module — every active national board as a clickable card,
// plus a small archive of dismantled/former boards at the bottom.
export default function Boards() {
  const { data, loading, error } = useDashboard()
  const [query, setQuery] = useState('')
  const [view, setView] = useState('cards')

  const boards = data?.boards || []
  const overallTable = useMemo(
    () => (data?.boardRankings || []).find((t) => t.id === 'overall-board-ranking')?.table || [],
    [data]
  )

  // Auto-computed honor pills per board — no fabricated data, just the
  // current #1 in each ranking the site already tracks.
  const honorsByBoard = useMemo(() => {
    const honors = new Map()
    const add = (name, label, Icon) => {
      if (!name) return
      const list = honors.get(name) || []
      list.push({ label, Icon })
      honors.set(name, list)
    }
    const mostCredits = [...boards].sort((a, b) => (b.credits || 0) - (a.credits || 0))[0]
    add(mostCredits?.name, 'Most Credits', IconCredits)
    const mostTrophies = [...boards].sort((a, b) => (b.trophiesCount || 0) - (a.trophiesCount || 0))[0]
    add(mostTrophies?.name, 'Most Trophies', IconTrophy)
    const bestWinRate = [...overallTable]
      .filter((r) => r.winningRate != null)
      .sort((a, b) => b.winningRate - a.winningRate)[0]
    add(bestWinRate?.board, 'Best Winning Rate', IconChampion)
    return honors
  }, [boards, overallTable])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const { dismantledBoards = [] } = data
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
            <div className="boards-controls">
              <div className="boards-view-toggle">
                <button
                  className={`boards-view-toggle__btn${view === 'cards' ? ' is-active' : ''}`}
                  onClick={() => setView('cards')}
                  title="Card view"
                >
                  <IconGrid aria-hidden="true" />
                </button>
                <button
                  className={`boards-view-toggle__btn${view === 'explorer' ? ' is-active' : ''}`}
                  onClick={() => setView('explorer')}
                  title="Explorer view"
                >
                  <IconGlobe aria-hidden="true" />
                </button>
              </div>
              <input
                type="text"
                className="boards-search"
                placeholder="Search boards by name…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredBoards.length === 0 ? (
            <div className="empty-state">No boards match "{query}".</div>
          ) : view === 'explorer' ? (
            <div className="boards-explorer">
              {filteredBoards.map((b) => {
                const identity = knownBoardIdentity(b.name)
                return (
                  <Link key={b.id} to={`/boards/${b.id}`} className="boards-explorer__tile glass-panel">
                    <span className="boards-explorer__flag-frame">
                      {identity && <FlagIcon identity={identity} />}
                    </span>
                    <span className="boards-explorer__name">{b.name}</span>
                    <span className="text-faint boards-explorer__credits">{formatCredits(b.credits)}</span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="card-grid">
              {filteredBoards.map((b) => {
                const identity = knownBoardIdentity(b.name)
                const honors = honorsByBoard.get(b.name) || []
                return (
                  <div key={b.id} className="entity-card glass-panel boards-card">
                    <div className="entity-card__top">
                      <span className="boards-card__badge">
                        <Badge name={b.name} size={56} />
                      </span>
                      <div>
                        <p className="entity-card__title">
                          {identity && <FlagIcon identity={identity} className="boards-card__flag" />} {b.name}
                        </p>
                        <p className="entity-card__meta">Chairman: {b.chairman || '—'}</p>
                        <p className="entity-card__meta">CEO: {b.ceo || '—'}</p>
                        {identity?.mascotName && (
                          <p className="entity-card__meta text-faint">
                            <MascotIcon identity={identity} /> {identity.mascotName}
                          </p>
                        )}
                      </div>
                    </div>
                    {honors.length > 0 && (
                      <div className="boards-card__honors">
                        {honors.map((h) => (
                          <span key={h.label} className="pill boards-card__honor-pill">
                            <h.Icon aria-hidden="true" /> {h.label}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="entity-card__stats">
                      <div className="entity-card__stat">
                        <span className="text-faint">Credits</span>
                        <b>{formatCredits(b.credits)}</b>
                      </div>
                      <div className="entity-card__stat">
                        <span className="text-faint">Ranking</span>
                        <b>#{b.ranking}</b>
                      </div>
                      <div className="entity-card__stat">
                        <span className="text-faint"><IconUmpire aria-hidden="true" /> Umpires</span>
                        <b>{b.umpiresCount ?? 0}</b>
                      </div>
                    </div>
                    <div className="boards-card__cta-row">
                      <Link to={`/boards/${b.id}`} className="btn btn-outline-gold boards-card__cta">
                        View Board
                        <span className="boards-card__cta-arrow" aria-hidden="true">→</span>
                      </Link>
                      {identity?.instagram && (
                        <a
                          href={identity.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="boards-card__insta"
                          aria-label={`Contact ${b.name} on Instagram`}
                          title="Contact on Instagram"
                        >
                          <IconInstagram aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
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
