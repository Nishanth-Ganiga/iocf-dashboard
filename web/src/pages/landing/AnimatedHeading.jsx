import { motion, useReducedMotion } from 'framer-motion'

// Renders the hero heading as one motion.span per character so the whole
// line reveals letter-by-letter. Timings are tuned so the full sequence
// (first letter starting to last letter settling) lands at ~1.4s, per the
// brief: LETTER_DURATION + (charCount - 1) * LETTER_STAGGER ≈ 1.4s for a
// ~23-character heading. Pass `\n` in `text` for an explicit line break
// (rendered as <br/>, doesn't count toward the stagger as a letter).
//
// Each letter fades up from a slight blur, scales from 0.95 -> 1, and
// settles into place. Once the whole heading has finished, `onDone` fires
// so the caller can layer on the post-reveal golden glow.
//
// Under prefers-reduced-motion, skips the per-letter choreography entirely
// and does a single, quick opacity fade for the whole heading.
const LETTER_DURATION = 0.6
const LETTER_STAGGER = 0.03

export default function AnimatedHeading({ text, className, delay = 0, onDone }) {
  const prefersReducedMotion = useReducedMotion()
  const chars = Array.from(text)
  const letterIndices = chars.reduce((acc, char, i) => {
    if (char !== '\n') acc.push(i)
    return acc
  }, [])
  const lastLetterIndex = letterIndices[letterIndices.length - 1]

  if (prefersReducedMotion) {
    return (
      <motion.span
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay }}
        onAnimationComplete={onDone}
        style={{ display: 'inline-block' }}
      >
        {chars.map((char, i) => (char === '\n' ? <br key={`br-${i}`} /> : char))}
      </motion.span>
    )
  }

  const container = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: delay,
        staggerChildren: LETTER_STAGGER,
      },
    },
  }

  const letter = {
    hidden: { opacity: 0, y: 24, scale: 0.95, filter: 'blur(8px)' },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: { duration: LETTER_DURATION, ease: [0.16, 1, 0.3, 1] },
    },
  }

  return (
    <motion.span
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
      style={{ display: 'inline-block' }}
    >
      {chars.map((char, i) =>
        char === '\n' ? (
          <br key={`br-${i}`} />
        ) : (
          <motion.span
            key={`${char}-${i}`}
            variants={letter}
            // The container's own variant carries no animatable properties
            // (it only exists to orchestrate stagger timing), so framer-motion
            // would fire the container's onAnimationComplete immediately
            // rather than once the stagger finishes. Hanging it off the last
            // letter instead ties it to real animation completion.
            onAnimationComplete={i === lastLetterIndex ? onDone : undefined}
            style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}
          >
            {char}
          </motion.span>
        )
      )}
    </motion.span>
  )
}
