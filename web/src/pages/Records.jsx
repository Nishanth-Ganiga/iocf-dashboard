import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { IconTrophy, IconAward } from '../lib/icons'
import './Records.css'

// Records & Milestones — biggest wins, whitewashes and most-decorated
// players, computed straight from the completed Series/Test sheets
// (server/data.py's get_records). Only rows with a clean two-team,
// clean-numeric result count toward a margin — nothing here is guessed.
export default function Records() {
  const { data, loading, error } = useDashboard()

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const records = data.records || {}
  const biggestWins = records.biggestWins || []
  const whitewashes = records.whitewashes || []
  const closestMatches = records.closestMatches || []
  const manOfTheMatch = records.manOfTheMatch || []
  const bestBatsman = records.bestBatsman || []
  const bestBowler = records.bestBowler || []

  const hasAny =
    biggestWins.length ||
    whitewashes.length ||
    closestMatches.length ||
    manOfTheMatch.length ||
    bestBatsman.length ||
    bestBowler.length

  if (!hasAny) {
    return (
      <div className="page-enter">
        <div className="container">
          <section className="page-section">
            <div className="section-header">
              <div>
                <p className="section-header__eyebrow">Hall of Numbers</p>
                <h2>Records & Milestones</h2>
              </div>
            </div>
            <div className="empty-state">No record data recorded yet.</div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Hall of Numbers</p>
              <h2>Records & Milestones</h2>
            </div>
          </div>
          <p className="text-faint records-caption">
            Biggest wins, whitewashes and most-decorated players — pulled straight from every
            completed series and Test on record.
          </p>
        </section>

        <RecordSection title="Biggest Wins" eyebrow="Widest Margins" rows={biggestWins} />
        <RecordSection title="Nail-Biters" eyebrow="Closest Margins" rows={closestMatches} />
        <RecordSection title="Whitewashes" eyebrow="Clean Sweeps" rows={whitewashes} />

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Most Decorated</p>
              <h2>Player Milestones</h2>
            </div>
          </div>
          <div className="records-decorated-grid">
            <DecoratedList title="Man of the Match" icon={<IconTrophy />} rows={manOfTheMatch} />
            <DecoratedList title="Best Batsman" icon={<IconAward />} rows={bestBatsman} />
            <DecoratedList title="Best Bowler" icon={<IconAward />} rows={bestBowler} />
          </div>
        </section>
      </div>
    </div>
  )
}

function RecordSection({ title, eyebrow, rows }) {
  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="section-header__eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="empty-state">No {title.toLowerCase()} recorded yet.</div>
      ) : (
        <div className="records-list">
          {rows.map((r, i) => (
            <div key={i} className="glass-panel records-row">
              <span className="records-row__margin">
                {r.margin}
                <span className="text-faint records-row__margin-label">margin</span>
              </span>
              <div className="records-row__teams">
                <span className="records-row__team">
                  <Badge name={r.hostBoard} size={32} />
                  {r.hostBoard}
                </span>
                <span className="text-faint records-row__vs">vs</span>
                <span className="records-row__team">
                  <Badge name={r.opponentBoard} size={32} />
                  {r.opponentBoard}
                </span>
              </div>
              <div className="records-row__meta">
                <span className="records-row__name">{r.seriesName}</span>
                <span className="text-faint">{r.result} · {r.dates}</span>
              </div>
              <span className="pill pill-status-completed records-row__winner">
                <IconTrophy aria-hidden="true" /> {r.winner}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function DecoratedList({ title, icon, rows }) {
  return (
    <div className="glass-panel records-decorated">
      <h3 className="records-decorated__title">{icon} {title}</h3>
      {rows.length === 0 ? (
        <p className="text-faint">No data recorded yet.</p>
      ) : (
        <ol className="records-decorated__list">
          {rows.map((r, i) => (
            <li key={i}>
              <span className="records-decorated__player">{r.player}</span>
              <b>{r.count}×</b>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
