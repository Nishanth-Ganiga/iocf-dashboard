import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PHASE_DURATIONS } from '../useIntroSequence'

// Drives the camera through the entire journey. Never fully stops - even
// the "settled" idle states layer in a slow breathing drift, per the
// brief's "the camera should never stop, never".
//
// Per-phase behavior:
//   void/space   - camera sits still-ish, gentle breathing float, ahead of
//                  where the portal will appear
//   portal       - camera slowly approaches the portal as it grows
//   warp         - camera accelerates forward through the portal
//   universe     - camera settles into the "looking at Earth" resting shot
//   ready        - idle drone drift + pointer parallax around that resting
//                  shot (reusing the same feel as the previous build)
//   launching    - a second, faster forward fly-through toward the new
//                  portal the launch sequence opens
//
// `pointer` and `launchProgress` are refs (not state) so mouse movement
// and the launch tween never trigger a React re-render. The 'warp' phase
// needs its own progress signal distinct from `launchProgress`: it plays
// automatically for a passive viewer who never clicks Get Started, but
// `launchProgress` is only ever written by HeroExperience's click-triggered
// launch() - so during a passive 'warp', `warpProgress` (derived from
// `phaseStartRef` + the phase's known duration) drives the fly-through
// instead.
const DAMPING = 2.6

export default function CameraRig({ pointer, phase, launchProgress, phaseStartRef }) {
  const { camera } = useThree()
  const target = useRef(new THREE.Vector3(0, 0, -6))

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const breathe = Math.sin(t * 0.15) * 0.06
    const breatheY = Math.sin(t * 0.11) * 0.04

    if (phase === 'launching' || phase === 'done') {
      const p = launchProgress?.current ?? 0
      const eased = p * p * (3 - 2 * p)
      camera.position.set(breathe * 0.3, breatheY * 0.3, 2 - eased * 10)
      camera.fov = THREE.MathUtils.lerp(50, 78, eased)
      camera.updateProjectionMatrix()
      camera.lookAt(0, 0, -10)
      return
    }

    if (phase === 'void' || phase === 'space') {
      camera.position.lerp(new THREE.Vector3(breathe, breatheY, 4), 1 - Math.exp(-DAMPING * delta))
      camera.lookAt(0, 0, -3)
      return
    }

    if (phase === 'portal') {
      // Slowly approach the portal as it grows - most of the actual
      // "growth" is the portal's own scale animation (see HeroExperience),
      // this just closes distance a little so it feels like motion toward
      // it rather than it inflating in place.
      camera.position.lerp(new THREE.Vector3(breathe * 0.5, breatheY * 0.5, 1.5), 1 - Math.exp(-1.2 * delta))
      camera.lookAt(0, 0, -4)
      return
    }

    if (phase === 'warp') {
      const elapsed = performance.now() - (phaseStartRef?.current ?? performance.now())
      const p = Math.min(1, elapsed / PHASE_DURATIONS.warp)
      const eased = p * p
      camera.position.set(breathe * 0.2, breatheY * 0.2, 1.5 - eased * 6)
      camera.fov = THREE.MathUtils.lerp(50, 95, eased)
      camera.updateProjectionMatrix()
      camera.lookAt(0, 0, -8)
      return
    }

    // 'universe' and 'ready': settled resting shot with idle drift +
    // pointer parallax.
    if (camera.fov !== 50) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, 50, Math.min(1, 2 * delta))
      camera.updateProjectionMatrix()
    }

    const px = pointer?.current?.x ?? 0
    const py = pointer?.current?.y ?? 0
    const desired = new THREE.Vector3(breathe + px * 0.6, breatheY + py * 0.3, 5.5)
    camera.position.lerp(desired, 1 - Math.exp(-DAMPING * delta))

    target.current.lerp(new THREE.Vector3(px * 0.8, py * 0.4 - 0.2, -6), 1 - Math.exp(-DAMPING * delta))
    camera.lookAt(target.current)
  })

  return null
}
