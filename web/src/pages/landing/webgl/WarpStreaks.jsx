import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PHASE_DURATIONS } from '../useIntroSequence'

// Star-streak burst for the portal fly-through: thin elongated lines
// radiating outward from the center, growing and accelerating as progress
// climbs from 0 to 1 - the classic "stars stretch into the distance"
// effect, done as camera-facing line segments rather than a full-screen
// shader pass (safer to reason about without being able to render/inspect
// it directly).
//
// Rendered during two distinct beats that need two different progress
// sources:
//   - the passive 'warp' phase (no user interaction) - progress derived
//     from how long that phase has been active (`phaseStartRef`), since
//     `launchProgress` stays at 0 for a viewer who never clicks anything
//   - the click-triggered 'launching'/'done' phase - progress comes from
//     `launchProgress`, HeroExperience's own rAF-driven ref
// `phase` picks which source to trust each frame.
const STREAK_COUNT = 220

export default function WarpStreaks({ phase, phaseStartRef, launchProgress }) {
  const lineRef = useRef(null)

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(STREAK_COUNT * 2 * 3) // 2 points per streak
    const seeds = new Float32Array(STREAK_COUNT * 2) // angle, distance
    for (let i = 0; i < STREAK_COUNT; i++) {
      seeds[i * 2] = Math.random() * Math.PI * 2
      seeds[i * 2 + 1] = 0.5 + Math.random() * 3
    }
    return { positions, seeds }
  }, [])

  useFrame(() => {
    const geom = lineRef.current?.geometry
    if (!geom) return

    const p =
      phase === 'warp'
        ? Math.min(1, (performance.now() - (phaseStartRef?.current ?? performance.now())) / PHASE_DURATIONS.warp)
        : (launchProgress?.current ?? 0)
    if (p <= 0) return

    const posAttr = geom.attributes.position
    const eased = p * p
    for (let i = 0; i < STREAK_COUNT; i++) {
      const angle = seeds[i * 2]
      const baseDist = seeds[i * 2 + 1]
      const innerR = baseDist * (0.2 + eased * 2)
      const outerR = innerR + eased * 14 + 0.05

      const ix = Math.cos(angle) * innerR
      const iy = Math.sin(angle) * innerR
      const ox = Math.cos(angle) * outerR
      const oy = Math.sin(angle) * outerR

      posAttr.array[i * 6] = ix
      posAttr.array[i * 6 + 1] = iy
      posAttr.array[i * 6 + 2] = -2
      posAttr.array[i * 6 + 3] = ox
      posAttr.array[i * 6 + 4] = oy
      posAttr.array[i * 6 + 5] = -2
    }
    posAttr.needsUpdate = true
    if (lineRef.current.material) {
      lineRef.current.material.opacity = Math.min(1, p * 2)
    }
  })

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color="#eef2fb"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  )
}
