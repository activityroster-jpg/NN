// The course's practice chart: a FICTIONAL island ("Isle of Kerran") in
// open water. Real Admiralty charts are UKHO copyright, so every lesson
// and exercise uses this area instead. NOT FOR NAVIGATION.
//
// Coordinates are written as (minutes north of 49°40'N, minutes west of
// 004°00'W) to keep the data readable. The chart covers 49°40'N–49°52'N,
// 004°00'W–004°24'W.
//
// Depths come from one model (depthAt) so soundings, contours and tints
// always agree: around the island depth rises with "normalised distance
// from the coast" (contours are the coastline scaled about the island's
// centre), plus a separate shoal (Brennan Bank) to the south-east.

import type { LatLon } from '../geo'

export const CHART_BOUNDS = {
  south: 49 + 40 / 60,
  north: 49 + 52 / 60,
  east: -4,
  west: -(4 + 24 / 60),
}

/** Magnetic variation printed on the chart's compass rose (west negative). */
export const CHART_VARIATION = { degrees: -3, label: "VAR 3°00'W (2025) (8'E)", year: 2025, annualChangeMinutes: 8 }

/** The year the course's exercises are set in (matches the tide tables). */
export const COURSE_YEAR = 2027

/**
 * Variation for a year from the rose: 3°00'W in 2025 changing 8' east a
 * year (so westerly variation gets smaller). Degrees, west negative.
 */
export function variationFor(year: number): number {
  const minutes = CHART_VARIATION.degrees * 60 + CHART_VARIATION.annualChangeMinutes * (year - CHART_VARIATION.year)
  return minutes / 60
}

/** (minutes north of 49°40'N, minutes west of 004°00'W) → LatLon. */
export function km(latMin: number, lonMinW: number): LatLon {
  return { lat: 49 + (40 + latMin) / 60, lon: -(4 + lonMinW / 60) }
}

type MinPt = [latMin: number, lonMinW: number]

// Island coastline, clockwise from the north tip. The dent on the south
// coast is Kerran Bay with the harbour.
const ISLAND_OUTLINE: MinPt[] = [
  [10.2, 12.0], [10.0, 10.8], [9.6, 9.6], [9.3, 8.4], [8.8, 7.6], [8.0, 7.0],
  [7.3, 6.6], [7.0, 6.3], [6.6, 6.8], [6.1, 7.6], [5.7, 8.6], [5.3, 9.4],
  [5.0, 10.4], [5.05, 10.9], [5.55, 11.15], [5.65, 11.65], [5.0, 11.9],
  [4.9, 12.6], [5.1, 13.6], [5.3, 14.6], [5.8, 15.6], [6.4, 16.6], [7.2, 17.3],
  [8.0, 17.0], [8.7, 16.2], [9.3, 15.0], [9.8, 13.8], [10.1, 12.8],
]

const ISLAND_CENTRE: MinPt = [7.6, 12.0]

// Nautical-mile space: x east-positive. One minute of longitude here is
// cos(latitude) miles; the chart is small enough for a single factor.
const COS_MID = Math.cos(((49 + 46 / 60) * Math.PI) / 180)

// Integer hash rather than Math.sin, so server and browser agree exactly.
function seeded(i: number): number {
  let t = (i * 0x9e3779b1) >>> 0
  t = Math.imul(t ^ (t >>> 16), 0x85ebca6b) >>> 0
  t = Math.imul(t ^ (t >>> 13), 0xc2b2ae35) >>> 0
  return ((t ^ (t >>> 16)) >>> 0) / 4294967296
}

// A natural-looking coast: split each edge, nudge the new points sideways
// by a deterministic amount, then round the corners (Chaikin).
function roughen(outline: MinPt[]): MinPt[] {
  const split: MinPt[] = []
  outline.forEach((a, i) => {
    const b = outline[(i + 1) % outline.length]!
    const dy = b[0] - a[0]
    const dx = (b[1] - a[1]) * COS_MID
    const len = Math.hypot(dx, dy) || 1
    const steps = 4
    for (let s = 0; s < steps; s++) {
      const f = s / steps
      let lat = a[0] + dy * f
      let lonW = a[1] + (b[1] - a[1]) * f
      if (s > 0) {
        const amp = Math.min(0.07, 0.06 * len) * (seeded(i * 7 + s + 500) * 2 - 1)
        lat += (dx / len) * amp
        lonW += ((-dy / len) * amp) / COS_MID
      }
      split.push([lat, lonW])
    }
  })
  const smooth: MinPt[] = []
  split.forEach((p, i) => {
    const q = split[(i + 1) % split.length]!
    smooth.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25])
    smooth.push([p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75])
  })
  return smooth
}

