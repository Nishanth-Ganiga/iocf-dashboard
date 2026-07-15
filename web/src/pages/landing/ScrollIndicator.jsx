import { motion } from 'framer-motion'

// Elegant "scroll to explore" affordance pinned to the bottom center of
// the hero. Purely decorative (aria-hidden) — the page has no snap-scroll
// sections to jump to, this just signals there's more below the fold.
export default function ScrollIndicator(motionProps) {
  return (
    <motion.div className="landing__scroll-cue" aria-hidden="true" {...motionProps}>
      <span className="landing__scroll-cue-text text-faint">Scroll to Explore</span>
      <span className="landing__scroll-cue-mouse">
        <span className="landing__scroll-cue-wheel" />
      </span>
      <span className="landing__scroll-cue-arrow">⌄</span>
    </motion.div>
  )
}
