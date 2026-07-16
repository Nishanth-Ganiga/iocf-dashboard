import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'
import { IOCF_NATIONS, BEAM_SEQUENCE, latLngToVector3 } from './nations'

// Glowing markers for each of the 14 IOCF boards, placed on the Earth's
// surface, plus a "data travelling" beam (smooth flowing energy, not a
// lightning bolt) that lights up new nation-to-nation connections one at
// a time following BEAM_SEQUENCE - once every pair has been drawn, all of
// them stay lit simultaneously ("the Earth now looks alive... One
// Federation. One Cricket World").
const EARTH_RADIUS = 2.6
const MARKER_RADIUS = EARTH_RADIUS + 0.03
const SECONDS_PER_BEAM = 1.8
const ARC_SAMPLES = 20

// Spherical linear interpolation between two unit vectors - used to walk
// the great-circle path between two nations one sample point at a time
// (see beamGeometries below).
function slerpOnSphere(a, b, t) {
  const omega = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1))
  if (omega < 1e-5) return a.clone()
  const sinOmega = Math.sin(omega)
  const s0 = Math.sin((1 - t) * omega) / sinOmega
  const s1 = Math.sin(t * omega) / sinOmega
  return a.clone().multiplyScalar(s0).add(b.clone().multiplyScalar(s1))
}

// Flowing-energy beam: a tube whose fragment shader draws a bright pulse
// travelling along its length, rather than a static lit tube or a jagged
// lightning texture.
const BeamMaterial = shaderMaterial(
  { uTime: 0, uProgress: 0, uColor: new THREE.Color('#34e0ff') },
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform float uProgress;
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      // vUv.x runs along the beam's length. uProgress (0-1) reveals the
      // tube up to that point; a bright pulse trails just behind the tip.
      float reveal = step(vUv.x, uProgress);
      float pulse = smoothstep(0.0, 0.08, uProgress - vUv.x) * smoothstep(0.25, 0.08, uProgress - vUv.x);
      float flow = 0.5 + 0.5 * sin(vUv.x * 40.0 - uTime * 4.0);
      float alpha = reveal * (0.25 + flow * 0.25) + pulse * 1.2;
      gl_FragColor = vec4(uColor, alpha);
    }
  `
)
extend({ BeamMaterial })

export default function NationNetwork({ reveal = 0, earthPosition = [0, 0, -6] }) {
  const groupRef = useRef(null)
  const markerRefs = useRef([])
  const beamMaterialRefs = useRef([])
  const current = useRef(0)

  const nationPositions = useMemo(() => {
    const map = {}
    IOCF_NATIONS.forEach((n) => {
      map[n.id] = latLngToVector3(n.lat, n.lng, MARKER_RADIUS)
    })
    return map
  }, [])

  // An arc that always stays above the Earth's surface, built by sampling
  // several points along the great-circle path between the two nations
  // (via spherical slerp) and lifting each one radially outward, with the
  // lift peaking at the midpoint and scaling with angular separation.
  //
  // A single 3-point quadratic bezier (lifting only the midpoint control
  // point) isn't enough here: a bezier curve doesn't pass through its
  // control point, so for widely-separated nations the sampled curve's
  // closest approach to Earth's center can still dip below the surface
  // even with a generously lifted control point. Sampling many points
  // that are *each* individually guaranteed to sit at or above
  // MARKER_RADIUS (before the lift is even added) avoids that entirely,
  // regardless of how far apart the two nations are.
  const beamGeometries = useMemo(() => {
    return BEAM_SEQUENCE.map(([fromId, toId]) => {
      const from = new THREE.Vector3(...nationPositions[fromId])
      const to = new THREE.Vector3(...nationPositions[toId])
      const dirFrom = from.clone().normalize()
      const dirTo = to.clone().normalize()
      const angle = Math.acos(THREE.MathUtils.clamp(dirFrom.dot(dirTo), -1, 1))

      const points = []
      for (let s = 0; s <= ARC_SAMPLES; s++) {
        const t = s / ARC_SAMPLES
        const dir = slerpOnSphere(dirFrom, dirTo, t)
        const lift = Math.sin(t * Math.PI) * (angle * 0.5 + 0.15)
        points.push(dir.multiplyScalar(MARKER_RADIUS + lift))
      }
      const curve = new THREE.CatmullRomCurve3(points)
      return new THREE.TubeGeometry(curve, 48, 0.012, 6, false)
    })
  }, [nationPositions])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    current.current += (reveal - current.current) * Math.min(1, 1 * delta)
    const r = current.current

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.03 // matches Earth's own rotation
    }

    markerRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      const pulse = 0.7 + Math.sin(t * 1.6 + i * 0.7) * 0.3
      mesh.scale.setScalar(pulse * r)
      if (mesh.material) mesh.material.opacity = r
    })

    // Cycle through the beam sequence: each beam gets SECONDS_PER_BEAM to
    // draw itself, then holds fully lit while later beams draw in turn.
    const totalCycle = beamGeometries.length * SECONDS_PER_BEAM
    const cycleTime = t % (totalCycle + 2) // +2s pause once fully connected
    beamMaterialRefs.current.forEach((mat, i) => {
      if (!mat) return
      const beamStart = i * SECONDS_PER_BEAM
      const localT = cycleTime - beamStart
      const progress = THREE.MathUtils.clamp(localT / (SECONDS_PER_BEAM * 0.7), 0, 1)
      mat.uProgress = cycleTime > beamStart ? progress : 0
      mat.uTime = t
    })
  })

  return (
    <group ref={groupRef} position={earthPosition}>
      {IOCF_NATIONS.map((nation, i) => (
        <mesh key={nation.id} position={nationPositions[nation.id]} ref={(el) => (markerRefs.current[i] = el)}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshBasicMaterial color={nation.color} transparent opacity={0} toneMapped={false} />
        </mesh>
      ))}

      {beamGeometries.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <beamMaterial
            ref={(el) => (beamMaterialRefs.current[i] = el)}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uColor={new THREE.Color(i % 2 === 0 ? '#34e0ff' : '#d4af37')}
          />
        </mesh>
      ))}
    </group>
  )
}
