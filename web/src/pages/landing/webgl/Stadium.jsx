import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// A stylized cricket ground: a mown-grass outfield, a proper 22-yard pitch
// strip with crease markings, a rope-style boundary, and seating tiers
// textured to read as a lit crowd rather than flat translucent rings, plus
// four floodlight towers. Still deliberately stylized rather than
// photoreal (procedural canvas textures only, no external assets/GLTF),
// but grounded enough to actually read as "cricket stadium" rather than
// abstract sci-fi rings.
//
// `reveal` (0-1, from the intro phase) is a *target* the "power on" wipe
// eases toward every frame via a ref (rather than being applied to
// materials directly), so a phase change doesn't visibly snap the rim
// opacity/floodlight intensity - it powers on smoothly over roughly a
// second, matching "lights slowly power on" in the brief.
const TIER_COUNT = 3
const RING_SEGMENTS = 96
const EASE_RATE = 1.4
const OUTFIELD_RADIUS = 8.6
const BOUNDARY_RADIUS = 8.5

// Concentric alternating-shade bands, like the mowing pattern on a real
// cricket oval, plus a soft vignette toward the boundary so the grass
// blends into the stands rather than cutting off sharply.
function useGrassTexture() {
  return useMemo(() => {
    const size = 1024
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const cx = size / 2
    const cy = size / 2
    const maxR = size / 2

    const bandWidth = 46
    for (let r = maxR; r > 0; r -= bandWidth) {
      const bandIndex = Math.floor(r / bandWidth)
      ctx.fillStyle = bandIndex % 2 === 0 ? '#153a1c' : '#1c4823'
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // Fine grain for a less flat, "real turf" look.
    ctx.globalAlpha = 0.05
    for (let i = 0; i < 4000; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.sqrt(Math.random()) * maxR
      ctx.fillStyle = Math.random() > 0.5 ? '#0d2412' : '#2a5a32'
      ctx.fillRect(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 2, 2)
    }
    ctx.globalAlpha = 1

    // Vignette toward the boundary
    const vignette = ctx.createRadialGradient(cx, cy, maxR * 0.6, cx, cy, maxR)
    vignette.addColorStop(0, 'rgba(0,0,0,0)')
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, size, size)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
}

// The 22-yard pitch strip: tan/khaki base, faint vertical mow lines, and
// white crease markings at both ends so it actually reads as a wicket
// rather than a plain rectangle.
function usePitchTexture() {
  return useMemo(() => {
    const width = 256
    const height = 1024
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#a68a5c'
    ctx.fillRect(0, 0, width, height)

    ctx.globalAlpha = 0.08
    for (let x = 8; x < width; x += 14) {
      ctx.strokeStyle = '#7a6440'
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Bowling + popping creases near both ends, plus stump silhouettes.
    const drawEnd = (y, flip) => {
      const creaseY = flip ? y - 26 : y + 26
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(20, y)
      ctx.lineTo(width - 20, y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(30, creaseY)
      ctx.lineTo(width - 30, creaseY)
      ctx.stroke()

      ctx.fillStyle = 'rgba(20,15,10,0.8)'
      const stumpGap = 10
      for (let i = -1; i <= 1; i++) {
        ctx.fillRect(width / 2 + i * stumpGap - 2, y - 4, 4, 8)
      }
    }
    drawEnd(36, false)
    drawEnd(height - 36, true)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
}

// Red/white dashed pattern for the rope-style boundary, tiled around a
// thin torus via repeat wrapping.
function useRopeTexture() {
  return useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#f5f2e9'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#b23a3a'
    ctx.fillRect(0, 0, size / 2, size)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(90, 1)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
}

// A "lit crowd" texture for the seating tiers: rows of small glowing
// specks (gold/white/neon) over a dark base, used as both the base color
// map and the emissive map so brighter specks read as floodlit sections
// of the crowd rather than a flat glowing ring.
function useStandsTexture() {
  return useMemo(() => {
    const width = 1024
    const height = 128
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#0a1128'
    ctx.fillRect(0, 0, width, height)

    const rowCount = 5
    const rowHeight = height / rowCount
    for (let row = 0; row < rowCount; row++) {
      const y = row * rowHeight
      ctx.fillStyle = row % 2 === 0 ? '#0d1633' : '#0a1128'
      ctx.fillRect(0, y, width, rowHeight)

      const speckCount = 140
      for (let i = 0; i < speckCount; i++) {
        const x = (i / speckCount) * width + Math.sin(i * 12.9898 + row) * 6
        const specY = y + rowHeight * (0.25 + 0.5 * Math.abs(Math.sin(i * 7.233 + row * 3)))
        const brightness = Math.abs(Math.sin(i * 3.71 + row * 1.9))
        if (brightness > 0.72) {
          ctx.fillStyle = brightness > 0.9 ? '#f5cf5c' : '#d4af37'
        } else if (brightness > 0.55) {
          ctx.fillStyle = '#34e0ff'
        } else {
          continue
        }
        ctx.fillRect(x, specY, 3, 3)
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
}

export default function Stadium({ reveal = 1 }) {
  const ringGroupRef = useRef(null)
  const floodlightRefs = useRef([])
  const tierMaterialRefs = useRef([])
  const floorMaterialRef = useRef(null)
  const pitchMaterialRef = useRef(null)
  const ropeMaterialRef = useRef(null)
  const accentMaterialRef = useRef(null)
  const lightHeadRefs = useRef([])
  const current = useRef(0)

  const grassTexture = useGrassTexture()
  const pitchTexture = usePitchTexture()
  const ropeTexture = useRopeTexture()
  const standsTexture = useStandsTexture()

  const tiers = useMemo(
    () =>
      Array.from({ length: TIER_COUNT }, (_, i) => ({
        radius: 9 + i * 1.4,
        height: 0.5 + i * 0.35,
        y: -1.6 - i * 0.55,
      })),
    []
  )

  const floodlightPositions = useMemo(() => {
    const count = 4
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.PI / 4
      const radius = 11.5
      return [Math.cos(angle) * radius, 3.2, Math.sin(angle) * radius]
    })
  }, [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    current.current += (reveal - current.current) * Math.min(1, EASE_RATE * delta)
    const r = current.current

    if (ringGroupRef.current) {
      // Barely-there ambient rotation - the "alive" digital-stadium feel
      // the brief asks for, without ever reading as spinning.
      ringGroupRef.current.rotation.y = t * 0.006
    }

    tierMaterialRefs.current.forEach((mat) => {
      if (!mat) return
      mat.emissiveIntensity = 0.9 * r
      mat.opacity = 0.85 * r
    })
    if (floorMaterialRef.current) floorMaterialRef.current.emissiveIntensity = 0.15 * r
    if (pitchMaterialRef.current) pitchMaterialRef.current.emissiveIntensity = 0.2 * r
    if (ropeMaterialRef.current) ropeMaterialRef.current.opacity = r
    if (accentMaterialRef.current) accentMaterialRef.current.opacity = 0.3 * r

    floodlightRefs.current.forEach((light, i) => {
      if (!light) return
      const flicker = 0.9 + Math.sin(t * 1.3 + i * 1.7) * 0.08
      // Point lights use physically-correct inverse-square falloff, and
      // these sit ~12-18 units from the pitch/stands, so the intensity
      // needs to be much higher than it looks like it "should" be for the
      // pitch to actually read as floodlit rather than staying dark.
      light.intensity = r * 220 * flicker
    })
    lightHeadRefs.current.forEach((mat) => {
      if (!mat) return
      mat.emissiveIntensity = r * 2.2
    })
  })

  return (
    <group>
      <group ref={ringGroupRef}>
        {tiers.map((tier, i) => (
          <mesh key={i} position={[0, tier.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[tier.radius, tier.radius + 1.1, RING_SEGMENTS]} />
            <meshStandardMaterial
              ref={(el) => (tierMaterialRefs.current[i] = el)}
              map={standsTexture}
              emissiveMap={standsTexture}
              color="#0f1a3d"
              emissive="#d4af37"
              emissiveIntensity={0}
              transparent
              opacity={0}
              side={THREE.DoubleSide}
              roughness={0.8}
              metalness={0.1}
            />
          </mesh>
        ))}

        {/* Mown-grass outfield */}
        <mesh position={[0, -1.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[OUTFIELD_RADIUS, RING_SEGMENTS]} />
          <meshStandardMaterial
            ref={floorMaterialRef}
            map={grassTexture}
            emissive="#1c4823"
            emissiveIntensity={0}
            roughness={0.95}
          />
        </mesh>

        {/* 22-yard pitch strip, sitting just above the outfield */}
        <mesh position={[0, -1.615, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.5, 6.4]} />
          <meshStandardMaterial
            ref={pitchMaterialRef}
            map={pitchTexture}
            emissive="#a68a5c"
            emissiveIntensity={0}
            roughness={0.9}
          />
        </mesh>

        {/* Rope-style boundary */}
        <mesh position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[BOUNDARY_RADIUS, 0.055, 8, 128]} />
          <meshStandardMaterial
            ref={ropeMaterialRef}
            map={ropeTexture}
            transparent
            opacity={0}
            roughness={0.6}
          />
        </mesh>

        {/* Faint outer glow ring - the "digital stadium" accent layered
            just outside the physical rope boundary. */}
        <mesh position={[0, -1.59, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[BOUNDARY_RADIUS + 0.22, BOUNDARY_RADIUS + 0.3, RING_SEGMENTS]} />
          <meshBasicMaterial
            ref={accentMaterialRef}
            color="#d4af37"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {floodlightPositions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Tower mast */}
          <mesh position={[0, -2.4, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 5.6, 8]} />
            <meshStandardMaterial color="#16234f" roughness={0.6} metalness={0.5} />
          </mesh>
          {/* Light head */}
          <mesh>
            <boxGeometry args={[0.9, 0.5, 0.15]} />
            <meshStandardMaterial
              ref={(el) => (lightHeadRefs.current[i] = el)}
              color="#eef2fb"
              emissive="#eef2fb"
              emissiveIntensity={0}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            ref={(el) => (floodlightRefs.current[i] = el)}
            color="#f5cf5c"
            intensity={0}
            distance={22}
            decay={2}
          />
        </group>
      ))}
    </group>
  )
}
