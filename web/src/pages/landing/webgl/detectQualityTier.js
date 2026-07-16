// Coarse GPU/perf tier detection used to scale particle counts and
// postprocessing complexity - the brief asks for the scene to "adapt to
// lower-end GPUs by reducing particle counts and shader complexity while
// preserving the overall visual experience" rather than just cutting
// quality uniformly for everyone.
//
// This is a heuristic, not a benchmark: WebGL renderer string sniffing is
// unreliable across browsers/drivers, so this leans on cheaper signals
// (logical CPU count, device memory when available, DPR) that correlate
// reasonably well with "is this a lower-end machine" without requiring an
// actual timed render pass before the scene even starts.
export default function detectQualityTier() {
  if (typeof navigator === 'undefined') return 'high'

  const cores = navigator.hardwareConcurrency ?? 4
  const memory = navigator.deviceMemory ?? 8 // Chrome-only; undefined elsewhere
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  if (cores <= 4 || memory <= 4) return 'low'
  if (cores <= 6 || dpr > 2) return 'medium'
  return 'high'
}

export const QUALITY_SETTINGS = {
  low: {
    dpr: [1, 1],
    voidParticleCount: 160,
    energyParticleCount: 100,
    starCount: 900,
    postProcessing: { bloom: true, depthOfField: false, chromaticAberration: false, noise: false, vignette: true },
  },
  medium: {
    dpr: [1, 1.5],
    voidParticleCount: 300,
    energyParticleCount: 180,
    starCount: 1800,
    postProcessing: { bloom: true, depthOfField: false, chromaticAberration: true, noise: false, vignette: true },
  },
  high: {
    dpr: [1, 2],
    voidParticleCount: 420,
    energyParticleCount: 260,
    starCount: 2500,
    postProcessing: { bloom: true, depthOfField: true, chromaticAberration: true, noise: true, vignette: true },
  },
}
