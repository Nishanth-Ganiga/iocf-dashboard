import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { buildAchievementsIndex, getAchievementsFor } from '../lib/playerAchievements'
import {
  findFranchiseSquads, findHomeBoard, representedBoards, splitOfficeHolders, FORMER_BOARD_MEMBER_NAMES,
} from '../lib/playerProfile'
import { computeBadges, BADGE_ICONS } from '../lib/playerBadges'
import { IconAward } from '../lib/icons'
import './BadgeHolders.css'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }
const MAX_RESULTS = 30

// Own route (rather than a tab on Achievers) so the heavier per-player
// pass here — computing each player's full badge cabinet via
// computeBadges, the same one PlayerDetail.jsx renders — only runs when
// this page is actually visited, instead of on every Top Achievers load.
// Clicking a player expands their row in place (mirroring Players.jsx's
// card-expand pattern) to reveal their board and full badge list, rather
// than navigating away.
export default function BadgeHolders() {
  const { data, loading, error } = useDashboard()
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(null)
  const achievementsIndex = useMemo(() => buildAchievementsIndex(data), [data])

  const leaderboard = useMemo(() => {
    if (!data) return []
    const { boards = [] } = data
    const pool = []
    for (const b of boards) {
      for (const n of splitOfficeHolders(b.chairman)) pool.push({ name: n, board: b.name, boardId: b.id })
      for (const n of splitOfficeHolders(b.ceo)) pool.push({ name: n, board: b.name, boardId: b.id })
      for (const name of b.players || []) pool.push({ name, board: b.name, boardId: b.id })
    }
    for (const [name, boardName] of Object.entries(FORMER_BOARD_MEMBER_NAMES)) {
      const board = boards.find((b) => b.name === boardName)
      if (board) pool.push({ name, board: board.name, boardId: board.id, former: true })
    }
    return pool
      .map((p) => {
        const home = findHomeBoard(data, p.name)
        const squads = findFranchiseSquads(data, p.name)
        const achievements = getAchievementsFor(achievementsIndex, p.name)
        const repBoards = representedBoards(home, squads)
        const badges = computeBadges(data, p.name, { home, squads, achievements, boards: repBoards })
        return { ...p, badges }
      })
      .filter((p) => p.badges.length > 0)
      .sort((a, b) => b.badges.length - a.badges.length)
      .slice(0, MAX_RESULTS)
      .map((p, i) => ({ ...p, rank: i + 1 }))
  }, [data, achievementsIndex])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const maxBadges = Math.max(1, ...leaderboard.map((p) => p.badges.length))

  const q = query.trim().toLowerCase()
  const filtered = q ? leaderboard.filter((p) => p.name.toLowerCase().includes(q)) : leaderboard

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Badge Cabinet Leaderboard</p>
              <h2>Top Badge Holders</h2>
            </div>
            <input
              type="text"
              className="bh-search"
              placeholder="Search players by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <p className="bh-caption text-faint">
            The top {MAX_RESULTS} players by IOCF Badge count — the same badge cabinet shown on
            each player's own profile (career milestones, franchise-league honors, board/team
            roles), just ranked here. {leaderboard.length} players have at least one badge on
            record. Click a player to see their board and full badge list.
          </p>

          {filtered.length === 0 ? (
            <div className="empty-state">No badge holders match "{query}".</div>
          ) : (
            <div className="glass-panel bh-table">
              {filtered.map((p) => {
                const cardKey = `${p.name}-${p.boardId}`
                const isOpen = expanded === cardKey
                const medal = MEDALS[p.rank]
                const share = Math.max(2, (p.badges.length / maxBadges) * 100)
                return (
                  <div
                    key={cardKey}
                    className={`bh-row${medal ? ' bh-row--top' : ''}${isOpen ? ' is-expanded' : ''}`}
                  >
                    <div className="bh-row__bar" style={{ width: `${share}%` }} aria-hidden="true" />
                    <div
                      className="bh-row__main"
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
                      <div className={`bh-row__rank${medal ? ` bh-row__rank--${p.rank}` : ''}`}>
                        {medal || `#${p.rank}`}
                      </div>
                      <Badge name={p.name} size={44} rounded="square" />
                      <div className="bh-row__text">
                        <Link
                          to={`/players/${encodeURIComponent(p.name)}`}
                          className="bh-row__name"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p.name}
                        </Link>
                        <span className="bh-row__board text-faint">
                          {p.former ? `Formerly ${p.board}` : p.board}
                        </span>
                      </div>
                      <div className="bh-row__count">
                        <span className="text-faint">Badges</span>
                        <b>{p.badges.length}</b>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="bh-row__panel">
                        <Link to={`/boards/${p.boardId}`} className="bh-row__board-link">
                          {p.former ? 'Formerly represented ' : 'Represents '}
                          {p.board}
                        </Link>
                        <div className="bh-badge-grid">
                          {p.badges.map((b) => {
                            const Icon = BADGE_ICONS[b.key] || IconAward
                            return (
                              <span key={b.key} className="bh-badge-chip" title={b.detail}>
                                <Icon aria-hidden="true" /> {b.label}
                              </span>
                            )
                          })}
                        </div>
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
