// Navigation maths used by the course widgets and exercises: position
// formatting, Mercator projection for the practice chart, rhumb-line
// distance and bearing, and true/magnetic/compass conversion.
//
// Conventions: latitude north-positive, longitude EAST-positive (so
// 004°10'W is -4.1667), angles in degrees, distances in nautical miles.

export interface LatLon {
  lat: number
  lon: number
}

const DEG = Math.PI / 180
const EARTH_NM_PER_DEG_LAT = 60

/** "49°45.2'N" — degrees and decimal minutes, as on Admiralty charts. */
export function formatLat(lat: number, decimals = 1): string {
  return formatDM(Math.abs(lat), 2, decimals) + (lat >= 0 ? 'N' : 'S')
}

/** "004°10.6'W" — longitude always has three-figure degrees. */
export function formatLon(lon: number, decimals = 1): string {
  return formatDM(Math.abs(lon), 3, decimals) + (lon >= 0 ? 'E' : 'W')
}

export function formatPosition(p: LatLon, decimals = 1): string {
  return `${formatLat(p.lat, decimals)} ${formatLon(p.lon, decimals)}`
}

function formatDM(value: number, degDigits: number, decimals: number): string {
  let deg = Math.floor(value)
  let min = Number(((value - deg) * 60).toFixed(decimals))
  if (min >= 60) {
    deg += 1
    min = 0
  }
  const minStr = min.toFixed(decimals).padStart(decimals > 0 ? decimals + 3 : 2, '0')
  return `${String(deg).padStart(degDigits, '0')}°${minStr}'`
}

/** Degrees + minutes + hemisphere → signed decimal degrees. */
export function fromDM(deg: number, min: number, hemi: 'N' | 'S' | 'E' | 'W'): number {
  const v = deg + min / 60
  return hemi === 'S' || hemi === 'W' ? -v : v
}

/** Normalise any angle to 0 ≤ a < 360. */
export function norm360(a: number): number {
  return ((a % 360) + 360) % 360
}

/** "045°" — three-figure notation, rounded to whole degrees. */
export function formatBearing(deg: number, suffix: '' | 'T' | 'M' | 'C' = ''): string {
  const d = Math.round(norm360(deg)) % 360
  return `${String(d).padStart(3, '0')}°${suffix}`
}

/** Smallest absolute difference between two bearings (handles 359 vs 001). */
export function bearingDiff(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b))
  return d > 180 ? 360 - d : d
}

export function reciprocal(bearing: number): number {
  return norm360(bearing + 180)
}

/** Mercator ordinate for a latitude (radians-based, unitless). */
export function mercatorY(lat: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (lat * DEG) / 2))
}

export function inverseMercatorY(y: number): number {
  return (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / DEG
}

/**
 * Rhumb-line (constant-bearing) distance in nautical miles: what you
 * measure on a Mercator chart with dividers against the latitude scale.
 */
export function rhumbDistance(a: LatLon, b: LatLon): number {
  const dLat = b.lat - a.lat
  const dPsi = mercatorY(b.lat) - mercatorY(a.lat)
  // Near-east/west lines: dLat/dPsi is unstable, use cos(lat).
  const q = Math.abs(dPsi) > 1e-12 ? (dLat * DEG) / dPsi : Math.cos(a.lat * DEG)
  const dLon = b.lon - a.lon
  return Math.sqrt(dLat * dLat + q * q * dLon * dLon) * EARTH_NM_PER_DEG_LAT
}

/** Rhumb-line true bearing from a to b, 0–360. */
export function rhumbBearing(a: LatLon, b: LatLon): number {
  const dPsi = mercatorY(b.lat) - mercatorY(a.lat)
  const dLon = (b.lon - a.lon) * DEG
  return norm360(Math.atan2(dLon, dPsi) / DEG)
}

/** Position reached from `from` along a rhumb line. */
export function rhumbDestination(from: LatLon, bearing: number, distanceNm: number): LatLon {
  const d = distanceNm / EARTH_NM_PER_DEG_LAT
  const lat = from.lat + d * Math.cos(bearing * DEG)
  const dPsi = mercatorY(lat) - mercatorY(from.lat)
  const q = Math.abs(dPsi) > 1e-12 ? ((lat - from.lat) * DEG) / dPsi : Math.cos(from.lat * DEG)
  const lon = from.lon + (d * Math.sin(bearing * DEG)) / q
  return { lat, lon }
}

/**
 * Variation and deviation are "east positive, west negative".
 *   True = Magnetic + variation      (CADET: Compass ADd East → True)
 *   Magnetic = Compass + deviation
 */
export function magneticToTrue(magnetic: number, variation: number): number {
  return norm360(magnetic + variation)
}

export function trueToMagnetic(trueBearing: number, variation: number): number {
  return norm360(trueBearing - variation)
}

export function compassToTrue(compass: number, deviation: number, variation: number): number {
  return norm360(compass + deviation + variation)
}

export function trueToCompass(trueBearing: number, deviation: number, variation: number): number {
  return norm360(trueBearing - variation - deviation)
}

/** Speed, time, distance. Time in minutes (the "60D = ST" form). */
export function distanceFrom(speedKn: number, minutes: number): number {
  return (speedKn * minutes) / 60
}

export function timeFor(distanceNm: number, speedKn: number): number {
  return (60 * distanceNm) / speedKn
}

export function speedFor(distanceNm: number, minutes: number): number {
  return (60 * distanceNm) / minutes
}

/** Difference between two positions in minutes of latitude/longitude. */
export function minutesApart(a: LatLon, b: LatLon): { dLat: number; dLon: number } {
  return { dLat: Math.abs(a.lat - b.lat) * 60, dLon: Math.abs(a.lon - b.lon) * 60 }
}

/**
 * Where two position lines cross. Each line passes through a charted
 * object on the bearing observed FROM the boat TO the object (°T).
 * Returns null for lines that are (nearly) parallel.
 *
 * Works in a local flat frame (miles east/north of `a`), which is exact
 * enough over the few miles of a coastal fix.
 */
export function positionLineCrossing(a: LatLon, bearingToA: number, b: LatLon, bearingToB: number): LatLon | null {
  const cos = Math.cos(a.lat * DEG)
  const bx = (b.lon - a.lon) * 60 * cos
  const by = (b.lat - a.lat) * 60
  // Direction from each object back towards the boat (reciprocal).
  const ua = [Math.sin(reciprocal(bearingToA) * DEG), Math.cos(reciprocal(bearingToA) * DEG)]
  const ub = [Math.sin(reciprocal(bearingToB) * DEG), Math.cos(reciprocal(bearingToB) * DEG)]
  const det = ua[0]! * -ub[1]! - ua[1]! * -ub[0]!
  if (Math.abs(det) < 1e-6) return null
  // a + s·ua = b + t·ub
  const s = (bx * -ub[1]! - by * -ub[0]!) / det
  return { lat: a.lat + (s * ua[1]!) / 60, lon: a.lon + (s * ua[0]!) / 60 / cos }
}

/** Angle (0–90°) between two position lines: near 90° gives the best fix. */
export function cutAngle(bearing1: number, bearing2: number): number {
  const d = bearingDiff(bearing1, bearing2) % 180
  return d > 90 ? 180 - d : d
}
