import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Scene 1, "The Void": a field of particles in near-total darkness, each
// with one of five distinct behaviors (drift upward, wander randomly,
// fade in/out, glow-pulse, slow rotation/orbit) rather than a single
// uniform system - the brief is explicit that "every particle should have
// its own motion". Particles within cursor range are gently pushed away
// and brightened, so the field visibly reacts to the visitor before
// anything else on the page does.
//
// `reveal` (0-1) fades the whole field in from nothing as the 'void'
// phase progresses; `pointerWorld` is a ref holding the cursor's
// approximate world-space XY (projected from screen space by the parent),
// read every frame rather than driving React state. `count` scales with
// the detected quality tier (see detectQualityTier.js).
const BEHAVIORS = ['drift', 'wander', 'fade', 'pulse', 'orbit']
const FIELD_RADIUS = 9

function useVoidParticleData(count) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3)
    const basePositions = new Float32Array(count * 3)
    const seeds = new Float32Array(count * 4) // behaviorIndex, phase, speed, size
    const colors = new Float32Array(count * 3)
    const baseColors = new Float32Array(count * 3)

    const white = new THREE.Color('#eef2fb')
    const gold = new THREE.Color('#d4af37')
    const neon = new THREE.Color('#34e0ff')
    const palette = [white, gold, neon]

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * FIELD_RADIUS * 2
      const y = (Math.random() - 0.5) * FIELD_RADIUS * 1.4
      const z = (Math.random() - 0.5) * FIELD_RADIUS * 2 - 2

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      basePositions[i * 3] = x
      basePositions[i * 3 + 1] = y
      basePositions[i * 3 + 2] = z

      seeds[i * 4] = Math.floor(Math.random() * BEHAVIORS.length)
      seeds[i * 4 + 1] = Math.random() * Math.PI * 2
      seeds[i * 4 + 2] = 0.15 + Math.random() * 0.5
      seeds[i * 4 + 3] = 0.02 + Math.random() * 0.05

      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
      baseColors[i * 3] = c.r
      baseColors[i * 3 + 1] = c.g
      baseColors[i * 3 + 2] = c.b
    }

    return { positions, basePositions, seeds, colors, baseColors }
  }, [count])
}

export default function VoidParticles({ reveal = 1, pointerWorld, count = 420 }) {
  const { positions, basePositions, seeds, colors, baseColors } = useVoidParticleData(count)
  const pointsRef = useRef(null)
  const materialRef = useRef(null)
  const currentReveal = useRef(0)
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    const geom = pointsRef.current?.geometry
    if (!geom) return
    const posAttr = geom.attributes.position
    const colorAttr = geom.attributes.color
    const t = state.clock.elapsedTime
    currentReveal.current += (reveal - currentReveal.current) * Math.min(1, 1.2 * delta)

    const px = pointerWorld?.current?.x ?? 999
    const py = pointerWorld?.current?.y ?? 999

    for (let i = 0; i < count; i++) {
      const behavior = BEHAVIORS[seeds[i * 4]]
      const phase = seeds[i * 4 + 1]
      const speed = seeds[i * 4 + 2]

      const bx = basePositions[i * 3]
      const by = basePositions[i * 3 + 1]
      const bz = basePositions[i * 3 + 2]

      let x = bx
      let y = by
      let z = bz
      let brightness = 1

      switch (behavior) {
        case 'drift':
          y = by + ((t * speed * 0.3 + phase) % 4) - 2
          x = bx + Math.sin(t * 0.2 + phase) * 0.3
          break
        case 'wander':
          x = bx + Math.sin(t * speed + phase) * 0.6
          y = by + Math.cos(t * speed * 0.8 + phase) * 0.4
          z = bz + Math.sin(t * speed * 0.6 + phase * 2) * 0.5
          break
        case 'orbit': {
          const r = 0.4 + (phase % 1) * 0.6
          x = bx + Math.cos(t * speed + phase) * r
          z = bz + Math.sin(t * speed + phase) * r
          break
        }
        case 'fade':
          brightness = 0.15 + (Math.sin(t * speed * 0.6 + phase) * 0.5 + 0.5) * 0.85
          break
        case 'pulse':
          brightness = 0.4 + Math.pow(Math.sin(t * speed * 1.4 + phase) * 0.5 + 0.5, 3) * 1.4
          break
        default:
          break
      }

      // Cursor reaction: particles within range get pushed outward and
      // brightened, so the field visibly responds before anything else on
      // the page does.
      tmp.set(x - px, y - py, 0)
      const distSq = tmp.x * tmp.x + tmp.y * tmp.y
      if (distSq < 4) {
        const dist = Math.sqrt(distSq) || 0.001
        const proximity = 1 - dist / 2
        const push = proximity * 0.8
        x += (tmp.x / dist) * push
        y += (tmp.y / dist) * push
        brightness += proximity * 1.5
      }

      posAttr.array[i * 3] = x
      posAttr.array[i * 3 + 1] = y
      posAttr.array[i * 3 + 2] = z

      colorAttr.array[i * 3] = baseColors[i * 3] * brightness
      colorAttr.array[i * 3 + 1] = baseColors[i * 3 + 1] * brightness
      colorAttr.array[i * 3 + 2] = baseColors[i * 3 + 2] * brightness
    }
    posAttr.needsUpdate = true
    colorAttr.needsUpdate = true

    if (materialRef.current) {
      materialRef.current.opacity = currentReveal.current
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.045}
        vertexColors
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
