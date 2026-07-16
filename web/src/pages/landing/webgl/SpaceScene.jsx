import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

// Scene 2, "Space Awakens": stars, drifting volumetric fog cards, and a
// pair of soft light shafts cutting through the dark - all fading in
// together as `reveal` climbs from 0 to 1 over the 'space' phase.
//
// Fog + light shafts are simple additive-blended shader planes (cheap,
// billboard-style) rather than a real volumetric raymarch - "volumetric
// fog" here means "reads as volumetric", not a physically simulated
// medium, which would be far too expensive for a background layer that
// has to share frame budget with the portal and (eventually) the Earth
// scene.
const LightShaftMaterial = shaderMaterial(
  { uTime: 0, uOpacity: 0, uColor: new THREE.Color('#34e0ff') },
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform float uOpacity;
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      float edge = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
      float vertical = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.4, vUv.y);
      float flicker = 0.85 + 0.15 * sin(uTime * 0.6 + vUv.y * 6.0);
      float alpha = edge * vertical * flicker * uOpacity;
      gl_FragColor = vec4(uColor, alpha * 0.35);
    }
  `
)
extend({ LightShaftMaterial })

function useFogTexture() {
  return useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(180, 200, 230, 0.5)')
    gradient.addColorStop(0.5, 'rgba(150, 180, 220, 0.18)')
    gradient.addColorStop(1, 'rgba(150, 180, 220, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    const texture = new THREE.CanvasTexture(canvas)
    return texture
  }, [])
}

export default function SpaceScene({ reveal = 1, starCount = 2500 }) {
  const fogTexture = useFogTexture()
  const starsRef = useRef(null)
  const fogGroupRef = useRef(null)
  const shaftRefs = useRef([])
  const current = useRef(0)

  const fogCards = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        position: [
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 6 - 1,
          -4 - Math.random() * 10,
        ],
        scale: 5 + Math.random() * 4,
        speed: 0.02 + Math.random() * 0.03,
        phase: i,
      })),
    []
  )

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    current.current += (reveal - current.current) * Math.min(1, 1.1 * delta)
    const r = current.current

    if (starsRef.current?.material) {
      starsRef.current.material.opacity = r
      starsRef.current.material.transparent = true
    }
    if (fogGroupRef.current) {
      fogGroupRef.current.children.forEach((mesh, i) => {
        mesh.material.opacity = r * 0.5
        mesh.position.x += Math.sin(t * fogCards[i].speed + fogCards[i].phase) * 0.001
      })
    }
    shaftRefs.current.forEach((mat) => {
      if (!mat) return
      mat.uTime = t
      mat.uOpacity = r
    })
  })

  return (
    <group>
      <Stars ref={starsRef} radius={60} depth={40} count={starCount} factor={3} fade speed={0.4} />

      <group ref={fogGroupRef}>
        {fogCards.map((card, i) => (
          <sprite key={i} position={card.position} scale={[card.scale, card.scale, 1]}>
            <spriteMaterial map={fogTexture} transparent opacity={0} depthWrite={false} />
          </sprite>
        ))}
      </group>

      <mesh position={[-3, 2, -6]} rotation={[0, 0, 0.15]}>
        <planeGeometry args={[3, 14]} />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <lightShaftMaterial
          ref={(el) => (shaftRefs.current[0] = el)}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uColor={new THREE.Color('#34e0ff')}
        />
      </mesh>
      <mesh position={[4, 1.5, -8]} rotation={[0, 0, -0.1]}>
        <planeGeometry args={[2.5, 12]} />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <lightShaftMaterial
          ref={(el) => (shaftRefs.current[1] = el)}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uColor={new THREE.Color('#d4af37')}
        />
      </mesh>
    </group>
  )
}
