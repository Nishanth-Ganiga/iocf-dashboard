// Per-board theming for the floating islands (Scene: "Floating Worlds").
// A handful of boards get a bespoke palette/terrain/mascot/atmosphere per
// the brief's worked examples (England, India, Australia, West Indies,
// Scotland, Netherlands); the remaining IOCF boards get a themed but
// templated look generated from the same palette system, so every island
// is visually distinct without requiring 14 fully bespoke 3D dioramas.
//
// `mascotShape` selects which procedural low-poly silhouette IslandMascot
// builds (see IslandMascot.jsx) - not a modeled asset, a small primitive
// composition that reads as the animal in silhouette/glow form.
export const ISLAND_THEMES = {
  england: {
    name: 'England',
    palette: { ground: '#2b3550', accent: '#34e0ff', glow: '#8fd6ff', sky: '#0d1730' },
    terrain: 'castle',
    mascotShape: 'lion',
    fogDensity: 0.55,
  },
  india: {
    name: 'India',
    palette: { ground: '#4a2440', accent: '#f5cf5c', glow: '#ff9a3c', sky: '#2a1030' },
    terrain: 'festival',
    mascotShape: 'elephant',
    fogDensity: 0.2,
  },
  australia: {
    name: 'Australia',
    palette: { ground: '#5a3a1e', accent: '#f5cf5c', glow: '#ff7a3c', sky: '#3a1f10' },
    terrain: 'outback',
    mascotShape: 'kangaroo',
    fogDensity: 0.3,
  },
  pakistan: {
    name: 'Pakistan',
    palette: { ground: '#1f4a3a', accent: '#34e0ff', glow: '#5cffb0', sky: '#0a2418' },
    terrain: 'valley',
    mascotShape: 'markhor',
    fogDensity: 0.4,
  },
  bangladesh: {
    name: 'Bangladesh',
    palette: { ground: '#1f4a2e', accent: '#34e0ff', glow: '#5cff8f', sky: '#0a2416' },
    terrain: 'delta',
    mascotShape: 'tiger',
    fogDensity: 0.5,
  },
  scotland: {
    name: 'Scotland',
    palette: { ground: '#33403a', accent: '#d4af37', glow: '#9fd4c8', sky: '#141c1a' },
    terrain: 'castle',
    mascotShape: 'unicorn',
    fogDensity: 0.65,
  },
  italy: {
    name: 'Italy',
    palette: { ground: '#4a3020', accent: '#34e0ff', glow: '#ffcf8f', sky: '#241408' },
    terrain: 'hills',
    mascotShape: 'wolf',
    fogDensity: 0.25,
  },
  netherlands: {
    name: 'Netherlands',
    palette: { ground: '#264a3a', accent: '#d4af37', glow: '#8fffce', sky: '#0c241a' },
    terrain: 'windmill',
    mascotShape: 'fox',
    fogDensity: 0.35,
  },
  qatar: {
    name: 'Qatar',
    palette: { ground: '#5a4020', accent: '#f5cf5c', glow: '#ffdca0', sky: '#2c1e0c' },
    terrain: 'dunes',
    mascotShape: 'oryx',
    fogDensity: 0.2,
  },
  southafrica: {
    name: 'South Africa',
    palette: { ground: '#4a3a1e', accent: '#d4af37', glow: '#ffb060', sky: '#241c0e' },
    terrain: 'savanna',
    mascotShape: 'springbok',
    fogDensity: 0.3,
  },
  srilanka: {
    name: 'Sri Lanka',
    palette: { ground: '#1e4a3e', accent: '#34e0ff', glow: '#5cffd6', sky: '#0a2420' },
    terrain: 'jungle',
    mascotShape: 'elephant',
    fogDensity: 0.45,
  },
  westindies: {
    name: 'West Indies',
    palette: { ground: '#20506a', accent: '#34e0ff', glow: '#8fe8ff', sky: '#0c2836' },
    terrain: 'beach',
    mascotShape: 'marlin',
    fogDensity: 0.15,
  },
  uae: {
    name: 'United Arab Emirates',
    palette: { ground: '#4a3a20', accent: '#d4af37', glow: '#ffe0a0', sky: '#241c10' },
    terrain: 'dunes',
    mascotShape: 'falcon',
    fogDensity: 0.2,
  },
  newzealand: {
    name: 'New Zealand',
    palette: { ground: '#1e4a30', accent: '#34e0ff', glow: '#8fffb8', sky: '#0a2416' },
    terrain: 'fjord',
    mascotShape: 'kiwi',
    fogDensity: 0.5,
  },
}