const ISLAND = roughen(ISLAND_OUTLINE)
function toNm([latMin, lonMinW]: MinPt): [number, number] {
  return [-lonMinW * COS_MID, latMin]
}
function fromNm([x, y]: [number, number]): MinPt {
  return [y, -x / COS_MID]
}

const CENTRE_NM = toNm(ISLAND_CENTRE)
const ISLAND_NM = ISLAND.map(toNm)

/** Coastline polygon scaled about the island centre (k = 1 is the coast). */
export function islandRing(k: number): LatLon[] {
  return ISLAND_NM.map(([x, y]) => {
    const [lat, lon] = fromNm([CENTRE_NM[0] + (x - CENTRE_NM[0]) * k, CENTRE_NM[1] + (y - CENTRE_NM[1]) * k])
    return km(lat, lon)
  })
}

// Largest distance from the centre to the coast along a ray (handles
// the bay, where a ray crosses the coast more than once).
function coastRadius(angle: number): number {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  let best = 0
  for (let i = 0; i < ISLAND_NM.length; i++) {
    const [ax, ay] = ISLAND_NM[i]!
    const [bx, by] = ISLAND_NM[(i + 1) % ISLAND_NM.length]!
    const ex = bx - ax
    const ey = by - ay
    const ox = ax - CENTRE_NM[0]
    const oy = ay - CENTRE_NM[1]
    const det = ex * dy - ey * dx
    if (Math.abs(det) < 1e-12) continue
    const t = (ex * oy - ey * ox) / det // distance along the ray
    const u = (dx * oy - dy * ox) / det // position along the edge
    if (t > 0 && u >= 0 && u <= 1) best = Math.max(best, t)
  }
  return best
}

/** A point on the ray from the island centre at a true bearing, k × the coast radius. */
function coastPoint(bearing: number, k: number): MinPt {
  const a = ((90 - bearing) * Math.PI) / 180
  const r = coastRadius(a) * k
  return fromNm([CENTRE_NM[0] + r * Math.cos(a), CENTRE_NM[1] + r * Math.sin(a)])
}

/** Normalised distance from the island centre: < 1 is (roughly) land. */
function islandR(p: MinPt): number {
  const [x, y] = toNm(p)
  const dx = x - CENTRE_NM[0]
  const dy = y - CENTRE_NM[1]
  const r = Math.hypot(dx, dy)
  return r / coastRadius(Math.atan2(dy, dx))
}

// Depth profile around the island: drying between the coast (k = 1) and
// k = 1.06, then deepening towards ~40 m offshore.
const DRYING_EDGE = 1.06
function islandDepth(k: number): number {
  if (k < 1) return -3
  if (k < DRYING_EDGE) return -1.6 + (1.6 * (k - 1)) / (DRYING_EDGE - 1)
  return 40 * (1 - Math.exp(-(k - DRYING_EDGE) / 0.6))
}

/** k (scale of the coastline) at which the island profile reaches a depth. */
export function islandContourK(depth: number): number {
  return DRYING_EDGE - 0.6 * Math.log(1 - depth / 40)
}

// Brennan Bank: an elliptical shoal, least depth 2.1 m.
export const BANK = { centre: [3.0, 5.6] as MinPt, rLat: 1.1, rLonW: 1.7, least: 2.1, slope: 25 }
function bankR([latMin, lonMinW]: MinPt): number {
  return Math.hypot((latMin - BANK.centre[0]) / BANK.rLat, (lonMinW - BANK.centre[1]) / BANK.rLonW)
}
export function bankContourR(depth: number): number {
  return Math.sqrt(Math.max(0, depth - BANK.least) / BANK.slope)
}

