import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Drone-style camera: a slow idle figure-eight drift plus a gentle
// parallax offset toward the pointer, both damped so nothing ever snaps.
// On launch, the same ref-driven approach lets us tween straight through
// to a "flying into the stadium" position without fighting React state.
//
// pointer is a ref (not React state) holding normalized [-1, 1] coords,
// updated by the parent on pointermove - keeps this frame-rate-bound
// logic outside React's render cycle entirely.
const IDLE_DRIFT_RADIUS = 0.35
const IDLE_DRIFT_SPEED = 0.055
const POINTER_INFLUENCE = 0.9
const DAMPING = 3.2

export default function CameraRig({ pointer, phase, launchProgress }) {
  const { camera } = useThree()
  const target = useRef(new THREE.Vector3(0, 0.2, 0))
  const basePos = useRef(new THREE.Vector3(0, 0.6, 6.5))

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime

    if (phase === 'launching' || phase === 'done') {
      // Fly forward into the stadium: progress 0 -> 1 drives both the
      // dolly-in and a slight upward tilt, giving the "entering the
      // stadium" sensation the brief calls for.
      const p = launchProgress?.current ?? 0
      const eased = 1 - Math.pow(1 - p, 3)
      camera.position.set(0, 0.6 + eased * 1.4, 6.5 - eased * 6.2)
      camera.lookAt(0, 0.4 + eased * 0.6, -4)
      return
    }

    // Idle drone hover: small figure-eight, independent of pointer.
    const driftX = Math.sin(t * IDLE_DRIFT_SPEED) * IDLE_DRIFT_RADIUS
    const driftY = Math.sin(t * IDLE_DRIFT_SPEED * 2) * IDLE_DRIFT_RADIUS * 0.35

    const px = pointer?.current?.x ?? 0
    const py = pointer?.current?.y ?? 0

    const desired = basePos.current
      .clone()
      .add(new THREE.Vector3(driftX + px * POINTER_INFLUENCE, driftY + py * POINTER_INFLUENCE * 0.5, 0))

    camera.position.lerp(desired, 1 - Math.exp(-DAMPING * delta))

    target.current.lerp(
      new THREE.Vector3(px * 0.6, 0.2 - py * 0.3, 0),
      1 - Math.exp(-DAMPING * delta)
    )
    camera.lookAt(target.current)
  })

  return null
}
