// Ported from the Boaty Jobs transits lesson, all computed from the practice chart: the Port
// Kerran leading lights, natural transits, compass checks and clearing
// bearings. Pure functions, so the server-rendered notes, the widgets,
// the scenes and the exercises always agree.

import {
  formatBearing, norm360, positionLineCrossing, reciprocal, rhumbBearing, rhumbDestination, rhumbDistance, type LatLon,
} from '@/lib/courses/geo'
import { COURSE_YEAR, LEADING_LINE, deviationFor, feature, variationFor, type ChartFeature } from '@/lib/courses/navigation/practice-chart'
import { landInFront } from './sight'

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

/** Signed difference a − b in degrees, −180 to 180. */
export function signedDiff(a: number, b: number): number {
  const d = norm360(a - b)
  return d > 180 ? d - 360 : d
}

const DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
/** "290" → "two nine zero", the way navigators say a bearing. */
export function say(deg: number): string {
  return formatBearing(deg).slice(0, 3).split('').map((d) => DIGITS[Number(d)]).join(' ')
}

/** "2°W" / "3°E" for a signed angle (east positive). */
export function eastWest(deg: number, decimals = 0): string {
  const v = Math.abs(deg).toFixed(decimals)
  if (Number(v) === 0) return '0°'
  return `${v}°${deg < 0 ? 'W' : 'E'}`
}

/** Distance in cables (0.1 M), to one decimal place. */
export function cables(nm: number): string {
  return (Math.round(nm * 100) / 10).toFixed(1)
}

const EIGHT = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']
export function eightPoint(deg: number): string {
  return EIGHT[Math.round(norm360(deg) / 45) % 8]!
}

const SIXTEEN = [
  'north', 'north-north-east', 'north-east', 'east-north-east', 'east', 'east-south-east', 'south-east', 'south-south-east',
  'south', 'south-south-west', 'south-west', 'west-south-west', 'west', 'west-north-west', 'north-west', 'north-north-west',
]
export function sixteenPoint(deg: number): string {
  return SIXTEEN[Math.round(norm360(deg) / 22.5) % 16]!
}

/* ------------------------------------------------------------------ */
/* Variation and the deviation card                                  */
/* ------------------------------------------------------------------ */

/** Variation for the course year, east positive: −2.73 (2°44'W). */
export const VAR_EXACT = variationFor(COURSE_YEAR)
/** Rounded to whole degrees for chart work: −3 (3°W). */
export const VAR = Math.round(VAR_EXACT)
export const VAR_TEXT = eastWest(VAR)
const varMin = Math.round(Math.abs(VAR_EXACT) * 60)
export const VAR_EXACT_TEXT = `${Math.floor(varMin / 60)}°${String(varMin % 60).padStart(2, '0')}'${VAR_EXACT < 0 ? 'W' : 'E'}`

export const toMagnetic = (trueBearing: number) => norm360(trueBearing - VAR)
export const toTrue = (magnetic: number) => norm360(magnetic + VAR)

/**
 * The whole-degree reading of the course yacht's steering compass when her
 * magnetic heading is `magnetic`, from the deviation card (C + dev(C) = M).
 */
export function compassReadingFor(magnetic: number): number {
  let best = 0
  let err = Infinity
  for (let c = 0; c < 360; c++) {
    const e = Math.abs(signedDiff(c + deviationFor(c), magnetic))
    if (e < err - 1e-9) {
      err = e
      best = c
    }
  }
  return best
}

export interface CompassCheck {
  /** What you are doing. */
  label: string
  trueBearing: number
  magnetic: number
  compass: number
  /** Deviation found from the transit: magnetic − compass (east +). */
  deviation: number
  /** What the deviation card gives for that compass heading. */
  card: number
}

function compassCheck(label: string, trueBearing: number): CompassCheck {
  const t = Math.round(trueBearing)
  const magnetic = toMagnetic(t)
  const compass = compassReadingFor(magnetic)
  return { label, trueBearing: t, magnetic, compass, deviation: signedDiff(magnetic, compass), card: deviationFor(compass) }
}

/* ------------------------------------------------------------------ */
/* Port Kerran leading lights                                          */
/* ------------------------------------------------------------------ */

export const FRONT = feature('ldg-front')
export const REAR = feature('ldg-rear')
export const LEAD_BRG = LEADING_LINE.bearing
const heightOf = (f: ChartFeature) => Number(f.light?.match(/(\d+)m/)?.[1] ?? 0)
export const FRONT_HEIGHT = heightOf(FRONT)
export const REAR_HEIGHT = heightOf(REAR)
export const LIGHT_CHAR = LEADING_LINE.light
export const LIGHTS_APART = rhumbDistance(FRONT.at, REAR.at)
/** Length of the leading line drawn on the chart, seaward end to the front light. */
export const LINE_LENGTH = rhumbDistance(LEADING_LINE.from, FRONT.at)

