import { useEffect, useRef, useState } from 'react'

// Muted-by-default ambience toggle in the corner. There's no licensed
// stadium-crowd audio in this repo, so this synthesizes a soft, low
// drone + gentle filtered noise "atmosphere" via the Web Audio API as a
// stand-in - it's meant to be swapped for a real recorded stadium
// ambience loop later (see the comment on AUDIO_SRC below).
//
// To use a real recording instead: drop an .mp3/.ogg into
// `web/public/audio/stadium-ambience.<ext>`, set AUDIO_SRC to that path,
// and replace the body of `startSynthAmbience`/`stopSynthAmbience` with a
// plain <audio> element (loop, volume ~0.3) - the on/off button wiring
// below doesn't need to change.
const AUDIO_SRC = null // e.g. '/audio/stadium-ambience.mp3' once a real track exists

export default function SoundToggle() {
  const [muted, setMuted] = useState(true)
  const audioCtxRef = useRef(null)
  const nodesRef = useRef(null)
  const audioElRef = useRef(null)

  useEffect(() => {
    if (!AUDIO_SRC) return
    const el = new Audio(AUDIO_SRC)
    el.loop = true
    el.volume = 0.3
    audioElRef.current = el
    return () => el.pause()
  }, [])

  const startSynthAmbience = () => {
    if (AUDIO_SRC) {
      audioElRef.current?.play().catch(() => {})
      return
    }
    if (audioCtxRef.current) return

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextCtor) return
    const ctx = new AudioContextCtor()

    // Low drone: two detuned oscillators for a subtle beating texture.
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    osc1.type = 'sine'
    osc2.type = 'sine'
    osc1.frequency.value = 55
    osc2.frequency.value = 55.6

    // Filtered noise for a faint "crowd/air" texture underneath the drone.
    const bufferSize = ctx.sampleRate * 2
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuffer
    noise.loop = true
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.value = 400

    const masterGain = ctx.createGain()
    masterGain.gain.value = 0
    const targetGain = 0.06

    const droneGain = ctx.createGain()
    droneGain.gain.value = 0.5
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.15

    osc1.connect(droneGain)
    osc2.connect(droneGain)
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    droneGain.connect(masterGain)
    noiseGain.connect(masterGain)
    masterGain.connect(ctx.destination)

    osc1.start()
    osc2.start()
    noise.start()
    masterGain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 1.2)

    audioCtxRef.current = ctx
    nodesRef.current = { osc1, osc2, noise, masterGain }
  }

  const stopSynthAmbience = () => {
    if (AUDIO_SRC) {
      audioElRef.current?.pause()
      return
    }
    const ctx = audioCtxRef.current
    const nodes = nodesRef.current
    if (!ctx || !nodes) return
    nodes.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4)
    setTimeout(() => {
      nodes.osc1.stop()
      nodes.osc2.stop()
      nodes.noise.stop()
      ctx.close()
    }, 450)
    audioCtxRef.current = null
    nodesRef.current = null
  }

  useEffect(() => stopSynthAmbience, [])

  const toggle = () => {
    setMuted((prev) => {
      const next = !prev
      if (next) stopSynthAmbience()
      else startSynthAmbience()
      return next
    })
  }

  return (
    <button
      type="button"
      className="hero-sound-toggle"
      onClick={toggle}
      data-cursor-hover
      aria-pressed={!muted}
      aria-label={muted ? 'Unmute stadium ambience' : 'Mute stadium ambience'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
