// Ported from the Boaty Jobs position-lines lesson: pure helpers shared by the notes, the
// widgets, the scenes and the exercises: the landmarks used for
// hand-bearing compass work (line of sight comes from ./sight), the course's variation,
// what the compass reads, and where a position line crosses a depth
// contour. No hooks, no randomness of their own: safe on the server.

import { formatBearing, magneticToTrue, norm360, reciprocal, rhumbBearing, rhumbDestination, rhumbDistance, type LatLon } from '@/lib/courses/geo'
import {
  BANK, CHART_BOUNDS, COURSE_YEAR, bankRing, depthAt, feature, isLand, islandContourK, islandRing, km, variationFor,
  type ChartFeature,
} from '@/lib/courses/navigation/practice-chart'
import { project, unproject, type Pt } from '@/lib/courses/navigation/chart-geometry'
import { randStep, type Rng } from '@/lib/courses/random'
import { inSight } from './sight'

/* ------------------------------------------------------------------ */
/* Variation and the compass reading                                   */
/* ------------------------------------------------------------------ */

/** Variation in the course year from the chart's rose (west negative): 2°44'W. */
export const VAR_EXACT = variationFor(COURSE_YEAR)
/** Rounded to whole degrees for chart work, as the course does: 3°W → −3. */
export const VAR = Math.round(VAR_EXACT)

/** "2°44'W" */
export function formatVariation(v: number): string {
  const m = Math.round(Math.abs(v) * 60)
  return `${Math.floor(m / 60)}°${String(m % 60).padStart(2, '0')}'${v < 0 ? 'W' : 'E'}`
}

export const VAR_TEXT = formatVariation(VAR_EXACT)
export const VAR_ROUND_TEXT = `${Math.abs(VAR)}°${VAR < 0 ? 'W' : 'E'}`

/**
 * What a hand-bearing compass with no deviation reads, to the nearest
 * degree, for a true bearing: the real variation (2°44'W) makes the
 * magnetic figure bigger.
 */
export function compassReading(trueBearing: number): number {
  return Math.round(norm360(trueBearing - VAR_EXACT)) % 360
}

/** A magnetic reading converted with the course's rounded variation (3°W: subtract 3). */
export function toTrue(magnetic: number): number {
  return magneticToTrue(magnetic, VAR)
}

const DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
/** "045" → "zero four five", the way navigators say a bearing. */
export function say(deg: number): string {
  return formatBearing(deg).slice(0, 3).split('').map((d) => DIGITS[Number(d)]).join(' ')
}

/** "0.27" → "0.3 M (3 cables)" style text for small distances. */
export function cables(nm: number): string {
  const c = Math.round(nm * 10 * 10) / 10
  return `${c % 1 === 0 ? c.toFixed(0) : c.toFixed(1)} cable${c === 1 ? '' : 's'}`
}

/* ------------------------------------------------------------------ */
/* Landmarks                                                           */
/* ------------------------------------------------------------------ */

export type LandmarkArt = 'spire' | 'mast' | 'tower' | 'lighthouse'

export interface Landmark {
  id: string
  /** Button label. */
  label: string
  /** As it reads mid-sentence. */
  called: string
  art: LandmarkArt
}

export const LANDMARKS: Landmark[] = [
  { id: 'church', label: 'Church spire', called: 'the church spire', art: 'spire' },
  { id: 'mast', label: 'Radio mast', called: 'the radio mast', art: 'mast' },
  { id: 'tower', label: 'Old tower', called: 'the old tower', art: 'tower' },
  { id: 'gull-point-lt', label: 'Gull Point lighthouse', called: 'Gull Point lighthouse', art: 'lighthouse' },
  { id: 'kerran-head-lt', label: 'Kerran Head light', called: 'Kerran Head light', art: 'lighthouse' },
]

export function landmark(id: string): Landmark & { f: ChartFeature } {
  const l = LANDMARKS.find((x) => x.id === id)
  if (!l) throw new Error(`unknown landmark ${id}`)
  return { ...l, f: feature(id) }
}

/** Furthest a landmark is used from (M): beyond this it is too far for a good bearing in this course. */
export const MAX_RANGE = 8

/**
 * True if a landmark is worth a bearing from a boat: not too close, not too
 * far, and not hidden by the island (the course's line-of-sight rule in
 * ./sight: the mast shows over the island, lower objects only over land
 * close in front of them).
 */
