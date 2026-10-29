// Chart helpers for the latitude-and-longitude lesson: views that frame a
// position together with the border scales it is read from, the reading
// itself (whole minutes + tenths), and positions at sea for plotting
// practice. Pure functions: safe on the server and in the browser.

import { rhumbDistance, type LatLon } from '@/lib/courses/geo'
import { CHART_HEIGHT, CHART_WIDTH, project, type ViewRect } from '@/lib/courses/navigation/chart-geometry'
import { CHART_BOUNDS, FEATURES, depthAt, km } from '@/lib/courses/navigation/practice-chart'
import { randStep, type Rng } from '@/lib/courses/random'

const ASPECT = CHART_WIDTH / CHART_HEIGHT

/** Minutes of latitude north of 49°00' (the whole chart is in 49°N). */
export function latMinutes(p: LatLon): number {
  return Math.round((p.lat - 49) * 600) / 10
}

/** Minutes of longitude west of 004°00' (the whole chart is in 004°W). */
export function lonMinutesW(p: LatLon): number {
  return Math.round((-p.lon - 4) * 600) / 10
}

/** Split a reading such as 42.2 into the whole-minute mark and tenths beyond it. */
export function splitMinutes(m: number): { whole: number; tenths: number } {
  const whole = Math.floor(m + 1e-9)
  return { whole, tenths: Math.round((m - whole) * 10) }
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const tenthsText = (n: number) => `${n} tenth${n === 1 ? '' : 's'}`

/** How the latitude scale reads for this position, in words. */
export function latReading(p: LatLon): string {
  const { whole, tenths } = splitMinutes(latMinutes(p))
  return tenths === 0 ? `exactly on the ${pad2(whole)}' mark` : `${tenthsText(tenths)} above the ${pad2(whole)}' mark`
}

/** How the longitude scale reads (minutes increase to the left, westwards). */
export function lonReading(p: LatLon): string {
  const { whole, tenths } = splitMinutes(lonMinutesW(p))
  return tenths === 0 ? `exactly on the ${pad2(whole)}' mark` : `${tenthsText(tenths)} to the left (west) of the ${pad2(whole)}' mark`
}

/** The nearer side border (latitude scale) and top/bottom border (longitude scale). */
export function nearestScales(p: LatLon): { side: 'left' | 'right'; edge: 'top' | 'bottom'; sideLon: number; edgeLat: number } {
  const q = project(p)
  const side = q.x < CHART_WIDTH / 2 ? 'left' : 'right'
  const edge = q.y < CHART_HEIGHT / 2 ? 'top' : 'bottom'
  return {
    side,
    edge,
    sideLon: side === 'left' ? CHART_BOUNDS.west : CHART_BOUNDS.east,
    edgeLat: edge === 'top' ? CHART_BOUNDS.north : CHART_BOUNDS.south,
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

/** About two-thirds of the chart, anchored at the corner nearest the position: it shows both scales. */
export function regionView(p: LatLon, frac = 0.66): ViewRect {
  const { side, edge } = nearestScales(p)
  const w = CHART_WIDTH * frac
  const h = CHART_HEIGHT * frac
  return { x: side === 'left' ? 0 : CHART_WIDTH - w, y: edge === 'top' ? 0 : CHART_HEIGHT - h, w, h }
}

/** A close-up of the latitude scale level with the position. */
export function latScaleView(p: LatLon, w = 170, aspect = ASPECT): ViewRect {
  const { side } = nearestScales(p)
  const h = w / aspect
  const y = clamp(project(p).y - h / 2, 0, CHART_HEIGHT - h)
  return { x: side === 'left' ? 0 : CHART_WIDTH - w, y, w, h }
}

/** A close-up of the longitude scale above or below the position. */
export function lonScaleView(p: LatLon, w = 170, aspect = ASPECT): ViewRect {
  const { edge } = nearestScales(p)
  const h = w / aspect
  const x = clamp(project(p).x - w / 2, 0, CHART_WIDTH - w)
  return { x, y: edge === 'top' ? 0 : CHART_HEIGHT - h, w, h }
}

// One minute of longitude is cos(latitude) miles here.
const COS_LAT = Math.cos(((49 + 46 / 60) * Math.PI) / 180)

/** Open water well clear of the island, symbols, the title block and the compass rose. */
export function clearForPlotting(latMin: number, lonMinW: number): boolean {
  const d = depthAt([latMin, lonMinW])
  if (d === null || d < 3) return false
  if (latMin > 10.0 && lonMinW > 17.2) return false // title block
  if (Math.hypot(latMin - 2.0, (lonMinW - 21.0) * COS_LAT) < 2.3) return false // compass rose
  const p = km(latMin, lonMinW)
  return !FEATURES.some((f) => rhumbDistance(f.at, p) < 0.6)
}

/** A random position at sea, to a tenth of a minute, inside the chart. */
export function randomSeaPosition(rng: Rng): LatLon {
  for (let i = 0; i < 400; i++) {
    const latMin = randStep(rng, 0.6, 11.4, 0.1)
    const lonW = randStep(rng, 0.6, 23.4, 0.1)
    if (clearForPlotting(latMin, lonW)) return km(Math.round(latMin * 10) / 10, Math.round(lonW * 10) / 10)
  }
  return km(9.4, 5.3)
}

/** Fixed positions for the "plot this position" widget in the notes. */
export const PLOT_TARGETS: LatLon[] = [
  km(9.4, 5.3),
  km(3.4, 8.6),
  km(6.2, 21.5),
  km(0.9, 13.4),
  km(11.2, 15.6),
  km(4.7, 4.1),
]

/** The worked plotting example used in the video and the notes. */
export const PLOT_EXAMPLE = km(10.6, 8.2)
/** The marked position read in the video. */
export const READ_EXAMPLE = km(9.7, 4.6)

const BUOY = 'A buoy’s position is the middle of the foot of its symbol.'
const BUOY_CIRCLE = 'A buoy’s position is the small circle at the foot of its symbol.'
const LANDMARK = 'A landmark’s position is the small circle (or dot) at the foot of its symbol.'

/** Features whose charted position reads cleanly to a tenth of a minute, with where to measure from. */
export const READABLE_FEATURES: Array<{ id: string; label: string; hint: string }> = [
  { id: 'kerran-approach', label: 'the Kerran Approach buoy', hint: BUOY },
  { id: 'no1', label: 'the No 1 buoy', hint: BUOY_CIRCLE },
  { id: 'no2', label: 'the No 2 buoy', hint: BUOY_CIRCLE },
  { id: 'church', label: 'the church spire', hint: LANDMARK },
  { id: 'mast', label: 'the radio mast', hint: LANDMARK },
  { id: 'tower', label: 'the old tower', hint: LANDMARK },
  { id: 'wreck', label: 'the wreck', hint: 'Its position is the centre of the dotted outline.' },
  { id: 'beacon-hill', label: 'the summit of Beacon Hill', hint: 'Its position is the dot beside the height, 87.' },
]
