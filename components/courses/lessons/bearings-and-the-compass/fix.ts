// Ported from the Boaty Jobs three-point-fix lesson: the
// objects you can take bearings of (line of sight: ./sight),
// cocked hats, random fix scenarios and the lesson's worked example.
// Pure functions, safe on the server; every number comes from the chart.

import { cutAngle, formatBearing, magneticToTrue, positionLineCrossing, rhumbBearing, rhumbDistance, trueToMagnetic, type LatLon } from '@/lib/courses/geo'
import { COURSE_YEAR, SOUNDINGS, depthAt, feature, km, variationFor } from '@/lib/courses/navigation/practice-chart'
import { randStep, type Rng } from '@/lib/courses/random'
import { inSight } from './sight'

/* ------------------------------------------------------------------ */
/* Variation (practice chart: 2°44'W in 2027, 3°W for chart work)  */
/* ------------------------------------------------------------------ */

/** Variation in the course year, degrees (west negative). */
export const VAR_EXACT = variationFor(COURSE_YEAR)
/** Rounded to whole degrees for chart work. */
export const VAR = Math.round(VAR_EXACT)
export const VAR_DEG = Math.abs(VAR)
const VAR_MINUTES = Math.round(Math.abs(VAR_EXACT) * 60)
/** "2°44'W" */
export const VAR_TEXT = `${Math.floor(VAR_MINUTES / 60)}°${String(VAR_MINUTES % 60).padStart(2, '0')}'${VAR_EXACT < 0 ? 'W' : 'E'}`
/** "3°W" */
export const VAR_ROUNDED = `${VAR_DEG}°${VAR < 0 ? 'W' : 'E'}`

/** Whole-degree magnetic bearing → true, with the rounded variation. */
export const toTrue = (magnetic: number) => Math.round(magneticToTrue(magnetic, VAR)) % 360
/** Whole-degree true bearing → magnetic. */
export const toMag = (trueBearing: number) => Math.round(trueToMagnetic(trueBearing, VAR)) % 360

const DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
/** "045" → "zero four five", the way navigators say a bearing. */
export function say(deg: number): string {
  return formatBearing(deg).slice(0, 3).split('').map((d) => DIGITS[Number(d)]).join(' ')
}

/* ------------------------------------------------------------------ */
/* Objects you can take a bearing of                                    */
/* ------------------------------------------------------------------ */

export type ObjectKind = 'lighthouse' | 'landmark' | 'beacon' | 'summit' | 'buoy'

export interface FixObject {
  id: string
  kind: ObjectKind
  /** Name as a label, e.g. "Church spire". */
  label: string
  /** Name mid-sentence, e.g. "the church spire". */
  called: string
  /**
   * Farthest this lesson offers it for a fix (M): further off, a bearing is
   * too coarse to be worth plotting, or a buoy too small to pick out reliably.
   */
  range: number
}