export function canSee(from: LatLon, l: Landmark): boolean {
  const d = rhumbDistance(from, feature(l.id).at)
  if (d < 0.8 || d > MAX_RANGE) return false
  return inSight(from, l.id)
}

export function visibleFrom(from: LatLon): Landmark[] {
  return LANDMARKS.filter((l) => canSee(from, l))
}

/* ------------------------------------------------------------------ */
/* Positions at sea                                                    */
/* ------------------------------------------------------------------ */

const toMin = (p: LatLon): [number, number] => [(p.lat - 49 - 40 / 60) * 60, (-p.lon - 4) * 60]

// Dangers to keep the boat clear of, and areas of the chart covered by
// the title block and compass rose.
const DANGERS = ['teeth', 'head-ledge', 'mew-rock', 'wreck'].map((id) => feature(id).at)

/** Charted depth (m) at a position, or null on land. */
export function chartedDepth(p: LatLon): number | null {
  return depthAt(toMin(p))
}

/** A sensible place for a yacht: in open water, clear of dangers, the title block and the compass rose. */
export function isOpenWater(p: LatLon): boolean {
  const [latMin, lonMinW] = toMin(p)
  if (latMin < 0.6 || latMin > 11.4 || lonMinW < 0.8 || lonMinW > 23.2) return false
  if (latMin > 10 && lonMinW > 17.3) return false // title block
  if (latMin < 4.1 && lonMinW > 17.8) return false // compass rose
  const depth = depthAt([latMin, lonMinW])
  if (depth === null || depth < 6) return false
  if (DANGERS.some((d) => rhumbDistance(p, d) < 0.6)) return false
  for (let b = 0; b < 360; b += 30) if (isLand(rhumbDestination(p, b, 0.5))) return false
  return true
}

/** A random open-water position from which at least `minVisible` landmarks can be seen. */
export function randomSpot(rng: Rng, minVisible = 2): { at: LatLon; visible: Landmark[] } {
  for (let attempt = 0; attempt < 400; attempt++) {
    const at = {
      lat: CHART_BOUNDS.south + randStep(rng, 0.8, 11.2, 0.05) / 60,
      lon: -(4 + randStep(rng, 1, 23, 0.05) / 60),
    }
    if (!isOpenWater(at)) continue
    const visible = visibleFrom(at)
    if (visible.length >= minVisible) return { at, visible }
  }
  // Fallback: just south-west of Port Kerran, where the spire and Kerran Head light are both in view.
  const at = { lat: 49 + 43.1 / 60, lon: -(4 + 14 / 60) }
  return { at, visible: visibleFrom(at) }
}

/* ------------------------------------------------------------------ */
/* Bearing error                                                       */
/* ------------------------------------------------------------------ */

/** The 1 in 60 rule: how far (M) a bearing error of `errorDeg` moves the line at `distanceNm` from the object. */
export function offsetFor(distanceNm: number, errorDeg: number): number {
  return (distanceNm * errorDeg) / 60
}

/* ------------------------------------------------------------------ */
/* A position line and a depth contour                                 */
/* ------------------------------------------------------------------ */

function cross(a: Pt, b: Pt, c: Pt, d: Pt): { t: number; angle: number } | null {
  const rx = b.x - a.x
  const ry = b.y - a.y
  const sx = d.x - c.x
  const sy = d.y - c.y
  const den = rx * sy - ry * sx
  if (Math.abs(den) < 1e-9) return null
  const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / den
  const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / den
  if (t < 0 || t > 1 || u < 0 || u > 1) return null
  const cos = Math.abs(rx * sx + ry * sy) / (Math.hypot(rx, ry) * Math.hypot(sx, sy))
  return { t, angle: (Math.acos(Math.min(1, cos)) * 180) / Math.PI }
}

/** The drawn contour rings for a depth (island, and Brennan Bank when deep enough). */
export function contourRings(depth: number): LatLon[][] {
  const rings = [islandRing(islandContourK(depth))]
  if (depth > BANK.least) rings.push(bankRing(depth))
  return rings
}

/**
 * Where a position line, drawn from an object on `bearingFromObject`
 * (°T, the reciprocal of the bearing taken), crosses the drawn contour
 * for `depth`. Works in chart pixels, where a rhumb line is straight, so
 * the answer matches the chart exactly. Returns every crossing, nearest
 * the object first, with the angle of cut against the contour.
 */