/** Ring for a bank contour, as LatLon points. */
export function bankRing(depth: number, steps = 48): LatLon[] {
  const r = bankContourR(depth)
  return Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2
    return km(BANK.centre[0] + r * BANK.rLat * Math.sin(a), BANK.centre[1] + r * BANK.rLonW * Math.cos(a))
  })
}

/**
 * Charted depth in metres below chart datum at a point; negative values
 * are drying heights (above chart datum). Land returns null.
 */
export function depthAt(p: MinPt): number | null {
  const k = islandR(p)
  if (k < 1) return null
  let d = islandDepth(k)
  const b = bankR(p)
  d = Math.min(d, BANK.least + BANK.slope * b * b)
  // Deeper water in the south of the chart, beyond the contoured area.
  if (p[0] < 2) d += (2 - p[0]) * 4
  return d
}

export function isLand(p: LatLon): boolean {
  const latMin = (p.lat - 49 - 40 / 60) * 60
  const lonMinW = (-p.lon - 4) * 60
  return islandR([latMin, lonMinW]) < 1
}

export interface Sounding {
  at: LatLon
  /** Metres below chart datum; negative = drying height. */
  depth: number
}

// Keep soundings off the rocks, the harbour and the compass rose.
const SOUNDING_EXCLUSIONS: Array<{ c: MinPt; r: number }> = [
  { c: [7.1, 4.95], r: 0.7 },   // The Teeth
  { c: [4.0, 15.0], r: 0.5 },   // Mew Rock
  { c: [5.2, 11.4], r: 0.75 },  // Kerran Bay / harbour
  { c: [2.0, 21.0], r: 2.4 },   // compass rose
  { c: [11.0, 21.0], r: 1.4 },  // title block
  { c: [1.4, 16.5], r: 0.45 },  // wreck
  { c: [6.85, 18.25], r: 0.55 }, // Head Ledge
]

/** Soundings on a jittered grid, deterministic so the chart never changes. */
export const SOUNDINGS: Sounding[] = (() => {
  const out: Sounding[] = []
  let i = 0
  for (let latMin = 0.6; latMin < 11.6; latMin += 0.9) {
    for (let lonMinW = 0.8; lonMinW < 23.4; lonMinW += 1.25) {
      i++
      const p: MinPt = [latMin + (seeded(i) - 0.5) * 0.5, lonMinW + (seeded(i + 999) - 0.5) * 0.7]
      if (SOUNDING_EXCLUSIONS.some(({ c, r }) => Math.hypot(p[0] - c[0], (p[1] - c[1]) * COS_MID) < r)) continue
      const d = depthAt(p)
      if (d === null || islandR(p) < 1.015) continue
      out.push({ at: km(p[0], p[1]), depth: d < 21 ? Math.round(d * 10) / 10 : Math.round(d) })
    }
  }
  // Hand-placed soundings that lessons refer to: the bank's least depth,
  // drying heights on the foreshore and depths in the approach channel.
  out.push({ at: km(BANK.centre[0], BANK.centre[1]), depth: BANK.least })
  const extra: MinPt[] = [
    coastPoint(150, 1.025), coastPoint(25, 1.03), coastPoint(250, 1.035),
    [4.4, 11.5], [3.6, 11.5],
  ]
  for (const p of extra) {
    const d = depthAt(p)
    if (d !== null) out.push({ at: km(p[0], p[1]), depth: Math.round(d * 10) / 10 })
  }
  return out
})()

export type FeatureKind =
  | 'port-mark' | 'starboard-mark' | 'cardinal-north' | 'cardinal-east' | 'cardinal-south' | 'cardinal-west'
  | 'safe-water' | 'isolated-danger' | 'special-mark'
  | 'lighthouse' | 'leading-light' | 'rock-drying' | 'rock-awash' | 'wreck' | 'church' | 'mast' | 'tower'
  | 'spot-height' | 'anchorage' | 'harbour'

