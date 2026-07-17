import { motion } from 'framer-motion'
import { FaInstagram, FaYoutube, FaDiscord, FaTelegram, FaXTwitter } from 'react-icons/fa6'
import { GiTrophyCup } from 'react-icons/gi'
import useCountUp from '../../../lib/useCountUp'

// The only confirmed-real IOCF social account is Instagram — every icon in
// this panel (YouTube/Discord/Telegram/X included) links there rather than
// to guessed URLs for accounts that may not exist.
const INSTAGRAM_URL = 'https://www.instagram.com/iocf_official?igsh=dHBzcGFsYnJ2YTc='

const PLATFORMS = [
  { Icon: FaInstagram, label: 'Instagram' },
  { Icon: FaYoutube, label: 'YouTube' },
  { Icon: FaDiscord, label: 'Discord' },
  { Icon: FaTelegram, label: 'Telegram' },
  { Icon: FaXTwitter, label: 'X' },
]

// Premium social panel replacing the old Instagram-only card: a glowing
// trophy/globe emblem on the left, "JOIN 100,000+ CRICKET FANS" copy and a
// row of platform icons on the right, one shared FOLLOW button beneath.
// The follower count reuses the same scroll-triggered useCountUp hook as
// the dashboard's stat cards, so it only starts ticking once this section
// enters the viewport. Entry motion props are forwarded from the parent's
// fadeUpProps() so this slots into the hero's overall choreography.
export default function SocialPanel({ onRipple, ...motionProps }) {
  const [followers, countRef] = useCountUp(100000)

  return (
    <motion.div className="hero-social glass-panel" ref={countRef} {...motionProps}>
      <span className="hero-social__corner hero-social__corner--tl" aria-hidden="true" />
      <span className="hero-social__corner hero-social__corner--br" aria-hidden="true" />
      <div className="hero-social__particles" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} style={{ '--i': i }} />
        ))}
      </div>

      <div className="hero-social__emblem" aria-hidden="true">
        <GiTrophyCup />
      </div>

      <div className="hero-social__body">
        <p className="hero-social__headline">
          JOIN <span className="hero-social__count gradient-heading">{followers}+</span>
          <br />
          CRICKET FANS
        </p>
        <div className="hero-social__icons">
          {PLATFORMS.map(({ Icon, label }) => (
            <a
              key={label}
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-social__icon"
              aria-label={label}
              data-cursor-hover
            >
              <Icon aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>

      <a
        className="hero-social__btn"
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        onPointerDown={onRipple}
        data-cursor-hover
      >
        <span>FOLLOW IOCF OFFICIAL</span>
        <span className="hero-social__btn-arrow" aria-hidden="true">→</span>
      </a>
    </motion.div>
  )
}
