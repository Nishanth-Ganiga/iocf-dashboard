import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import './Transfers.css'

// Auctions & Transfers module — there is no dedicated transfers/auction
// table in the workbook. What exists is a free-text transfer log per
// board (data.boards[i].transfers, lines like "Yasin Iqbal - 5k"). This
// page flattens that into a searchable feed grouped by board, in the same
// order boards already come in (ranked by credits). We deliberately do
// NOT try to parse "- 5k" / "(10k)" suffixes into a structured amount —
// that would fabricate precision the source data doesn't have.
export default function Transfers() {
  const { data, loading, error } = useDashboard()
  const [query, setQuery] = useState('')

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const boards = data.boards || []

  const groups = boards
    .map((b) => ({
      board: b,
      lines: b.transfers || [],
    }))
    .filter((g) => g.lines.length > 0)

  const q = query.trim().toLowerCase()
  const filteredGroups = q
    ? groups
        .map((g) => ({
          ...g,
          lines: g.board.name.toLowerCase().includes(q) ? g.lines : g.lines.filter((line) => line.toLowerCase().includes(q)),
        }))
        .filter((g) => g.lines.length > 0)
    : groups

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Auctions & Transfers</p>
              <h2>Transfer Activity Log</h2>
            </div>
            <input
              type="text"
              className="transfers-search"
              placeholder="Search transfers or board names…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <p className="text-dim transfers-intro">
            This reflects the free-text transfer / auction log recorded directly in each board's
            sheet — a running list of lines like "Player — amount", not a structured auction
            ledger with clean date/amount/player columns. Any "- 5k" or "(10k)" suffix shown
            below is shown verbatim as it appears in the source; no extra structure has been
            inferred from it.
          </p>
          <p className="text-faint transfers-count">
            {groups.length} of {boards.length} boards have recorded transfer activity.
          </p>

          {filteredGroups.length === 0 ? (
            <div className="empty-state">
              {q ? `No transfer lines match "${query}".` : 'No transfer activity recorded yet.'}
            </div>
          ) : (
            <div className="transfers-feed">
              {filteredGroups.map((g) => (
                <div key={g.board.id} className="glass-panel transfers-group">
                  <Link to={`/boards/${g.board.id}`} className="transfers-group__header">
                    <Badge name={g.board.name} size={40} />
                    <div>
                      <p className="transfers-group__name">{g.board.name}</p>
                      <p className="text-faint transfers-group__meta">
                        {g.lines.length} transfer{g.lines.length === 1 ? '' : 's'} recorded
                      </p>
                    </div>
                  </Link>
                  <ul className="transfers-group__list">
                    {g.lines.map((line, i) => (
                      <li key={i} className="transfers-line">
                        <span className="transfers-line__icon">🔁</span>
                        <span className="transfers-line__text">{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
