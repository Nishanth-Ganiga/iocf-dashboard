import { useEffect, useRef, useState } from 'react'

// Muted-by-default ambience toggle in the corner. There's no licensed
// cinematic score/stadium-crowd/choir audio in this repo, so this
// synthesizes a layered atmosphere via the Web Audio API as a stand-in for
// the brief's "low frequency ambience, wind, soft choir, distant stadium
// crowd, energy humming" - it's meant to be swapped for real recorded
// audio later (see the comment on AUDIO_SRC below). Deliberately built as
// several independent layers (not one drone) so it has some of the
// movement real cinematic ambience has, without ever getting loud.
//
// To use real recordings instead: drop files into `web/public/audio/`,
// set AUDIO_SRC to the main one, and replace the body of
// `startSynthAmbience`/`stopSynthAmbience` with a plain <audio> element
// (loop, volume ~0.3) - the on/off button wiring below doesn't need to
// change.
const AUDIO_SRC = null // e.g. '/audio/iocf-ambience.mp3' once a real track exists

export default function SoundToggle() {
  const [muted, setMuted] = useState(true)
  const audioCtxRef = useRef(null)
  const nodesRef = useRef(null)
  const audioElRef = useRef(null)
  const humIntervalRef = useRef(null)

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
    const masterGain = ctx.createGain()
    masterGain.gain.value = 0
    masterGain.connect(ctx.destination)

    // Low drone: two detuned oscillators for a subtle beating texture -
    // the "low frequency ambience" bed everything else sits on top of.
    const droneOsc1 = ctx.createOscillator()
    const droneOsc2 = ctx.createOscillator()
    droneOsc1.type = 'sine'
    droneOsc2.type = 'sine'
    droneOsc1.frequency.value = 55
    droneOsc2.frequency.value = 55.6
    const droneGain = ctx.createGain()
    droneGain.gain.value = 0.5
    droneOsc1.connect(droneGain)
    droneOsc2.connect(droneGain)
    droneGain.connect(masterGain)

    // Wind: filtered noise with a slowly wandering cutoff frequency, so
    // it swells and fades rather than sitting static.
    const windBufferSize = ctx.sampleRate * 4
    const windBuffer = ctx.createBuffer(1, windBufferSize, ctx.sampleRate)
    const windData = windBuffer.getChannelData(0)
    for (let i = 0; i < windBufferSize; i++) windData[i] = Math.random() * 2 - 1
    const wind = ctx.createBufferSource()
    wind.buffer = windBuffer
    wind.loop = true
    const windFilter = ctx.createBiquadFilter()
    windFilter.type = 'bandpass'
    windFilter.frequency.value = 500
    windFilter.Q.value = 0.6
    const windLfo = ctx.createOscillator()
    windLfo.frequency.value = 0.07
    const windLfoGain = ctx.createGain()
    windLfoGain.gain.value = 300
    windLfo.connect(windLfoGain)
    windLfoGain.connect(windFilter.frequency)
    const windGain = ctx.createGain()
    windGain.gain.value = 0.12
    wind.connect(windFilter)
    windFilter.connect(windGain)
    windGain.connect(masterGain)

    // Distant crowd: heavier lowpass noise, much quieter than wind, for a
    // faint "far-off stadium" texture rather than anything intelligible.
    const crowdBufferSize = ctx.sampleRate * 3
    const crowdBuffer = ctx.createBuffer(1, crowdBufferSize, ctx.sampleRate)
    const crowdData = crowdBuffer.getChannelData(0)
    for (let i = 0; i < crowdBufferSize; i++) crowdData[i] = Math.random() * 2 - 1
    const crowd = ctx.createBufferSource()
    crowd.buffer = crowdBuffer
    crowd.loop = true
    const crowdFilter = ctx.createBiquadFilter()
    crowdFilter.type = 'lowpass'
    crowdFilter.frequency.value = 300
    const crowdGain = ctx.createGain()
    crowdGain.gain.value = 0.05
    crowd.connect(crowdFilter)
    crowdFilter.connect(crowdGain)
    crowdGain.connect(masterGain)

    // Soft "choir": a few slow, gently detuned sine tones in a high
    // register with long attack/release - a stand-in for a wordless pad,
    // not an attempt at vocal synthesis.
    const choirFreqs = [392, 493.88, 587.33] // G4, B4, D5 - open, airy triad
    const choirOscs = choirFreqs.map((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq * (1 + (i - 1) * 0.002)
      const gain = ctx.createGain()
      gain.gain.value = 0.03
      osc.connect(gain)
      gain.connect(masterGain)
      return osc
    })

    ;[droneOsc1, droneOsc2, wind, windLfo, crowd, ...choirOscs].forEach((node) => node.start())
    masterGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.5)

    audioCtxRef.current = ctx
    nodesRef.current = { masterGain, sources: [droneOsc1, droneOsc2, wind, windLfo, crowd, ...choirOscs] }

    // Energy hum: an occasional soft rising blip, standing in for
    // "energy humming / portal sound" as a periodic accent rather than a
    // constant tone.
    humIntervalRef.current = setInterval(() => {
      if (!audioCtxRef.current) return
      const humOsc = ctx.createOscillator()
      const humGain = ctx.createGain()
      humOsc.type = 'triangle'
      humOsc.frequency.setValueAtTime(220, ctx.currentTime)
      humOsc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 1.2)
      humGain.gain.setValueAtTime(0, ctx.currentTime)
      humGain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.5)
      humGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.4)
      humOsc.connect(humGain)
      humGain.connect(masterGain)
      humOsc.start()
      humOsc.stop(ctx.currentTime + 1.5)
    }, 6000)
  }

  const stopSynthAmbience = () => {
    if (AUDIO_SRC) {
      audioElRef.current?.pause()
      return
    }
    if (humIntervalRef.current) {
      clearInterval(humIntervalRef.current)
      humIntervalRef.current = null
    }
    const ctx = audioCtxRef.current
    const nodes = nodesRef.current
    if (!ctx || !nodes) return
    nodes.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4)
    setTimeout(() => {
      nodes.sources.forEach((node) => {
        try {
          node.stop()
        } catch {
          // already stopped - harmless
        }
      })
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
      aria-label={muted ? 'Unmute IOCF universe ambience' : 'Mute IOCF universe ambience'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
