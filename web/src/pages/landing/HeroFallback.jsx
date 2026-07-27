import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'

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
// full experience's DOM overlay (same heading/subtitle/CTA/social layout)
// but with a 2D canvas starfield + digital-planet backdrop + SVG cricket
// ball standing in for the 3D stadium scene, and no scroll-lock/launch
// sequence - Get Started just navigates directly. Content renders
// immediately, with no staggered entrance choreography.
export default function HeroFallback() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const { x: mouseX, y: mouseY } = useParallaxMouse()
  const [headingGlowing, setHeadingGlowing] = useState(false)
  const onRipple = useRipple()

  const handleHeadingDone = useCallback(() => setHeadingGlowing(true), [])

  return (
    <div className="landing">
      <div className="landing__bg">
        <CanvasField motionX={mouseX} motionY={mouseY} reducedMotion={prefersReducedMotion} />
        <HeroBackdrop mouseX={mouseX} mouseY={mouseY} />
      </div>

      <div className="landing__ball-stage">
        <CricketBall mouseX={mouseX} mouseY={mouseY} />
      </div>

      <div className="landing__content">
        <span className="landing__badge">
          <span className="landing__badge-shimmer" aria-hidden="true" />
          International Online Cricket Federation
        </span>

        <h1 className={`landing__title gradient-heading${headingGlowing ? ' is-glowing' : ''}`}>
          <AnimatedHeading
            text={'WELCOME TO THE\nIOCF UNIVERSE'}
            onDone={handleHeadingDone}
          />
        </h1>

        <p className="landing__subtitle">
          One Federation. One Cricket World. Boards, Players, Stadiums, Rankings, Tournaments
          and Cricket Intelligence — Every Nation Connected.
        </p>

        <GetStartedButton onClick={() => navigate('/dashboard')} onRipple={onRipple} />

        <FeatureCards />

        <SocialPanel onRipple={onRipple} />
      </div>

      <ScrollIndicator />
    </div>
  )
}

