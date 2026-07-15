import { useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { formatCredits } from '../lib/badges'
import './Fixtures.css'

// Fixtures & Results module — upcoming series/tests with best-effort
// countdowns, plus a results archive. Series and Test/WTC rows have
// different shapes coming out of the workbook, so every row is rendered
// through a generic field-walker rather than a hardcoded column list.

const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
]

// Best-effort "in ~N days" label from free-text dates like "8th July" or
// "6th - 10th Jan" — parses the FIRST day+month against the real current
// date. Never fabricates a countdown if parsing fails.
function parseCountdown(dateText) {
  if (!dateText || typeof dateText !== 'string') return null
  try {
    const match = dateText.match(/(\d{1,2})\w*\s*([A-Za-z]+)/)
    if (!match) return null
    const day = parseInt(match[1], 10)
    const monthAbbrev = match[2].slice(0, 3).toLowerCase()
    const monthIdx = MONTHS.indexOf(monthAbbrev)
    if (monthIdx === -1 || day < 1 || day > 31) return null

    const now = new Date()
    let target = new Date(now.getFullYear(), monthIdx, day)
    const diffDays = Math.round((target - now) / 86400000)
    if (diffDays < -7) target = new Date(now.getFullYear() + 1, monthIdx, day)

    const finalDiff = Math.round((target - now) / 86400000)
    if (finalDiff < 0) return 'happening now'
    if (finalDiff === 0) return 'today'
    return `in ~${finalDiff} day${finalDiff === 1 ? '' : 's'}`
  } catch {
    return null
  }
}

// Known "primary" keys we surface explicitly in the card header — anything
// else on the row is rendered generically as an extra tag so we never drop
// fields that differ between series/test/WTC shapes.
const TITLE_KEYS = ['Series Name', 'Test Name', 'League Name', 'Name']
const HOST_KEYS = ['Hosting Board']
const OPPONENT_KEYS = ['Opponents']

function pick(row, keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k]
  }
  return null
}

function findWinnersKey(row) {
  return Object.keys(row).find((k) => k.trim().toLowerCase() === 'winners') || null
}

function buildDateLabel(row) {
  if (row['Dates']) return row['Dates']
  if (row['Start Date'] && row['End Date']) return `${row['Start Date']} – ${row['End Date']}`
  if (row['Start Date']) return row['Start Date']
  if (row['Month']) return row['Month']
  return null
}

const CORE_KEYS = new Set(
  [...TITLE_KEYS, ...HOST_KEYS, ...OPPONENT_KEYS, 'Dates', 'Start Date', 'End Date', 'Month'].map((k) =>
    k.trim().toLowerCase()
  )
)

function extraEntries(row, winnersKey) {
  return Object.entries(row).filter(([k, v]) => {
    if (CORE_KEYS.has(k.trim().toLowerCase())) return false
    if (winnersKey && k === winnersKey) return false
    if (v === null || v === undefined || v === '') return false
    if (typeof v === 'string' && v.trim() === '-') return false
    return true
  })
}