export const NO1 = feature('no1')
export const NO2 = feature('no2')
export const NO3 = feature('no3')
export const NO4 = feature('no4')
/** Half the width of the buoyed channel at Nos 1 and 2 (miles). */
export const CHANNEL_HALF = rhumbDistance(NO1.at, NO2.at) / 2

/**
 * A position `along` miles to seaward of the front light on the leading
 * line, `cross` miles to the right (+, east) or left (−, west) of it,
 * looking up the line towards the lights.
 */
export function approachPoint(along: number, cross = 0): LatLon {
  const onLine = rhumbDestination(FRONT.at, reciprocal(LEAD_BRG), along)
  if (Math.abs(cross) < 1e-9) return onLine
  return rhumbDestination(onLine, norm360(LEAD_BRG + (cross > 0 ? 90 : -90)), Math.abs(cross))
}

export interface LightsLook {
  /** Bearing of the front light from you (°T). */
  front: number
  /** Bearing of the rear light from you (°T). */
  rear: number
  /** How far the rear light appears right (+) or left (−) of the front, degrees. */
  rearOffset: number
}

export function lightsFrom(p: LatLon): LightsLook {
  const front = rhumbBearing(p, FRONT.at)
  const rear = rhumbBearing(p, REAR.at)
  return { front, rear, rearOffset: signedDiff(rear, front) }
}

/** Closer than this (degrees), the eye sees the two lights as in line. */
export const IN_LINE_DEG = 0.05

export type Side = 'left' | 'right' | 'on'
export function sideOf(rearOffset: number): Side {
  return Math.abs(rearOffset) < IN_LINE_DEG ? 'on' : rearOffset < 0 ? 'left' : 'right'
}

/** How far apart the lights look one cable off the line, at several distances. */
export const SENSITIVITY = [1, 2, 3].map((along) => ({
  along,
  offset: Math.abs(lightsFrom(approachPoint(along, -0.1)).rearOffset),
}))

/* ------------------------------------------------------------------ */
/* Compass checks on the leading line                                   */
/* ------------------------------------------------------------------ */

export const CHECK_IN = compassCheck('Entering on the leading line, lights in line ahead', LEAD_BRG)
export const CHECK_OUT = compassCheck('Leaving on the leading line, lights in line astern', reciprocal(LEAD_BRG))

/* ------------------------------------------------------------------ */
/* Natural transits                                                    */
/* ------------------------------------------------------------------ */

export const GULL = feature('gull-point-lt')
export const MAST = feature('mast')
export const TEETH = feature('teeth')
export const MEW = feature('mew-rock')
export const CHURCH = feature('church')
export const WRECK = feature('wreck')

export interface Transit {
  front: ChartFeature
  rear: ChartFeature
  /** Bearing of the pair from seaward, as you see them in line (°T). */
  bearing: number
}

function transit(front: ChartFeature, rear: ChartFeature): Transit {
  return { front, rear, bearing: rhumbBearing(front.at, rear.at) }
}

// Both transits pass the course's line-of-sight rule (./sight):
// the radio mast shows over the island; the spire and the lighthouse are
// seen over less than LOW_OBJECT_LAND miles of land along these lines.

/** The church spire in line with the radio mast, seen from seaward of Kerran Bay. */
export const SPIRE_TRANSIT = transit(CHURCH, MAST)
/** Gull Point lighthouse in line with the radio mast: it doubles as a clearing line for The Teeth. */
export const MAST_TRANSIT = transit(GULL, MAST)

/** A point `nm` miles to seaward of a transit's front object, on the transit. */
export function onTransit(t: Transit, nm: number): LatLon {
  return rhumbDestination(t.front.at, reciprocal(t.bearing), nm)
}

/** How far the spire stands inland along its transit: the line reaches the sea this far from it (M). */
export const SPIRE_INLAND = landInFront(onTransit(SPIRE_TRANSIT, 4), CHURCH.id)
/** Where the boat is when it sees a transit: the direction from the objects out to sea, e.g. "south-south-east". */
export const seawardOf = (t: Transit) => sixteenPoint(reciprocal(t.bearing))

/** Worked example: the leading lights in line and Mew Rock beacon bearing FIX_BRG. */
export const FIX_ALONG = 2.75
export const FIX_BRG = Math.round(rhumbBearing(approachPoint(FIX_ALONG), MEW.at))
export const FIX = positionLineCrossing(FRONT.at, LEAD_BRG, MEW.at, FIX_BRG)!

/* ------------------------------------------------------------------ */
/* Clearing bearings                                                   */
/* ------------------------------------------------------------------ */

export type Limit = 'NMT' | 'NLT'

