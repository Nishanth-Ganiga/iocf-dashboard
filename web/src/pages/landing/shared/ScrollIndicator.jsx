import { motion } from 'framer-motion'

// Elegant "scroll to enter" affordance pinned to the bottom center of the
// hero. Scrolling (or clicking Get Started) is what actually triggers the
// launch sequence into the dashboard - see useIntroSequence/Landing.jsx.
export default function ScrollIndicator(motionProps) {
  return (
    <motion.div className="landing__scroll-cue" aria-hidden="true" {...motionProps}>
      <span className="landing__scroll-cue-text text-faint">Scroll to Enter IOCF</span>
      <span className="landing__scroll-cue-mouse">
        <span className="landing__scroll-cue-wheel" />
      </span>
      <span className="landing__scroll-cue-arrow">⌄</span>
    </motion.div>
  )
}
