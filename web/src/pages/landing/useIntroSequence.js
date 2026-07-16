import { useCallback, useEffect, useRef, useState } from 'react'

// Drives the whole cinematic journey as an explicit state machine - every
// visual layer (void particles, space dressing, portal, warp, Earth/
// nations, UI overlay) reads the same `phase` value, so nothing can pop
// in ahead of or behind the beat the rest of the scene is on.
//
// Phases, in order (durations tuned so a passive viewer reaches 'ready'
// at ~14s, landing inside the brief's "15-20 seconds if the user simply
// watches" - everything after 'ready' is a living idle state, not a
// discrete timed beat):
//   'void'      - living darkness, particles begin appearing            (3.0s)
//   'space'     - stars/fog/light rays reveal                           (2.6s)
//   'portal'    - the energy portal appears and grows                   (4.2s)
//   'warp'      - camera flies through, screen floods with light        (1.6s)
//   'universe'  - the portal dissolves into the Earth/nations scene     (2.4s)
//   'ready'     - heading/subtitle/CTA/Instagram reveal, islands + lion
//                 settle into their ambient idle motion, fully interactive
//   'launching' - Get Started pressed: a new portal opens and consumes
//                 the camera
//   'done'      - launch animation finished; caller navigates away
//
// Under prefers-reduced-motion, the entire void->warp->universe journey
// (itself one long continuous motion sequence) is skipped - straight to
// a settled 'ready' with the Earth/UI already in place.
const PHASE_DURATIONS = {
  void: 3000,
  space: 2600,
  portal: 4200,
  warp: 1600,
  universe: 2400,
}
const PHASE_ORDER = ['void', 'space', 'portal', 'warp', 'universe', 'ready']
const LAUNCH_DURATION = 1800

// Exported so consumers that need to know "how far into the current phase
// are we" (CameraRig/WarpStreaks, for the passive auto-play 'warp' beat -
// see phaseStartRef below) can look up a phase's duration without
// threading it through as another prop.
export { PHASE_DURATIONS }

export default function useIntroSequence({ reducedMotion = false } = {}) {
  const [phase, setPhase] = useState('void')
  const timers = useRef([])
  // Timestamp (performance.now()) of the most recent phase transition.
  // CameraRig/WarpStreaks read this directly (it's a ref, so no re-render
  // is needed) to compute local elapsed-in-phase time for the passive
  // 'warp' beat, which has no other progress signal driving it - unlike
  // the click-triggered launch, which has `launchProgress` from
  // HeroExperience's own rAF loop.
  const phaseStartRef = useRef(performance.now())

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => {
    phaseStartRef.current = performance.now()
  }, [phase])

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
  // Get Started). A second portal consumes the camera before navigating,
  // so the transition never reads as a plain fade.
  const triggerLaunch = useCallback(
    (onComplete) => {
      setPhase('launching')
      const duration = reducedMotion ? 300 : LAUNCH_DURATION
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

  return { phase, isAtLeast, triggerLaunch, phaseStartRef }
}
