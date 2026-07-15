import { NavLink } from 'react-router-dom'

const MODULES = [
  { label: 'Dashboard', to: '/dashboard', icon: '🏠' },
  { label: 'Cricket Boards', to: '/boards', icon: '🛡️' },
  { label: 'Players', to: '/players', icon: '🏏' },
  { label: 'Stadiums', to: '/stadiums', icon: '🏟️' },
  { label: 'Tournaments', to: '/tournaments', icon: '🏆' },
  { label: 'Rankings', to: '/rankings', icon: '📊' },
  { label: 'Credits', to: '/credits', icon: '💰' },
  { label: 'Trophy Cabinet', to: '/trophy-cabinet', icon: '🥇' },
  { label: 'Fixtures & Results', to: '/fixtures', icon: '📅' },
  { label: 'Auctions & Transfers', to: '/transfers', icon: '🔁' },
  { label: 'News & Announcements', to: '/news', icon: '📰' },
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
                <span className="sidebar__icon">{m.icon}</span>
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
