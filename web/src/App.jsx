import { useState } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { DashboardProvider } from './context/DashboardContext'
import TopNav from './components/TopNav'
import Sidebar from './components/Sidebar'
import DashboardBackdrop from './components/DashboardBackdrop'
import ErrorBoundary from './components/ErrorBoundary'

import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Boards from './pages/Boards'
import BoardDetail from './pages/BoardDetail'
import Players from './pages/Players'
import Stadiums from './pages/Stadiums'
import Tournaments from './pages/Tournaments'
import TournamentDetail from './pages/TournamentDetail'
import Rankings from './pages/Rankings'
import Credits from './pages/Credits'
import TrophyCabinet from './pages/TrophyCabinet'
import HallOfFame from './pages/HallOfFame'
import Fixtures from './pages/Fixtures'
import Transfers from './pages/Transfers'
import News from './pages/News'
import Contact from './pages/Contact'

function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="app-shell">
      <DashboardBackdrop />
      <TopNav
        onToggleSidebar={() => {
          if (window.innerWidth <= 1024) setMobileOpen((v) => !v)
          else setSidebarCollapsed((v) => !v)
        }}
      />
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <main className={`app-main${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        {/* Keyed by path so navigating away from a page that errored
            recovers automatically instead of staying stuck on the fallback. */}
        <ErrorBoundary key={location.pathname}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/boards" element={<Boards />} />
            <Route path="/boards/:boardId" element={<BoardDetail />} />
            <Route path="/players" element={<Players />} />
            <Route path="/stadiums" element={<Stadiums />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/:tournamentId" element={<TournamentDetail />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/trophy-cabinet" element={<TrophyCabinet />} />
            <Route path="/hall-of-fame" element={<HallOfFame />} />
            <Route path="/fixtures" element={<Fixtures />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/news" element={<News />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <DashboardProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </HashRouter>
    </DashboardProvider>
  )
}
