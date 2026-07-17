import { useMemo } from 'react'
import { motion, useTransform } from 'framer-motion'

// The "digital cricket planet" backdrop: layered radial-gradient corner
// glows, a large glowing/rotating globe with orbit rings, an aurora sweep,
// drifting polygons, and a mouse-reactive spotlight — all pure CSS/SVG so
// it drops onto both hero variants (WebGL overlay + CSS fallback) without
// any extra GPU scene work. Everything here moves on an 8-30s loop per the
// brief ("never stop moving"), and the whole layer no-ops its animations
// under prefers-reduced-motion via the existing global rule in Landing.css.
//
// `motionX`/`motionY` are the same spring-smoothed framer-motion values
// every other parallax layer in this hero already consumes (see
// useParallaxMouse) — reused here to tilt the globe and slide the cursor
// spotlight without adding a second mousemove listener.
const POLYGON_COUNT = 9

function rand(min, max) {
  return min + Math.random() * (max - min)
}

export default function HeroBackdrop({ mouseX, mouseY }) {
  const globeRotateX = useTransform(mouseY, [-1, 1], [6, -6])
  const globeRotateY = useTransform(mouseX, [-1, 1], [-8, 8])
  const glowX = useTransform(mouseX, [-1, 1], ['35%', '65%'])
  const glowY = useTransform(mouseY, [-1, 1], ['35%', '65%'])

  const polygons = useMemo(
    () =>
      Array.from({ length: POLYGON_COUNT }, (_, i) => ({
        id: i,
        left: rand(4, 94),
        top: rand(6, 90),
        size: rand(18, 46),
        duration: rand(14, 28),
        delay: rand(-20, 0),
        hue: i % 3 === 0 ? 'var(--hero-cyan)' : i % 3 === 1 ? 'var(--hero-gold)' : 'var(--hero-purple)',
        sides: 3 + (i % 4),
      })),
    []
  )

  return (
    <div className="hero-bg" aria-hidden="true">
      {/* Corner + directional gradient wash, per brief */}
      <div className="hero-bg__gradient" />

      {/* Cursor-reactive soft spotlight */}
      <motion.div className="hero-bg__spotlight" style={{ left: glowX, top: glowY }} />

      {/* Aurora light sweep */}
      <div className="hero-bg__aurora" />

      {/* Digital globe with orbit rings, tilting gently toward the pointer */}
      <motion.div className="hero-bg__globe-stage" style={{ rotateX: globeRotateX, rotateY: globeRotateY }}>
        <div className="hero-bg__globe">
          <div className="hero-bg__globe-grid" />
          <div className="hero-bg__globe-core" />
        </div>
        <div className="hero-bg__orbit hero-bg__orbit--1" />
        <div className="hero-bg__orbit hero-bg__orbit--2" />
        <div className="hero-bg__orbit hero-bg__orbit--3" />
      </motion.div>

      {/* Golden energy lines radiating outward */}
      <div className="hero-bg__energy-lines">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ '--i': i }} />
        ))}
      </div>

      {/* Drifting low-poly fragments */}
      <div className="hero-bg__polygons">
        {polygons.map((p) => (
          <svg
            key={p.id}
            className="hero-bg__polygon"
            viewBox="0 0 100 100"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          >
            <polygon
              points={polygonPoints(p.sides)}
              fill="none"
              stroke={p.hue}
              strokeWidth="1.5"
            />
          </svg>
        ))}
      </div>
    </div>
  )
}

// Generates a regular n-gon's point list inscribed in the 0-100 viewBox.
function polygonPoints(sides) {
  const cx = 50
  const cy = 50
  const r = 44
  return Array.from({ length: sides }, (_, i) => {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')
}
