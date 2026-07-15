import { motion, useTransform } from 'framer-motion'

// Giant, near-transparent cricket ball anchored behind the hero heading.
// Pure SVG (seam drawn as two arcs + stitch ticks) so it stays crisp at any
// size and never costs an image request. Two independent motions:
//  - a slow constant spin (CSS, GPU-friendly transform)
//  - a subtle tilt that eases toward the pointer (framer-motion springs
//    piped in from useParallaxMouse, already smoothed there)
// Opacity is intentionally pinned low — it's a texture behind the text,
// never meant to compete with it.
export default function CricketBall({ mouseX, mouseY }) {
  const rotateX = useTransform(mouseY, [-1, 1], [8, -8])
  const rotateY = useTransform(mouseX, [-1, 1], [-10, 10])

  return (
    <motion.div
      className="landing__ball-wrap"
      style={{ rotateX, rotateY }}
      aria-hidden="true"
    >
      <div className="landing__ball-spin">
        <svg viewBox="0 0 400 400" className="landing__ball-svg">
          <defs>
            <radialGradient id="ballBody" cx="35%" cy="32%" r="75%">
              <stop offset="0%" stopColor="#f5cf5c" stopOpacity="0.9" />
              <stop offset="45%" stopColor="#d4af37" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#6b1f1f" stopOpacity="0.25" />
            </radialGradient>
            <radialGradient id="ballGlow" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#34e0ff" stopOpacity="0" />
              <stop offset="100%" stopColor="#34e0ff" stopOpacity="0.18" />
            </radialGradient>
          </defs>

          <circle cx="200" cy="200" r="192" fill="url(#ballGlow)" />
          <circle cx="200" cy="200" r="170" fill="url(#ballBody)" stroke="rgba(212,175,55,0.35)" strokeWidth="1.5" />

          {/* seam */}
          <path
            d="M 200 30 C 120 90, 120 310, 200 370"
            fill="none"
            stroke="rgba(238,242,251,0.55)"
            strokeWidth="2.5"
          />
          <path
            d="M 200 30 C 280 90, 280 310, 200 370"
            fill="none"
            stroke="rgba(238,242,251,0.55)"
            strokeWidth="2.5"
          />

          {/* stitch ticks along each seam arc */}
          {Array.from({ length: 14 }).map((_, i) => {
            const t = i / 13
            const y = 40 + t * 320
            const bow = Math.sin(t * Math.PI) * 78
            return (
              <g key={i}>
                <line
                  x1={200 - bow - 6}
                  y1={y}
                  x2={200 - bow + 6}
                  y2={y}
                  stroke="rgba(238,242,251,0.4)"
                  strokeWidth="1.5"
                  transform={`rotate(${-18 + t * 36} ${200 - bow} ${y})`}
                />
                <line
                  x1={200 + bow - 6}
                  y1={y}
                  x2={200 + bow + 6}
                  y2={y}
                  stroke="rgba(238,242,251,0.4)"
                  strokeWidth="1.5"
                  transform={`rotate(${18 - t * 36} ${200 + bow} ${y})`}
                />
              </g>
            )
          })}
        </svg>
      </div>
    </motion.div>
  )
}
