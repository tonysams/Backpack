export interface GpxImport {
  name: string
  route: string
  distanceMiles: number
  elevationGainFt: number
  waypointNames: string[]
}

/**
 * Parse a GPX file and extract trip-relevant data.
 * Handles both <trk> (recorded tracks) and <rte> (planned routes).
 */
export function parseGpx(xmlText: string): GpxImport {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'application/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) throw new Error('Invalid GPX file')

  // ── Name ───────────────────────────────────────────────────────────────────
  const metaName  = doc.querySelector('metadata > name')?.textContent?.trim()
  const trackName = doc.querySelector('trk > name')?.textContent?.trim()
  const routeName = doc.querySelector('rte > name')?.textContent?.trim()
  const name = metaName || trackName || routeName || 'Imported Trip'
  const route = trackName || routeName || ''

  // ── Points (track segments take priority over route points) ───────────────
  const trkPoints = Array.from(doc.querySelectorAll('trkpt'))
  const rtePoints = Array.from(doc.querySelectorAll('rtept'))
  const points = trkPoints.length > 0 ? trkPoints : rtePoints

  // ── Distance (Haversine between consecutive points, in miles) ─────────────
  let distanceMiles = 0
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const lat1 = parseFloat(prev.getAttribute('lat') ?? '0')
    const lon1 = parseFloat(prev.getAttribute('lon') ?? '0')
    const lat2 = parseFloat(curr.getAttribute('lat') ?? '0')
    const lon2 = parseFloat(curr.getAttribute('lon') ?? '0')
    distanceMiles += haversine(lat1, lon1, lat2, lon2)
  }

  // ── Elevation gain (sum of positive rises between consecutive points) ──────
  let elevationGainFt = 0
  for (let i = 1; i < points.length; i++) {
    const prevEle = parseFloat(points[i - 1].querySelector('ele')?.textContent ?? '0')
    const currEle = parseFloat(points[i].querySelector('ele')?.textContent ?? '0')
    const diff = currEle - prevEle
    if (diff > 0) elevationGainFt += diff * 3.28084 // metres → feet
  }

  // ── Waypoints ─────────────────────────────────────────────────────────────
  const waypointNames = Array.from(doc.querySelectorAll('wpt > name'))
    .map(n => n.textContent?.trim() ?? '')
    .filter(Boolean)

  return {
    name,
    route,
    distanceMiles: Math.round(distanceMiles * 10) / 10,
    elevationGainFt: Math.round(elevationGainFt),
    waypointNames,
  }
}

/** Haversine distance between two lat/lon points in miles */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8 // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Read a File object and return its text content */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsText(file)
  })
}
