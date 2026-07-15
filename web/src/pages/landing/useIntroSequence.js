import { useCallback, useEffect, useRef, useState } from 'react'

// Drives the hero's cinematic intro as an explicit state machine rather
// than a pile of independent timeouts — every visual layer (particles,
// stadium, floodlights, logo, DOM heading) reads the same `phase` value,
// so the 3D scene and the HTML overlay can never drift out of sync with
// each other.
//
// Phases, in order:
//   'dark'      - brief black hold before anything appears
//   'particles' - glowing energy particles fade in
//   'stadium'   - the stadium geometry + fog + floodlights power on
//   'logo'      - IOCF badge/logo fades into view
//   'ready'     - heading/subtitle/CTA reveal, scene fully interactive
//   'launching' - Get Started was pressed: camera flies forward, particles
//                 burst, hero zooms in
//   'done'      - launch animation finished; caller should navigate away
//
// Under prefers-reduced-motion, the whole intro collapses to a single
// quick fade straight to 'ready' — no held darkness, no staged reveal.
const PHASE_DURATIONS = {
  dark: 300,
  particles: 900,
  stadium: 1600,
  logo: 700,
}
const PHASE_ORDER = ['dark', 'particles', 'stadium', 'logo', 'ready']
const LAUNCH_DURATION = 1400

export default function useIntroSequence({ reducedMotion = false } = {}) {
  const [phase, setPhase] = useState('dark')
  const timers = useRef([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => {
    clearTimers()

    if (reducedMotion) {
      const t = setTimeout(() => setPhase('ready'), 200)
      timers.current.push(t)
      return clearTimers
    }

    let elapsed = 0
    PHASE_ORDER.slice(1).forEach((nextPhase, i) => {
      elapsed += PHASE_DURATIONS[PHASE_ORDER[i]] ?? 0
      const t = setTimeout(() => setPhase(nextPhase), elapsed)
      timers.current.push(t)
    })

    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion])

  // Called when the visitor commits to entering the dashboard (clicking
  // Get Started, or the equivalent scroll gesture). `onComplete` fires
  // once the fly-forward animation has had time to play, so the caller
  // can navigate mid-fade rather than cutting the animation short.
  const triggerLaunch = useCallback(
    (onComplete) => {
      setPhase('launching')
      const duration = reducedMotion ? 250 : LAUNCH_DURATION
      const t = setTimeout(() => {
        setPhase('done')
        onComplete?.()
      }, duration)
      timers.current.push(t)
    },
    [reducedMotion]
  )

  const isAtLeast = useCallback(
    (target) => {
      if (phase === 'launching' || phase === 'done') return true
      return PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(target)
    },
    [phase]
  )

  return { phase, isAtLeast, triggerLaunch }
}
