// Where things are on the practice chart, in chart pixels, for this
// lesson's overlays (scenes and widgets). Values that PracticeChart draws
// internally (title block, border width) are mirrored here; everything
// else is computed from the chart data. Client modules only: it imports
// constants from PracticeChart.

import { rhumbDistance, type LatLon } from '@/lib/courses/geo'
import {
  CHART_HEIGHT, CHART_MARGIN, CHART_WIDTH, PLOT_HEIGHT, PLOT_WIDTH, project, r2, type Pt, type ViewRect,
} from '@/lib/courses/navigation/chart-geometry'
import { BANK, CHART_BOUNDS, SOUNDINGS, feature, km } from '@/lib/courses/navigation/practice-chart'
import { ROSE_CENTRE, ROSE_RADIUS } from '../../PracticeChart'
import { bandStretches, type MinPt } from './bands'

export { VARIATION } from './bands'

export const X0 = CHART_MARGIN
export const Y0 = CHART_MARGIN
export const X1 = CHART_MARGIN + PLOT_WIDTH
export const Y1 = CHART_MARGIN + PLOT_HEIGHT
/** Width of the latitude/longitude border scales (PracticeChart's Border). */
export const BORDER = 12

/** The title block as PracticeChart draws it, and the baselines of its lines. */
export const TITLE_BLOCK = { x: X0 + 10, y: Y0 + 10, w: 226, h: 88 }
export const TITLE_LINES = {
  name: Y0 + 29,
  fictional: Y0 + 43,
  notForNav: Y0 + 57,
  depths: Y0 + 71,
  heights: Y0 + 82,
  scale: Y0 + 93,
}

export const ROSE = project(ROSE_CENTRE)
export const ROSE_OUTER = ROSE_RADIUS
/** The magnetic (inner) ring sits 30 px inside the true ring. */
export const ROSE_INNER = ROSE_RADIUS - 30

/** Chart y of a latitude given as minutes past 49°00'N. */
export function latY(minutes: number): number {
  return project({ lat: 49 + minutes / 60, lon: CHART_BOUNDS.west }).y
}

/** A point at a true bearing and radius from a centre (rounded for hydration). */
export function polar(c: Pt, r: number, bearing: number): Pt {
  const a = (bearing * Math.PI) / 180
  return { x: r2(c.x + r * Math.sin(a)), y: r2(c.y - r * Math.cos(a)) }
}

/** A view `w` chart pixels wide, centred where possible, never beyond the chart. */
export function frame(cx: number, cy: number, w: number, aspect = CHART_WIDTH / CHART_HEIGHT): ViewRect {
  const h = w / aspect
  return {
    x: Math.min(Math.max(cx - w / 2, 0), CHART_WIDTH - w),
    y: Math.min(Math.max(cy - h / 2, 0), CHART_HEIGHT - h),
    w,
    h,
  }
}

/** A straight line from the south-west coast out to sea, crossing every tint, clear of printed labels. */
export const COLOUR_RAY: [MinPt, MinPt] = [[6.8, 16.5], [4.4, 16.5]]
export const COLOUR_STRETCHES = bandStretches(COLOUR_RAY[0], COLOUR_RAY[1])

/** The drying height (underlined sounding) closest to Port Kerran. */
export const DRYING_SOUNDING = [...SOUNDINGS]
  .filter((s) => s.depth < 0)
  .sort((a, b) => rhumbDistance(a.at, feature('harbour').at) - rhumbDistance(b.at, feature('harbour').at))[0]!

export const BANK_CENTRE: LatLon = km(BANK.centre[0], BANK.centre[1])

/** Numbers printed on the chart, read from the data rather than retyped. */
export const GULL_LIGHT = feature('gull-point-lt')
export const GULL_LIGHT_HEIGHT = Number(GULL_LIGHT.light?.match(/(\d+)m/)?.[1])
export const BEACON_HILL = feature('beacon-hill')
export const BEACON_HILL_HEIGHT = Number(BEACON_HILL.name.match(/(\d+) m/)?.[1])
export const MEW_ROCK_DRIES = Number(feature('mew-rock').note.match(/dries ([\d.]+) m/)?.[1])
