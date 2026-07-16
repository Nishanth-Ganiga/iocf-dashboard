import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bloom, ChromaticAberration, DepthOfField, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

import VoidParticles from './VoidParticles'
import SpaceScene from './SpaceScene'
import Portal from './Portal'
import PortalDebris from './PortalDebris'
import WarpStreaks from './WarpStreaks'
import Earth from './Earth'
import NationNetwork from './NationNetwork'
import FloatingIslands from './FloatingIslands'
import LionArrival from './LionArrival'
import CameraRig from './CameraRig'
import { QUALITY_SETTINGS } from './detectQualityTier'

// Composes the entire cinematic journey: void particles, space dressing,
// the portal + its debris, warp streaks, and (once through) the
// holographic Earth/nations/islands/lion universe - each layer reading
// the same `phase` from useIntroSequence so nothing pops in out of sync
// with anything else. `qualityTier` scales particle counts and switches
// off the heaviest postprocessing passes (DepthOfField in particular) on
// lower-end hardware while every other layer stays present, per the
// brief's "preserving the overall visual experience" rather than a blunt
// quality slider.
const VOID_REVEAL = { void: 0.4, space: 1, portal: 1, warp: 1, universe: 1, ready: 1, launching: 1, done: 1 }
const SPACE_REVEAL = { void: 0, space: 1, portal: 1, warp: 1, universe: 1, ready: 1, launching: 1, done: 1 }
const PORTAL_REVEAL = { void: 0, space: 0, portal: 1, warp: 1, universe: 0, ready: 0, launching: 0, done: 0 }
const UNIVERSE_REVEAL = { void: 0, space: 0, portal: 0, warp: 0, universe: 1, ready: 1, launching: 0.3, done: 0 }
const LION_REVEAL = { void: 0, space: 0, portal: 0, warp: 0, universe: 0, ready: 1, launching: 1, done: 1 }

export default function HeroCanvas({ phase, pointer, pointerWorld, launchProgress, phaseStartRef, qualityTier = 'high' }) {
  const settings = QUALITY_SETTINGS[qualityTier] ?? QUALITY_SETTINGS.high
  const pp = settings.postProcessing

  const voidReveal = VOID_REVEAL[phase] ?? 1
  const spaceReveal = SPACE_REVEAL[phase] ?? 1
  const portalReveal = PORTAL_REVEAL[phase] ?? 0
  const universeReveal = UNIVERSE_REVEAL[phase] ?? 0
  const lionReveal = LION_REVEAL[phase] ?? 0
  const showWarpStreaks = phase === 'warp' || phase === 'launching' || phase === 'done'

  const dpr = useMemo(() => settings.dpr, [settings.dpr])

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 4], fov: 50, near: 0.1, far: 80 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={['#020208']} />
      <fog attach="fog" args={['#020208', 14, 40]} />

      <ambientLight intensity={0.25} />
      <hemisphereLight args={['#1c8fa8', '#020208', 0.3]} />

      <Suspense fallback={null}>
        <VoidParticles reveal={voidReveal} pointerWorld={pointerWorld} count={settings.voidParticleCount} />
        <SpaceScene reveal={spaceReveal} starCount={settings.starCount} />

        <Portal reveal={portalReveal} position={[0, 0, -3]} />
        <PortalDebris reveal={portalReveal} position={[0, 0, -3]} />
        {showWarpStreaks && (
          <WarpStreaks phase={phase} phaseStartRef={phaseStartRef} launchProgress={launchProgress} />
        )}

        <Earth reveal={universeReveal} position={[0, 0, -6]} />
        <NationNetwork reveal={universeReveal} earthPosition={[0, 0, -6]} />
        <FloatingIslands reveal={universeReveal} earthPosition={[0, 0, -6]} />
        <LionArrival reveal={lionReveal} position={[2.6, -1.1, -1.5]} />
      </Suspense>

      <CameraRig pointer={pointer} phase={phase} launchProgress={launchProgress} phaseStartRef={phaseStartRef} />

      <EffectComposer multisampling={0}>
        {pp.bloom && <Bloom intensity={0.65} luminanceThreshold={0.2} luminanceSmoothing={0.35} mipmapBlur />}
        {pp.chromaticAberration && (
          <ChromaticAberration
            offset={new THREE.Vector2(0.0006, 0.0006)}
            radialModulation={false}
            modulationOffset={0}
          />
        )}
        {pp.depthOfField && <DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={2.5} />}
        {pp.noise && <Noise opacity={0.025} blendFunction={BlendFunction.OVERLAY} />}
        {pp.vignette && <Vignette eskil={false} offset={0.25} darkness={0.75} />}
      </EffectComposer>
    </Canvas>
  )
}
