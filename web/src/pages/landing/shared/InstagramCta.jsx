import { motion } from 'framer-motion'
import useCountUp from '../../../lib/useCountUp'

const INSTAGRAM_URL = 'https://www.instagram.com/iocf_official?igsh=dHBzcGFsYnJ2YTc='

const HIGHLIGHTS = [
  'Official Tournaments',
  'Player Rankings',
  'Auction News',
  'League Announcements',
  'Daily Cricket Content',
]

// Premium Instagram community callout beneath the main CTA. The follower
// count uses the same scroll-triggered useCountUp hook the dashboard stat
// cards already rely on, so it only starts ticking once this section
// actually enters the viewport. Entry motion props (initial/animate/
// transition) are forwarded from the parent's fadeUpProps() so this slots
// into the hero's overall choreography.
export default function InstagramCta({ onRipple, ...motionProps }) {
  const [followers, countRef] = useCountUp(100000)

  return (
    <motion.div className="landing__insta glass-panel" ref={countRef} {...motionProps}>
      <div className="landing__insta-head">
        <span className="landing__insta-icon" aria-hidden="true">
          📸
        </span>
        <div>
          <p className="landing__insta-title">
            Join <span className="landing__insta-count-inline gradient-heading">{followers}+</span> Cricket Fans
          </p>
          <p className="landing__insta-sub text-dim">Follow IOCF Official</p>
        </div>
      </div>

      <ul className="landing__insta-list">
        {HIGHLIGHTS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <a
        className="landing__insta-btn"
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        onPointerDown={onRipple}
        data-cursor-hover
      >
        <span className="landing__insta-btn-label">Follow IOCF Official</span>
        <span className="landing__insta-btn-arrow" aria-hidden="true">
          →
        </span>
      </a>
    </motion.div>
  )
}
