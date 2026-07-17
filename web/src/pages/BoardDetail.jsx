import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import FlagIcon from '../components/FlagIcon'
import MascotIcon from '../components/MascotIcon'
import { formatCredits } from '../lib/badges'
import { knownBoardIdentity } from '../lib/boardIdentity'
import { IconStadium, IconTrophy, IconUmpire, IconCredits } from '../lib/icons'
import './BoardDetail.css'

// Rich single-board profile: leadership, roster, stadiums, trophy cabinet
// and recent transfer activity — everything the workbook has on one board.
export default function BoardDetail() {
  const { boardId } = useParams()
  const { data, loading, error } = useDashboard()

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const board = (data.boards || []).find((b) => b.id === boardId)

  if (!board) {
    return (
      <div className="page-enter">
        <div className="container">
          <div className="empty-state">
            <p>Board not found.</p>
            <p style={{ marginTop: 10 }}>
              <Link to="/boards" className="btn btn-outline-gold">
                Back to Boards
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  const totalBoards = (data.boards || []).length
  const players = board.players || []
  const stadiums = board.stadiums || []
  const trophies = board.trophies || []
  const transfers = board.transfers || []
  const umpires = board.umpires || []
  const identity = knownBoardIdentity(board.name)

  return (
    <div className="page-enter">
      <div className="container">
        <Link to="/boards" className="board-detail__back">
          <span className="board-detail__back-arrow" aria-hidden="true">←</span> Back to Boards
        </Link>

        <section className="board-detail__hero glass-panel">
          <span className="board-detail__hero-badge">
            <Badge name={board.name} size={72} />
          </span>
          <div className="board-detail__hero-info">
            <h1 className="board-detail__name gradient-heading">
              {identity && <FlagIcon identity={identity} className="board-detail__flag" />} {board.name}
            </h1>
            <div className="board-detail__meta-row">
              <span className="text-dim">Chairman: {board.chairman || '—'}</span>
              <span className="text-dim">CEO: {board.ceo || '—'}</span>
              {board.stadiumTier && (
                <span className="pill board-detail__tier-pill">{board.stadiumTier}</span>
              )}
              {identity?.mascotName && (
                <span className="pill board-detail__mascot-pill">
                  <MascotIcon identity={identity} /> {identity.mascotName}
                </span>
              )}
            </div>
          </div>
          <div className="board-detail__hero-stats">
            <div className="entity-card__stat">
              <span className="text-faint">Ranking</span>
              <b>#{board.ranking} of {totalBoards}</b>
            </div>
            <div className="entity-card__stat">
              <span className="text-faint">Credits</span>
              <b>{formatCredits(board.credits)}</b>
            </div>
          </div>
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Full Roster</p>
              <h2>Players ({board.playersCount ?? players.length})</h2>
            </div>
          </div>
          {players.length === 0 ? (
            <div className="empty-state">No players recorded for this board.</div>
          ) : (
            <div className="board-detail__player-grid">
              {players.map((name, i) => (
                <div key={i} className="board-detail__player-chip glass-panel">
                  <Badge name={name} size={32} rounded="square" />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Home Grounds</p>
              <h2>Stadiums ({stadiums.length})</h2>
            </div>
          </div>
          {stadiums.length === 0 ? (
            <div className="empty-state">No stadiums recorded for this board.</div>
          ) : (
            <div className="board-detail__stadium-grid">
              {stadiums.map((entry, i) => {
                const [venue, ...tags] = entry.split('|').map((s) => s.trim())
                return (
                  <div key={i} className="board-detail__stadium-card glass-panel">
                    <p className="board-detail__stadium-name">
                      <IconStadium className="board-detail__stadium-icon" /> {venue}
                    </p>
                    {tags.length > 0 && (
                      <div className="board-detail__stadium-tags">
                        {tags.map((tag, j) => (
                          <span key={j} className="pill board-detail__stadium-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Hall of Champions</p>
              <h2><IconTrophy className="board-detail__section-icon" /> Trophy Cabinet ({board.trophiesCount ?? trophies.length})</h2>
            </div>
          </div>
          {trophies.length === 0 ? (
            <div className="empty-state">No trophies recorded for this board.</div>
          ) : (
            <div className="board-detail__trophy-grid">
              {trophies.map((trophy, i) => (
                <div key={i} className="board-detail__trophy-card glass-panel">
                  <span className="board-detail__trophy-icon"><IconTrophy /></span>
                  <span>{trophy}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">On-Field Officials</p>
              <h2><IconUmpire className="board-detail__section-icon" /> Umpires ({board.umpiresCount ?? umpires.length})</h2>
            </div>
            {board.umpireCredits != null && (
              <span className="pill board-detail__umpire-credits-pill">
                <IconCredits aria-hidden="true" /> {formatCredits(board.umpireCredits)} total
              </span>
            )}
          </div>
          {umpires.length === 0 ? (
            <div className="empty-state">No umpires recorded for this board.</div>
          ) : (
            <div className="board-detail__umpire-grid">
              {umpires.map((umpire, i) => (
                <UmpireCard key={i} umpire={umpire} />
              ))}
            </div>
          )}
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Activity Log</p>
              <h2>Recent Transfers</h2>
            </div>
          </div>
          {transfers.length === 0 ? (
            <div className="empty-state">No transfer activity on record.</div>
          ) : (
            <div className="glass-panel board-detail__transfer-list">
              {transfers.map((line, i) => (
                <div key={i} className="board-detail__transfer-row">
                  <span className="board-detail__transfer-dot" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

// One umpire's officiating record — name up top, appearance/activity lines
// (kept verbatim, exactly as parsed from the workbook) collapsed behind a
// toggle once there are more than a handful, matching the squad-card
// expand pattern used elsewhere in the dashboard.
function UmpireCard({ umpire }) {
  const [expanded, setExpanded] = useState(false)
  const appearances = umpire.appearances || []
  const shown = expanded ? appearances : appearances.slice(0, 4)

  return (
    <div className="entity-card glass-panel board-detail__umpire-card">
      <div className="entity-card__top">
        <Badge name={umpire.name} size={44} rounded="square" />
        <div>
          <p className="entity-card__title">{umpire.name}</p>
          <p className="entity-card__meta">
            {appearances.length} record{appearances.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>
      {appearances.length > 0 && (
        <ul className="board-detail__umpire-card__appearances">
          {shown.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}
      {appearances.length > 4 && (
        <button
          type="button"
          className="btn btn-ghost board-detail__umpire-card__toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show less' : `Show all ${appearances.length}`}
        </button>
      )}
    </div>
  )
}
