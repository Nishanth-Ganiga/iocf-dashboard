import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MeshTransmissionMaterial } from '@react-three/drei'

// A translucent, glass-like cricket ball floating behind the hero text.
// Uses drei's MeshTransmissionMaterial for the glass/refraction look
// (transmission + roughness + ior) rather than a flat-shaded sphere, plus
// a procedural canvas texture for the seam so there's no external asset
// to load. Slow constant spin + a subtle pointer-driven tilt; opacity is
// intentionally low (~15%) so it never competes with the heading.
function useSeamTexture() {
  return useMemo(() => {
    const size = 1024
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    // Base leather tone
    ctx.fillStyle = '#d4af37'
    ctx.fillRect(0, 0, size, size)

    // Two seam bands running pole-to-pole (equirect projection: seams sit
    // at roughly 1/4 and 3/4 of the texture width).
    ctx.strokeStyle = '#eef2fb'
    ctx.lineWidth = 6
    ;[size * 0.28, size * 0.72].forEach((x) => {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, size)
      ctx.stroke()

      // stitch ticks
      for (let y = 10; y < size; y += 22) {
        ctx.beginPath()
        ctx.moveTo(x - 14, y)
        ctx.lineTo(x + 14, y)
        ctx.lineWidth = 2.5
        ctx.stroke()
      }
      ctx.lineWidth = 6
    })

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
}

export default function CricketBallMesh({ pointer, opacity = 0.15 }) {
  const groupRef = useRef(null)
  const seamTexture = useSeamTexture()

  useFrame((state, delta) => {
    if (!groupRef.current) return
    // Constant slow spin
    groupRef.current.rotation.y += delta * 0.08

    // Gentle tilt toward the pointer, damped
    const px = pointer?.current?.x ?? 0
    const py = pointer?.current?.y ?? 0
    const targetTiltX = py * 0.25
    const targetTiltZ = -px * 0.25
    groupRef.current.rotation.x += (targetTiltX - groupRef.current.rotation.x) * Math.min(1, delta * 3)
    groupRef.current.rotation.z += (targetTiltZ - groupRef.current.rotation.z) * Math.min(1, delta * 3)
  })

  return (
    <group ref={groupRef} position={[0, 0.3, -1.5]}>
      <mesh>
        <sphereGeometry args={[2.4, 64, 64]} />
        <MeshTransmissionMaterial
          transmission={0.92}
          roughness={0.15}
          thickness={1.2}
          ior={1.3}
          chromaticAberration={0.02}
          color="#f5cf5c"
          attenuationColor="#d4af37"
          attenuationDistance={2.5}
          map={seamTexture}
          opacity={opacity}
          transparent
        />
      </mesh>
      {/* Soft outer glow shell */}
      <mesh scale={1.06}>
        <sphereGeometry args={[2.4, 32, 32]} />
        <meshBasicMaterial color="#34e0ff" transparent opacity={opacity * 0.25} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}
