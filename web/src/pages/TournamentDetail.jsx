import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { formatCredits } from '../lib/badges'
import { IconChampion, IconMedal, IconMatch, IconCalendar } from '../lib/icons'
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
  const boards = Object.keys(league.boards || {})
  return (
    <>
      <ChampionBanner champion={league.champion} runnerUp={league.runnerUp} />
      <p className="text-faint td-caption">
        Note: the workbook doesn't record per-franchise-team names — the groups below are the
        players registered for this league, grouped by their home national board, not the
        franchise teams themselves.
      </p>
      <div className="td-subsection">
        <h3 className="td-subsection__title">Registered Players by Board</h3>
        {boards.length === 0 ? (
          <div className="empty-state">No registered players on record.</div>
        ) : (
          <div className="card-grid">
            {boards.map((b) => (
              <SquadCard key={b} board={b} players={league.boards[b]} />
            ))}
          </div>
        )}
      </div>
    </>
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
