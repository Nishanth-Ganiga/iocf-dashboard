import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Ambient energy particles: a sparse cloud of gold/blue points drifting
// slowly around the scene. Positions live in a single Float32Array
// updated in-place every frame (no per-particle React state, no
// allocations in the render loop) so this scales to a few hundred points
// without denting frame time.
//
// On launch, `launchProgress` (0-1, read from a ref each frame) drives an
// outward "soft explosion" - particles ease from their orbit radius out
// to 3x that, fading as they go - matching the brief's "particles explode
// softly" on click.
const PARTICLE_COUNT = 260

function useParticleData() {
  return useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const seeds = new Float32Array(PARTICLE_COUNT * 4) // radius, angle, height, speed
    const colors = new Float32Array(PARTICLE_COUNT * 3)

    const gold = new THREE.Color('#d4af37')
    const neon = new THREE.Color('#34e0ff')

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 3 + Math.random() * 9
      const angle = Math.random() * Math.PI * 2
      const height = (Math.random() - 0.5) * 6

      seeds[i * 4] = radius
      seeds[i * 4 + 1] = angle
      seeds[i * 4 + 2] = height
      seeds[i * 4 + 3] = 0.02 + Math.random() * 0.05

      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = height
      positions[i * 3 + 2] = Math.sin(angle) * radius

      const c = Math.random() > 0.5 ? gold : neon
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    return { positions, seeds, colors }
  }, [])
}

export default function EnergyParticles({ reveal = 1, launchProgress }) {
  const { positions, seeds, colors } = useParticleData()
  const pointsRef = useRef(null)
  const materialRef = useRef(null)
  const currentReveal = useRef(0)

  useFrame((state, delta) => {
    const geom = pointsRef.current?.geometry
    if (!geom) return
    const posAttr = geom.attributes.position
    const t = state.clock.elapsedTime
    const launch = launchProgress?.current ?? 0
    currentReveal.current += (reveal - currentReveal.current) * Math.min(1, 1.6 * delta)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = seeds[i * 4]
      const baseAngle = seeds[i * 4 + 1]
      const height = seeds[i * 4 + 2]
      const speed = seeds[i * 4 + 3]

      const angle = baseAngle + t * speed
      const explodeRadius = radius * (1 + launch * 2.2)
      const bob = Math.sin(t * speed * 4 + i) * 0.25

      posAttr.array[i * 3] = Math.cos(angle) * explodeRadius
      posAttr.array[i * 3 + 1] = height + bob + launch * bob * 3
      posAttr.array[i * 3 + 2] = Math.sin(angle) * explodeRadius
    }
    posAttr.needsUpdate = true

    if (materialRef.current) {
      materialRef.current.opacity = currentReveal.current * (1 - launch * 0.7)
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
        size={0.055}
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
