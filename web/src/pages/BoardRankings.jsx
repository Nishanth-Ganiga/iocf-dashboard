import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import FlagIcon from '../components/FlagIcon'
import { formatCredits } from '../lib/badges'
import { knownBoardIdentity } from '../lib/boardIdentity'
import { IconPlayer, IconTrophy, IconUmpire } from '../lib/icons'
import './BoardRankings.css'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

// Board Rankings — credits is IOCF's only ranking metric (same order as
// the Credits Ranking leaderboard), but here every row is expanded into a
// full board comparison: chairman, CEO, roster size, trophy cabinet,
// umpire panel and stadium tier alongside the credits share bar, so
// ranking position and board profile don't need two separate lookups.
export default function BoardRankings() {
  const { data, loading, error } = useDashboard()
  const [query, setQuery] = useState('')

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const { boards = [] } = data
  const sorted = [...boards].sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999))
  const maxCredits = Math.max(1, ...sorted.map((b) => b.credits ?? 0))

  const q = query.trim().toLowerCase()
  const filtered = q ? sorted.filter((b) => b.name.toLowerCase().includes(q)) : sorted

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Full Board Comparison</p>
              <h2>Board Rankings</h2>
            </div>
            <input
              type="text"
              className="board-rankings-search"
              placeholder="Search boards by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <p className="text-faint board-rankings-caption">
            Ranked by credits — same order as Credits Ranking — alongside each board's
            chairman, CEO, roster size, trophy cabinet, umpire panel and stadium tier.
          </p>

          {filtered.length === 0 ? (
            <div className="empty-state">No boards match "{query}".</div>
          ) : (
            <div className="board-rankings-list">
              {filtered.map((b) => {
                const identity = knownBoardIdentity(b.name)
                const medal = MEDALS[b.ranking]
                const share = Math.max(2, ((b.credits ?? 0) / maxCredits) * 100)
                return (
                  <Link
                    key={b.id}
                    to={`/boards/${b.id}`}
                    className={`glass-panel board-rankings-row${medal ? ' board-rankings-row--top' : ''}`}
                  >
                    <div
                      className="board-rankings-row__bar"
                      style={{ width: `${share}%` }}
                      aria-hidden="true"
                    />
                    <div className="board-rankings-row__head">
                      <span className={`board-rankings-row__rank${medal ? ' board-rankings-row__rank--medal' : ''}`}>
                        {medal || `#${b.ranking}`}
                      </span>
                      <Badge name={b.name} size={48} />
                      <div className="board-rankings-row__title">
                        <span className="board-rankings-row__name">
                          {identity && <FlagIcon identity={identity} className="board-rankings-row__flag" />}
                          {b.name}
                        </span>
                        <span className="text-faint board-rankings-row__credits">
                          {formatCredits(b.credits)} credits
                        </span>
                      </div>
                    </div>
                    <div className="board-rankings-row__details">
                      <div className="board-rankings-row__stat">
                        <span className="text-faint">Chairman</span>
                        <b>{b.chairman || '—'}</b>
                      </div>
                      <div className="board-rankings-row__stat">
                        <span className="text-faint">CEO</span>
                        <b>{b.ceo || '—'}</b>
                      </div>
                      <div className="board-rankings-row__stat">
                        <span className="text-faint"><IconPlayer aria-hidden="true" /> Players</span>
                        <b>{b.playersCount ?? 0}</b>
                      </div>
                      <div className="board-rankings-row__stat">
                        <span className="text-faint"><IconTrophy aria-hidden="true" /> Trophies</span>
                        <b>{b.trophiesCount ?? 0}</b>
                      </div>
                      <div className="board-rankings-row__stat">
                        <span className="text-faint"><IconUmpire aria-hidden="true" /> Umpires</span>
                        <b>{b.umpiresCount ?? 0}</b>
                      </div>
                      <div className="board-rankings-row__stat">
                        <span className="text-faint">Stadium Tier</span>
                        <b>{b.stadiumTier || '—'}</b>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
