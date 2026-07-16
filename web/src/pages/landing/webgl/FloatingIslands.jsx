import { ISLAND_THEMES } from './islandThemes'
import { IOCF_NATIONS } from './nations'
import FloatingIsland from './FloatingIsland'

// Renders one FloatingIsland per IOCF board, distributed around the Earth
// at varied orbit radii/speeds/inclinations so they don't read as a flat
// ring of identical objects circling in lockstep.
const ORBIT_BASE_RADIUS = 5.5

export default function FloatingIslands({ reveal = 0, earthPosition = [0, 0, -6] }) {
  return (
    <group position={earthPosition}>
      {IOCF_NATIONS.map((nation, i) => {
        const theme = ISLAND_THEMES[nation.id]
        if (!theme) return null
        const orbitRadius = ORBIT_BASE_RADIUS + (i % 3) * 0.9
        const orbitSpeed = 0.035 + (i % 5) * 0.006
        const orbitOffset = (i / IOCF_NATIONS.length) * Math.PI * 2
        const inclination = 0.6 + (i % 4) * 0.3

        return (
          <FloatingIsland
            key={nation.id}
            theme={theme}
            orbitRadius={orbitRadius}
            orbitSpeed={orbitSpeed}
            orbitOffset={orbitOffset}
            inclination={inclination}
            reveal={reveal}
          />
        )
      })}
    </group>
  )
}
