import { useEffect, useRef } from 'react'

// Tracks pointer position as a plain ref (normalized -1..1), shared by the
// camera rig and cricket ball so mouse movement never re-renders React.
// Lives in its own module (rather than alongside HeroCanvas) purely so
// that file can stay a component-only export for fast-refresh.
export default function usePointerRef() {
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', handleMove, { passive: true })
    return () => window.removeEventListener('pointermove', handleMove)
  }, [])

  return pointer
}
