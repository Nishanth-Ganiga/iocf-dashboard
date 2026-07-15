// Cheap synchronous check for "can this browser reasonably run a WebGL2
// scene" - used to route between the immersive R3F hero and the CSS
// fallback before ever mounting <Canvas>, so a locked-down browser/old
// GPU never eats the cost of trying and failing.
export default function canUseWebGL() {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    return Boolean(gl)
  } catch {
    return false
  }
}
