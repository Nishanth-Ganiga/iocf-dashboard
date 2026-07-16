import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Debris + particle streams orbiting the portal: small crystal-like
// fragments (flat shards, tumbling) and a denser ring of fast-moving
// particle streams being pulled toward the event horizon - the brief's
// "floating crystal fragments" and "particles begin orbiting around it".
const SHARD_COUNT = 18
const STREAM_COUNT = 140

export default function PortalDebris({ reveal = 0, position = [0, 0, 0] }) {
  const shardsRef = useRef([])
  const streamRef = useRef(null)
  const current = useRef(0)

  const shards = useMemo(
    () =>
      Array.from({ length: SHARD_COUNT }, () => ({
        radius: 1.8 + Math.random() * 1.6,
        angle: Math.random() * Math.PI * 2,
        speed: (0.1 + Math.random() * 0.2) * (Math.random() > 0.5 ? 1 : -1),
        yOffset: (Math.random() - 0.5) * 1.2,
        tumble: 0.5 + Math.random() * 1.5,
        size: 0.05 + Math.random() * 0.08,
      })),
    []
  )

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(STREAM_COUNT * 3)
    const seeds = new Float32Array(STREAM_COUNT * 3) // radius, angle, speed
    for (let i = 0; i < STREAM_COUNT; i++) {
      seeds[i * 3] = 1.6 + Math.random() * 2.5
      seeds[i * 3 + 1] = Math.random() * Math.PI * 2
      seeds[i * 3 + 2] = 0.3 + Math.random() * 0.6
    }
    return { positions, seeds }
  }, [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    current.current += (reveal - current.current) * Math.min(1, 1.3 * delta)
    const r = current.current

    shardsRef.current.forEach((mesh, i) => {
      if (!mesh) return
      const s = shards[i]
      const angle = s.angle + t * s.speed
      mesh.position.set(Math.cos(angle) * s.radius, s.yOffset + Math.sin(t * 0.5 + i) * 0.15, Math.sin(angle) * s.radius)
      mesh.rotation.x = t * s.tumble
      mesh.rotation.y = t * s.tumble * 0.7
      mesh.material.opacity = r * 0.8
    })

    const geom = streamRef.current?.geometry
    if (geom) {
      const posAttr = geom.attributes.position
      for (let i = 0; i < STREAM_COUNT; i++) {
        // Radius shrinks over time then wraps - simulates streams being
        // pulled inward and recycled, rather than a static ring.
        const cycle = (t * seeds[i * 3 + 2] + seeds[i * 3 + 1] * 3) % 3
        const radius = seeds[i * 3] * (1 - cycle / 3)
        const angle = seeds[i * 3 + 1] + t * 0.3
        posAttr.array[i * 3] = Math.cos(angle) * radius
        posAttr.array[i * 3 + 1] = Math.sin(t * 2 + i) * 0.08
        posAttr.array[i * 3 + 2] = Math.sin(angle) * radius
      }
      posAttr.needsUpdate = true
    }
    if (streamRef.current?.material) {
      streamRef.current.material.opacity = r * 0.7
    }
  })

  return (
    <group position={position}>
      {shards.map((s, i) => (
        <mesh key={i} ref={(el) => (shardsRef.current[i] = el)}>
          <tetrahedronGeometry args={[s.size, 0]} />
          <meshBasicMaterial color="#8fd6ff" transparent opacity={0} toneMapped={false} />
        </mesh>
      ))}

      <points ref={streamRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#f5cf5c"
          size={0.03}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
