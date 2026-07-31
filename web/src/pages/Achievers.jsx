import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { buildAchievementsIndex, getAchievementsFor } from '../lib/playerAchievements'
import { findFranchiseSquads, splitOfficeHolders } from '../lib/playerProfile'
import { teamHonorFor } from '../lib/playerBadges'
import { IconAward, IconChampion, IconMedal, IconFairPlay } from '../lib/icons'
import './Achievers.css'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

// Hard cap on rendered rows, same rationale as Players.jsx — narrowing the
// search always reveals more of the ranked list.
const MAX_RESULTS = 150

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
// The IOCF Badge leaderboard lives on its own page (BadgeHolders.jsx) —
// computing every player's full badge cabinet is a heavier pass than this
// page's honors score, so it's kept off this route entirely rather than
// paid for on every visit here.
export default function Achievers() {
  const { data, loading, error } = useDashboard()
  const [query, setQuery] = useState('')
  const achievementsIndex = useMemo(() => buildAchievementsIndex(data), [data])

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

  const q = query.trim().toLowerCase()
  const filtered = q ? leaderboard.filter((p) => p.name.toLowerCase().includes(q)) : leaderboard
  const visible = filtered.slice(0, MAX_RESULTS)
  const truncated = filtered.length > visible.length

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Career Honors Leaderboard</p>
              <h2>Top Achievers</h2>
            </div>
            <input
              type="text"
              className="achievers-search"
              placeholder="Search players by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

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
        </section>
      </div>
    </div>
  )
}
