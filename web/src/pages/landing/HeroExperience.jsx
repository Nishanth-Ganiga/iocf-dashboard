import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

import useIntroSequence from './useIntroSequence'
import useRipple from '../../lib/useRipple'
import CustomCursor from './CustomCursor'
import SoundToggle from './SoundToggle'
import HeroCanvas from './webgl/HeroCanvas'
import usePointerRef from './webgl/usePointerRef'
import usePointerWorld from './webgl/usePointerWorld'
import detectQualityTier from './webgl/detectQualityTier'
import AnimatedHeading from './shared/AnimatedHeading'
import InstagramCta from './shared/InstagramCta'
import ScrollIndicator from './shared/ScrollIndicator'
import GetStartedButton from './shared/GetStartedButton'

// The full cinematic "World Cricket Portal" experience: void -> space ->
// portal -> warp -> holographic Earth/nations/islands/lion universe (see
// webgl/HeroCanvas.jsx), behind a scroll-locked glass UI overlay. The
// visitor can't scroll the page until they either click Get Started or
// perform one committed scroll/swipe gesture - both trigger the launch
// sequence (a second portal opens, the camera warps through it, the
// screen floods with light) before navigating to /dashboard.
const EASE_OUT = [0.16, 1, 0.3, 1]
const LAUNCH_WARP_DURATION = 1800

function fadeUpProps(delay, distance = 24) {
  return {
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: EASE_OUT, delay },
  }
}

export default function HeroExperience() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const { phase, isAtLeast, triggerLaunch, phaseStartRef } = useIntroSequence({ reducedMotion: prefersReducedMotion })
  const pointer = usePointerRef()
  const pointerWorld = usePointerWorld(pointer)
  const qualityTier = useMemo(() => detectQualityTier(), [])
  const launchProgress = useRef(0)
  const onRipple = useRipple()
  const [headingGlowing, setHeadingGlowing] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const hasLaunchedRef = useRef(false)

  const handleHeadingDone = useCallback(() => setHeadingGlowing(true), [])

  const launch = useCallback(() => {
    if (hasLaunchedRef.current) return
    hasLaunchedRef.current = true
    setIsLaunching(true)

    const start = performance.now()
    const duration = prefersReducedMotion ? 250 : LAUNCH_WARP_DURATION
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      launchProgress.current = t
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    triggerLaunch(() => navigate('/dashboard'))
  }, [navigate, prefersReducedMotion, triggerLaunch])

  // Scroll-lock: the hero owns the viewport until launch. A single
  // committed downward wheel/touch gesture counts as "Get Started" too -
  // a permanently inert scroll would just confuse anyone who tries it.
  useEffect(() => {
    const preventScroll = (e) => {
      if (hasLaunchedRef.current) return
      e.preventDefault()
      if (e.deltaY > 12 || e.touches?.length) launch()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('wheel', preventScroll, { passive: false })
    window.addEventListener('touchmove', preventScroll, { passive: false })
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('wheel', preventScroll)
      window.removeEventListener('touchmove', preventScroll)
    }
  }, [launch])

  return (
    <div className="hero-exp">
      <CustomCursor />

      <motion.div
        className="hero-exp__canvas-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      >
        <Suspense fallback={null}>
          <HeroCanvas
            phase={phase}
            pointer={pointer}
            pointerWorld={pointerWorld}
            launchProgress={launchProgress}
            phaseStartRef={phaseStartRef}
            qualityTier={qualityTier}
          />
        </Suspense>
      </motion.div>

      <div className={`hero-exp__vignette${isLaunching ? ' is-launching' : ''}`} aria-hidden="true" />

      {isAtLeast('ready') && <SoundToggle />}

      <div className={`hero-exp__content${isLaunching ? ' is-launching' : ''}`}>
        {isAtLeast('universe') && (
          <motion.span className="landing__badge" {...fadeUpProps(0, 14)}>
            <span className="landing__badge-shimmer" aria-hidden="true" />
            International Online Cricket Federation
          </motion.span>
        )}

        <h1 className={`landing__title gradient-heading${headingGlowing ? ' is-glowing' : ''}`}>
          {isAtLeast('ready') ? (
            <AnimatedHeading
              text={'Welcome to the\nIOCF Universe'}
              delay={0}
              onDone={handleHeadingDone}
            />
          ) : null}
        </h1>

        {isAtLeast('ready') && (
          <>
            <motion.p className="landing__subtitle text-dim" {...fadeUpProps(0.5)}>
              One Federation. One Cricket World. Boards, Players, Stadiums, Tournaments
              &amp; Rankings — every nation, connected.
            </motion.p>

            <GetStartedButton onClick={launch} onRipple={onRipple} isLaunching={isLaunching} {...fadeUpProps(1.0)} />

            <InstagramCta {...fadeUpProps(1.4)} onRipple={onRipple} />
          </>
        )}
      </div>

      {isAtLeast('ready') && <ScrollIndicator {...fadeUpProps(1.8, 10)} />}
    </div>
  )
}
