import { motion } from 'framer-motion'

// Elegant "scroll to enter" affordance pinned to the bottom center of the
// hero. Scrolling (or clicking the CTA) is what actually triggers the
// launch sequence into the dashboard - see useIntroSequence/Landing.jsx.
export default function ScrollIndicator(motionProps) {
  return (
    <motion.div className="hero-scroll" aria-hidden="true" {...motionProps}>
      <span className="hero-scroll__text">Scroll to Enter IOCF</span>
      <span className="hero-scroll__mouse">
        <span className="hero-scroll__dot" />
      </span>
      <span className="hero-scroll__line" />
    </motion.div>
  )
}
