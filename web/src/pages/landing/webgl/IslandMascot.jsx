import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// A small procedural, low-poly glowing silhouette standing in for each
// board's mascot - built from primitives (no modeled/rigged assets exist
// for these), styled as a holographic glowing figure rather than an
// attempt at a realistic animal. Every shape shares the same body-plan
// (torso + head + 4 limbs + tail) with per-species proportion tweaks, so
// 14 different mascots don't mean 14 bespoke geometries to maintain.
const SPECIES_PROPORTIONS = {
  lion: { torso: [0.32, 0.22, 0.5], neck: 0.28, legLen: 0.42, tail: 0.55, mane: true },
  elephant: { torso: [0.42, 0.32, 0.6], neck: 0.15, legLen: 0.38, tail: 0.25, trunk: true },
  kangaroo: { torso: [0.24, 0.34, 0.32], neck: 0.2, legLen: 0.5, tail: 0.6, upright: true },
  markhor: { torso: [0.24, 0.22, 0.46], neck: 0.3, legLen: 0.48, tail: 0.2, horns: true },
  tiger: { torso: [0.3, 0.22, 0.52], neck: 0.24, legLen: 0.4, tail: 0.5 },
  unicorn: { torso: [0.26, 0.24, 0.5], neck: 0.34, legLen: 0.5, tail: 0.4, horns: true },
  wolf: { torso: [0.26, 0.2, 0.48], neck: 0.22, legLen: 0.4, tail: 0.35 },
  fox: { torso: [0.2, 0.16, 0.36], neck: 0.18, legLen: 0.3, tail: 0.4 },
  oryx: { torso: [0.24, 0.22, 0.44], neck: 0.28, legLen: 0.46, tail: 0.2, horns: true },
  springbok: { torso: [0.22, 0.2, 0.4], neck: 0.24, legLen: 0.44, tail: 0.15, horns: true },
  marlin: { torso: [0.16, 0.16, 0.62], neck: 0.05, legLen: 0.02, tail: 0.3, swim: true },
  falcon: { torso: [0.18, 0.2, 0.3], neck: 0.14, legLen: 0.18, tail: 0.25, wings: true },
  kiwi: { torso: [0.2, 0.22, 0.28], neck: 0.1, legLen: 0.22, tail: 0.05 },
}

// `walk` accepts either a plain boolean (idle islands: always false) or a
// ref (`{ current: boolean }`, used by LionArrival) whose value can change
// across frames without triggering a re-render - since useFrame reads it
// fresh every tick, a plain prop would be captured once via the JSX above
// and never reflect a later change from a parent's rAF loop.
export default function IslandMascot({ species = 'lion', color = '#f5cf5c', scale = 1, walk = false }) {
  const groupRef = useRef(null)
  const legRefs = useRef([])
  const tailRef = useRef(null)
  const headRef = useRef(null)

  const p = SPECIES_PROPORTIONS[species] ?? SPECIES_PROPORTIONS.lion

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!groupRef.current) return

    // Idle breathing: a slow uniform scale pulse on the torso reads as
    // breath without needing a skinned mesh.
    const breathe = 1 + Math.sin(t * 1.2) * 0.015
    groupRef.current.scale.set(scale * breathe, scale, scale * breathe)

    // Tail sway
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 1.8) * 0.25
    }
    // Head: subtle look-around + blink via a quick y-scale pinch
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.5) * 0.15
      const blinkCycle = t % 4
      headRef.current.scale.y = blinkCycle > 3.85 ? 0.2 : 1
    }
    // Walk cycle: alternating leg swing, only while `walk` is true (used
    // during the portal-arrival beat; idle islands keep mascots stationary
    // aside from breathing/tail/head motion).
    const isWalking = typeof walk === 'boolean' ? walk : walk?.current
    if (isWalking) {
      legRefs.current.forEach((leg, i) => {
        if (!leg) return
        const dir = i % 2 === 0 ? 1 : -1
        leg.rotation.x = Math.sin(t * 6 + (i > 1 ? Math.PI : 0)) * 0.5 * dir
      })
    } else {
      legRefs.current.forEach((leg) => {
        if (leg) leg.rotation.x = 0
      })
    }
  })

  const legPositions = [
    [p.torso[0] * 0.7, -p.legLen / 2, p.torso[2] * 0.35],
    [-p.torso[0] * 0.7, -p.legLen / 2, p.torso[2] * 0.35],
    [p.torso[0] * 0.7, -p.legLen / 2, -p.torso[2] * 0.35],
    [-p.torso[0] * 0.7, -p.legLen / 2, -p.torso[2] * 0.35],
  ]

  return (
    <group ref={groupRef}>
      {/* Torso */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={p.torso} />
        <meshBasicMaterial color={color} wireframe={false} transparent opacity={0.85} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0]} scale={1.04}>
        <boxGeometry args={p.torso} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.4} toneMapped={false} />
      </mesh>

      {/* Head */}
      <group ref={headRef} position={[0, p.torso[1] * 0.3, p.torso[2] / 2 + p.neck * 0.5]}>
        <mesh>
          <boxGeometry args={[p.torso[0] * 0.7, p.torso[1] * 0.8, p.neck]} />
          <meshBasicMaterial color={color} transparent opacity={0.85} toneMapped={false} />
        </mesh>
        {p.mane && (
          <mesh scale={1.5}>
            <sphereGeometry args={[p.torso[0] * 0.5, 8, 8]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={0.3} toneMapped={false} />
          </mesh>
        )}
        {p.horns && (
          <>
            <mesh position={[0.08, 0.15, -0.05]} rotation={[0.3, 0, 0.2]}>
              <coneGeometry args={[0.02, 0.25, 6]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            <mesh position={[-0.08, 0.15, -0.05]} rotation={[0.3, 0, -0.2]}>
              <coneGeometry args={[0.02, 0.25, 6]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
          </>
        )}
        {p.trunk && (
          <mesh position={[0, -0.15, 0.1]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.02, 0.3, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.85} toneMapped={false} />
          </mesh>
        )}
        {p.wings && (
          <>
            <mesh position={[0.2, 0, -0.1]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.25, 0.02, 0.15]} />
              <meshBasicMaterial color={color} transparent opacity={0.6} toneMapped={false} />
            </mesh>
            <mesh position={[-0.2, 0, -0.1]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[0.25, 0.02, 0.15]} />
              <meshBasicMaterial color={color} transparent opacity={0.6} toneMapped={false} />
            </mesh>
          </>
        )}
      </group>

      {/* Legs */}
      {!p.swim &&
        legPositions.map((pos, i) => (
          <mesh key={i} position={pos} ref={(el) => (legRefs.current[i] = el)}>
            <cylinderGeometry args={[0.025, 0.02, p.legLen, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.7} toneMapped={false} />
          </mesh>
        ))}

      {/* Tail */}
      <mesh
        ref={tailRef}
        position={[0, p.torso[1] * 0.1, -p.torso[2] / 2 - p.tail * 0.3]}
        rotation={[0.6, 0, 0]}
      >
        <coneGeometry args={[0.03, p.tail, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} toneMapped={false} />
      </mesh>

      {/* Soft glow halo */}
      <mesh>
        <sphereGeometry args={[Math.max(...p.torso) * 0.9, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.06} side={THREE.BackSide} toneMapped={false} />
      </mesh>
    </group>
  )
}