export const FIX_OBJECTS: FixObject[] = [
  { id: 'gull-point-lt', kind: 'lighthouse', label: 'Gull Point lighthouse', called: 'Gull Point lighthouse', range: 7 },
  { id: 'kerran-head-lt', kind: 'lighthouse', label: 'Kerran Head light', called: 'Kerran Head light', range: 7 },
  { id: 'church', kind: 'landmark', label: 'Church spire', called: 'the church spire', range: 6.5 },
  { id: 'mast', kind: 'landmark', label: 'Radio mast', called: 'the radio mast', range: 7 },
  { id: 'tower', kind: 'landmark', label: 'Old tower', called: 'the old tower', range: 6.5 },
  { id: 'mew-rock', kind: 'beacon', label: 'Mew Rock beacon', called: 'Mew Rock beacon', range: 5 },
  { id: 'beacon-hill', kind: 'summit', label: 'Beacon Hill summit', called: 'the summit of Beacon Hill', range: 7 },
  { id: 'kerran-approach', kind: 'buoy', label: 'Kerran Approach buoy', called: 'Kerran Approach buoy', range: 4 },
  { id: 'east-teeth', kind: 'buoy', label: 'East Teeth buoy', called: 'East Teeth buoy', range: 4 },
  { id: 'n-teeth', kind: 'buoy', label: 'North Teeth buoy', called: 'North Teeth buoy', range: 4 },
  { id: 's-brennan', kind: 'buoy', label: 'South Brennan buoy', called: 'South Brennan buoy', range: 4 },
  { id: 'w-ledge', kind: 'buoy', label: 'West Ledge buoy', called: 'West Ledge buoy', range: 4 },
  { id: 'outfall', kind: 'buoy', label: 'Outfall buoy', called: 'the Outfall buoy', range: 4 },
  { id: 'no1', kind: 'buoy', label: 'No 1 buoy', called: 'No 1 buoy', range: 4 },
  { id: 'no2', kind: 'buoy', label: 'No 2 buoy', called: 'No 2 buoy', range: 4 },
  { id: 'no3', kind: 'buoy', label: 'No 3 buoy', called: 'No 3 buoy', range: 4 },
  { id: 'no4', kind: 'buoy', label: 'No 4 buoy', called: 'No 4 buoy', range: 4 },
]

export function fixObject(id: string): FixObject {
  const o = FIX_OBJECTS.find((x) => x.id === id)
  if (!o) throw new Error(`unknown fix object ${id}`)
  return o
}

export const KIND_LABEL: Record<ObjectKind, string> = {
  lighthouse: 'Lighthouse', landmark: 'Landmark', beacon: 'Beacon', summit: 'Hill summit', buoy: 'Buoy',
}

/** Closer than this, an object is too near to be worth a bearing (it is nearly alongside). */
const MIN_RANGE = 0.6

/**
 * Is the object worth a bearing from p? In range, and not hidden by the
 * island under the course's line-of-sight rule (shared with Lessons 11 and
 * 13): the radio mast and Beacon Hill show over the island, lower objects
 * only over land close in front of them, marks at sea over no land at all.
 */
export function canSee(p: LatLon, o: FixObject): boolean {
  const d = rhumbDistance(p, feature(o.id).at)
  if (d < MIN_RANGE || d > o.range) return false
  return inSight(p, o.id)
}

export interface Sighting {
  obj: FixObject
  at: LatLon
  /** True bearing from the boat to the object (exact). */
  bearing: number
  distance: number
}

export function sighting(p: LatLon, id: string): Sighting {
  const obj = fixObject(id)
  const at = feature(id).at
  return { obj, at, bearing: rhumbBearing(p, at), distance: rhumbDistance(p, at) }
}

/** Everything worth a bearing from p: all visible fixed objects plus the nearest few buoys, clockwise from north. */
export function sightingsFrom(p: LatLon, maxBuoys = 3): Sighting[] {
  const seen = FIX_OBJECTS.filter((o) => canSee(p, o)).map((o) => sighting(p, o.id))
  const fixed = seen.filter((s) => s.obj.kind !== 'buoy')
  const buoys = seen.filter((s) => s.obj.kind === 'buoy').sort((a, b) => a.distance - b.distance).slice(0, maxBuoys)
  return [...fixed, ...buoys].sort((a, b) => a.bearing - b.bearing)
}

/* ------------------------------------------------------------------ */
/* Cocked hats                                                          */
/* ------------------------------------------------------------------ */

const PAIRS = [[0, 1], [1, 2], [0, 2]] as const

/** The smallest angle of cut between any two of the position lines. */
export function minCut(bearings: number[]): number {
  return Math.min(...PAIRS.map(([i, j]) => cutAngle(bearings[i]!, bearings[j]!)))
}

export interface Hat {
  /** The three crossings (null if two lines are parallel). */
  corners: [LatLon, LatLon, LatLon] | null
  /** The fix: the centre of the cocked hat. */
  centre: LatLon | null
  /** Longest side of the hat (M); Infinity if there is none. */
  size: number
  /** Angles of cut for the pairs 0–1, 1–2, 0–2. */
  cuts: [number, number, number]
}

