import { useEffect, useRef } from 'react'

const STAR_COUNT = 90
const DUST_COUNT = 46

function rand(min, max) {
  return min + Math.random() * (max - min)
}

// Canvas starfield + digital dust layer for the hero background.
//
// Runs a single rAF loop shared by every star/particle (no per-element DOM
// animations, no React re-renders) so it stays cheap at 60fps even with
// ~130 moving points. Stars drift almost imperceptibly and twinkle; dust
// motes drift with a light parallax offset that eases toward the current
// mouse position. `motionX`/`motionY` are framer-motion motion values
// (stable object identities, already spring-smoothed by useParallaxMouse)
// — reading them via `.get()` inside the rAF loop avoids subscribing this
// component to every pointer move, so it never re-renders.
//
// Renders one static frame and stops under prefers-reduced-motion.
export default function CanvasField({ motionX, motionY, reducedMotion }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let width = 0
    let height = 0
    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: rand(0, 1),
      y: rand(0, 1),
      r: rand(0.5, 1.6),
      baseAlpha: rand(0.25, 0.85),
      twinkleSpeed: rand(0.0004, 0.0014),
      twinklePhase: rand(0, Math.PI * 2),
      driftX: rand(-0.0015, 0.0015),
      driftY: rand(-0.001, 0.001),
    }))

    const dust = Array.from({ length: DUST_COUNT }, () => ({
      x: rand(0, 1),
      y: rand(0, 1),
      r: rand(0.8, 2.2),
      hue: Math.random() > 0.5 ? '212, 175, 55' : '52, 224, 255',
      alpha: rand(0.2, 0.5),
      speed: rand(0.00008, 0.0003),
      angle: rand(0, Math.PI * 2),
    }))

    let raf = null
    let smoothedPX = 0
    let smoothedPY = 0

    const draw = (t) => {
      ctx.clearRect(0, 0, width, height)

      const targetPX = motionX?.get() ?? 0
      const targetPY = motionY?.get() ?? 0
      smoothedPX += (targetPX - smoothedPX) * 0.03
      smoothedPY += (targetPY - smoothedPY) * 0.03

      for (const s of stars) {
        const wrap = (v) => ((v % 1) + 1) % 1
        const x = wrap(s.x + s.driftX * (t / 1000)) * width
        const y = wrap(s.y + s.driftY * (t / 1000)) * height
        const twinkle = Math.sin(t * s.twinkleSpeed + s.twinklePhase) * 0.35 + 0.65
        ctx.beginPath()
        ctx.fillStyle = `rgba(238, 242, 251, ${s.baseAlpha * twinkle})`
        ctx.arc(x, y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const d of dust) {
        const wrap = (v) => ((v % 1) + 1) % 1
        const parallax = 0.02
        const x = wrap(d.x + Math.cos(d.angle) * d.speed * t) * width + smoothedPX * parallax * 40
        const y = wrap(d.y + Math.sin(d.angle) * d.speed * t) * height + smoothedPY * parallax * 40
        ctx.beginPath()
        ctx.fillStyle = `rgba(${d.hue}, ${d.alpha})`
        ctx.shadowColor = `rgba(${d.hue}, 0.8)`
        ctx.shadowBlur = 6
        ctx.arc(x, y, d.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0

      raf = requestAnimationFrame(draw)
    }

    if (reducedMotion) {
      draw(0)
    } else {
      raf = requestAnimationFrame(draw)
    }

    const handleResize = () => resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [motionX, motionY, reducedMotion])

  return <canvas ref={canvasRef} className="landing__canvas" aria-hidden="true" />
}
