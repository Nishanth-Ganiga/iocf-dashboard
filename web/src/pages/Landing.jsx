import { lazy, Suspense, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import './Landing.css'

import canUseWebGL from './landing/canUseWebGL'
import HeroWebGLBoundary from './landing/HeroWebGLBoundary'
import HeroFallback from './landing/HeroFallback'

// The WebGL hero (React Three Fiber + three.js + postprocessing) is by far
// the heaviest part of this app - lazy-loaded so that weight only ever
// downloads for visitors who both land on `/` *and* pass the capability
// check below. Every other route (including /dashboard, which most
// visitors reach a few seconds later) never pays for it.
const HeroExperience = lazy(() => import('./landing/HeroExperience'))

// Landing page: the site's front door. This just decides which hero to
// render - the immersive React Three Fiber experience (HeroExperience) or
// the CSS-only fallback (HeroFallback) - then gets out of the way.
//
// The WebGL hero is skipped entirely (not mounted-then-hidden) for:
//   - browsers/GPUs that fail the WebGL capability check
//   - prefers-reduced-motion (a scroll-locked camera-fly-through is itself
//     a motion effect no reduced-motion setting should force on someone)
//   - coarse-pointer/small-viewport devices (phones/tablets) - a 3D scene
//     built for mouse parallax and a scroll-jack doesn't translate well
//     to touch, and the extra GPU load isn't worth it on mobile chipsets
// This is a plain client-side SPA (no SSR), so the check runs synchronously
// via a lazy useState initializer rather than an effect - no boot flash.
// HeroExperience is additionally wrapped in an error boundary so a runtime
// WebGL failure (driver quirk, context loss) falls back cleanly instead of
// taking down the page.
function checkShouldUseWebGL() {
  if (typeof window === 'undefined') return false
  const isSmallOrTouch = window.matchMedia('(pointer: coarse), (max-width: 820px)').matches
  return !isSmallOrTouch && canUseWebGL()
}

export default function Landing() {
  const prefersReducedMotion = useReducedMotion()
  const [envSupportsWebGL] = useState(checkShouldUseWebGL)
  const shouldUse = envSupportsWebGL && !prefersReducedMotion

  if (!shouldUse) return <HeroFallback />

  return (
    <HeroWebGLBoundary fallback={<HeroFallback />}>
      {/* While the WebGL chunk downloads, hold on a plain black screen
          (matches the hero's own "start with darkness" opening beat)
          rather than the fallback - swapping to the fallback and then
          instantly to the WebGL hero a few hundred ms later would flash. */}
      <Suspense fallback={<div className="landing landing--boot" />}>
        <HeroExperience />
      </Suspense>
    </HeroWebGLBoundary>
  )
}
