import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

// Replaces the default cursor with a small glowing dot + a lagging outer
// ring, both driven directly via CSS transform on refs (never React
// state) so the 60fps pointer loop can't trigger re-renders. The ring
// lerps toward the pointer each frame for a soft trailing feel; the dot
// tracks it 1:1. Hovering anything with [data-cursor-hover] expands the
// ring, giving buttons a "magnetic" affordance.
//
// Disabled entirely on touch devices (no real cursor to replace) and
// under prefers-reduced-motion (a lagging ring is itself a motion effect).
export default function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    setEnabled(!isTouch && !prefersReducedMotion)
  }, [prefersReducedMotion])

  useEffect(() => {
    if (!enabled) return undefined

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const ring = { x: pointer.x, y: pointer.y, scale: 1 }
    let hovering = false
    let raf = null

    const handleMove = (e) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      const target = e.target
      hovering = Boolean(target?.closest?.('[data-cursor-hover]'))
    }

    const tick = () => {
      ring.x += (pointer.x - ring.x) * 0.18
      ring.y += (pointer.y - ring.y) * 0.18
      ring.scale += ((hovering ? 1.8 : 1) - ring.scale) * 0.2

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) scale(${ring.scale})`
      }
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', handleMove, { passive: true })
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <div ref={dotRef} className="hero-cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="hero-cursor-ring" aria-hidden="true" />
    </>
  )
}
