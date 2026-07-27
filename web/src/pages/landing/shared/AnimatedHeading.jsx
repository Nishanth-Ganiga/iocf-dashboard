import { useEffect } from 'react'

// Renders the hero heading as plain text — no letter-by-letter reveal or
// fade-in. `onDone` still fires once on mount so callers that key a
// post-reveal effect (the golden glow) off it keep working unchanged.
// Pass `\n` in `text` for an explicit line break.
export default function AnimatedHeading({ text, className, onDone }) {
  useEffect(() => {
    onDone?.()
  }, [onDone])

  const lines = text.split('\n')

  return (
    <span className={className} style={{ display: 'inline-block' }}>
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </span>
  )
}