export interface ChartFeature {
  id: string
  kind: FeatureKind
  name: string
  at: LatLon
  /** Light characteristic as printed, e.g. "Fl(3)10s28m15M". */
  light?: string
  /** Plain-English explanation shown in chart tours. */
  note: string
  /** Least depth over a wreck or obstruction, metres below chart datum. */
  depth?: number
  /** Drying height of a rock, metres above chart datum. */
  dries?: number
}

export const FEATURES: ChartFeature[] = [
  { id: 'gull-point-lt', kind: 'lighthouse', name: 'Gull Point lighthouse', at: km(7.0, 6.35),
    light: 'Fl(3)10s28m15M', note: 'A white light flashing in groups of three every 10 seconds, 28 m above MHWS, visible 15 miles.' },
  { id: 'kerran-head-lt', kind: 'lighthouse', name: 'Kerran Head light', at: km(7.2, 17.25),
    light: 'Iso4s18m10M', note: 'An isophase light: equal periods of light and dark, a 4-second cycle, 18 m high, range 10 miles.' },
  { id: 'teeth', kind: 'rock-awash', name: 'The Teeth', at: km(7.1, 4.95),
    note: 'Rocks that are awash at chart datum: a serious danger. Give them a wide berth.' },
  { id: 'east-teeth', kind: 'cardinal-east', name: 'East Teeth buoy', at: km(7.0, 4.15),
    light: 'Q(3)10s', note: 'East cardinal mark: safe water lies to its EAST. It guards the eastern side of The Teeth.' },
  { id: 'mew-rock', kind: 'isolated-danger', name: 'Mew Rock beacon', at: km(4.0, 15.0), dries: 1.2,
    light: 'Fl(2)5s', note: 'Isolated danger mark on Mew Rock, which dries 1.2 m. There is navigable water all around it.' },
  { id: 'kerran-approach', kind: 'safe-water', name: 'Kerran Approach buoy', at: km(2.2, 11.5),
    light: 'LFl10s', note: 'Safe water mark: navigable water all around. The usual starting point for the harbour approach.' },
  { id: 'no1', kind: 'starboard-mark', name: 'No 1 buoy', at: km(3.8, 11.08),
    light: 'Fl G 5s', note: 'Starboard-hand mark (green, conical). Entering harbour, keep it on your starboard (right) side.' },
  { id: 'no2', kind: 'port-mark', name: 'No 2 buoy', at: km(3.8, 11.92),
    light: 'Fl R 5s', note: 'Port-hand mark (red, can-shaped). Entering harbour, keep it on your port (left) side.' },
  { id: 'no3', kind: 'starboard-mark', name: 'No 3 buoy', at: km(4.45, 11.12),
    light: 'Fl(2) G 5s', note: 'Starboard-hand mark at the inner end of the approach channel.' },
  { id: 'no4', kind: 'port-mark', name: 'No 4 buoy', at: km(4.45, 11.88),
    light: 'Fl(2) R 5s', note: 'Port-hand mark at the inner end of the approach channel.' },
  { id: 'wreck', kind: 'wreck', name: 'Wreck', at: km(1.4, 16.5), depth: 4.2,
    note: 'A dangerous wreck with 4.2 m of water over it at chart datum.' },
  { id: 'harbour', kind: 'harbour', name: 'Port Kerran', at: km(5.3, 11.4),
    note: 'A small harbour at the head of Kerran Bay, approached from the south between Nos 1–4 buoys.' },
  { id: 'church', kind: 'church', name: 'Church spire', at: km(6.6, 11.6),
    note: 'A conspicuous church spire: a good landmark for hand-bearing compass fixes.' },
  { id: 'mast', kind: 'mast', name: 'Radio mast', at: km(8.6, 13.2),
    note: 'A radio mast with red obstruction lights: another conspicuous landmark.' },
  { id: 'tower', kind: 'tower', name: 'Old tower', at: km(9.0, 9.4),
    note: 'A conspicuous old tower on the north-east of the island.' },
  { id: 'beacon-hill', kind: 'spot-height', name: 'Beacon Hill 87 m', at: km(8.0, 12.4),
    note: 'The highest point of the island. Heights on land are above MHWS.' },
  { id: 'n-teeth', kind: 'cardinal-north', name: 'North Teeth buoy', at: km(7.8, 4.95),
    light: 'Q', note: 'North cardinal mark: safe water lies to its NORTH. It guards the northern side of The Teeth.' },
  { id: 's-brennan', kind: 'cardinal-south', name: 'South Brennan buoy', at: km(2.0, 5.6),
    light: 'Q(6)+LFl15s', note: 'South cardinal mark: safe water lies to its SOUTH. It marks the southern edge of Brennan Bank.' },
  { id: 'head-ledge', kind: 'rock-awash', name: 'Head Ledge', at: km(6.85, 18.25),
    note: 'A ledge of rocks awash at chart datum, off Kerran Head. Keep well clear.' },
  { id: 'w-ledge', kind: 'cardinal-west', name: 'West Ledge buoy', at: km(6.75, 19.05),
    light: 'Q(9)15s', note: 'West cardinal mark: safe water lies to its WEST. It guards the western side of Head Ledge.' },
  { id: 'outfall', kind: 'special-mark', name: 'Outfall buoy', at: km(9.2, 6.7),
    light: 'Fl Y 5s', note: 'Special mark (yellow, with a yellow X topmark): it marks the end of an outfall pipe, not a danger to navigation as such.' },
  { id: 'ldg-front', kind: 'leading-light', name: 'Front leading light', at: km(5.75, 11.5),
    light: 'Oc 4s 6m 5M', note: 'The front of the Port Kerran leading lights. Keep the two lights in line, one above the other, bearing 000°T, to come up the channel.' },
  { id: 'ldg-rear', kind: 'leading-light', name: 'Rear leading light', at: km(6.1, 11.5),
    light: 'Oc 4s 14m 5M', note: 'The rear leading light stands higher than the front one, so when you are on the line the two appear one above the other.' },
  { id: 'anchorage', kind: 'anchorage', name: 'Kerran Roads anchorage', at: km(10.9, 12.3),
    note: 'A recommended anchorage north of the island, sheltered from southerly winds.' },
]

