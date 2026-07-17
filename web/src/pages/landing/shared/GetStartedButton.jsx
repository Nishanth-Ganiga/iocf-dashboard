import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// The hero's primary CTA: idle breathing glow (CSS keyframes on box-shadow,
// see .hero-cta) plus a gentle idle float and a "magnetic" hover pull,
// both driven from a single requestAnimationFrame loop here rather than
// CSS keyframes/framer-motion's animate props.
//
// Why one JS loop instead of the more obvious two declarative animations:
// framer-motion writes its own inline `transform` for this button's
// fade-up entrance, and a CSS @keyframes animating `transform` would
// silently lose to that inline style once React re-renders it. Driving
// both the float and the magnet pull through the `translate` CSS property
// (which composes alongside `transform` instead of replacing it) sidesteps
// that fight entirely, and combining them in one loop means the magnet
// pull and the idle bob add together smoothly instead of two competing
// timers stomping on the same style property.
const MAGNET_RANGE = 14
const FLOAT_AMPLITUDE = 4
const FLOAT_PERIOD_MS = 5000

export default function GetStartedButton({ onClick, onRipple, isLaunching, ...motionProps }) {
  const buttonRef = useRef(null)
  const magnetRef = useRef({ x: 0, y: 0 })
  const prefersReducedMotion = useReducedMotion()

  const handlePointerMove = (e) => {
    const el = buttonRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const relY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    magnetRef.current.x = relX * MAGNET_RANGE
    magnetRef.current.y = relY * MAGNET_RANGE
  }

  const handlePointerLeave = () => {
    magnetRef.current.x = 0
    magnetRef.current.y = 0
  }

  useEffect(() => {
    if (prefersReducedMotion || isLaunching) return undefined
    let raf = null
    let currentX = 0
    let currentY = 0

    const tick = (t) => {
      const el = buttonRef.current
      if (el) {
        const floatY = Math.sin((t / FLOAT_PERIOD_MS) * Math.PI * 2) * FLOAT_AMPLITUDE
        currentX += (magnetRef.current.x - currentX) * 0.15
        currentY += (magnetRef.current.y - currentY) * 0.15
        el.style.translate = `${currentX}px ${floatY + currentY}px`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [prefersReducedMotion, isLaunching])

  return (
    <motion.button
      ref={buttonRef}
      className={`hero-cta${isLaunching ? ' is-dissolving' : ''}`}
      onClick={onClick}
      onPointerDown={onRipple}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      disabled={isLaunching}
      data-cursor-hover
      {...motionProps}
    >
      <span className="hero-cta__fill" aria-hidden="true" />
      <span className="hero-cta__border" aria-hidden="true" />
      <span className="hero-cta__label">Explore IOCF Universe</span>
      <span className="hero-cta__arrow" aria-hidden="true">→</span>
    </motion.button>
  )
}
