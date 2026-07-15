import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

import useIntroSequence from './useIntroSequence'
import useRipple from '../../lib/useRipple'
import CustomCursor from './CustomCursor'
import SoundToggle from './SoundToggle'
import HeroCanvas from './webgl/HeroCanvas'
import usePointerRef from './webgl/usePointerRef'
import AnimatedHeading from './shared/AnimatedHeading'
import InstagramCta from './shared/InstagramCta'
import ScrollIndicator from './shared/ScrollIndicator'
import GetStartedButton from './shared/GetStartedButton'

// The full immersive "Active Theory"-style hero: a WebGL stadium scene
// (see webgl/HeroCanvas.jsx) behind a scroll-locked DOM overlay. The
// visitor can't scroll the page until they either click Get Started or
// perform one committed scroll/swipe gesture - both trigger the same
// cinematic launch (camera flies forward, particles burst, hero zooms)
// before navigating to /dashboard, so there's no jarring instant jump.
const EASE_OUT = [0.16, 1, 0.3, 1]

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
  const { phase, isAtLeast, triggerLaunch } = useIntroSequence({ reducedMotion: prefersReducedMotion })
  const pointer = usePointerRef()
  const launchProgress = useRef(0)
  const onRipple = useRipple()
  const [headingGlowing, setHeadingGlowing] = useState(false)
  const hasLaunchedRef = useRef(false)

  const handleHeadingDone = useCallback(() => setHeadingGlowing(true), [])

  const launch = useCallback(() => {
    if (hasLaunchedRef.current) return
    hasLaunchedRef.current = true

    const start = performance.now()
    const duration = prefersReducedMotion ? 250 : 1400
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      launchProgress.current = t
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    triggerLaunch(() => navigate('/dashboard'))
  }, [navigate, prefersReducedMotion, triggerLaunch])

  // Scroll-lock: the hero owns the viewport until launch. A single
  // committed downward wheel/touch gesture counts as "Get Started" too,
  // per the brief ("scrolling begins only after clicking Get Started" -
  // interpreted as: scrolling *is* the alternate entry gesture, since a
  // permanently inert scroll would just confuse anyone who tries it).
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

  const isLaunching = phase === 'launching' || phase === 'done'

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
          <HeroCanvas phase={phase} pointer={pointer} launchProgress={launchProgress} dpr={[1, 1.75]} />
        </Suspense>
      </motion.div>

      <div className={`hero-exp__vignette${isLaunching ? ' is-launching' : ''}`} aria-hidden="true" />

      <SoundToggle />

      <div className={`hero-exp__content${isLaunching ? ' is-launching' : ''}`}>
        {isAtLeast('logo') && (
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
              The Ultimate Virtual Cricket Management Platform — Boards, Players, Stadiums,
              Tournaments &amp; Rankings, all in one command center.
            </motion.p>

            <GetStartedButton onClick={launch} onRipple={onRipple} {...fadeUpProps(1.0)} />

            <InstagramCta {...fadeUpProps(1.4)} onRipple={onRipple} />
          </>
        )}
      </div>

      {isAtLeast('ready') && <ScrollIndicator {...fadeUpProps(1.8, 10)} />}
    </div>
  )
}
