import { useEffect, useRef, useState } from 'react'

// Counts up from 0 to `value` once the element scrolls into view (or
// immediately if IntersectionObserver isn't available). Used for the
// stat-card animated counters on the dashboard overview.
export default function useCountUp(value, { duration = 1200, decimals = 0 } = {}) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const startedRef = useRef(false)

  useEffect(() => {
    const target = typeof value === 'number' ? value : 0
    const node = ref.current

    const run = () => {
      if (startedRef.current) return
      startedRef.current = true
      const start = performance.now()
      const from = 0
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        setDisplay(from + (target - from) * eased)
        if (t < 1) requestAnimationFrame(tick)
        else setDisplay(target)
      }
      requestAnimationFrame(tick)
    }

    if (!node || typeof IntersectionObserver === 'undefined') {
      run()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) run()
        })
      },
      { threshold: 0.2 }
    )
    observer.observe(node)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // if the underlying value changes after mount (e.g. workbook refresh), retarget smoothly
  useEffect(() => {
    if (!startedRef.current) return
    const target = typeof value === 'number' ? value : 0
    const from = display
    const start = performance.now()
    const dur = 800
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (target - from) * eased)
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString('en-US')
  return [formatted, ref]
}