export function contourCrossings(object: LatLon, bearingFromObject: number, depth: number): Array<{ at: LatLon; angle: number; fromObject: number }> {
  const a = project(object)
  const b = project(rhumbDestination(object, bearingFromObject, 16))
  const out: Array<{ at: LatLon; angle: number; fromObject: number }> = []
  for (const ring of contourRings(depth)) {
    const pts = ring.map(project)
    for (let i = 0; i < pts.length; i++) {
      const hit = cross(a, b, pts[i]!, pts[(i + 1) % pts.length]!)
      if (!hit) continue
      const at = unproject({ x: a.x + (b.x - a.x) * hit.t, y: a.y + (b.y - a.y) * hit.t })
      out.push({ at, angle: hit.angle, fromObject: rhumbDistance(object, at) })
    }
  }
  return out.sort((p, q) => p.fromObject - q.fromObject)
}

/** The single, cleanly cut crossing of a position line with a contour, or null if there isn't exactly one. */
export function onContour(object: LatLon, bearingFromObject: number, depth: number, minAngle = 35): LatLon | null {
  const hits = contourCrossings(object, bearingFromObject, depth)
  if (hits.length !== 1 || hits[0]!.angle < minAngle) return null
  return hits[0]!.at
}

/* ------------------------------------------------------------------ */
/* One complete observation, worked from a boat's position             */
/* ------------------------------------------------------------------ */

export interface Observation {
  boat: LatLon
  l: Landmark & { f: ChartFeature }
  /** The real true bearing from the boat to the object. */
  exactTrue: number
  /** What the hand-bearing compass reads (°M, whole degrees). */
  magnetic: number
  /** The reading converted with 3°W (°T). */
  trueBrg: number
  /** The direction to draw from the object (°T). */
  fromObject: number
  distance: number
}

export function observe(boat: LatLon, id: string): Observation {
  const l = landmark(id)
  const exactTrue = rhumbBearing(boat, l.f.at)
  const magnetic = compassReading(exactTrue)
  const trueBrg = toTrue(magnetic)
  return { boat, l, exactTrue, magnetic, trueBrg, fromObject: reciprocal(trueBrg), distance: rhumbDistance(boat, l.f.at) }
}

/** Where the plotted line passes closest to a point (M), for checking. */
export function distanceOffLine(object: LatLon, bearingFromObject: number, p: LatLon): number {
  const d = rhumbDistance(object, p)
  const off = ((rhumbBearing(object, p) - bearingFromObject) * Math.PI) / 180
  return Math.abs(d * Math.sin(off))
}

/* ------------------------------------------------------------------ */
/* Scenarios used by the widget, the notes and the video               */
/* ------------------------------------------------------------------ */

export interface Scenario {
  where: string
  at: LatLon
  /** 24-hour clock. */
  time: string
  /** Log reading, M. */
  log: number
  heading: number
}

// Hand-picked positions around the island, each with two landmarks in view.
// The bearings themselves are always worked out from the chart.
export const SCENARIOS: Scenario[] = [
  { where: 'north-west of Kerran Head', at: km(9.6, 18.0), time: '0910', log: 4.2, heading: 60 },
  { where: 'at anchor in Kerran Roads, north of the island', at: km(11.0, 12.0), time: '1105', log: 9.8, heading: 200 },
  { where: 'north-east of the island', at: km(10.4, 5.0), time: '1220', log: 17.5, heading: 150 },
  { where: 'east of Gull Point', at: km(6.4, 2.5), time: '1340', log: 23.1, heading: 200 },
  { where: 'south of the island', at: km(1.9, 14.3), time: '1435', log: 31.6, heading: 270 },
  { where: 'south-east of Port Kerran', at: km(3.2, 9.0), time: '1015', log: 12.4, heading: 250 },
]

/** The worked example: south-east of Port Kerran at 1015, the spire's bearing plotted. */
export const WORKED = { ...observe(SCENARIOS[5]!.at, 'church'), time: SCENARIOS[5]!.time, log: SCENARIOS[5]!.log }

/** The error explorer: a bearing of Gull Point lighthouse from a boat to its south-south-east. */
export const ERR_OBJECT = feature('gull-point-lt')
/** The direction of the boat from Gull Point lighthouse in the explorer (°T): open water all the way. */
export const ERR_LINE = 150
