import { useRef } from 'react'

// Derives an approximate world-space XY position from the normalized
// (-1..1) screen pointer, scaled to roughly match the void particle
// field's extent - "approximate" because a true screen-to-world
// unprojection needs the active camera/canvas size, which would mean
// threading Three.js state out to a plain DOM-level hook. This field
// only needs to feel responsive to the cursor, not be pixel-accurate, so
// a fixed scale factor is enough.
//
// Returns a stable ref (created once) whose `.current` is a getter-backed
// object reading straight from the underlying pointer ref, so
// `pointerWorld.current.x/.y` always reflect the live pointer position
// with no extra event listener, React state, or per-render allocation.
export default function usePointerWorld(pointer) {
  const ref = useRef(null)
  if (!ref.current) {
    ref.current = {
      get x() {
        return (pointer.current?.x ?? 0) * 6
      },
      get y() {
        return -(pointer.current?.y ?? 0) * 4
      },
    }
  }
  return ref
}