/** Safety margin used to draw the lesson's clearing lines (miles). */
export const MARGIN = 0.4
/** The widget accepts anything from this clearance (miles) as safe. */
export const MIN_CLEARANCE = 0.3

export interface ClearingScenario {
  id: string
  label: string
  danger: ChartFeature
  landmark: ChartFeature
  /** How the danger reads mid-sentence. */
  dangerName: string
  /** "are" for The Teeth, "is" for Mew Rock. */
  dangerVerb: 'is' | 'are'
  landmarkName: string
  approach: string
  /** Which side of the danger you mean to pass. */
  passSide: string
  limit: Limit
  /** Bearing of the landmark from the danger: the line that leads straight onto it. */
  dangerBearing: number
  dangerDistance: number
  /** The clearing bearing, rounded outwards so the margin is at least MARGIN. */
  bearing: number
  clearance: number
}

export interface Assessment {
  /** True when the danger lies on the dangerous side of the limit. */
  excluded: boolean
  /** Perpendicular distance from the danger to the clearing line (miles). */
  distance: number
  /** Direction from the clearing line to the danger, e.g. "north". */
  dangerDirection: string
}

/**
 * Where the danger lies relative to a clearing bearing. NLT keeps you where
 * the landmark bears at least `value`: on the left of the line as you look
 * at the landmark. NMT keeps you on its right.
 */
export function assess(danger: LatLon, landmark: LatLon, limit: Limit, value: number): Assessment {
  const bD = rhumbBearing(danger, landmark)
  const d = rhumbDistance(danger, landmark)
  const s = signedDiff(value, bD)
  const excluded = limit === 'NLT' ? s > 0 : s < 0
  const distance = Math.abs(s) >= 90 ? d : d * Math.sin((Math.abs(s) * Math.PI) / 180)
  // Facing the landmark, points to your left see it on a bigger bearing, so a
  // danger with a smaller bearing (s > 0) lies to the right of the line.
  const dangerDirection = eightPoint(s > 0 ? value + 90 : value - 90)
  return { excluded, distance, dangerDirection }
}

/** Clearing bearing on `landmark` passing at least `margin` miles clear of `danger`. */
export function clearingBearing(danger: LatLon, landmark: LatLon, limit: Limit, margin = MARGIN): number {
  const bD = rhumbBearing(danger, landmark)
  const d = rhumbDistance(danger, landmark)
  const a = (Math.asin(Math.min(1, margin / d)) * 180) / Math.PI
  return norm360(limit === 'NLT' ? Math.ceil(bD + a) : Math.floor(bD - a))
}

function scenario(s: Omit<ClearingScenario, 'dangerBearing' | 'dangerDistance' | 'bearing' | 'clearance'>): ClearingScenario {
  const bearing = clearingBearing(s.danger.at, s.landmark.at, s.limit)
  return {
    ...s,
    dangerBearing: rhumbBearing(s.danger.at, s.landmark.at),
    dangerDistance: rhumbDistance(s.danger.at, s.landmark.at),
    bearing,
    clearance: assess(s.danger.at, s.landmark.at, s.limit, bearing).distance,
  }
}

export const TEETH_CLEAR = scenario({
  id: 'teeth',
  label: 'The Teeth, from the east',
  danger: TEETH,
  landmark: GULL,
  dangerName: 'The Teeth',
  dangerVerb: 'are',
  landmarkName: 'Gull Point lighthouse',
  approach: 'You are arriving from the east, bound round Gull Point for Port Kerran.',
  passSide: 'south',
  limit: 'NLT',
})

export const MEW_CLEAR = scenario({
  id: 'mew',
  label: 'Mew Rock, from the south-west',
  danger: MEW,
  landmark: CHURCH,
  dangerName: 'Mew Rock',
  dangerVerb: 'is',
  landmarkName: 'the church spire',
  approach: 'You are approaching Kerran Bay from the south-west, with the church spire ahead.',
  passSide: 'south-east',
  limit: 'NMT',
})

export const SCENARIOS = [TEETH_CLEAR, MEW_CLEAR]

/** How far the mast-behind-the-lighthouse transit passes from The Teeth, and on which side. */
export const MAST_CLEARS = assess(TEETH.at, GULL.at, 'NLT', MAST_TRANSIT.bearing)

/**
 * Far out, the Mew Rock clearing line runs close past the wreck south of the
 * island — on its "safe" side. A clearing line only guards its own danger.
 */
export const WRECK_BY_MEW_LINE = {
  ...assess(WRECK.at, CHURCH.at, MEW_CLEAR.limit, MEW_CLEAR.bearing),
  fromLandmark: rhumbDistance(WRECK.at, CHURCH.at),
}

/** The written form of a clearing bearing, e.g. "NLT 290°T". */
export function limitText(limit: Limit, value: number, ref: 'T' | 'M' = 'T'): string {
  return `${limit} ${formatBearing(value, ref)}`
}
