// What can be seen over the Isle of Kerran, ported from the Boaty Jobs
// position-lines lesson (the same rule there for every lesson).
//
// The practice chart gives no heights for the land, so the course assumes:
// - the radio mast and the summit of Beacon Hill (87 m) stand above the rest
//   of the island and can be seen over it from any side;
// - every other object on land (the church spire, the old tower, the
//   lighthouses and the leading lights) shows only over the land close in
//   front of it: the sight line may cross land only within LOW_OBJECT_LAND
//   miles of the object;
// - marks at sea (buoys, Mew Rock beacon) are hidden by any land at all.
// How far away an object is still worth a bearing is each lesson's own
// choice. Pure functions: safe on the server.

import { rhumbDistance, type LatLon } from '@/lib/courses/geo'
import { feature, isLand, type FeatureKind } from '@/lib/courses/navigation/practice-chart'

/** Objects tall enough to be seen over the whole island. */
export const TALL_OBJECTS = ['mast', 'beacon-hill']

/** A lower object on land shows over land only this close in front of it (M). */
export const LOW_OBJECT_LAND = 2

const AT_SEA: FeatureKind[] = [
  'port-mark', 'starboard-mark', 'cardinal-north', 'cardinal-east', 'cardinal-south', 'cardinal-west',
  'safe-water', 'isolated-danger', 'special-mark', 'rock-drying', 'rock-awash', 'wreck',
]

/** How many miles of land, just in front of the object, a sight line to it may cross. */
export function landAllowed(id: string): number {
  if (TALL_OBJECTS.includes(id)) return Infinity
  return AT_SEA.includes(feature(id).kind) ? 0 : LOW_OBJECT_LAND
}

const STEP_NM = 0.04
const lerp = (a: LatLon, b: LatLon, f: number): LatLon => ({ lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f })

/** Distance from the object back to the farthest land on the straight sight line from `from` (0 if it is all sea). */
export function landInFront(from: LatLon, id: string): number {
  const to = feature(id).at
  const d = rhumbDistance(from, to)
  const steps = Math.max(1, Math.ceil(d / STEP_NM))
  for (let i = 0; i <= steps; i++) {
    if (isLand(lerp(from, to, i / steps))) return (1 - i / steps) * d
  }
  return 0
}

/** True unless the island hides the object from `from`, under the course's rule. */
export function inSight(from: LatLon, id: string): boolean {
  const allowed = landAllowed(id)
  if (!Number.isFinite(allowed)) return true
  const to = feature(id).at
  const d = rhumbDistance(from, to)
  const steps = Math.max(1, Math.ceil(d / STEP_NM))
  for (let i = 0; i < steps; i++) {
    const f = i / steps
    if ((1 - f) * d <= allowed) return true
    if (isLand(lerp(from, to, f))) return false
  }
  return true
}

const HILL_HEIGHT = feature('beacon-hill').name.match(/(\d+)\s*m/)?.[1] ?? ''

/** The rule in words, for the notes of each lesson that relies on it. */
export const SIGHT_RULE =
  `The practice chart gives no heights for the land, so this course keeps it simple: the radio mast and Beacon Hill ` +
  `(${HILL_HEIGHT} m) stand above the rest of the island and can be seen over it, but lower objects — the church spire, the old ` +
  `tower and the lighthouses — show only over land close in front of them, within about ${LOW_OBJECT_LAND} M.`
