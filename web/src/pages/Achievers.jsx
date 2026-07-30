import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { buildAchievementsIndex, getAchievementsFor } from '../lib/playerAchievements'
import {
  findFranchiseSquads, findHomeBoard, representedBoards, splitOfficeHolders, FORMER_BOARD_MEMBER_NAMES,
} from '../lib/playerProfile'
import { computeBadges, teamHonorFor, BADGE_ICONS } from '../lib/playerBadges'
import { IconAward, IconChampion, IconMedal, IconFairPlay } from '../lib/icons'
import './Achievers.css'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

// Hard cap on rendered rows, same rationale as Players.jsx — narrowing the
// search always reveals more of the ranked list.
const MAX_RESULTS = 150
const MAX_BADGE_RESULTS = 30

// A trophy says more about a career than a single match award, and a
// Champion trophy outranks a Runner-up which outranks Fair Play — so each
// counts for more than a plain achievement, in that order, when ranking.
function scoreFor(achievementCount, honors) {
  return achievementCount + honors.champion * 3 + honors.runnerUp * 2 + honors.fairPlay
}

// Ranks every player across the dashboard by a combined "career honors"
// score: every individual award on record (Man of the Match, Best Batsman,
// Player of the Tournament, Hall of Fame induction, etc. — see
// lib/playerAchievements.js for the full source list) plus every franchise
// squad they were part of that went on to win Champion, Runner-up, or Fair
// Play for its league (lib/playerBadges.js's teamHonorFor). Nothing here is
// a new data field — it's the same achievements/squads data already shown
// on each player's own profile, just aggregated into one ranked list.
//
// A second tab ranks the same player pool by IOCF Badge count instead —
// the same badge cabinet PlayerDetail.jsx computes per player
// (computeBadges), just sorted and capped to the top 30. Clicking a row
// there expands it in place (mirroring Players.jsx's card-expand pattern)
// to reveal that player's board and full badge list, rather than
// navigating away.
export default function Achievers() {
  const { data, loading, error } = useDashboard()
  const [view, setView] = useState('honors')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(null)
  const achievementsIndex = useMemo(() => buildAchievementsIndex(data), [data])

  const badgesLeaderboard = useMemo(() => {
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
      .slice(0, MAX_BADGE_RESULTS)
      .map((p, i) => ({ ...p, rank: i + 1 }))
  }, [data, achievementsIndex])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const { boards = [] } = data

  const allPlayers = []
  for (const b of boards) {
    for (const n of splitOfficeHolders(b.chairman)) allPlayers.push({ name: n, board: b.name, boardId: b.id })
    for (const n of splitOfficeHolders(b.ceo)) allPlayers.push({ name: n, board: b.name, boardId: b.id })
    for (const name of b.players || []) allPlayers.push({ name, board: b.name, boardId: b.id })
  }

  const leaderboard = allPlayers
    .map((p) => {
      const achievementCount = getAchievementsFor(achievementsIndex, p.name).length
      const honors = { champion: 0, runnerUp: 0, fairPlay: 0 }
      for (const s of findFranchiseSquads(data, p.name)) {
        const honor = teamHonorFor(data, s.leagueId, s.team)
        if (honor === 'champion') honors.champion++
        else if (honor === 'runner-up') honors.runnerUp++
        else if (honor === 'fair-play') honors.fairPlay++
      }
      return { ...p, achievementCount, honors, score: scoreFor(achievementCount, honors) }
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1 }))

  const maxScore = Math.max(1, ...leaderboard.map((p) => p.score))
  const maxBadges = Math.max(1, ...badgesLeaderboard.map((p) => p.badges.length))

  const q = query.trim().toLowerCase()
  const filtered = q ? leaderboard.filter((p) => p.name.toLowerCase().includes(q)) : leaderboard
  const visible = filtered.slice(0, MAX_RESULTS)
  const truncated = filtered.length > visible.length

  const filteredBadges = q ? badgesLeaderboard.filter((p) => p.name.toLowerCase().includes(q)) : badgesLeaderboard

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">
                {view === 'honors' ? 'Career Honors Leaderboard' : 'Badge Cabinet Leaderboard'}
              </p>
              <h2>{view === 'honors' ? 'Top Achievers' : 'Top Badge Holders'}</h2>
            </div>
            <input
              type="text"
              className="achievers-search"
              placeholder="Search players by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="achievers-tabs">
            <button
              className={`achievers-tab${view === 'honors' ? ' is-active' : ''}`}
              onClick={() => setView('honors')}
            >
              Career Honors
            </button>
            <button
              className={`achievers-tab${view === 'badges' ? ' is-active' : ''}`}
              onClick={() => setView('badges')}
            >
              Top Badge Holders
            </button>
          </div>

          {view === 'honors' ? (
            <>
              <p className="achievers-caption text-faint">
                Ranked by a combined score: every individual award on record, plus every franchise
                squad that went on to win Champion (×3), Runner-up (×2), or Fair Play (×1) for its
                league. {leaderboard.length} players have at least one honor on record.
                {truncated && ` Showing top ${MAX_RESULTS} — narrow your search to see more.`}
              </p>

              {filtered.length === 0 ? (
                <div className="empty-state">No achievers match "{query}".</div>
              ) : (
                <div className="glass-panel achievers-table">
                  {visible.map((p) => {
                    const medal = MEDALS[p.rank]
                    const share = Math.max(2, (p.score / maxScore) * 100)
                    return (
                      <div
                        key={`${p.name}-${p.boardId}`}
                        className={`achievers-row${medal ? ' achievers-row--top' : ''}`}
                      >
                        <div className="achievers-row__bar" style={{ width: `${share}%` }} aria-hidden="true" />
                        <div className={`achievers-row__rank${medal ? ` achievers-row__rank--${p.rank}` : ''}`}>
                          {medal || `#${p.rank}`}
                        </div>
                        <Badge name={p.name} size={44} rounded="square" />
                        <div className="achievers-row__text">
                          <Link to={`/players/${encodeURIComponent(p.name)}`} className="achievers-row__name">
                            {p.name}
                          </Link>
                          <Link to={`/boards/${p.boardId}`} className="achievers-row__board text-faint">
                            {p.board}
                          </Link>
                        </div>
                        <div className="achievers-row__pills">
                          {p.honors.champion > 0 && (
                            <span className="pill achievers-pill achievers-pill--champion" title="Champion squads">
                              <IconChampion aria-hidden="true" /> {p.honors.champion}
                            </span>
                          )}
                          {p.honors.runnerUp > 0 && (
                            <span className="pill achievers-pill achievers-pill--runner-up" title="Runner-up squads">
                              <IconMedal aria-hidden="true" /> {p.honors.runnerUp}
                            </span>
                          )}
                          {p.honors.fairPlay > 0 && (
                            <span className="pill achievers-pill achievers-pill--fair-play" title="Fair Play squads">
                              <IconFairPlay aria-hidden="true" /> {p.honors.fairPlay}
                            </span>
                          )}
                          {p.achievementCount > 0 && (
                            <span className="pill achievers-pill achievers-pill--award" title="Individual awards">
                              <IconAward aria-hidden="true" /> {p.achievementCount}
                            </span>
                          )}
                        </div>
                        <div className="achievers-row__score">
                          <span className="text-faint">Score</span>
                          <b>{p.score}</b>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="achievers-caption text-faint">
                The top {MAX_BADGE_RESULTS} players by IOCF Badge count — the same badge cabinet
                shown on each player's own profile (career milestones, franchise-league honors,
                board/team roles), just ranked here. {badgesLeaderboard.length} players have at
                least one badge on record. Click a player to see their board and full badge list.
              </p>

              {filteredBadges.length === 0 ? (
                <div className="empty-state">No badge holders match "{query}".</div>
              ) : (
                <div className="glass-panel achievers-table">
                  {filteredBadges.map((p) => {
                    const cardKey = `${p.name}-${p.boardId}`
                    const isOpen = expanded === cardKey
                    const medal = MEDALS[p.rank]
                    const share = Math.max(2, (p.badges.length / maxBadges) * 100)
                    return (
                      <div
                        key={cardKey}
                        className={`achievers-row achievers-row--badges${medal ? ' achievers-row--top' : ''}${isOpen ? ' is-expanded' : ''}`}
                      >
                        <div className="achievers-row__bar" style={{ width: `${share}%` }} aria-hidden="true" />
                        <div
                          className="achievers-row__main"
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
                          <div className={`achievers-row__rank${medal ? ` achievers-row__rank--${p.rank}` : ''}`}>
                            {medal || `#${p.rank}`}
                          </div>
                          <Badge name={p.name} size={44} rounded="square" />
                          <div className="achievers-row__text">
                            <Link
                              to={`/players/${encodeURIComponent(p.name)}`}
                              className="achievers-row__name"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {p.name}
                            </Link>
                            <span className="achievers-row__board text-faint">
                              {p.former ? `Formerly ${p.board}` : p.board}
                            </span>
                          </div>
                          <div className="achievers-row__score">
                            <span className="text-faint">Badges</span>
                            <b>{p.badges.length}</b>
                          </div>
                        </div>
                        {isOpen && (
                          <div className="achievers-row__badges-panel">
                            <Link
                              to={`/boards/${p.boardId}`}
                              className="achievers-row__badges-board-link"
                            >
                              {p.former ? 'Formerly represented ' : 'Represents '}
                              {p.board}
                            </Link>
                            <div className="achievers-badge-grid">
                              {p.badges.map((b) => {
                                const Icon = BADGE_ICONS[b.key] || IconAward
                                return (
                                  <span key={b.key} className="achievers-badge-chip" title={b.detail}>
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
            </>
          )}
        </section>
      </div>
    </div>
  )
}
