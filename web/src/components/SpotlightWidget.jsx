import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from './Badge'
import { IconChampion, IconUmpire, IconTrophy } from '../lib/icons'
import './SpotlightWidget.css'

const ROTATE_MS = 5000

// Rotating "spotlight" card on the Dashboard — cycles through the board
// sitting top of the Overall Board Ranking, the umpire leading the global
// Umpire Rankings, and the board with the most trophies. Every figure is
// read straight off rankings the site already computes; nothing here is a
// separate stat. Skips slides for any category with no data rather than
// showing a placeholder.
export default function SpotlightWidget({ data }) {
  const slides = useMemo(() => {
    const list = []

    const overall = (data?.boardRankings || []).find((t) => t.id === 'overall-board-ranking')
    const topBoard = overall?.table?.[0]
    if (topBoard) {
      list.push({
        key: 'board',
        eyebrow: 'Board of the Moment',
        icon: <IconChampion />,
        badge: topBoard.board,
        title: topBoard.board,
        stat: `${topBoard.points?.toLocaleString(undefined, { maximumFractionDigits: 1 })} pts · #${topBoard.rank} Overall`,
        to: '/board-rankings',
      })
    }

    const topUmpire = (data?.umpireRankings || [])[0]
    if (topUmpire) {
      list.push({
        key: 'umpire',
        eyebrow: 'Top Umpire',
        icon: <IconUmpire />,
        badge: topUmpire.boards?.[0],
        title: topUmpire.name,
        stat: `${topUmpire.totalPoints?.toLocaleString(undefined, { maximumFractionDigits: 1 })} pts officiating`,
        to: '/umpire-rankings',
      })
    }

    const topTrophyBoard = [...(data?.boards || [])].sort(
      (a, b) => (b.trophiesCount || 0) - (a.trophiesCount || 0)
    )[0]
    if (topTrophyBoard) {
      list.push({
        key: 'trophies',
        eyebrow: 'Most Decorated Board',
        icon: <IconTrophy />,
        badge: topTrophyBoard.name,
        title: topTrophyBoard.name,
        stat: `${topTrophyBoard.trophiesCount ?? 0} trophies won`,
        to: '/trophy-cabinet',
      })
    }

    return list
  }, [data])

  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (slides.length < 2) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), ROTATE_MS)
    return () => clearInterval(timer)
  }, [slides.length])

  if (slides.length === 0) return null
  const slide = slides[index % slides.length]

  return (
    <Link to={slide.to} className="spotlight-widget glass-panel">
      <div className="spotlight-widget__badge">
        <Badge name={slide.badge} size={56} />
      </div>
      <div className="spotlight-widget__body">
        <span className="spotlight-widget__eyebrow">{slide.icon} {slide.eyebrow}</span>
        <span className="spotlight-widget__title">{slide.title}</span>
        <span className="text-faint spotlight-widget__stat">{slide.stat}</span>
      </div>
      {slides.length > 1 && (
        <div className="spotlight-widget__dots" aria-hidden="true">
          {slides.map((s, i) => (
            <span key={s.key} className={`spotlight-widget__dot${i === index ? ' is-active' : ''}`} />
          ))}
        </div>
      )}
    </Link>
  )
}
