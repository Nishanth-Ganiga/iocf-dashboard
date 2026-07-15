import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import Stadium from './Stadium'
import CricketBallMesh from './CricketBallMesh'
import EnergyParticles from './EnergyParticles'
import HoloNetwork from './HoloNetwork'
import CameraRig from './CameraRig'

// Composes the whole WebGL scene: fog + volumetric-feeling lighting,
// stadium, glass cricket ball, energy particles, holographic network, and
// the drone camera rig - then a light bloom/vignette pass on top so the
// floodlights and gold/blue emissives actually read as "glowing" rather
// than flat-shaded.
//
// `phase` (from useIntroSequence) drives per-layer reveal amounts so nothing
// pops in - stadium/particles/network all ease their own opacity/intensity
// based on how far the intro has progressed. `pointer` and `launchProgress`
// are refs (not state) so mouse movement and the launch tween never trigger
// a React re-render of the overlay - only the R3F frame loop reads them.
const PHASE_REVEAL = {
  dark: 0,
  particles: 0,
  stadium: 0,
  logo: 1,
  ready: 1,
  launching: 1,
  done: 1,
}
const PARTICLE_REVEAL = {
  dark: 0,
  particles: 1,
  stadium: 1,
  logo: 1,
  ready: 1,
  launching: 1,
  done: 1,
}

export default function HeroCanvas({ phase, pointer, launchProgress, dpr }) {
  const stadiumReveal = PHASE_REVEAL[phase] ?? 1
  const particleReveal = PARTICLE_REVEAL[phase] ?? 1

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.6, 6.5], fov: 50, near: 0.1, far: 60 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={['#05070d']} />
      <fog attach="fog" args={['#05070d', 8, 26]} />

      <ambientLight intensity={0.15} />
      <hemisphereLight args={['#1c8fa8', '#05070d', 0.25]} />
      <directionalLight position={[6, 8, 4]} intensity={0.3} color="#f5cf5c" />

      <Suspense fallback={null}>
        <Stadium reveal={stadiumReveal} />
        <CricketBallMesh pointer={pointer} opacity={0.15} />
        <EnergyParticles reveal={particleReveal} launchProgress={launchProgress} />
        <HoloNetwork reveal={stadiumReveal} />
      </Suspense>

      <CameraRig pointer={pointer} phase={phase} launchProgress={launchProgress} />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.55}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.35}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.25} darkness={0.65} />
      </EffectComposer>
    </Canvas>
  )
}
