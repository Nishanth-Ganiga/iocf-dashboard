import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

import useParallaxMouse from '../../lib/useParallaxMouse'
import useRipple from '../../lib/useRipple'
import CanvasField from './fallback/CanvasField'
import CricketBall from './fallback/CricketBall'
import HeroBackdrop from './shared/HeroBackdrop'
import AnimatedHeading from './shared/AnimatedHeading'
import FeatureCards from './shared/FeatureCards'
import SocialPanel from './shared/SocialPanel'
import ScrollIndicator from './shared/ScrollIndicator'
import GetStartedButton from './shared/GetStartedButton'

// CSS/Canvas2D fallback hero - used instead of the WebGL HeroExperience on
// touch/small-viewport devices, when the browser fails the WebGL
// capability check, when prefers-reduced-motion is set, or if the WebGL
// scene throws at runtime (see Landing.jsx). Visually equivalent to the
// full experience's DOM overlay (same heading/subtitle/CTA/social
// choreography) but with a 2D canvas starfield + digital-planet backdrop +
// SVG cricket ball standing in for the 3D stadium scene, and no
// scroll-lock/launch sequence - Get Started just navigates directly.
const HEADING_DELAY = 0.3
const HEADING_DURATION = 1.4
const HEADING_DONE = HEADING_DELAY + HEADING_DURATION
const SUBTITLE_DELAY = HEADING_DONE + 0.3
const CTA_DELAY = SUBTITLE_DELAY + 0.5
const CARDS_DELAY = CTA_DELAY + 0.3
const SOCIAL_DELAY = CARDS_DELAY + 0.3
const SCROLL_CUE_DELAY = SOCIAL_DELAY + 0.4

const EASE_OUT = [0.16, 1, 0.3, 1]

function fadeUpProps(delay, distance = 24) {
  return {
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: EASE_OUT, delay },
  }
}

export default function HeroFallback() {
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
        <HeroBackdrop mouseX={mouseX} mouseY={mouseY} />
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
            text={'WELCOME TO THE\nIOCF UNIVERSE'}
            delay={HEADING_DELAY}
            onDone={handleHeadingDone}
          />
        </h1>

        <motion.p className="landing__subtitle" {...fadeUpProps(SUBTITLE_DELAY)}>
          One Federation. One Cricket World. Boards, Players, Stadiums, Rankings, Tournaments
          and Cricket Intelligence — Every Nation Connected.
        </motion.p>

        <GetStartedButton
          onClick={() => navigate('/dashboard')}
          onRipple={onRipple}
          {...fadeUpProps(CTA_DELAY)}
        />

        <FeatureCards {...fadeUpProps(CARDS_DELAY)} />

        <SocialPanel {...fadeUpProps(SOCIAL_DELAY)} onRipple={onRipple} />
      </div>

      <ScrollIndicator {...fadeUpProps(SCROLL_CUE_DELAY, 10)} />
    </div>
  )
}

