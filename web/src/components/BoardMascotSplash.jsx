import { useEffect, useState } from 'react'
import MascotIcon from './MascotIcon'
import './BoardMascotSplash.css'

// Total time the splash stays mounted before auto-dismissing (fly-in +
// hold/glow + dissolve-out) - see BoardMascotSplash.css's single keyframe
// animation, which is timed to match this exactly.
const SPLASH_DURATION_MS = 2200

// A big, cinematic "the mascot arrives" moment shown once each time a
// board's detail page is opened - giant glowing mascot flies in over a
// darkened, board-color backdrop, holds for a beat, then dissolves away
// to reveal the page underneath. Purely decorative/non-blocking: it never
// captures clicks (or keeps scroll locked) so impatient visitors can just
// scroll/interact with the real page immediately if they want to.
//
// Skipped entirely under prefers-reduced-motion, same philosophy as the
// landing hero - a giant flying-in mascot is itself a motion effect no
// reduced-motion setting should force on someone.
//
// Keyed by `board.id` from the caller (BoardDetail.jsx) so navigating
// from one board straight to another remounts this and plays again,
// rather than only firing on the very first board page ever visited.
export default function BoardMascotSplash({ identity, boardName }) {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (!visible) return undefined
    const timer = setTimeout(() => setVisible(false), SPLASH_DURATION_MS)
    return () => clearTimeout(timer)
  }, [visible])

  if (!visible || !identity) return null

  const { primary, secondary } = identity.crest || {}

  return (
    <div
      className="mascot-splash"
      style={{ '--splash-primary': primary || '#d4af37', '--splash-secondary': secondary || '#34e0ff' }}
      aria-hidden="true"
    >
      <div className="mascot-splash__backdrop" />
      <div className="mascot-splash__burst" />
      <div className="mascot-splash__stage">
        <span className="mascot-splash__mascot">
          <MascotIcon identity={identity} size="1em" />
        </span>
        {identity.mascotName && (
          <p className="mascot-splash__label">
            {identity.mascotName}
            {boardName && <span className="mascot-splash__label-sub"> · {boardName}</span>}
          </p>
        )}
      </div>
    </div>
  )
}
