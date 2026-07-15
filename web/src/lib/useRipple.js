import { useCallback, useRef } from 'react'
import gsap from 'gsap'

// Imperative click-ripple, positioned at the actual pointer coordinates
// (Material-style) rather than a fixed CSS :active pulse. This is the one
// place the hero reaches for GSAP rather than framer-motion/CSS: a
// one-off, non-declarative burst that's simplest to express as a direct
// tween triggered from a DOM event, not as component state.
//
// Usage: const onPointerDown = useRipple(); <button onPointerDown={onPointerDown}>
export default function useRipple() {
  const idRef = useRef(0)

  return useCallback((e) => {
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 1.8
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    const ripple = document.createElement('span')
    ripple.className = 'gsap-ripple'
    ripple.style.width = `${size}px`
    ripple.style.height = `${size}px`
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`
    ripple.dataset.rippleId = String(idRef.current++)
    button.appendChild(ripple)

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      ripple.remove()
      return
    }

    gsap.fromTo(
      ripple,
      { opacity: 0.5, scale: 0.15 },
      {
        opacity: 0,
        scale: 1,
        duration: 0.7,
        ease: 'power2.out',
        onComplete: () => ripple.remove(),
      }
    )
  }, [])
}