/** Three position lines (each through an object, on the bearing from the boat to it) and the hat they make. */
export function cockedHat(objects: LatLon[], bearings: number[]): Hat {
  const cuts = PAIRS.map(([i, j]) => cutAngle(bearings[i]!, bearings[j]!)) as [number, number, number]
  const c = PAIRS.map(([i, j]) => positionLineCrossing(objects[i]!, bearings[i]!, objects[j]!, bearings[j]!))
  if (c.some((x) => x === null)) return { corners: null, centre: null, size: Infinity, cuts }
  const corners = c as [LatLon, LatLon, LatLon]
  const centre = { lat: (corners[0].lat + corners[1].lat + corners[2].lat) / 3, lon: (corners[0].lon + corners[1].lon + corners[2].lon) / 3 }
  const size = Math.max(rhumbDistance(corners[0], corners[1]), rhumbDistance(corners[1], corners[2]), rhumbDistance(corners[0], corners[2]))
  return { corners, centre, size, cuts }
}

/** "1.7 cables" below a mile, "1.2 M" above. */
export function formatHat(nm: number): string {
  if (!Number.isFinite(nm)) return 'no hat — the lines are parallel'
  return nm < 1 ? `${(nm * 10).toFixed(1)} cables` : `${nm.toFixed(1)} M`
}

/* ------------------------------------------------------------------ */
/* Random fix scenarios (practice and the fix builder)                  */
/* ------------------------------------------------------------------ */

// Kept out of the compass rose (PracticeChart's ROSE_CENTRE; that module is
// client-only) and the title block, and away from rocks and wrecks.
const ROSE = km(2.0, 21.0)
const DANGERS = ['teeth', 'head-ledge', 'mew-rock', 'wreck'].map((id) => feature(id).at)

export function every3<T>(items: T[]): Array<[T, T, T]> {
  const out: Array<[T, T, T]> = []
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) for (let k = j + 1; k < items.length; k++) out.push([items[i]!, items[j]!, items[k]!])
  return out
}

export interface Scenario {
  at: LatLon
  sightings: Sighting[]
}

/** A sensible place for a yacht to be: at sea, in 5 m or more, clear of dangers and the chart furniture. */
export function goodSpot(latMin: number, lonMinW: number): boolean {
  const p = km(latMin, lonMinW)
  const d = depthAt([latMin, lonMinW])
  if (d === null || d < 5) return false
  if (rhumbDistance(p, ROSE) < 2.2 || (latMin > 9.6 && lonMinW > 18.2)) return false
  return DANGERS.every((x) => rhumbDistance(p, x) > 0.7)
}

/**
 * A random position with at least `minObjects` objects in sight, including
 * a well-spread three (smallest cut ≥ minBest, no hill summit) and — when
 * asked — a badly spread three (smallest cut ≤ 20°) to compare it with.
 */
export function randomScenario(rng: Rng, { minBest = 45, needPoor = false, minObjects = 4 } = {}): Scenario {
  for (let attempt = 0; attempt < 300; attempt++) {
    const latMin = randStep(rng, 0.8, 11.2, 0.1)
    const lonMinW = randStep(rng, 1.5, 22.5, 0.1)
    if (!goodSpot(latMin, lonMinW)) continue
    const at = km(latMin, lonMinW)
    const sightings = sightingsFrom(at)
    if (sightings.length < minObjects) continue
    const sets = every3(sightings)
    const best = Math.max(...sets.filter((t) => t.every((s) => s.obj.kind !== 'summit')).map((t) => minCut(t.map((s) => s.bearing))))
    if (best < minBest) continue
    if (needPoor && !sets.some((t) => minCut(t.map((s) => s.bearing)) <= 20)) continue
    return { at, sightings }
  }
  return { at: DEMO_AT, sightings: sightingsFrom(DEMO_AT) }
}

