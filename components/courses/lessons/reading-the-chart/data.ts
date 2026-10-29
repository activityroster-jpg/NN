// Figures this lesson quotes, read from the practice-chart data so the
// notes, widgets, video and exercises always agree with what is drawn.
// Ported from the Boaty Jobs "chart symbols and depths" lesson (section.ts),
// without its tidal cross-section.

import { rhumbBearing, rhumbDistance, type LatLon } from '@/lib/courses/geo'
import { BANK, FEATURES, SOUNDINGS, depthAt, feature, km, type ChartFeature, type Sounding } from '@/lib/courses/navigation/practice-chart'

/** Lat/lon → (minutes north of 49°40'N, minutes west of 004°00'W), as practice-chart.ts uses. */
export function toMin(p: LatLon): [number, number] {
  return [(p.lat - 49 - 40 / 60) * 60, (-p.lon - 4) * 60]
}

function noteNumber(text: string, re: RegExp): number {
  const m = text.match(re)
  if (!m) throw new Error(`chart note "${text}" has no figure for ${re}`)
  return Number(m[1])
}

function required(value: number | undefined, what: string): number {
  if (value === undefined) throw new Error(`practice chart has no ${what}`)
  return value
}

/** Mew Rock's drying height (printed underlined beside the rock). */
export const MEW_DRIES = required(feature('mew-rock').dries, 'drying height for Mew Rock')
/** Least depth over the wreck at chart datum. */
export const WRECK_DEPTH = required(feature('wreck').depth, 'depth over the wreck')
/** Beacon Hill's height above MHWS. */
export const HILL_HEIGHT = noteNumber(feature('beacon-hill').name, /(\d+) m/)
/** Gull Point light's elevation above MHWS, from its characteristic. */
export const GULL_ELEVATION = noteNumber(feature('gull-point-lt').light ?? '', /(\d+)m/)
/** Brennan Bank's least depth. */
export const BANK_LEAST = BANK.least
export const BANK_AT = km(BANK.centre[0], BANK.centre[1])

const TOWER = feature('tower').at

/** The drying height nearest the old tower: the foreshore on the north coast. */
export const DRYING: Sounding = SOUNDINGS.filter((s) => s.depth < 0).reduce((a, b) =>
  rhumbDistance(b.at, TOWER) < rhumbDistance(a.at, TOWER) ? b : a,
)

const [DRY_LAT, LINE_LON] = toMin(DRYING.at)

/** The deepest sounding printed just north of the drying height (a depth with tenths, such as 13₉). */
export const OFFSHORE: Sounding = SOUNDINGS.filter((s) => {
  const [lat, lon] = toMin(s.at)
  return s.depth > 0 && s.depth < 21 && Math.abs(lon - LINE_LON) < 0.06 && lat > DRY_LAT && lat < DRY_LAT + 1
}).reduce((a, b) => (b.depth > a.depth ? b : a))

/** A deep sounding near OFFSHORE, printed in whole metres. */
export const DEEP: Sounding = SOUNDINGS.filter((s) => s.depth >= 21).reduce((a, b) =>
  rhumbDistance(b.at, OFFSHORE.at) < rhumbDistance(a.at, OFFSHORE.at) ? b : a,
)

/** "1.4" style figure. */
export const m1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1)

const UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

/** A figure in words for the narration: 13.9 → "thirteen point nine", 87 → "eighty-seven". */
export function say(n: number): string {
  const v = Math.abs(n)
  const whole = Math.floor(v + 1e-9)
  const tenth = Math.round((v - whole) * 10)
  const w = whole < 20 ? UNITS[whole]! : TENS[Math.floor(whole / 10)]! + (whole % 10 ? `-${UNITS[whole % 10]!}` : '')
  return tenth ? `${w} point ${UNITS[tenth]!}` : w
}

/* ------------------------------------------------------------------ */
/* Reading a bay: four places to stop round the island                 */
/* ------------------------------------------------------------------ */

export type Seabed = 'S' | 'M' | 'Wd' | 'R' | 'Sh'

export const SEABED: Record<Seabed, { name: string; holding: 'good' | 'fair' | 'poor'; note: string }> = {
  S: { name: 'Sand', holding: 'good', note: 'The anchor digs in and holds. What you are looking for.' },
  M: { name: 'Mud', holding: 'good', note: 'Usually holds well once the anchor has buried itself; very soft mud can drag.' },
  Wd: { name: 'Weed (often seagrass)', holding: 'poor', note: 'The anchor skids over the top or holds a clump of weed, not the seabed. Seagrass is protected in much of the Mediterranean.' },
  R: { name: 'Rock', holding: 'poor', note: 'Nothing to dig into, and an anchor can jam in a crevice.' },
  Sh: { name: 'Shells', holding: 'fair', note: 'Mixed: sometimes fine, sometimes the anchor skates over a hard crust.' },
}

/** Compass point names used for wind directions. */
export const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const
export type Point = (typeof POINTS)[number]
export const POINT_NAMES: Record<Point, string> = {
  N: 'north', NE: 'north-east', E: 'east', SE: 'south-east', S: 'south', SW: 'south-west', W: 'west', NW: 'north-west',
}
export const pointBearing = (p: Point) => POINTS.indexOf(p) * 45

/** The middle of the island, from which each stop's side of the island is judged. */
export const ISLAND_CENTRE = km(7.6, 12.0)

export interface BayStop {
  id: string
  name: string
  at: LatLon
  /** Seabed written on this lesson's overlay (the practice chart itself prints none). */
  seabed: Seabed
  /** Charted depth at the spot, metres below chart datum. */
  depth: number
  /** True bearing of the spot from the island centre: the side of the island it is on. */
  side: number
}

const DANGER_KINDS: ChartFeature['kind'][] = ['rock-awash', 'rock-drying', 'isolated-danger', 'wreck']

function stop(id: string, name: string, latMin: number, lonMinW: number, seabed: Seabed): BayStop {
  const at = km(latMin, lonMinW)
  return { id, name, at, seabed, depth: Math.round((depthAt([latMin, lonMinW]) ?? 0) * 10) / 10, side: rhumbBearing(ISLAND_CENTRE, at) }
}

export const BAY_STOPS: BayStop[] = [
  stop('roads', 'Kerran Roads (north)', 10.65, 11.6, 'S'),
  stop('east', 'East shore, north of Gull Point', 8.2, 6.5, 'Wd'),
  stop('south', 'Kerran Bay, west side (south)', 4.5, 14.0, 'S'),
  stop('west', 'Under Kerran Head (west)', 7.6, 18.0, 'R'),
]

/** Charted dangers within `radius` miles of a point, nearest first. */
export function dangersNear(at: LatLon, radius = 1.5): Array<{ f: ChartFeature; miles: number }> {
  return FEATURES.filter((f) => DANGER_KINDS.includes(f.kind))
    .map((f) => ({ f, miles: rhumbDistance(f.at, at) }))
    .filter((x) => x.miles <= radius)
    .sort((a, b) => a.miles - b.miles)
}

/** Smallest angle between two bearings, 0 to 180. */
function apart(a: number, b: number): number {
  const d = Math.abs((((a - b) % 360) + 360) % 360)
  return d > 180 ? 360 - d : d
}

export type Shelter = 'sheltered' | 'partly' | 'exposed'

/** Shelter at a stop from a wind blowing FROM `windFrom`: good when the island lies between the wind and you. */
export function shelterAt(s: BayStop, windFrom: number): Shelter {
  const d = apart(s.side, windFrom)
  if (d >= 120) return 'sheltered'
  if (d >= 60) return 'partly'
  return 'exposed'
}
