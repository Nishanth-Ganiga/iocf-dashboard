import { NavLink } from 'react-router-dom'
import {
  IconBoard,
  IconPlayer,
  IconStadium,
  IconTrophy,
  IconPodium,
  IconCredits,
  IconMedal,
  IconHallOfFame,
  IconCalendar,
  IconTransfer,
  IconNews,
  IconContact,
} from '../lib/icons'

const MODULES = [
  { label: 'Dashboard', to: '/dashboard', Icon: null, emoji: '🏠' },
  { label: 'Cricket Boards', to: '/boards', Icon: IconBoard },
  { label: 'Players', to: '/players', Icon: IconPlayer },
  { label: 'Stadiums', to: '/stadiums', Icon: IconStadium },
  { label: 'Tournaments', to: '/tournaments', Icon: IconTrophy },
  { label: 'Rankings', to: '/rankings', Icon: IconPodium },
  { label: 'Credits', to: '/credits', Icon: IconCredits },
  { label: 'Trophy Cabinet', to: '/trophy-cabinet', Icon: IconMedal },
  { label: 'Hall of Fame', to: '/hall-of-fame', Icon: IconHallOfFame },
  { label: 'Fixtures & Results', to: '/fixtures', Icon: IconCalendar },
  { label: 'Auctions & Transfers', to: '/transfers', Icon: IconTransfer },
  { label: 'News & Announcements', to: '/news', Icon: IconNews },
  { label: 'Contact', to: '/contact', Icon: IconContact },
]

// `collapsed` — desktop icon-only rail vs full-width rail.
// `mobileOpen` — whether the mobile drawer overlay is shown.
export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  return (
    <>
      <aside className={`sidebar${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`}>
        <div className="sidebar__scroll">
          <p className="sidebar__section-label">Navigate</p>
          <nav className="sidebar__nav">
            {MODULES.map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                onClick={onCloseMobile}
                className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}
                title={m.label}
              >
                <span className="sidebar__icon">
                  {m.Icon ? <m.Icon /> : m.emoji}
                </span>
                <span className="sidebar__label">{m.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
      <div
        className={`sidebar__scrim${mobileOpen ? ' is-visible' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />
    </>
  )
}
