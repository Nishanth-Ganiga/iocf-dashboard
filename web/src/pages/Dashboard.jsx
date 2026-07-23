import { Link } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import { formatCredits } from '../lib/badges'
import {
  IconBoard,
  IconPlayer,
  IconStadium,
  IconTrophy,
  IconCredits,
  IconCalendar,
  IconCrown,
  IconPodium,
  IconMedal,
  IconHallOfFame,
  IconAward,
  IconTransfer,
  IconNews,
} from '../lib/icons'
import './Dashboard.css'

// The central hub — welcome hero, KPI overview, and a preview of every
// module in the app (boards, tournaments, matches, news, trophies…).
// Each module gets its own full page elsewhere; this page only teases the
// highlights and links out to the real thing.
export default function Dashboard() {
  const { data, loading, error } = useDashboard()

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const { stats, boards, tournaments, news, upcomingMatches, hallOfFame } = data

  const featuredTournaments = (tournaments || []).slice(0, 6)
  const previewBoards = (boards || []).slice(0, 8)
  const latestNews = (news || []).slice(0, 9)
  const nextMatches = (upcomingMatches || []).slice(0, 6)
  const featuredHallOfFame = (hallOfFame || []).slice(0, 3)
  const topTrophyBoards = [...(boards || [])]
    .sort((a, b) => (b.trophiesCount || 0) - (a.trophiesCount || 0))
    .slice(0, 5)

  return (
    <div className="page-enter">
      <section className="dash-hero">
        <div className="dash-hero__bg">
          <div className="dash-hero__glow dash-hero__glow--1" />
          <div className="dash-hero__glow dash-hero__glow--2" />
          <div className="dash-hero__ring" />
          <div className="dash-hero__particles">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} style={{ '--i': i }} />
            ))}
          </div>
        </div>
        <div className="container dash-hero__content">
          <span className="dash-hero__badge">International Online Cricket Federation</span>
          <h1 className="dash-hero__title gradient-heading">
            Welcome to the International Online Cricket Federation
          </h1>
          <p className="dash-hero__subtitle text-dim">
            The Ultimate Virtual Cricket Management Platform
          </p>
        </div>
      </section>

      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Command Center</p>
              <h2>Dashboard Overview</h2>
            </div>
          </div>
          <div className="stat-grid">
            <StatCard label="Total Cricket Boards" value={stats.totalBoards} icon={<IconBoard />} accent="gold" />
            <StatCard label="Total Players" value={stats.totalPlayers} icon={<IconPlayer />} accent="neon" />
            <StatCard label="Total Stadiums" value={stats.totalStadiums} icon={<IconStadium />} accent="gold" />
            <StatCard label="Total Tournaments" value={stats.totalTournaments} icon={<IconTrophy />} accent="neon" />
            <StatCard label="Total Credits" value={stats.totalCredits} icon={<IconCredits />} accent="gold" suffix=" cr" />
            <StatCard label="Total Matches" value={stats.totalMatches} icon={<IconCalendar />} accent="neon" />
            <StatCard label="Total Championships" value={stats.totalChampionships} icon={<IconCrown />} accent="gold" />
          </div>
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Explore</p>
              <h2>Quick Access Modules</h2>
            </div>
          </div>
          <div className="card-grid">
            {QUICK_MODULES.map((m) => (
              <Link key={m.to} to={m.to} className="entity-card glass-panel dash-module">
                <div className="entity-card__top">
                  <div className="dash-module__icon"><m.Icon /></div>
                  <div>
                    <p className="entity-card__title">{m.title}</p>
                    <p className="entity-card__meta">{m.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Cricket's Grandest Stages</p>
              <h2>Featured Tournaments</h2>
            </div>
            <Link to="/tournaments" className="btn btn-ghost">View All Tournaments</Link>
          </div>
          {featuredTournaments.length === 0 ? (
            <div className="empty-state">No tournaments recorded yet.</div>
          ) : (
            <div className="dash-scroll-row">
              {featuredTournaments.map((t) => (
                <div key={t.id} className="dash-tournament-card glass-panel">
                  <div className="entity-card__top">
                    <Badge name={t.name} size={44} />
                    <div>
                      <p className="entity-card__title">{t.name}</p>
                      <p className="entity-card__meta">{t.category} · Season {t.season}</p>
                    </div>
                  </div>
                  <span className={`pill pill-status-${t.status.toLowerCase()}`}>{t.status}</span>
                  {(t.champion || t.runnerUp) && (
                    <p className="entity-card__meta">
                      {t.champion ? `Champion: ${t.champion}` : 'Champion: TBD'}
                      {t.runnerUp ? ` · Runner-up: ${t.runnerUp}` : ''}
                    </p>
                  )}
                  <Link to={`/tournaments/${t.id}`} className="btn btn-outline-gold dash-tournament-card__cta">
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Ranked by Credits</p>
              <h2>Cricket Boards</h2>
            </div>
            <Link to="/boards" className="btn btn-ghost">View All Boards</Link>
          </div>
          {previewBoards.length === 0 ? (
            <div className="empty-state">No boards recorded yet.</div>
          ) : (
            <div className="card-grid">
              {previewBoards.map((b) => (
                <Link key={b.id} to={`/boards/${b.id}`} className="entity-card glass-panel">
                  <div className="entity-card__top">
                    <Badge name={b.name} size={48} />
                    <div>
                      <p className="entity-card__title">{b.name}</p>
                      <p className="entity-card__meta">Chairman: {b.chairman || '—'}</p>
                      <p className="entity-card__meta">CEO: {b.ceo || '—'}</p>
                    </div>
                  </div>
                  <div className="entity-card__stats">
                    <div className="entity-card__stat">
                      <span className="text-faint">Credits</span>
                      <b>{formatCredits(b.credits)}</b>
                    </div>
                    <div className="entity-card__stat">
                      <span className="text-faint">Ranking</span>
                      <b>#{b.ranking}</b>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="dash-split">
          <section className="page-section dash-split__col">
            <div className="section-header">
              <div>
                <p className="section-header__eyebrow">Fresh off the Wire</p>
                <h2>Latest Updates</h2>
              </div>
              <Link to="/news" className="btn btn-ghost">View All</Link>
            </div>
            {latestNews.length === 0 ? (
              <div className="empty-state">No updates yet.</div>
            ) : (
              <div className="glass-panel dash-feed">
                {latestNews.map((item, i) => (
                  <FeedItem key={i} item={item} />
                ))}
              </div>
            )}
          </section>

          <section className="page-section dash-split__col">
            <div className="section-header">
              <div>
                <p className="section-header__eyebrow">On the Horizon</p>
                <h2>Upcoming Matches</h2>
              </div>
              <Link to="/fixtures" className="btn btn-ghost">View All</Link>
            </div>
            {nextMatches.length === 0 ? (
              <div className="empty-state">No upcoming matches scheduled.</div>
            ) : (
              <div className="glass-panel dash-feed">
                {nextMatches.map((m, i) => (
                  <MatchRow key={i} match={m} />
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Hall of Champions</p>
              <h2>Trophy Cabinet</h2>
            </div>
            <Link to="/trophy-cabinet" className="btn btn-ghost">View full Trophy Cabinet</Link>
          </div>
          {topTrophyBoards.length === 0 ? (
            <div className="empty-state">No trophies recorded yet.</div>
          ) : (
            <div className="glass-panel dash-leaderboard">
              {topTrophyBoards.map((b, i) => (
                <div key={b.id} className="dash-leaderboard__row">
                  <span className="dash-leaderboard__rank">#{i + 1}</span>
                  <Badge name={b.name} size={36} />
                  <span className="dash-leaderboard__name">{b.name}</span>
                  <span className="dash-leaderboard__trophies">
                    <IconTrophy /> {b.trophiesCount ?? 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">IOCF Legends</p>
              <h2>Hall of Fame</h2>
            </div>
            <Link to="/hall-of-fame" className="btn btn-ghost">View full Hall of Fame</Link>
          </div>
          {featuredHallOfFame.length === 0 ? (
            <div className="empty-state">No Hall of Fame cards recorded yet.</div>
          ) : (
            <div className="card-grid">
              {featuredHallOfFame.map((card, i) => (
                <Link key={i} to="/hall-of-fame" className="entity-card glass-panel dash-hof-card">
                  <div className="entity-card__top">
                    <div className="dash-module__icon"><IconHallOfFame /></div>
                    <div>
                      <p className="entity-card__title">{card.name}</p>
                      {card.subtitle && <p className="entity-card__meta">{card.subtitle}</p>}
                    </div>
                  </div>
                  {card.players?.[0] && (
                    <p className="entity-card__meta dash-hof-card__player">
                      <IconAward aria-hidden="true" /> {card.players[0].award}: {card.players[0].name}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

const QUICK_MODULES = [
  { to: '/boards', Icon: IconBoard, title: 'Cricket Boards', desc: 'All 14 national boards & leadership' },
  { to: '/players', Icon: IconPlayer, title: 'Players', desc: 'Browse every registered player' },
  { to: '/stadiums', Icon: IconStadium, title: 'Stadiums', desc: 'Venues across every board' },
  { to: '/tournaments', Icon: IconTrophy, title: 'Tournaments', desc: 'World Cups, leagues & cups' },
  { to: '/rankings', Icon: IconPodium, title: 'Credits Ranking', desc: 'Credits-based board leaderboard' },
  { to: '/board-rankings', Icon: IconBoard, title: 'Board Rankings', desc: 'Official points-based performance ranking' },
  { to: '/credits', Icon: IconCredits, title: 'Credits', desc: 'Board finances & transactions' },
  { to: '/trophy-cabinet', Icon: IconMedal, title: 'Trophy Cabinet', desc: 'Every trophy, every board' },
  { to: '/hall-of-fame', Icon: IconHallOfFame, title: 'Hall of Fame', desc: 'IOCF’s best players, period by period' },
  { to: '/fixtures', Icon: IconCalendar, title: 'Fixtures & Results', desc: 'Series, tests & schedules' },
  { to: '/transfers', Icon: IconTransfer, title: 'Auctions & Transfers', desc: 'Player movement log' },
  { to: '/news', Icon: IconNews, title: 'News & Announcements', desc: 'Champions, transfers & results' },
]

const NEWS_TAGS = {
  tournament: { label: 'Tournament', className: 'dash-feed__dot--gold' },
  transfer: { label: 'Transfer', className: 'dash-feed__dot--neon' },
  series: { label: 'Series', className: 'dash-feed__dot--success' },
  test: { label: 'Test', className: 'dash-feed__dot--warning' },
}

function FeedItem({ item }) {
  const tag = NEWS_TAGS[item.type] || { label: item.type, className: 'dash-feed__dot--gold' }
  return (
    <div className="dash-feed__item">
      <span className={`dash-feed__dot ${tag.className}`} />
      <div className="dash-feed__body">
        <p className="dash-feed__headline">{item.headline}</p>
        {item.detail && <p className="dash-feed__detail text-dim">{item.detail}</p>}
      </div>
      <span className="dash-feed__tag text-faint">{tag.label}</span>
    </div>
  )
}

// Best-effort "in ~N days" label from free-text dates like "8th July" or
// "6th - 10th Jan" — parses the FIRST day+month it finds against the
// current real year. Never fabricates a countdown if parsing fails.
const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
]

function parseCountdown(dateText) {
  try {
    const match = dateText.match(/(\d{1,2})\w*\s*([A-Za-z]+)/)
    if (!match) return null
    const day = parseInt(match[1], 10)
    const monthAbbrev = match[2].slice(0, 3).toLowerCase()
    const monthIdx = MONTHS.indexOf(monthAbbrev)
    if (monthIdx === -1 || day < 1 || day > 31) return null

    const now = new Date()
    let year = now.getFullYear()
    let target = new Date(year, monthIdx, day)
    // If that date already passed this year by more than a week, assume next year.
    const diffDays = Math.round((target - now) / 86400000)
    if (diffDays < -7) {
      target = new Date(year + 1, monthIdx, day)
    }
    const finalDiff = Math.round((target - now) / 86400000)
    if (finalDiff < 0) return 'happening now'
    if (finalDiff === 0) return 'today'
    return `in ~${finalDiff} day${finalDiff === 1 ? '' : 's'}`
  } catch {
    return null
  }
}

function MatchRow({ match }) {
  const countdown = parseCountdown(match.dates)
  return (
    <div className="dash-feed__item">
      <Badge name={match.host} size={38} rounded="square" />
      <div className="dash-feed__body">
        <p className="dash-feed__headline">{match.name}</p>
        <p className="dash-feed__detail text-dim">
          {match.host} vs {match.opponents} · {match.format}
        </p>
      </div>
      <div className="dash-match-row__when">
        <span className="dash-feed__tag text-faint">{match.dates}</span>
        {countdown && <span className="pill pill-status-upcoming">{countdown}</span>}
      </div>
    </div>
  )
}
