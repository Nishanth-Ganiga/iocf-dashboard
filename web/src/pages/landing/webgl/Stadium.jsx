import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// A stylized, low-poly cricket stadium: a wide ring of "seating" tiers
// plus four floodlight towers. This is deliberately abstract rather than
// photoreal — the brief calls for a "digital"/holographic stadium, not a
// literal 3D model, so simple extruded geometry + emissive materials read
// as "stadium at night" without a heavy asset pipeline or GLTF loading.
//
// `reveal` (0-1, from the intro phase) is a *target* the "power on" wipe
// eases toward every frame via a ref (rather than being applied to
// materials directly), so a phase change doesn't visibly snap the rim
// opacity/floodlight intensity - it powers on smoothly over roughly a
// second, matching "lights slowly power on" in the brief.
const TIER_COUNT = 3
const RING_SEGMENTS = 96
const EASE_RATE = 1.4

export default function Stadium({ reveal = 1 }) {
  const ringGroupRef = useRef(null)
  const floodlightRefs = useRef([])
  const tierMaterialRefs = useRef([])
  const floorMaterialRef = useRef(null)
  const accentMaterialRef = useRef(null)
  const lightHeadRefs = useRef([])
  const current = useRef(0)

  const tiers = useMemo(
    () =>
      Array.from({ length: TIER_COUNT }, (_, i) => ({
        radius: 9 + i * 1.4,
        height: 0.5 + i * 0.35,
        y: -1.6 - i * 0.55,
      })),
    []
  )

  const floodlightPositions = useMemo(() => {
    const count = 4
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.PI / 4
      const radius = 11.5
      return [Math.cos(angle) * radius, 3.2, Math.sin(angle) * radius]
    })
  }, [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    current.current += (reveal - current.current) * Math.min(1, EASE_RATE * delta)
    const r = current.current

    if (ringGroupRef.current) {
      // Barely-there ambient rotation - the "alive" digital-stadium feel
      // the brief asks for, without ever reading as spinning.
      ringGroupRef.current.rotation.y = t * 0.006
    }

    tierMaterialRefs.current.forEach((mat) => {
      if (!mat) return
      mat.emissiveIntensity = 0.25 * r
      mat.opacity = 0.55 * r
    })
    if (floorMaterialRef.current) floorMaterialRef.current.emissiveIntensity = 0.4 * r
    if (accentMaterialRef.current) accentMaterialRef.current.opacity = 0.35 * r

    floodlightRefs.current.forEach((light, i) => {
      if (!light) return
      const flicker = 0.9 + Math.sin(t * 1.3 + i * 1.7) * 0.08
      light.intensity = r * 8 * flicker
    })
    lightHeadRefs.current.forEach((mat) => {
      if (!mat) return
      mat.emissiveIntensity = r * 2.2
    })
  })

  return (
    <group>
      <group ref={ringGroupRef}>
        {tiers.map((tier, i) => (
          <mesh key={i} position={[0, tier.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[tier.radius, tier.radius + 1.1, RING_SEGMENTS]} />
            <meshStandardMaterial
              ref={(el) => (tierMaterialRefs.current[i] = el)}
              color="#0f1a3d"
              emissive="#1c2d63"
              emissiveIntensity={0}
              transparent
              opacity={0}
              side={THREE.DoubleSide}
              roughness={0.7}
              metalness={0.3}
            />
          </mesh>
        ))}

        {/* Ground/pitch disc - a soft glowing floor beneath everything */}
        <mesh position={[0, -1.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[8.6, RING_SEGMENTS]} />
          <meshStandardMaterial
            ref={floorMaterialRef}
            color="#081022"
            emissive="#0a1128"
            emissiveIntensity={0}
            roughness={0.9}
          />
        </mesh>

        {/* Faint gold accent ring tracing the pitch boundary */}
        <mesh position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[8.5, 8.62, RING_SEGMENTS]} />
          <meshBasicMaterial
            ref={accentMaterialRef}
            color="#d4af37"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {floodlightPositions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Tower mast */}
          <mesh position={[0, -2.4, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 5.6, 8]} />
            <meshStandardMaterial color="#16234f" roughness={0.6} metalness={0.5} />
          </mesh>
          {/* Light head */}
          <mesh>
            <boxGeometry args={[0.9, 0.5, 0.15]} />
            <meshStandardMaterial
              ref={(el) => (lightHeadRefs.current[i] = el)}
              color="#eef2fb"
              emissive="#eef2fb"
              emissiveIntensity={0}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            ref={(el) => (floodlightRefs.current[i] = el)}
            color="#f5cf5c"
            intensity={0}
            distance={22}
            decay={2}
          />
        </group>
      ))}
    </group>
  )
}