/** The best-spread three of a scenario's sightings (no hill summits). */
export function bestThree(sightings: Sighting[]): [Sighting, Sighting, Sighting] {
  const sets = every3(sightings).filter((t) => t.every((s) => s.obj.kind !== 'summit'))
  return sets.reduce((a, b) => (minCut(b.map((s) => s.bearing)) > minCut(a.map((s) => s.bearing)) ? b : a))
}

/* ------------------------------------------------------------------ */
/* The lesson's worked example: south of the island at 1015            */
/* ------------------------------------------------------------------ */

/** Where the yacht really is (49°43.4'N 004°10.6'W). */
export const DEMO_AT = km(3.4, 10.6)
export const DEMO_TIME = '1015'
export const DEMO_IDS = ['mew-rock', 'church', 'gull-point-lt']
export const DEMO_SIGHTINGS = DEMO_IDS.map((id) => sighting(DEMO_AT, id))
export const DEMO_POINTS = DEMO_SIGHTINGS.map((s) => s.at)
// Small, realistic errors in the observed bearings (degrees).
const DEMO_ERRORS = [0.3, -0.8, 0.6]
/** The bearings as plotted (°T) and as read on the hand-bearing compass (°M). */
export const DEMO_TRUE = DEMO_SIGHTINGS.map((s, i) => Math.round(s.bearing + DEMO_ERRORS[i]!) % 360)
export const DEMO_MAG = DEMO_TRUE.map(toMag)
export const DEMO_HAT = cockedHat(DEMO_POINTS, DEMO_TRUE)
export const DEMO_FIX = DEMO_HAT.centre!
/** The sounding printed on the chart just beside the fix: the depth to check against. */
export const DEMO_SOUNDING = SOUNDINGS.reduce((a, b) => (rhumbDistance(b.at, DEMO_FIX) < rhumbDistance(a.at, DEMO_FIX) ? b : a))
export const DEMO_DEPTH = Math.round(DEMO_SOUNDING.depth)

/** A poor choice from the same spot: the spire and the mast are almost in line. */
export const POOR_IDS = ['church', 'mast', 'gull-point-lt']
export const POOR_POINTS = POOR_IDS.map((id) => feature(id).at)
const POOR_ERRORS = [-0.6, 0.9, 0.6]
export const POOR_TRUE = POOR_IDS.map((id, i) => Math.round(rhumbBearing(DEMO_AT, feature(id).at) + POOR_ERRORS[i]!) % 360)
export const POOR_HAT = cockedHat(POOR_POINTS, POOR_TRUE)
export const POOR_GAP = Math.round(cutAngle(Math.round(rhumbBearing(DEMO_AT, feature('church').at)), Math.round(rhumbBearing(DEMO_AT, feature('mast').at))))

/** A misidentified object: the mark taken for Mew Rock beacon was really West Ledge buoy. */
export const MISID_BEARING = Math.round(rhumbBearing(DEMO_AT, feature('w-ledge').at)) % 360
export const MISID_TRUE = [MISID_BEARING, DEMO_TRUE[1]!, DEMO_TRUE[2]!]
export const MISID_HAT = cockedHat(DEMO_POINTS, MISID_TRUE)
/** The corner of the misidentified hat nearest Mew Rock, the danger here. */
export const MISID_DANGER_CORNER = MISID_HAT.corners!.reduce((a, b) => (rhumbDistance(b, feature('mew-rock').at) < rhumbDistance(a, feature('mew-rock').at) ? b : a))

/** "2°44' west", for narration (the player says "2 degrees 44 minutes west"). */
export const VAR_SPOKEN = `${Math.floor(VAR_MINUTES / 60)}°${VAR_MINUTES % 60}' ${VAR_EXACT < 0 ? 'west' : 'east'}`
/** How far the far corner of the poor hat lies from the real position (M). */
export const POOR_FAR = Math.max(...POOR_HAT.corners!.map((c) => rhumbDistance(c, DEMO_AT)))