function FixtureCard({ row, mode, typeLabel }) {
  const title = pick(row, TITLE_KEYS) || `${row['Hosting Board'] || 'TBD'} vs ${row['Opponents'] || 'TBD'}`
  const host = pick(row, HOST_KEYS)
  const opponents = pick(row, OPPONENT_KEYS)
  const dates = buildDateLabel(row)
  const countdown = mode === 'upcoming' ? parseCountdown(dates) : null
  const winnersKey = findWinnersKey(row)
  const winners = winnersKey ? row[winnersKey] : null
  const showWinner = mode === 'result' && winners && winners !== '-'
  const extras = extraEntries(row, winnersKey)

  return (
    <div className="glass-panel fixture-card">
      <div className="fixture-card__top">
        <div className="fixture-card__teams">
          <Badge name={host || opponents || title} size={40} rounded="square" />
          <div>
            <p className="fixture-card__title">{title}</p>
            <p className="fixture-card__meta">
              {host || '—'}
              {opponents ? ` vs ${opponents}` : ''}
            </p>
          </div>
        </div>
        <span className="pill fixture-card__type">{typeLabel}</span>
      </div>

      <div className="fixture-card__body">
        <div className="fixture-card__dates">
          <span className="text-faint">{dates || 'Date TBD'}</span>
          {countdown && <span className="pill pill-status-upcoming">{countdown}</span>}
        </div>

        {showWinner && (
          <p className="fixture-card__winner">
            🏆 Winner: <b>{winners}</b>
          </p>
        )}

        {extras.length > 0 && (
          <div className="fixture-card__extra">
            {extras.map(([k, v]) => (
              <span key={k} className="fixture-card__tag">
                <b>{k.trim()}:</b>{' '}
                <span className="fixture-card__tag-value">
                  {typeof v === 'number' ? formatCredits(v) : String(v)}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FixtureGroup({ title, rows, mode, typeLabel }) {
  if (!rows || rows.length === 0) return null
  return (
    <div className="fixture-group">
      <h3 className="fixture-group__title">{title}</h3>
      <div className="fixture-grid">
        {rows.map((row, i) => (
          <FixtureCard key={i} row={row} mode={mode} typeLabel={typeLabel} />
        ))}
      </div>
    </div>
  )
}

function NextUpStrip({ matches }) {
  if (!matches || matches.length === 0) return null
  return (
    <div className="fixture-nextup glass-panel">
      <p className="fixture-nextup__label text-faint">Next Up</p>
      <div className="fixture-nextup__row">
        {matches.map((m, i) => {
          const countdown = parseCountdown(m.dates)
          return (
            <div key={i} className="fixture-nextup__item">
              <Badge name={m.host} size={34} rounded="square" />
              <div className="fixture-nextup__text">
                <p className="fixture-nextup__name">{m.name}</p>
                <p className="text-dim fixture-nextup__meta">
                  {m.host} vs {m.opponents}
                  {m.format ? ` · ${m.format}` : ''}
                </p>
              </div>
              <div className="fixture-nextup__when">
                <span className="text-faint">{m.dates}</span>
                {countdown && <span className="pill pill-status-upcoming">{countdown}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WtcStatusGrid({ rows }) {
  if (!rows || rows.length === 0) return null
  return (
    <div className="fixture-group">
      <h3 className="fixture-group__title">WTC Fixture Status Grid</h3>
      <div className="wtc-grid glass-panel">
        {rows.map((row, i) => (
          <div key={i} className="wtc-grid__row">
            <div className="wtc-grid__teams">
              <Badge name={row['Hosting Board']} size={30} rounded="square" />
              <span className="wtc-grid__vs">
                {row['Hosting Board']} <span className="text-faint">vs</span> {row['Opponents']}
              </span>
            </div>
            {row['Start Date'] && <span className="text-faint wtc-grid__date">{row['Start Date']}</span>}
            <span
              className={`pill ${
                row['Status'] === 'Completed' ? 'pill-status-completed' : 'pill-status-upcoming'
              }`}
            >
              {row['Status']}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Fixtures() {
  const { data, loading, error } = useDashboard()
  const [tab, setTab] = useState('upcoming')

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const fixtures = data.fixtures || { series: {}, tests: {} }
  const series = fixtures.series || {}
  const tests = fixtures.tests || {}

  const upcomingSeries = series.upcomingSeries || []
  const upcomingWtcSeries = series.upcomingIocfWorldTestChampionshipMatches || []
  const upcomingWtcTests = tests.upcomingIocfWorldTestChampionshipMatches || []
  const completedSeries = series.completedSeries || []
  const completedTests = tests.completedMatches || []
  const franchiseLeagues = series.franchiseLeagues || []
  const majorTournaments = series.majorTournaments || []
  const wtcPending = tests.wtcPendingSchedule || []

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Fixtures & Results</p>
              <h2>Match Calendar</h2>
            </div>
            <div className="fixture-tabs">
              <button
                type="button"
                className={`fixture-tab ${tab === 'upcoming' ? 'is-active' : ''}`}
                onClick={() => setTab('upcoming')}
              >
                Upcoming
              </button>
              <button
                type="button"
                className={`fixture-tab ${tab === 'results' ? 'is-active' : ''}`}
                onClick={() => setTab('results')}
              >
                Results
              </button>
            </div>
          </div>

          <NextUpStrip matches={data.upcomingMatches} />

          {tab === 'upcoming' ? (
            <>
              <FixtureGroup title="Series" rows={upcomingSeries} mode="upcoming" typeLabel="Series" />
              <FixtureGroup
                title="Test / WTC"
                rows={[...upcomingWtcSeries, ...upcomingWtcTests]}
                mode="upcoming"
                typeLabel="WTC"
              />
              {franchiseLeagues.length > 0 && (
                <FixtureGroup title="Franchise Leagues" rows={franchiseLeagues} mode="upcoming" typeLabel="League" />
              )}
              {majorTournaments.length > 0 && (
                <FixtureGroup title="Major Tournaments" rows={majorTournaments} mode="upcoming" typeLabel="Tournament" />
              )}
              {upcomingSeries.length === 0 &&
                upcomingWtcSeries.length === 0 &&
                upcomingWtcTests.length === 0 &&
                franchiseLeagues.length === 0 &&
                majorTournaments.length === 0 && (
                  <div className="empty-state">No upcoming fixtures scheduled.</div>
                )}
            </>
          ) : (
            <>
              <FixtureGroup title="Series Results" rows={completedSeries} mode="result" typeLabel="Series" />
              <FixtureGroup title="Test Match Results" rows={completedTests} mode="result" typeLabel="Test" />
              {completedSeries.length === 0 && completedTests.length === 0 && (
                <div className="empty-state">No completed fixtures recorded yet.</div>
              )}
            </>
          )}
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">World Test Championship</p>
              <h2>WTC Schedule Status</h2>
            </div>
          </div>
          <WtcStatusGrid rows={wtcPending} />
          {wtcPending.length === 0 && <div className="empty-state">No WTC schedule data recorded yet.</div>}
        </section>
      </div>
    </div>
  )
}
