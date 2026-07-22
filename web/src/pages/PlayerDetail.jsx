import { Link, useParams } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { buildAchievementsIndex, getAchievementsFor } from '../lib/playerAchievements'
import { findHomeBoard, findFranchiseSquads } from '../lib/playerProfile'
import { formatCredits } from '../lib/badges'
import { IconAward, IconCrown, IconCaptain, IconPurse } from '../lib/icons'
import './PlayerDetail.css'

// Dedicated player profile: home board, every franchise-league squad
// they've been picked into, and their full achievement history — the
// same cross-referenced data Players.jsx expands inline, but given its
// own page + URL so it can be linked to directly.
export default function PlayerDetail() {
  const { name: encodedName } = useParams()
  const { data, loading, error } = useDashboard()

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const name = decodeURIComponent(encodedName)
  const home = findHomeBoard(data, name)

  if (!home) {
    return (
      <div className="page-enter">
        <div className="container">
          <section className="page-section">
            <BackLink />
            <div className="empty-state">
              Player not found.
              <div style={{ marginTop: 14 }}>
                <Link to="/players" className="btn btn-outline-gold">Back to Players</Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  const { board, role } = home
  const squads = findFranchiseSquads(data, name)
  const achievementsIndex = buildAchievementsIndex(data)
  const achievements = getAchievementsFor(achievementsIndex, name)

  return (
    <div className="page-enter">
      <div className="container">
        <BackLink />

        <section className="pd-hero glass-panel">
          <span className="pd-hero__badge">
            <Badge name={name} size={84} rounded="square" />
          </span>
          <div className="pd-hero__info">
            <h1 className="pd-hero__name gradient-heading">
              {name}
              {role && (
                <span className="pill pd-hero__role-pill">
                  <IconCrown aria-hidden="true" /> {role}
                </span>
              )}
            </h1>
            <p className="text-dim pd-hero__board">
              Represents{' '}
              <Link to={`/boards/${board.id}`} className="pd-hero__board-link">
                {board.name}
              </Link>
            </p>
          </div>
          <div className="pd-hero__stats">
            <div className="entity-card__stat">
              <span className="text-faint">Achievements</span>
              <b>{achievements.length}</b>
            </div>
            <div className="entity-card__stat">
              <span className="text-faint">Franchise Squads</span>
              <b>{squads.length}</b>
            </div>
          </div>
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Franchise Leagues</p>
              <h2>Squads ({squads.length})</h2>
            </div>
          </div>
          {squads.length === 0 ? (
            <div className="empty-state">Not picked in any franchise league squad on record.</div>
          ) : (
            <div className="pd-squad-grid">
              {squads.map((s, i) => (
                <Link key={i} to={`/tournaments/${s.leagueId}`} className="pd-squad-card glass-panel">
                  <p className="pd-squad-card__team">{s.team}</p>
                  <p className="text-faint pd-squad-card__league">{s.league}</p>
                  <div className="pd-squad-card__meta">
                    {s.role && (
                      <span className="pill pd-squad-card__role-pill">
                        <IconCaptain aria-hidden="true" /> {s.role}
                      </span>
                    )}
                    {s.credits != null && (
                      <span className="pill pd-squad-card__credits-pill">
                        <IconPurse aria-hidden="true" /> {formatCredits(s.credits)}
                      </span>
                    )}
                  </div>
                  {s.note && <p className="text-faint pd-squad-card__note">{s.note}</p>}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Career Honors</p>
              <h2><IconAward className="pd-section-icon" aria-hidden="true" /> Achievements ({achievements.length})</h2>
            </div>
          </div>
          {achievements.length === 0 ? (
            <div className="empty-state">No achievements on record for this player yet.</div>
          ) : (
            <ul className="pd-achv-list glass-panel">
              {achievements.map((a, i) => (
                <li key={i}>
                  <IconAward className="pd-achv-list__icon" aria-hidden="true" />
                  <span>
                    <b>{a.title}</b>
                    {a.detail && <> · {a.detail}</>}
                    <span className="text-faint pd-achv-list__source"> — {a.source}</span>
                    {a.credits != null && (
                      <span className="pill pd-achv-list__credits">
                        {formatCredits(a.credits)} credits
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link to="/players" className="pd-back">
      ← Back to Players
    </Link>
  )
}
