import { useEffect, useRef } from 'react'

// A slow, ambient particle field behind the entire dashboard shell — mown
// grass color bands, drifting gold/emerald dust motes. Mounted once in
// AppShell (fixed position, full viewport, z-index below all content) so
// it plays continuously across every route rather than restarting on
// every page navigation, and never duplicates work per-page.
//
// Deliberately much calmer than the Landing hero's canvas work (lower
// particle count, slower drift, lower opacity) — this sits behind
// business-app content people read for minutes at a time, not a 15s
// cinematic intro.
const PARTICLE_COUNT = 46

export default function DashboardBackdrop() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let width = 0
    let height = 0

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * 1,
      y: Math.random() * 1,
      r: 0.6 + Math.random() * 1.6,
      speed: 0.00006 + Math.random() * 0.00012,
      drift: (Math.random() - 0.5) * 0.00004,
      phase: Math.random() * Math.PI * 2,
      gold: Math.random() > 0.5,
    }))

    let raf = null
    const draw = (t) => {
      ctx.clearRect(0, 0, width, height)
      for (const p of particles) {
        const wrap = (v) => ((v % 1) + 1) % 1
        const y = wrap(p.y - p.speed * t)
        const x = wrap(p.x + p.drift * t + Math.sin(t * 0.0003 + p.phase) * 0.02)
        const twinkle = 0.4 + Math.sin(t * 0.0006 + p.phase) * 0.25
        ctx.beginPath()
        ctx.fillStyle = p.gold
          ? `rgba(212, 175, 55, ${twinkle * 0.35})`
          : `rgba(92, 242, 154, ${twinkle * 0.3})`
        ctx.arc(x * width, y * height, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="dash-backdrop" aria-hidden="true">
      <canvas ref={canvasRef} className="dash-backdrop__canvas" />
      <div className="dash-backdrop__glow dash-backdrop__glow--1" />
      <div className="dash-backdrop__glow dash-backdrop__glow--2" />
    </div>
  )
}
