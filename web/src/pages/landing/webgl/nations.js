// The 14 IOCF member boards, with approximate lat/lng (degrees) used to
// place glowing markers on the holographic Earth and to route the
// connection-beam sequence between them. Precision doesn't matter here -
// these only need to read as "roughly the right part of the globe", not
// survey-accurate.
export const IOCF_NATIONS = [
  { id: 'england', name: 'England', lat: 52, lng: -1, color: '#34e0ff' },
  { id: 'india', name: 'India', lat: 21, lng: 78, color: '#f5cf5c' },
  { id: 'australia', name: 'Australia', lat: -25, lng: 133, color: '#f5cf5c' },
  { id: 'pakistan', name: 'Pakistan', lat: 30, lng: 70, color: '#34e0ff' },
  { id: 'bangladesh', name: 'Bangladesh', lat: 24, lng: 90, color: '#34e0ff' },
  { id: 'scotland', name: 'Scotland', lat: 56, lng: -4, color: '#d4af37' },
  { id: 'italy', name: 'Italy', lat: 42, lng: 12, color: '#34e0ff' },
  { id: 'netherlands', name: 'Netherlands', lat: 52, lng: 5, color: '#d4af37' },
  { id: 'qatar', name: 'Qatar', lat: 25, lng: 51, color: '#f5cf5c' },
  { id: 'southafrica', name: 'South Africa', lat: -29, lng: 24, color: '#d4af37' },
  { id: 'srilanka', name: 'Sri Lanka', lat: 7, lng: 81, color: '#34e0ff' },
  { id: 'westindies', name: 'West Indies', lat: 13, lng: -61, color: '#f5cf5c' },
  { id: 'uae', name: 'United Arab Emirates', lat: 24, lng: 54, color: '#d4af37' },
  { id: 'newzealand', name: 'New Zealand', lat: -41, lng: 174, color: '#34e0ff' },
]

// Converts lat/lng (degrees) to a point on a sphere of the given radius,
// in three.js's Y-up coordinate space.
export function latLngToVector3(lat, lng, radius) {
  const latRad = (lat * Math.PI) / 180
  const lngRad = (lng * Math.PI) / 180
  const x = radius * Math.cos(latRad) * Math.cos(lngRad)
  const y = radius * Math.sin(latRad)
  const z = radius * Math.cos(latRad) * Math.sin(lngRad)
  return [x, y, z]
}

// The order beams travel in, per the brief: England -> India -> Australia
// -> Pakistan -> England -> Scotland -> ... cycling until every nation has
// been visited, at which point every pair drawn so far stays lit and the
// sequence loops. Built by walking the nation list with a couple of
// "return to a hub" hops thrown in (matching the brief's England-anchored
// pattern) rather than a plain consecutive chain.
export const BEAM_SEQUENCE = (() => {
  const order = ['england', 'india', 'australia', 'pakistan', 'england', 'scotland']
  const rest = IOCF_NATIONS.map((n) => n.id).filter((id) => !order.includes(id))
  const withHubReturns = []
  rest.forEach((id, i) => {
    withHubReturns.push(id)
    if (i % 3 === 2) withHubReturns.push('england')
  })
  const full = [...order, ...withHubReturns]
  const pairs = []
  for (let i = 0; i < full.length - 1; i++) {
    pairs.push([full[i], full[i + 1]])
  }
  return pairs
})()
