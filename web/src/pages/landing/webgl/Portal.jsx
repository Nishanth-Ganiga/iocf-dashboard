import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

// The portal: a custom-shaded disc simulating rotating energy rings,
// swirling plasma, and a bright event-horizon core, plus a set of thin
// torus "rings" layered in front of it for actual geometric depth (the
// shader alone reads as flat from an angle; the rings sell the 3D form).
// Electric arcs are drawn as animated noise streaks within the same
// fragment shader rather than as separate geometry.
//
// All noise is a compact inline simplex/value-noise (no external glsl-noise
// dependency) so this has zero extra install weight.
const PortalMaterial = shaderMaterial(
  { uTime: 0, uReveal: 0, uColor1: new THREE.Color('#34e0ff'), uColor2: new THREE.Color('#d4af37') },
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform float uReveal;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    varying vec2 vUv;

    // Cheap hash-based value noise - good enough for plasma/arc texture,
    // far lighter than a full simplex implementation.
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    float fbm(vec2 p) {
      float v = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 4; i++) {
        v += amp * noise(p);
        p *= 2.0;
        amp *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 centered = vUv - 0.5;
      float dist = length(centered) * 2.0;
      float angle = atan(centered.y, centered.x);

      // Swirling plasma: sample fbm in polar-ish coordinates that rotate
      // over time, so the pattern churns rather than just scrolling.
      vec2 swirl = vec2(cos(angle - uTime * 0.6), sin(angle - uTime * 0.6)) * dist * 3.0;
      float plasma = fbm(swirl + uTime * 0.15);

      // Electric arcs: thin bright noise streaks near the mid-radius.
      float arcBand = smoothstep(0.35, 0.55, dist) * smoothstep(0.75, 0.55, dist);
      float arcNoise = pow(fbm(vec2(angle * 4.0 + uTime * 2.0, dist * 6.0)), 4.0);
      float arcs = arcBand * arcNoise * 2.5;

      // Bright event-horizon core.
      float core = smoothstep(0.3, 0.0, dist);

      // Overall radial falloff so the disc fades at its edge instead of
      // ending in a hard circle.
      float edgeFade = smoothstep(1.0, 0.75, dist);

      float intensity = (plasma * 0.6 + arcs + core * 1.4) * edgeFade;
      vec3 color = mix(uColor1, uColor2, plasma * 0.5 + 0.5 * dist);
      color += vec3(1.0) * core * 0.6;

      float alpha = clamp(intensity, 0.0, 1.0) * uReveal;
      gl_FragColor = vec4(color * intensity, alpha);
    }
  `
)
extend({ PortalMaterial })

export default function Portal({ reveal = 0, scale = 1, position = [0, 0, 0] }) {
  const materialRef = useRef(null)
  const ringGroupRef = useRef(null)
  const current = useRef(0)

  const rings = useMemo(
    () => [
      { radius: 1.05, thickness: 0.02, speed: 0.4, color: '#34e0ff' },
      { radius: 1.18, thickness: 0.012, speed: -0.25, color: '#d4af37' },
      { radius: 1.32, thickness: 0.008, speed: 0.15, color: '#f5cf5c' },
    ],
    []
  )

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    current.current += (reveal - current.current) * Math.min(1, 1.5 * delta)
    const r = current.current

    if (materialRef.current) {
      materialRef.current.uTime = t
      materialRef.current.uReveal = r
    }
    if (ringGroupRef.current) {
      ringGroupRef.current.children.forEach((ring, i) => {
        ring.rotation.z = t * rings[i].speed
        ring.material.opacity = r
        const pulse = 1 + Math.sin(t * 1.5 + i) * 0.02
        ring.scale.setScalar(pulse)
      })
    }
  })

  return (
    <group position={position} scale={scale}>
      <mesh>
        <circleGeometry args={[1.4, 64]} />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <portalMaterial
          ref={materialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      <group ref={ringGroupRef}>
        {rings.map((ring, i) => (
          <mesh key={i}>
            <torusGeometry args={[ring.radius, ring.thickness, 8, 96]} />
            <meshBasicMaterial color={ring.color} transparent opacity={0} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
