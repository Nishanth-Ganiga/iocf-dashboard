import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

import useIntroSequence from './useIntroSequence'
import useRipple from '../../lib/useRipple'
import useParallaxMouse from '../../lib/useParallaxMouse'
import CustomCursor from './CustomCursor'
import SoundToggle from './SoundToggle'
import HeroCanvas from './webgl/HeroCanvas'
import HeroBackdrop from './shared/HeroBackdrop'
import usePointerRef from './webgl/usePointerRef'
import usePointerWorld from './webgl/usePointerWorld'
import detectQualityTier from './webgl/detectQualityTier'
import AnimatedHeading from './shared/AnimatedHeading'
import FeatureCards from './shared/FeatureCards'
import SocialPanel from './shared/SocialPanel'
import ScrollIndicator from './shared/ScrollIndicator'
import GetStartedButton from './shared/GetStartedButton'

// The full cinematic "World Cricket Portal" experience: void -> space ->
// portal -> warp -> holographic Earth/nations/islands/lion universe (see
// webgl/HeroCanvas.jsx), behind a scroll-locked glass UI overlay. A thin,
// low-opacity HeroBackdrop layer (orbit rings/aurora/polygons) sits behind
// the 3D canvas purely for extra depth at the edges the 3D scene doesn't
// fill - it never competes with the WebGL scene for visual attention. The
// visitor can't scroll the page until they either click the CTA or perform
// one committed scroll/swipe gesture - both trigger the launch sequence (a
// second portal opens, the camera warps through it, the screen floods with
// light) before navigating to /dashboard.
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
  const { x: mouseX, y: mouseY } = useParallaxMouse()
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
  // committed downward wheel/touch gesture counts as the CTA too -
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

      <div className="hero-exp__backdrop" aria-hidden="true">
        <HeroBackdrop mouseX={mouseX} mouseY={mouseY} />
      </div>

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
              text={'WELCOME TO THE\nIOCF UNIVERSE'}
              delay={0}
              onDone={handleHeadingDone}
            />
          ) : null}
        </h1>

        {isAtLeast('ready') && (
          <>
            <motion.p className="landing__subtitle" {...fadeUpProps(0.5)}>
              One Federation. One Cricket World. Boards, Players, Stadiums, Rankings, Tournaments
              and Cricket Intelligence — Every Nation Connected.
            </motion.p>

            <GetStartedButton onClick={launch} onRipple={onRipple} isLaunching={isLaunching} {...fadeUpProps(1.0)} />

            <FeatureCards {...fadeUpProps(1.35)} />

            <SocialPanel {...fadeUpProps(1.7)} onRipple={onRipple} />
          </>
        )}
      </div>

      {isAtLeast('ready') && <ScrollIndicator {...fadeUpProps(2.1, 10)} />}
    </div>
  )
}
