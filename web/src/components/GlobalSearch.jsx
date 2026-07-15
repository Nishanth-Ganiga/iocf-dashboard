import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import Badge from './Badge'

// Instant client-side search across Boards, Players, Stadiums & Tournaments.
// `compact` renders the pill trigger used in the top nav; clicking it (or
// pressing "/") opens the full overlay with results.
export default function GlobalSearch({ compact = false }) {
  const { data } = useDashboard()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement?.tagName
      const isEditable =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable
      if (e.key === '/' && !open && !isEditable) {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const results = useMemo(() => {
    if (!data || !query.trim()) return { boards: [], players: [], stadiums: [], tournaments: [] }
    const q = query.trim().toLowerCase()

    const boards = data.boards.filter((b) => b.name.toLowerCase().includes(q)).slice(0, 6)

    const players = []
    for (const b of data.boards) {
      for (const p of b.players) {
        if (p.toLowerCase().includes(q)) {
          players.push({ name: p, board: b.name })
          if (players.length >= 8) break
        }
      }
      if (players.length >= 8) break
    }

    const stadiums = []
    for (const b of data.boards) {
      for (const s of b.stadiums) {
        if (s.toLowerCase().includes(q)) {
          stadiums.push({ name: s.split('|')[0].trim(), board: b.name })
          if (stadiums.length >= 8) break
        }
      }
      if (stadiums.length >= 8) break
    }

    const tournaments = data.tournaments.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 6)

    return { boards, players, stadiums, tournaments }
  }, [data, query])

  const totalResults =
    results.boards.length + results.players.length + results.stadiums.length + results.tournaments.length

  if (!open) {
    return (
      <button className={`gsearch-trigger${compact ? ' is-compact' : ''}`} onClick={() => setOpen(true)}>
        <span className="gsearch-trigger__icon">⌕</span>
        {!compact && <span>Search boards, players, stadiums…</span>}
        <kbd>/</kbd>
      </button>
    )
  }

  return (
    <div className="gsearch-overlay" onClick={() => setOpen(false)}>
      <div className="gsearch-panel glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="gsearch-input-row">
          <span className="gsearch-trigger__icon">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Boards, Players, Stadiums, Tournaments…"
            className="gsearch-input"
          />
          <button className="gsearch-close" onClick={() => setOpen(false)} aria-label="Close search">
            ✕
          </button>
        </div>

        {query.trim() && (
          <div className="gsearch-results">
            {totalResults === 0 && <p className="gsearch-empty text-dim">No matches for "{query}"</p>}

            {results.boards.length > 0 && (
              <ResultGroup title="Cricket Boards">
                {results.boards.map((b) => (
                  <ResultRow
                    key={b.id}
                    icon={<Badge name={b.name} size={30} />}
                    title={b.name}
                    subtitle={`Chairman: ${b.chairman || '—'}`}
                    onClick={() => {
                      navigate(`/boards/${b.id}`)
                      setOpen(false)
                      setQuery('')
                    }}
                  />
                ))}
              </ResultGroup>
            )}

            {results.players.length > 0 && (
              <ResultGroup title="Players">
                {results.players.map((p, i) => (
                  <ResultRow
                    key={`${p.name}-${i}`}
                    icon={<Badge name={p.name} size={30} rounded="square" />}
                    title={p.name}
                    subtitle={p.board}
                    onClick={() => {
                      navigate('/players', { state: { query: p.name } })
                      setOpen(false)
                      setQuery('')
                    }}
                  />
                ))}
              </ResultGroup>
            )}

            {results.stadiums.length > 0 && (
              <ResultGroup title="Stadiums">
                {results.stadiums.map((s, i) => (
                  <ResultRow
                    key={`${s.name}-${i}`}
                    icon={<Badge name={s.name} size={30} rounded="square" />}
                    title={s.name}
                    subtitle={`Home of ${s.board}`}
                    onClick={() => {
                      navigate('/stadiums', { state: { query: s.name } })
                      setOpen(false)
                      setQuery('')
                    }}
                  />
                ))}
              </ResultGroup>
            )}

            {results.tournaments.length > 0 && (
              <ResultGroup title="Tournaments">
                {results.tournaments.map((t) => (
                  <ResultRow
                    key={t.id}
                    icon={<Badge name={t.name} size={30} />}
                    title={t.name}
                    subtitle={t.status}
                    onClick={() => {
                      navigate(`/tournaments/${t.id}`)
                      setOpen(false)
                      setQuery('')
                    }}
                  />
                ))}
              </ResultGroup>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ResultGroup({ title, children }) {
  return (
    <div className="gsearch-group">
      <p className="gsearch-group__title">{title}</p>
      {children}
    </div>
  )
}

function ResultRow({ icon, title, subtitle, onClick }) {
  return (
    <button className="gsearch-row" onClick={onClick}>
      {icon}
      <span className="gsearch-row__text">
        <span className="gsearch-row__title">{title}</span>
        <span className="gsearch-row__subtitle text-dim">{subtitle}</span>
      </span>
    </button>
  )
}
