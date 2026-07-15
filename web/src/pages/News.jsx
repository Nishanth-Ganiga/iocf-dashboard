import { useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import './News.css'

// News & Announcements module — the FULL news feed (Dashboard.jsx only
// shows a short preview slice of this same data.news array). Reuses the
// same colored-dot feed-item visual pattern established on the dashboard.
const NEWS_TAGS = {
  tournament: { label: 'Tournament Results', className: 'news-dot--gold' },
  transfer: { label: 'Transfers', className: 'news-dot--neon' },
  series: { label: 'Series Results', className: 'news-dot--success' },
  test: { label: 'Test Match Results', className: 'news-dot--warning' },
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'tournament', label: 'Tournament Results' },
  { key: 'transfer', label: 'Transfers' },
  { key: 'series', label: 'Series Results' },
  { key: 'test', label: 'Test Match Results' },
]

function NewsCard({ item }) {
  const tag = NEWS_TAGS[item.type] || { label: item.type, className: 'news-dot--gold' }
  return (
    <div className="glass-panel news-card">
      <span className={`news-dot ${tag.className}`} />
      <div className="news-card__body">
        <p className="news-card__headline">{item.headline}</p>
        {item.detail && <p className="news-card__detail text-dim">{item.detail}</p>}
      </div>
      <span className="pill news-card__tag">{tag.label}</span>
    </div>
  )
}

export default function News() {
  const { data, loading, error } = useDashboard()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const news = data.news || []
  const q = query.trim().toLowerCase()

  const filtered = news.filter((item) => {
    if (filter !== 'all' && item.type !== filter) return false
    if (q && !item.headline.toLowerCase().includes(q)) return false
    return true
  })

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Fresh off the Wire</p>
              <h2>News & Announcements</h2>
            </div>
            <input
              type="text"
              className="news-search"
              placeholder="Search headlines…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="news-filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`news-filter ${filter === f.key ? 'is-active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {news.length === 0 ? (
            <div className="empty-state">No announcements recorded yet.</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No news matches this filter.</div>
          ) : (
            <div className="news-feed">
              {filtered.map((item, i) => (
                <NewsCard key={i} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
