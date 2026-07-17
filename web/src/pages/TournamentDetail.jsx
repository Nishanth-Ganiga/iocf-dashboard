import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { IconChampion, IconMedal, IconMatch, IconCalendar, IconPurse, IconCaptain, IconCancelled, IconTrophy } from '../lib/icons'
import { colorsFor, formatCredits } from '../lib/badges'
import './TournamentDetail.css'

// Tournament detail — dispatches to a different renderer depending on which
// data source backs this tournament id, since the workbook's richness
// varies a lot between the flagship World Cup, franchise leagues, the
// Emerging Talent League, Lone Warrior, and the (fixture-less) continental
// cups. Falls back to the generic base record if nothing else matches.
export default function TournamentDetail() {
  const { tournamentId } = useParams()
  const { data, loading, error } = useDashboard()

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const base = (data.tournaments || []).find((t) => t.id === tournamentId)

  if (!base) {
    return (
      <div className="page-enter">
        <div className="container">
          <section className="page-section">
            <BackLink />
            <div className="empty-state">
              Tournament not found.
              <div style={{ marginTop: 14 }}>
                <Link to="/tournaments" className="btn btn-outline-gold">Back to Tournaments</Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  let body
  if (tournamentId === 't20-world-cup-2026' && data.t20WorldCup) {
    body = <T20WorldCupDetail t20={data.t20WorldCup} />
  } else if (tournamentId === 'emerging-talent-league-2026' && data.emergingTalentLeague) {
    body = <EmergingTalentDetail etl={data.emergingTalentLeague} />
  } else if (tournamentId === 'lone-warrior-2026' && data.loneWarrior) {
    body = <LoneWarriorDetail lw={data.loneWarrior} />
  } else {
    const continentalCup = (data.continentalCups || []).find((c) => c.id === tournamentId)
    const franchiseLeague = (data.franchiseLeagues || []).find((l) => l.id === tournamentId)
    if (continentalCup) {
      body = <ContinentalCupDetail cup={continentalCup} />
    } else if (franchiseLeague) {
      body = <FranchiseLeagueDetail league={franchiseLeague} />
    } else {
      body = <GenericTournamentDetail base={base} />
    }
  }

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <BackLink />
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">{base.category} · Season {base.season}</p>
              <h2>{base.name}</h2>
            </div>
            <span className={`pill pill-status-${base.status.toLowerCase()}`}>{base.status}</span>
          </div>
          {body}
        </section>
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link to="/tournaments" className="td-back">
      ← Back to Tournaments
    </Link>
  )
}

function ChampionBanner({ champion, runnerUp, championBoard, runnerUpBoard, totalMatches }) {
  if (!champion && !runnerUp) return null
  return (
    <div className="td-banner glass-panel">
      {champion && (
        <div className="td-banner__slot">
          <Badge name={champion} size={56} />
          <div>
            <p className="text-faint td-banner__label">
              <IconChampion className="td-banner__icon td-banner__icon--champion" aria-hidden="true" />
              Champion
            </p>
            <p className="td-banner__name">{champion}</p>
            {championBoard && <p className="td-banner__sub text-dim">{championBoard}</p>}
          </div>
        </div>
      )}
      {runnerUp && (
        <div className="td-banner__slot">
          <Badge name={runnerUp} size={48} />
          <div>
            <p className="text-faint td-banner__label">
              <IconMedal className="td-banner__icon" aria-hidden="true" />
              Runner-up
            </p>
            <p className="td-banner__name">{runnerUp}</p>
            {runnerUpBoard && <p className="td-banner__sub text-dim">{runnerUpBoard}</p>}
          </div>
        </div>
      )}
      {totalMatches != null && (
        <div className="td-banner__slot td-banner__slot--stat">
          <p className="text-faint td-banner__label">
            <IconMatch className="td-banner__icon" aria-hidden="true" />
            Total Matches
          </p>
          <p className="td-banner__name">{totalMatches}</p>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* T20 World Cup — groups, per-stage match tables, awards              */
/* ------------------------------------------------------------------ */
function T20WorldCupDetail({ t20 }) {
  const groupNames = Object.keys(t20.groups || {})
  const stageNames = Object.keys(t20.stages || {})

  return (
    <>
      <ChampionBanner
        champion={t20.champion}
        runnerUp={t20.runnerUp}
        totalMatches={t20.totalMatches}
      />

      <div className="td-subsection">
        <h3 className="td-subsection__title">Groups</h3>
        {groupNames.length === 0 ? (
          <div className="empty-state">No groups on record.</div>
        ) : (
          <div className="card-grid">
            {groupNames.map((g) => (
              <div key={g} className="entity-card glass-panel td-team-list">
                <p className="entity-card__title">{g}</p>
                <ul className="td-team-list__items">
                  {(t20.groups[g] || []).map((team) => (
                    <li key={team}>
                      <Badge name={team} size={26} /> {team}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {stageNames.map((stage) => (
        <StageMatchesTable key={stage} title={stage} matches={t20.stages[stage] || []} />
      ))}

      <AwardsTable awards={t20.awards} />
    </>
  )
}

// Generic match table: renders whatever keys are present on each match row,
// since match objects have varying key sets (extra "Man of the match",
// "Best Batsman", "Best Bowler" columns on some rows but not others).
function StageMatchesTable({ title, matches }) {
  if (!matches || matches.length === 0) return null
  const columns = []
  for (const row of matches) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) columns.push(key)
    }
  }

  return (
    <div className="td-subsection">
      <h3 className="td-subsection__title">{title}</h3>
      <div className="td-table-scroll glass-panel">
        <table className="td-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matches.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col}>{row[col] ?? '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AwardsTable({ awards }) {
  return (
    <div className="td-subsection">
      <h3 className="td-subsection__title">Awards</h3>
      {!awards || awards.length === 0 ? (
        <div className="empty-state">No awards on record.</div>
      ) : (
        <div className="td-table-scroll glass-panel">
          <table className="td-table">
            <thead>
              <tr>
                <th>Award</th>
                <th>Winner</th>
                <th>Board</th>
                <th>Credits</th>
              </tr>
            </thead>
            <tbody>
              {awards.map((a, i) => (
                <tr key={i}>
                  <td>{a.award}</td>
                  <td>{a.winner}</td>
                  <td>{a.board}</td>
                  <td>{formatCredits(a.credits)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Emerging Talent League — squads + fixture list                      */
/* ------------------------------------------------------------------ */
function EmergingTalentDetail({ etl }) {
  const boards = Object.keys(etl.squads || {})
  const matches = etl.matches || []

  return (
    <>
      <ChampionBanner champion={etl.champion} runnerUp={etl.runnerUp} />

      <div className="td-subsection">
        <h3 className="td-subsection__title">Squads</h3>
        {boards.length === 0 ? (
          <div className="empty-state">No squads on record.</div>
        ) : (
          <div className="card-grid">
            {boards.map((b) => (
              <SquadCard key={b} board={b} players={etl.squads[b]} />
            ))}
          </div>
        )}
      </div>

      <div className="td-subsection">
        <h3 className="td-subsection__title">Fixtures</h3>
        {matches.length === 0 ? (
          <div className="empty-state">No fixtures on record.</div>
        ) : (
          <div className="glass-panel td-fixture-list">
            {matches.map((m, i) => (
              <div key={i} className="td-fixture-row">
                <div className="td-fixture-row__teams">
                  <Badge name={m.host} size={32} />
                  <span>{m.host}</span>
                  <span className="text-faint td-fixture-row__vs">
                    <IconMatch className="td-fixture-row__vs-icon" aria-hidden="true" /> vs
                  </span>
                  <Badge name={m.opponent} size={32} />
                  <span>{m.opponent}</span>
                </div>
                <div className="td-fixture-row__meta text-dim">
                  <IconCalendar className="td-fixture-row__meta-icon" aria-hidden="true" />
                  {m.venue} · {m.date}
                </div>
                <div className="td-fixture-row__result">
                  {m.winner && <span className="pill pill-status-completed">Won: {m.winner}</span>}
                  {m.motm && <span className="text-faint">MOTM: {m.motm}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Lone Warrior — one representative per board                         */
/* ------------------------------------------------------------------ */
function LoneWarriorDetail({ lw }) {
  const boards = Object.keys(lw.representatives || {})

  return (
    <>
      <ChampionBanner
        champion={lw.champion}
        runnerUp={lw.runnerUp}
        championBoard={lw.champion_board}
        runnerUpBoard={lw.runnerUp_board}
      />

      <div className="td-subsection">
        <h3 className="td-subsection__title">Representatives</h3>
        {boards.length === 0 ? (
          <div className="empty-state">No representatives on record.</div>
        ) : (
          <div className="card-grid td-rep-grid">
            {boards.map((b) => (
              <div key={b} className="entity-card glass-panel td-rep-card">
                <Badge name={lw.representatives[b]} size={44} />
                <div>
                  <p className="entity-card__title">{lw.representatives[b]}</p>
                  <p className="entity-card__meta">{b}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Continental Cup — participants only, no fixtures yet                */
/* ------------------------------------------------------------------ */
function ContinentalCupDetail({ cup }) {
  const teams = cup.teams || []
  return (
    <>
      <ChampionBanner champion={cup.champion} />
      <div className="td-subsection">
        <h3 className="td-subsection__title">Participating Teams</h3>
        {teams.length === 0 ? (
          <div className="empty-state">No participants on record.</div>
        ) : (
          <div className="card-grid">
            {teams.map((team) => (
              <div key={team} className="entity-card glass-panel td-team-card">
                <Badge name={team.replace(/\s*\(Host\)|\(\s*HOST\s*\)/gi, '').trim()} size={44} />
                <p className="entity-card__title">{team}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="empty-state">Fixtures for this cup have not been scheduled yet.</div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Franchise League — players grouped by home national board           */
/* ------------------------------------------------------------------ */
function FranchiseLeagueDetail({ league }) {
  const teamNames = Object.keys(league.teams || {})
  const boardNames = Object.keys(league.boards || {})
  const matches = league.matches || []
  const awards = league.awards || []
  const isCancelled = league.status === 'Cancelled'

  // The auction-style team rosters carry real per-player credit
  // valuations - a total-purse-spent figure per team is a natural,
  // genuinely meaningful stat this data supports that a plain player list
  // doesn't, so it's computed here rather than left implicit in the table.
  const teamsWithSpend = teamNames.map((name) => {
    const team = league.teams[name]
    const players = team.players || []
    const spent = players.reduce((sum, p) => sum + (p.credits || 0), 0)
    return { name, ...team, spent }
  })
  const highestSpend = Math.max(1, ...teamsWithSpend.map((t) => t.spent))

  return (
    <>
      <ChampionBanner champion={league.champion} runnerUp={league.runnerUp} totalMatches={league.totalMatches || null} />

      {isCancelled && (
        <div className="td-cancelled-banner glass-panel">
          <IconCancelled className="td-cancelled-banner__icon" aria-hidden="true" />
          <div>
            <p className="td-cancelled-banner__title">Season Cancelled</p>
            <p className="text-dim td-cancelled-banner__sub">
              This season was called off partway through — the roster and match results below
              are exactly as far as the source record goes, not a complete season.
            </p>
          </div>
        </div>
      )}

      {teamNames.length > 0 && (
        <div className="td-subsection">
          <h3 className="td-subsection__title">Franchise Teams</h3>
          <div className="card-grid td-franchise-grid">
            {teamsWithSpend.map((team) => (
              <FranchiseTeamCard key={team.name} team={team} highestSpend={highestSpend} />
            ))}
          </div>
        </div>
      )}

      {matches.length > 0 && <FranchiseMatchTimeline matches={matches} />}

      {awards.length > 0 && <FranchiseAwardsShowcase awards={awards} />}

      {boardNames.length > 0 && (
        <div className="td-subsection">
          <h3 className="td-subsection__title">Registered Players by Board</h3>
          <p className="text-faint td-caption">
            Every player who registered for this league's national-board draft pool — not every
            registrant was picked up by a franchise team at auction, so this list runs larger
            than the rosters above.
          </p>
          <div className="card-grid">
            {boardNames.map((b) => (
              <SquadCard key={b} board={b} players={league.boards[b]} />
            ))}
          </div>
        </div>
      )}

      {teamNames.length === 0 && matches.length === 0 && awards.length === 0 && boardNames.length === 0 && (
        <div className="empty-state">No franchise league data recorded for this season yet.</div>
      )}
    </>
  )
}

// One franchise team's auction roster: captain/mentor called out up top,
// a spend bar (this team's total credits spent vs. the league's biggest
// spender) for an at-a-glance "how this squad was built" read, then the
// full paid roster collapsed behind a toggle like every other squad list
// in this file.
function FranchiseTeamCard({ team, highestSpend }) {
  const [expanded, setExpanded] = useState(false)
  const [c1] = colorsFor(team.name)
  const players = team.players || []
  const leadership = players.filter((p) => p.role)
  const roster = players.filter((p) => !p.role)
  const shown = expanded ? roster : roster.slice(0, 5)
  const spendPct = Math.round((team.spent / highestSpend) * 100)

  return (
    <div className="entity-card glass-panel td-franchise-card" style={{ '--team-color': c1 }}>
      <div className="td-franchise-card__top">
        <Badge name={team.name} size={48} />
        <div>
          <p className="entity-card__title">{team.name}</p>
          <p className="entity-card__meta">{players.length} player{players.length === 1 ? '' : 's'} signed</p>
        </div>
      </div>

      {leadership.length > 0 && (
        <div className="td-franchise-card__leadership">
          {leadership.map((p) => (
            <span key={p.name} className="pill td-franchise-card__role-pill">
              <IconCaptain aria-hidden="true" /> {p.name} · {p.role}
            </span>
          ))}
        </div>
      )}

      <div className="td-franchise-card__spend">
        <div className="td-franchise-card__spend-label">
          <span className="text-faint">
            <IconPurse aria-hidden="true" /> Credits Spent
          </span>
          <b>{formatCredits(team.spent)}</b>
        </div>
        <div className="td-franchise-card__spend-bar">
          <div className="td-franchise-card__spend-fill" style={{ width: `${spendPct}%` }} />
        </div>
        {team.remainingPurse != null && (
          <p className="text-faint td-franchise-card__purse-left">
            {formatCredits(team.remainingPurse)} remaining purse
          </p>
        )}
      </div>

      {roster.length > 0 && (
        <>
          <ul className="td-squad-card__players td-franchise-card__players">
            {shown.map((p) => (
              <li key={p.name}>
                <span>{p.name}</span>
                {p.credits != null && <span className="td-franchise-card__player-credits">{formatCredits(p.credits)}</span>}
              </li>
            ))}
          </ul>
          {roster.length > 5 && (
            <button
              type="button"
              className="btn btn-ghost td-squad-card__toggle"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'Show less' : `Show all ${roster.length}`}
            </button>
          )}
        </>
      )}
    </div>
  )
}

// Full match schedule as a vertical timeline rather than a flat table -
// franchise leagues run 20-45+ matches, so a timeline with the eventual
// knockout stages (Qualifier/Eliminator/Final) visually distinguished
// reads much better than one more giant scrollable table.
const KNOCKOUT_RE = /qualifier|eliminator|final/i

function FranchiseMatchTimeline({ matches }) {
  return (
    <div className="td-subsection">
      <h3 className="td-subsection__title">Match Timeline ({matches.length})</h3>
      <div className="glass-panel td-timeline">
        {matches.map((m, i) => {
          const schedule = m.Schedule || ''
          const isKnockout = KNOCKOUT_RE.test(schedule)
          return (
            <div key={i} className={`td-timeline__row${isKnockout ? ' td-timeline__row--knockout' : ''}`}>
              <span className="td-timeline__dot" aria-hidden="true" />
              <div className="td-timeline__body">
                <p className="td-timeline__schedule">
                  <IconMatch className="td-timeline__icon" aria-hidden="true" />
                  {schedule}
                </p>
                <p className="text-faint td-timeline__meta">
                  {[m.Date, m.Venue].filter(Boolean).join(' · ')}
                </p>
              </div>
              {m.Winner && <span className="pill pill-status-completed td-timeline__winner">{m.Winner}</span>}
              {(m['Man of the Match'] || m['Best Batsman'] || m['Best Bowler']) && (
                <div className="td-timeline__standouts text-faint">
                  {m['Man of the Match'] && <span>MOTM: {m['Man of the Match']}</span>}
                  {m['Best Batsman'] && <span>Bat: {m['Best Batsman']}</span>}
                  {m['Best Bowler'] && <span>Ball: {m['Best Bowler']}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Awards as a showcase grid (medal-style cards) instead of a plain table -
// franchise league awards carry real credit prize values and a franchise
// team + national board per winner, which reads much better as a card
// than crammed into table cells.
function FranchiseAwardsShowcase({ awards }) {
  return (
    <div className="td-subsection">
      <h3 className="td-subsection__title">Awards</h3>
      <div className="card-grid td-award-grid">
        {awards.map((a, i) => (
          <div key={i} className="entity-card glass-panel td-award-card">
            <IconTrophy className="td-award-card__icon" aria-hidden="true" />
            <p className="td-award-card__name">{a.award}</p>
            <p className="td-award-card__winner">{a.winner}</p>
            {(a.team || a.board) && (
              <p className="text-faint td-award-card__sub">{[a.team, a.board].filter(Boolean).join(' · ')}</p>
            )}
            {a.credits != null && (
              <span className="pill td-award-card__credits">{formatCredits(a.credits)} credits</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Fallback — generic render of the base tournament record             */
/* ------------------------------------------------------------------ */
function GenericTournamentDetail({ base }) {
  return (
    <>
      <ChampionBanner
        champion={base.champion}
        runnerUp={base.runnerUp}
        totalMatches={base.totalMatches}
      />
      <div className="empty-state">No further detail is available for this tournament yet.</div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */
function SquadCard({ board, players }) {
  const [expanded, setExpanded] = useState(false)
  const list = players || []
  const shown = expanded ? list : list.slice(0, 6)

  return (
    <div className="entity-card glass-panel td-squad-card">
      <div className="entity-card__top">
        <Badge name={board} size={44} />
        <div>
          <p className="entity-card__title">{board}</p>
          <p className="entity-card__meta">{list.length} player{list.length === 1 ? '' : 's'}</p>
        </div>
      </div>
      <ul className="td-squad-card__players">
        {shown.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      {list.length > 6 && (
        <button type="button" className="btn btn-ghost td-squad-card__toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : `Show all ${list.length}`}
        </button>
      )}
    </div>
  )
}