export function feature(id: string): ChartFeature {
  const f = FEATURES.find((x) => x.id === id)
  if (!f) throw new Error(`unknown chart feature ${id}`)
  return f
}

/** Contour depths drawn on the chart, with the island scale factor or bank radius. */
export const CONTOUR_DEPTHS = [2, 5, 10, 20]

/**
 * Deviation card for the course's yacht, by compass heading (ship's head
 * °C). East positive, west negative. A typical small-yacht card: a few
 * degrees either way, varying smoothly round the compass.
 */
export const DEVIATION_CARD: Array<{ heading: number; deviation: number }> = [
  { heading: 0, deviation: -2 },
  { heading: 45, deviation: 1 },
  { heading: 90, deviation: 4 },
  { heading: 135, deviation: 5 },
  { heading: 180, deviation: 3 },
  { heading: 225, deviation: 0 },
  { heading: 270, deviation: -3 },
  { heading: 315, deviation: -4 },
]

/** Deviation for a compass heading, interpolated linearly between card entries. */
export function deviationFor(compassHeading: number): number {
  const h = ((compassHeading % 360) + 360) % 360
  const i = Math.floor(h / 45)
  const a = DEVIATION_CARD[i]!
  const b = DEVIATION_CARD[(i + 1) % DEVIATION_CARD.length]!
  const f = (h - a.heading) / 45
  return Math.round((a.deviation + (b.deviation - a.deviation) * f) * 10) / 10
}

/** Port Kerran leading line: the leading lights in line bearing 000°T, from seaward of No 1/No 2 into the bay. */
export const LEADING_LINE = { from: km(2.6, 11.5), bearing: 0, label: 'Ldg Lts 000°', light: 'Oc 4s' }

/**
 * Compass course to steer for a magnetic course, using the deviation card:
 * finds C such that C + deviation(C) = magnetic (the card is by compass
 * heading). Variation is applied separately (true → magnetic first).
 */
export function compassCourseFor(magneticCourse: number): { compass: number; deviation: number } {
  let c = magneticCourse
  for (let i = 0; i < 8; i++) c = (((magneticCourse - deviationFor(c)) % 360) + 360) % 360
  return { compass: c, deviation: deviationFor(c) }
}
