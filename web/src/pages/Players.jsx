import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { buildAchievementsIndex, getAchievementsFor } from '../lib/playerAchievements'
import { formatCredits } from '../lib/badges'
import { IconAward, IconCrown } from '../lib/icons'
import './Players.css'

// Hard cap on rendered cards so a broad/empty search never dumps the full
// ~335-row grid onto the DOM at once — narrowing the search (or picking a
// board) always reveals more.
const MAX_RESULTS = 200

// Players module — there is no standalone "players" collection in the
// workbook; every player only exists nested inside their board's roster
// (`board.players`, plain name strings). This page flattens every board's
// roster into one searchable directory of { name, board } rows, plus each
// board's Chairman and CEO — they're stored as separate fields on the
// board record (not inside `players`), but several of them do turn up
// actually playing in the franchise leagues (as captains, marquee
// signings, etc. - see lib/playerAchievements.js), so they belong in this
// directory too. Each is tagged with a Chairman/CEO pill so it's clear
// they're an office-holder first, not just hidden inside the roster count.
// Clicking a card expands it in place to show every achievement that
// player's exact name matched elsewhere in the dashboard (T20 World Cup
// awards, franchise league awards + match MOTM/Best Batsman/Best Bowler,
// Hall of Fame, World Test Championship, Emerging Talent League, Lone
// Warrior) — see lib/playerAchievements.js for how that cross-reference is
// built.
export default function Players() {
  const { data, loading, error } = useDashboard()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [boardFilter, setBoardFilter] = useState('All')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (location.state?.query) setQuery(location.state.query)
  }, [location.state])

  const achievementsIndex = useMemo(() => buildAchievementsIndex(data), [data])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const { boards = [] } = data

  const allPlayers = []
  for (const b of boards) {
    if (b.chairman) allPlayers.push({ name: b.chairman, board: b.name, boardId: b.id, role: 'Chairman' })
    if (b.ceo) allPlayers.push({ name: b.ceo, board: b.name, boardId: b.id, role: 'CEO' })
    for (const name of b.players || []) {
      allPlayers.push({ name, board: b.name, boardId: b.id, role: null })
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
            not cross-referenced against franchise league / emerging talent squads), plus each
            board's Chairman and CEO — several of whom also play in the franchise leagues.
            {truncated && ` Showing first ${MAX_RESULTS} — narrow your search to see more.`}
            {' '}Click a name to open their profile, or the rest of the card to preview achievements here.
          </p>

          {filtered.length === 0 ? (
            <div className="empty-state">
              No players match {query ? `"${query}"` : 'the selected board'}.
            </div>
          ) : (
            <div className="players-grid">
              {visible.map((p, i) => {
                const cardKey = `${p.name}-${i}`
                const isOpen = expanded === cardKey
                const achievements = getAchievementsFor(achievementsIndex, p.name)
                return (
                  <div
                    key={cardKey}
                    className={`players-card glass-panel${isOpen ? ' is-expanded' : ''}${achievements.length > 0 ? ' has-achievements' : ''}`}
                    onClick={() => setExpanded(isOpen ? null : cardKey)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setExpanded(isOpen ? null : cardKey)
                      }
                    }}
                  >
                    <div className="players-card__top">
                      <span className="players-card__badge">
                        <Badge name={p.name} size={44} rounded="square" />
                      </span>
                      <div className="players-card__text">
                        <p className="players-card__name">
                          <Link
                            to={`/players/${encodeURIComponent(p.name)}`}
                            className="players-card__name-text"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {p.name}
                          </Link>
                          {p.role && (
                            <span className="pill players-card__role-pill">
                              <IconCrown aria-hidden="true" /> {p.role}
                            </span>
                          )}
                        </p>
                        <Link
                          to={`/boards/${p.boardId}`}
                          className="players-card__board text-faint"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p.board}
                        </Link>
                      </div>
                      {achievements.length > 0 && (
                        <span className="pill players-card__achv-pill">
                          <IconAward aria-hidden="true" /> {achievements.length}
                        </span>
                      )}
                    </div>
                    {isOpen && (
                      <div className="players-card__achievements">
                        {achievements.length === 0 ? (
                          <p className="text-faint players-card__no-achv">
                            No achievements on record for this player yet.
                          </p>
                        ) : (
                          <ul>
                            {achievements.map((a, j) => (
                              <li key={j}>
                                <IconAward className="players-card__achv-icon" aria-hidden="true" />
                                <span>
                                  <b>{a.title}</b>
                                  {a.detail && <> · {a.detail}</>}
                                  <span className="text-faint players-card__achv-source"> — {a.source}</span>
                                  {a.credits != null && (
                                    <span className="pill players-card__achv-credits">
                                      {formatCredits(a.credits)} credits
                                    </span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
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
