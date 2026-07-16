import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

// A holographic, stylized Earth (dark oceans, glowing atmosphere rim,
// thin lat/long grid, soft cloud shimmer) rather than a photoreal globe -
// built entirely from a custom shader + procedural canvas texture, no
// satellite imagery. Landmasses are a rough hand-authored blob map (not
// geographically accurate) - it only needs to read as "a world", the
// actual IOCF nation markers are what carry meaning.
const EarthMaterial = shaderMaterial(
  { uTime: 0, uReveal: 0, uLandTexture: null },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform float uReveal;
    uniform sampler2D uLandTexture;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vec3 land = texture2D(uLandTexture, vec2(vUv.x + uTime * 0.006, vUv.y)).rgb;

      // Thin lat/long grid lines
      float gridLat = smoothstep(0.0, 0.02, abs(fract(vUv.y * 12.0) - 0.5) - 0.47);
      float gridLng = smoothstep(0.0, 0.02, abs(fract(vUv.x * 24.0) - 0.5) - 0.47);
      float grid = (1.0 - gridLat) * 0.15 + (1.0 - gridLng) * 0.1;

      vec3 ocean = vec3(0.02, 0.05, 0.12);
      vec3 base = mix(ocean, vec3(0.06, 0.14, 0.1), land.r);
      base += grid * vec3(0.2, 0.6, 0.8);

      // Fresnel-style rim glow using the view-space normal's Z component.
      float rim = pow(1.0 - abs(vNormal.z), 2.5);
      vec3 atmosphere = vec3(0.2, 0.85, 1.0) * rim * 1.4;

      vec3 color = base + atmosphere;
      gl_FragColor = vec4(color, uReveal);
    }
  `
)
extend({ EarthMaterial })

function useLandTexture() {
  return useMemo(() => {
    const width = 512
    const height = 256
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#ffffff'

    // Rough, non-geographic continent-like blobs - purely decorative
    // texture for the "holographic globe" look, not a real map.
    const blobs = [
      [0.15, 0.35, 0.14, 0.18],
      [0.22, 0.55, 0.09, 0.22],
      [0.45, 0.28, 0.11, 0.14],
      [0.5, 0.55, 0.08, 0.16],
      [0.62, 0.25, 0.16, 0.12],
      [0.7, 0.6, 0.1, 0.1],
      [0.85, 0.35, 0.09, 0.13],
      [0.88, 0.65, 0.06, 0.08],
    ]
    blobs.forEach(([cx, cy, rx, ry]) => {
      ctx.beginPath()
      ctx.ellipse(cx * width, cy * height, rx * width, ry * height, 0, 0, Math.PI * 2)
      ctx.fill()
    })

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    return texture
  }, [])
}

export default function Earth({ reveal = 0, position = [0, 0, -6] }) {
  const materialRef = useRef(null)
  const atmosphereMaterialRef = useRef(null)
  const groupRef = useRef(null)
  const current = useRef(0)
  const landTexture = useLandTexture()

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    current.current += (reveal - current.current) * Math.min(1, 1 * delta)
    const r = current.current

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.03
    }
    if (materialRef.current) {
      materialRef.current.uTime = t
      materialRef.current.uReveal = r
      materialRef.current.uLandTexture = landTexture
    }
    if (atmosphereMaterialRef.current) {
      atmosphereMaterialRef.current.opacity = 0.08 * r
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <sphereGeometry args={[2.6, 64, 64]} />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <earthMaterial ref={materialRef} transparent depthWrite />
      </mesh>
      {/* Soft outer atmosphere shell */}
      <mesh scale={1.04}>
        <sphereGeometry args={[2.6, 32, 32]} />
        <meshBasicMaterial
          ref={atmosphereMaterialRef}
          color="#34e0ff"
          transparent
          opacity={0}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}
