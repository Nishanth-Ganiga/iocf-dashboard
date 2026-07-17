import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'

// Reusable mouse-tilt wrapper for premium glass cards (feature cards, the
// social panel, etc.) — the card leans away from the cursor in 3D and lifts
// slightly, springing back to flat on pointer-leave. Pure framer-motion
// (no per-frame manual DOM writes), so it composes cleanly with each
// caller's own entrance animation props.
//
// A no-op tilt (motion values pinned at rest) under prefers-reduced-motion
// — the card still renders, it just never rotates.
const TILT_RANGE = 10

export default function TiltCard({ as: Component = motion.div, className, children, style, ...rest }) {
  const ref = useRef(null)
  const prefersReducedMotion = useReducedMotion()
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const rotateX = useSpring(useTransform(rawY, [-1, 1], [TILT_RANGE, -TILT_RANGE]), { stiffness: 220, damping: 22 })
  const rotateY = useSpring(useTransform(rawX, [-1, 1], [-TILT_RANGE, TILT_RANGE]), { stiffness: 220, damping: 22 })

  const handlePointerMove = (e) => {
    if (prefersReducedMotion) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    rawX.set(((e.clientX - rect.left) / rect.width) * 2 - 1)
    rawY.set(((e.clientY - rect.top) / rect.height) * 2 - 1)
  }

  const handlePointerLeave = () => {
    rawX.set(0)
    rawY.set(0)
  }

  return (
    <Component
      ref={ref}
      className={className}
      style={{ ...style, rotateX, rotateY, transformPerspective: 800 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...rest}
    >
      {children}
    </Component>
  )
}
