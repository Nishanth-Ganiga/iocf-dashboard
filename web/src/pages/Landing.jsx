import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import './Landing.css'

import useParallaxMouse from '../lib/useParallaxMouse'
import useRipple from '../lib/useRipple'
import CanvasField from './landing/CanvasField'
import CricketBall from './landing/CricketBall'
import FloatingElements from './landing/FloatingElements'
import AnimatedHeading from './landing/AnimatedHeading'
import InstagramCta from './landing/InstagramCta'
import ScrollIndicator from './landing/ScrollIndicator'

// Landing page: the site's front door. Clicking "Get Started" takes the
// user straight into the IOCF Dashboard (the real central hub - not
// another landing page).
//
// This is a cinematic hero: an animated starfield/particle canvas, a
// giant translucent cricket ball that tilts with the pointer, a
// letter-by-letter heading reveal, and a premium Instagram community CTA
// beneath the primary "Get Started" button. All motion is orchestrated
// with framer-motion and respects prefers-reduced-motion throughout.
//
// Timing is spelled out explicitly per element (rather than leaning on
// framer's staggerChildren) because the sequence interleaves motion and
// non-motion elements — AnimatedHeading manages its own internal reveal
// timing, so it can't participate in a parent stagger group. Explicit
// delays keep the whole cinematic order (badge -> heading -> subtitle ->
// CTA -> Instagram -> scroll cue) legible and easy to retune.
const HEADING_DELAY = 0.3
const HEADING_DURATION = 1.4
const HEADING_DONE = HEADING_DELAY + HEADING_DURATION // ~1.7s
const SUBTITLE_DELAY = HEADING_DONE + 0.3
const CTA_DELAY = SUBTITLE_DELAY + 0.5
const INSTA_DELAY = CTA_DELAY + 0.3
const SCROLL_CUE_DELAY = INSTA_DELAY + 0.4

const EASE_OUT = [0.16, 1, 0.3, 1]

function fadeUpProps(delay, distance = 24) {
  return {
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: EASE_OUT, delay },
  }
}

export default function Landing() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const { x: mouseX, y: mouseY } = useParallaxMouse()
  const [headingGlowing, setHeadingGlowing] = useState(false)
  const onRipple = useRipple()

  const handleHeadingDone = useCallback(() => setHeadingGlowing(true), [])

  return (
    <div className="landing">
      <motion.div
        className="landing__bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <CanvasField motionX={mouseX} motionY={mouseY} reducedMotion={prefersReducedMotion} />
        <div className="landing__mesh landing__mesh--1" />
        <div className="landing__mesh landing__mesh--2" />
        <div className="landing__fog" />
        <div className="landing__floodlight landing__floodlight--1" />
        <div className="landing__floodlight landing__floodlight--2" />
        <div className="landing__stadium-ring landing__stadium-ring--outer" />
        <div className="landing__stadium-ring landing__stadium-ring--inner" />
        <div className="landing__particles">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} style={{ '--i': i }} />
          ))}
        </div>
        <FloatingElements count={12} />
      </motion.div>

      <motion.div
        className="landing__ball-stage"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: EASE_OUT, delay: 0.15 }}
      >
        <CricketBall mouseX={mouseX} mouseY={mouseY} />
      </motion.div>

      <div className="landing__content">
        <motion.span className="landing__badge" {...fadeUpProps(0.1, 14)}>
          <span className="landing__badge-shimmer" aria-hidden="true" />
          International Online Cricket Federation
        </motion.span>

        <h1 className={`landing__title gradient-heading${headingGlowing ? ' is-glowing' : ''}`}>
          <AnimatedHeading
            text={'Welcome to the\nIOCF Universe'}
            delay={HEADING_DELAY}
            onDone={handleHeadingDone}
          />
        </h1>

        <motion.p className="landing__subtitle text-dim" {...fadeUpProps(SUBTITLE_DELAY)}>
          The Ultimate Virtual Cricket Management Platform — Boards, Players, Stadiums,
          Tournaments &amp; Rankings, all in one command center.
        </motion.p>

        <motion.button
          className="btn btn-primary landing__cta"
          onClick={() => navigate('/dashboard')}
          onPointerDown={onRipple}
          {...fadeUpProps(CTA_DELAY)}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.96 }}
        >
          <span className="landing__cta-label">Get Started</span>
          <span className="landing__cta-arrow" aria-hidden="true">→</span>
        </motion.button>

        <InstagramCta {...fadeUpProps(INSTA_DELAY)} onRipple={onRipple} />
      </div>

      <ScrollIndicator {...fadeUpProps(SCROLL_CUE_DELAY, 10)} />
    </div>
  )
}
