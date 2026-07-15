import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

// A sparse holographic "network" of glowing nodes (standing in for
// countries/boards) joined by faint connection lines - a lightweight,
// abstract way to represent "IOCF connecting the cricket world" without
// needing real geo data or labels that would compete with the hero text.
//
// Nodes sit on a loose sphere shell around the stadium; each connects to
// its two nearest neighbors so the result reads as a constellation/network
// rather than a random scatter. Everything pulses gently and drifts at a
// near-imperceptible rate.
const NODE_COUNT = 14

function useNetworkData() {
  return useMemo(() => {
    const nodes = Array.from({ length: NODE_COUNT }, (_, i) => {
      // Fibonacci sphere distribution for even, non-random-looking spread
      const y = 1 - (i / (NODE_COUNT - 1)) * 2
      const radiusAtY = Math.sqrt(1 - y * y)
      const goldenAngle = Math.PI * (3 - Math.sqrt(5))
      const theta = goldenAngle * i
      const shellRadius = 7.5
      return new THREE.Vector3(
        Math.cos(theta) * radiusAtY * shellRadius,
        y * 3.5,
        Math.sin(theta) * radiusAtY * shellRadius
      )
    })

    const edges = []
    nodes.forEach((node, i) => {
      const distances = nodes
        .map((other, j) => ({ j, d: i === j ? Infinity : node.distanceTo(other) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 2)
      distances.forEach(({ j }) => {
        const key = [Math.min(i, j), Math.max(i, j)].join('-')
        if (!edges.some((e) => e.key === key)) {
          edges.push({ key, a: node, b: nodes[j] })
        }
      })
    })

    return { nodes, edges }
  }, [])
}

export default function HoloNetwork({ reveal = 1 }) {
  const { nodes, edges } = useNetworkData()
  const groupRef = useRef(null)
  const nodeRefs = useRef([])
  const lineRefs = useRef([])
  const current = useRef(0)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    current.current += (reveal - current.current) * Math.min(1, 1.4 * delta)
    const r = current.current

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.015
    }
    nodeRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      const pulse = 0.7 + Math.sin(t * 1.4 + i * 0.9) * 0.3
      mesh.scale.setScalar(pulse)
      if (mesh.material) mesh.material.opacity = 0.8 * r
    })
    lineRefs.current.forEach((line) => {
      if (line?.material) line.material.opacity = 0.18 * r
    })
  })

  return (
    <group ref={groupRef}>
      {edges.map(({ key, a, b }, i) => (
        <Line
          key={key}
          ref={(el) => (lineRefs.current[i] = el)}
          points={[a, b]}
          color="#34e0ff"
          transparent
          opacity={0}
          lineWidth={1}
        />
      ))}
      {nodes.map((pos, i) => (
        <mesh key={i} position={pos} ref={(el) => (nodeRefs.current[i] = el)}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color="#f5cf5c" transparent opacity={0} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}
