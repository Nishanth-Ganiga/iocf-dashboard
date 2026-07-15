import { useMemo } from 'react'

const GLYPHS = ['🏏', '🏟️', '✨', '⭐']

function rand(min, max) {
  return min + Math.random() * (max - min)
}

// A sparse scatter of floating emoji glyphs (cricket ball, stadium,
// sparks, stars) — capped at 15 per the design brief. Positions/timings
// are randomized once per mount via useMemo, then driven purely by CSS
// (`floatDrift` keyframes in Landing.css) so there's no per-frame JS cost.
export default function FloatingElements({ count = 12 }) {
  const items = useMemo(
    () =>
      Array.from({ length: Math.min(count, 15) }, (_, i) => ({
        id: i,
        glyph: GLYPHS[i % GLYPHS.length],
        left: rand(4, 96),
        top: rand(6, 92),
        size: rand(0.9, 1.8),
        duration: rand(16, 30),
        delay: rand(-20, 0),
        drift: rand(20, 60) * (Math.random() > 0.5 ? 1 : -1),
      })),
    [count]
  )

  return (
    <div className="landing__floaters" aria-hidden="true">
      {items.map((item) => (
        <span
          key={item.id}
          className="landing__floater"
          style={{
            left: `${item.left}%`,
            top: `${item.top}%`,
            fontSize: `${item.size}rem`,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
            '--drift': `${item.drift}px`,
          }}
        >
          {item.glyph}
        </span>
      ))}
    </div>
  )
}
