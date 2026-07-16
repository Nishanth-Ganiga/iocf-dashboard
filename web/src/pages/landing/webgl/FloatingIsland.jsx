import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import IslandMascot from './IslandMascot'

// A single floating island: a chunk of terrain (shape varies by
// `terrain`), a small glowing "mini-stadium" ring, a mascot standing on
// it, and a soft fog/atmosphere tint matching the board's palette. Orbits
// slowly around the Earth at its own radius/speed/inclination and spins
// independently, per the brief ("every island rotates independently").
//
// This is a template, not 14 bespoke dioramas - terrain SHAPE varies by a
// small set of archetypes (castle/festival/outback/valley/delta/hills/
// windmill/dunes/savanna/jungle/beach/fjord), and palette/mascot/fog vary
// per board on top of that, so every island still reads as visually
// distinct despite sharing a construction method.
const TERRAIN_GEOMETRY = {
  castle: { base: 'cone', args: [0.9, 0.7, 5] },
  festival: { base: 'cylinder', args: [0.9, 1.0, 0.5, 8] },
  outback: { base: 'cone', args: [1.0, 0.35, 6] },
  valley: { base: 'cone', args: [0.85, 0.9, 5] },
  delta: { base: 'cylinder', args: [1.1, 1.0, 0.3, 10] },
  hills: { base: 'sphere', args: [0.85, 8, 6] },
  windmill: { base: 'cylinder', args: [0.9, 0.95, 0.4, 8] },
  dunes: { base: 'sphere', args: [0.9, 8, 6] },
  savanna: { base: 'cylinder', args: [1.0, 1.0, 0.35, 8] },
  jungle: { base: 'cone', args: [0.9, 0.8, 6] },
  beach: { base: 'cylinder', args: [1.0, 1.05, 0.3, 10] },
  fjord: { base: 'cone', args: [0.8, 1.0, 5] },
}

function TerrainMesh({ terrain, color }) {
  const spec = TERRAIN_GEOMETRY[terrain] ?? TERRAIN_GEOMETRY.hills
  return (
    <mesh rotation={[Math.PI, 0, 0]}>
      {spec.base === 'cone' && <coneGeometry args={spec.args} />}
      {spec.base === 'cylinder' && <cylinderGeometry args={spec.args} />}
      {spec.base === 'sphere' && <sphereGeometry args={spec.args} />}
      {/* meshBasicMaterial (not meshStandardMaterial) so each of the 14
          islands doesn't need its own point light to be visible - with 14
          islands x their own light that's a real GPU cost for something
          bloom/emissive already sells the "glowing" look for. */}
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

export default function FloatingIsland({ theme, orbitRadius, orbitSpeed, orbitOffset, inclination, reveal = 0 }) {
  const groupRef = useRef(null)
  const spinRef = useRef(null)
  const materialRefs = useRef([])
  const current = useRef(0)

  const stadiumRingGeom = useMemo(() => new THREE.RingGeometry(0.35, 0.42, 32), [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    current.current += (reveal - current.current) * Math.min(1, 0.8 * delta)
    const r = current.current

    if (groupRef.current) {
      const angle = orbitOffset + t * orbitSpeed
      const x = Math.cos(angle) * orbitRadius
      const z = Math.sin(angle) * orbitRadius
      const y = Math.sin(angle * 1.3) * inclination
      groupRef.current.position.set(x, y, z)
      groupRef.current.scale.setScalar(r)
    }
    if (spinRef.current) {
      spinRef.current.rotation.y = t * 0.15 + orbitOffset
    }
    materialRefs.current.forEach((mat) => {
      if (mat) mat.opacity = r
    })
  })

  return (
    <group ref={groupRef} position={[orbitRadius, 0, 0]}>
      <group ref={spinRef}>
        <TerrainMesh terrain={theme.terrain} color={theme.palette.ground} />

        {/* Mini glowing stadium ring on top of the terrain */}
        <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={stadiumRingGeom}>
          <meshBasicMaterial
            ref={(el) => (materialRefs.current[0] = el)}
            color={theme.palette.accent}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        {/* Mascot standing on the island */}
        <group position={[0, 0.4, 0]}>
          <IslandMascot species={theme.mascotShape} color={theme.palette.glow} scale={0.6} />
        </group>

        {/* Local atmosphere: a soft tinted fog sphere unique to this
            island's mood, per the brief's "unique... lighting, weather" */}
        <mesh>
          <sphereGeometry args={[1.3, 12, 12]} />
          <meshBasicMaterial
            ref={(el) => (materialRefs.current[1] = el)}
            color={theme.palette.sky}
            transparent
            opacity={0}
            side={THREE.BackSide}
          />
        </mesh>
      </group>
    </group>
  )
}