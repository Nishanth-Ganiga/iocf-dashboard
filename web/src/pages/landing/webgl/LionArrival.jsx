import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import Portal from './Portal'
import PortalDebris from './PortalDebris'
import IslandMascot from './IslandMascot'

// "The Lion" arrival beat: a second, golden portal opens near the camera,
// golden particles burst (reusing PortalDebris - same visual language as
// the main portal), and the lion mascot walks out of it before settling
// into an idle stance and "looking" at the visitor. Runs once `reveal`
// starts climbing (driven by the 'ready' phase, on a short internal
// delay) and then holds in its settled idle state indefinitely - it does
// not repeat the walk-out on every re-render.
export default function LionArrival({ reveal = 0, position = [2.4, -1.2, -2] }) {
  const groupRef = useRef(null)
  const mascotGroupRef = useRef(null)
  const walkProgress = useRef(0)
  const isWalkingRef = useRef(true)
  const current = useRef(0)

  useFrame((state, delta) => {
    current.current += (reveal - current.current) * Math.min(1, 0.8 * delta)
    const r = current.current

    // Walk out over the first ~2.5s of this element's own reveal, then
    // hold at the resting position - reveal itself is already gated by
    // the parent to only start once the universe scene has settled, so
    // this doesn't compete with the portal/Earth reveal for attention.
    walkProgress.current = Math.min(1, walkProgress.current + delta / 2.5)
    isWalkingRef.current = walkProgress.current < 1

    if (mascotGroupRef.current) {
      const eased = 1 - Math.pow(1 - walkProgress.current, 3)
      mascotGroupRef.current.position.z = -0.6 + eased * 0.6
      mascotGroupRef.current.scale.setScalar(r)
    }
    if (groupRef.current) {
      groupRef.current.visible = r > 0.01
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <Portal reveal={reveal} scale={0.9} />
      <PortalDebris reveal={reveal} />
      <group ref={mascotGroupRef} position={[0, -0.5, -0.6]}>
        <IslandMascot species="lion" color="#f5cf5c" scale={1.1} walk={isWalkingRef} />
      </group>
    </group>
  )
}
