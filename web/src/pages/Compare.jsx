import { useMemo, useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { formatCredits } from '../lib/badges'
import { IconTrophy, IconBoard, IconCredits, IconPodium, IconUmpire } from '../lib/icons'
import './Compare.css'

function formatNumber(v, decimals = 0) {
  if (v == null) return '—'
  return v.toLocaleString(undefined, { maximumFractionDigits: decimals })
}

// Board Comparator — pick any two boards, see credits/trophies/rankings
// side by side, plus the full head-to-head meeting history and cumulative
// win/loss tally between them. Combines the "comparator" and "rivalry
// tracker" ideas into one page since they are built from the exact same
// pairwise-meeting data (server/data.py's get_head_to_head).
export default function Compare() {
  const { data, loading, error } = useDashboard()
  const [boardAName, setBoardAName] = useState(null)
  const [boardBName, setBoardBName] = useState(null)

  const boards = data?.boards || []
  const sortedBoards = useMemo(() => [...boards].sort((a, b) => a.name.localeCompare(b.name)), [boards])

  const boardA = boards.find((b) => b.name === boardAName) || sortedBoards[0] || null
  const boardB = boards.find((b) => b.name === boardBName) || sortedBoards[1] || null

  const overallRanking = (data?.boardRankings || []).find((t) => t.id === 'overall-board-ranking')
  const overallByName = useMemo(
    () => new Map((overallRanking?.table || []).map((r) => [r.board, r])),
    [overallRanking]
  )

  const meetings = useMemo(() => {
    if (!boardA || !boardB || boardA.name === boardB.name) return []
    return (data?.headToHead || []).filter(
      (m) =>
        (m.hostBoard === boardA.name && m.opponentBoard === boardB.name) ||
        (m.hostBoard === boardB.name && m.opponentBoard === boardA.name)
    )
  }, [data, boardA, boardB])

  const tally = useMemo(() => {
    let winsA = 0
    let winsB = 0
    for (const m of meetings) {
      if (m.winner === boardA?.name) winsA += 1
      else if (m.winner === boardB?.name) winsB += 1
    }
    return { winsA, winsB }
  }, [meetings, boardA, boardB])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  if (sortedBoards.length < 2) {
    return (
      <div className="page-enter">
        <div className="container">
          <section className="page-section">
            <div className="section-header">
              <div>
                <p className="section-header__eyebrow">Rivalries</p>
                <h2>Board Comparator</h2>
              </div>
            </div>
            <div className="empty-state">Need at least two boards on record to compare.</div>
          </section>
        </div>
      </div>
    )
  }

  const same = boardA && boardB && boardA.name === boardB.name

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Rivalries</p>
              <h2>Board Comparator</h2>
            </div>
          </div>
          <p className="text-faint compare-caption">
            Pick any two boards to compare their credits, rankings and trophies side by side,
            and see every recorded meeting between them.
          </p>

          <div className="compare-picker">
            <select
              className="compare-picker__select"
              value={boardA?.name || ''}
              onChange={(e) => setBoardAName(e.target.value)}
            >
              {sortedBoards.map((b) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
            <span className="compare-picker__vs">VS</span>
            <select
              className="compare-picker__select"
              value={boardB?.name || ''}
              onChange={(e) => setBoardBName(e.target.value)}
            >
              {sortedBoards.map((b) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
        </section>

        {same ? (
          <div className="empty-state">Pick two different boards to compare.</div>
        ) : (
          <>
            <section className="page-section">
              <div className="compare-grid">
                <BoardColumn board={boardA} overall={overallByName.get(boardA.name)} />
                <div className="compare-tally">
                  <span className="compare-tally__score">{tally.winsA}</span>
                  <span className="text-faint compare-tally__label">Head-to-Head</span>
                  <span className="compare-tally__score">{tally.winsB}</span>
                </div>
                <BoardColumn board={boardB} overall={overallByName.get(boardB.name)} align="right" />
              </div>
            </section>

            <section className="page-section">
              <div className="section-header">
                <div>
                  <p className="section-header__eyebrow">All-Time Meetings</p>
                  <h2>{boardA.name} vs {boardB.name}</h2>
                </div>
              </div>
              {meetings.length === 0 ? (
                <div className="empty-state">These two boards have not met yet on record.</div>
              ) : (
                <div className="compare-meetings">
                  {meetings.map((m, i) => (
                    <div key={i} className="glass-panel compare-meeting">
                      <span className={`pill compare-meeting__format compare-meeting__format--${m.format.toLowerCase()}`}>
                        {m.format}
                      </span>
                      <div className="compare-meeting__body">
                        <span className="compare-meeting__name">{m.name}</span>
                        <span className="text-faint">
                          {m.hostBoard} vs {m.opponentBoard}
                          {m.hostScore != null && ` · ${m.hostScore}-${m.opponentScore}`}
                          {' · '}{m.dates}
                        </span>
                      </div>
                      <span className="pill pill-status-completed compare-meeting__winner">
                        <IconTrophy aria-hidden="true" /> {m.winner}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function BoardColumn({ board, overall, align = 'left' }) {
  return (
    <div className={`glass-panel compare-column compare-column--${align}`}>
      <div className="compare-column__head">
        <Badge name={board.name} size={64} />
        <span className="compare-column__name">{board.name}</span>
      </div>
      <div className="compare-column__stats">
        <div className="compare-column__stat">
          <span className="text-faint"><IconCredits aria-hidden="true" /> Credits</span>
          <b>{formatCredits(board.credits)}</b>
        </div>
        <div className="compare-column__stat">
          <span className="text-faint"><IconBoard aria-hidden="true" /> Credits Rank</span>
          <b>#{board.ranking}</b>
        </div>
        <div className="compare-column__stat">
          <span className="text-faint"><IconTrophy aria-hidden="true" /> Trophies</span>
          <b>{board.trophiesCount ?? 0}</b>
        </div>
        <div className="compare-column__stat">
          <span className="text-faint"><IconUmpire aria-hidden="true" /> Umpires</span>
          <b>{board.umpiresCount ?? 0}</b>
        </div>
        {overall && (
          <>
            <div className="compare-column__stat">
              <span className="text-faint"><IconPodium aria-hidden="true" /> Overall Rank</span>
              <b>#{overall.rank}</b>
            </div>
            <div className="compare-column__stat">
              <span className="text-faint">Winning Rate</span>
              <b>{overall.winningRate != null ? `${formatNumber(overall.winningRate, 1)}%` : '—'}</b>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
