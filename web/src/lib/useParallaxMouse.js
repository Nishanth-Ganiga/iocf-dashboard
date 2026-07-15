import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

// Tracks pointer position as a pair of spring-smoothed motion values,
// normalized to roughly -1..1 relative to the viewport center. Consumers
// derive their own parallax depth with `useTransform` on top of these, so
// a single mousemove listener drives every layer without triggering React
// re-renders (motion values bypass the component tree entirely).
//
// No-ops under prefers-reduced-motion — the values simply stay at 0, so
// bound transforms resolve to their resting position.
export default function useParallaxMouse() {
  const prefersReducedMotion = useReducedMotion()
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const x = useSpring(rawX, { stiffness: 40, damping: 20, mass: 0.6 })
  const y = useSpring(rawY, { stiffness: 40, damping: 20, mass: 0.6 })
  const frame = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion) return undefined

    const handleMove = (e) => {
      if (frame.current) return
      frame.current = requestAnimationFrame(() => {
        frame.current = null
        const nx = (e.clientX / window.innerWidth) * 2 - 1
        const ny = (e.clientY / window.innerHeight) * 2 - 1
        rawX.set(nx)
        rawY.set(ny)
      })
    }

    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMove)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [prefersReducedMotion, rawX, rawY])

  return { x, y }
}
