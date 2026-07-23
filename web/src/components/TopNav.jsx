import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import GlobalSearch from './GlobalSearch'

const NAV_ITEMS = [
  { label: 'Home', to: '/dashboard' },
  { label: 'Cricket Boards', to: '/boards' },
  { label: 'Players', to: '/players' },
  { label: 'Stadiums', to: '/stadiums' },
  { label: 'Tournaments', to: '/tournaments' },
  { label: 'Credits Ranking', to: '/rankings' },
  { label: 'News', to: '/news' },
  { label: 'Contact', to: '/contact' },
]

export default function TopNav({ onToggleSidebar }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="topnav">
      <div className="topnav__inner">
        <div className="topnav__left">
          <button
            className="topnav__burger"
            aria-label="Toggle sidebar"
            onClick={onToggleSidebar}
          >
            <span />
            <span />
            <span />
          </button>
          <Link to="/dashboard" className="topnav__logo">
            <span className="topnav__logo-mark">IOCF</span>
            <span className="topnav__logo-text">
              International Online<br />Cricket Federation
            </span>
          </Link>
        </div>

        <nav className="topnav__links">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `topnav__link${isActive ? ' is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="topnav__right">
          <GlobalSearch compact />
          <button
            className="topnav__mobile-toggle"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="topnav__mobile-menu">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `topnav__link${isActive ? ' is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
