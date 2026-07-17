import { motion } from 'framer-motion'
import { GiTrophyCup, GiPodiumWinner, GiScales } from 'react-icons/gi'
import { FaNewspaper } from 'react-icons/fa6'
import TiltCard from './TiltCard'

const FEATURES = [
  { icon: GiTrophyCup, title: 'Tournaments', copy: 'Global competitions' },
  { icon: GiPodiumWinner, title: 'Player Rankings', copy: 'Live rating system' },
  { icon: GiScales, title: 'Auctions', copy: 'Credits & Transfers' },
  { icon: FaNewspaper, title: 'Latest News', copy: 'Daily Cricket Updates' },
]

// Four premium glass feature cards replacing the old plain bullet list —
// each tilts toward the cursor (TiltCard), its icon spins on hover, and a
// gradient border sweeps in, matching the rest of the hero's "everything
// glows, nothing is flat" language.
export default function FeatureCards(motionProps) {
  return (
    <motion.div className="hero-cards" {...motionProps}>
      {FEATURES.map(({ icon: Icon, title, copy }, i) => (
        <TiltCard key={title} className="hero-card glass-panel" style={{ '--card-delay': `${i * 0.6}s` }}>
          <span className="hero-card__icon">
            <Icon aria-hidden="true" />
          </span>
          <p className="hero-card__title">{title}</p>
          <p className="hero-card__copy">{copy}</p>
        </TiltCard>
      ))}
    </motion.div>
  )
}
