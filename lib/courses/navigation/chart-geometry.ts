// Mercator projection for the practice chart, in SVG pixels. Pure
// functions so server-rendered lesson text, client widgets and the lesson
// player all place things identically.

import { inverseMercatorY, mercatorY, type LatLon } from '../geo'
import { CHART_BOUNDS } from './practice-chart'

const DEG = Math.PI / 180

/** Pixels per degree of longitude (24' of longitude ≈ 904 px). */
export const PX_PER_DEG_LON = 2260
/** Border around the plotting area for the latitude/longitude scales. */
export const CHART_MARGIN = 36

const Y_NORTH = mercatorY(CHART_BOUNDS.north)

// Rounded, so the server and the browser agree to the digit (trig can differ in the last place, which breaks hydration).
export const PLOT_WIDTH = Math.round((CHART_BOUNDS.east - CHART_BOUNDS.west) * PX_PER_DEG_LON * 100) / 100
export const PLOT_HEIGHT = Math.round(((Y_NORTH - mercatorY(CHART_BOUNDS.south)) / DEG) * PX_PER_DEG_LON * 100) / 100
export const CHART_WIDTH = PLOT_WIDTH + 2 * CHART_MARGIN
export const CHART_HEIGHT = PLOT_HEIGHT + 2 * CHART_MARGIN

export interface Pt {
  x: number
  y: number
}

// Rounded to 1/100 px: Math.log/tan can differ in the last bits between
// the server and the browser, which would break hydration.
export const r2 = (n: number) => Math.round(n * 100) / 100

export function project(p: LatLon): Pt {
  return {
    x: r2(CHART_MARGIN + (p.lon - CHART_BOUNDS.west) * PX_PER_DEG_LON),
    y: r2(CHART_MARGIN + ((Y_NORTH - mercatorY(p.lat)) / DEG) * PX_PER_DEG_LON),
  }
}

export function unproject({ x, y }: Pt): LatLon {
  return {
    lon: CHART_BOUNDS.west + (x - CHART_MARGIN) / PX_PER_DEG_LON,
    lat: inverseMercatorY(Y_NORTH - ((y - CHART_MARGIN) / PX_PER_DEG_LON) * DEG),
  }
}

/** Pixels per nautical mile (= per minute of latitude) at a latitude. */
export function pxPerNm(lat: number): number {
  return PX_PER_DEG_LON / 60 / Math.cos(lat * DEG)
}

export function polyPoints(ring: LatLon[]): string {
  return ring.map((p) => {
    const { x, y } = project(p)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

/** A rectangle in chart pixels: what the SVG viewBox shows. */
export interface ViewRect {
  x: number
  y: number
  w: number
  h: number
}

export const FULL_VIEW: ViewRect = { x: 0, y: 0, w: CHART_WIDTH, h: CHART_HEIGHT }

/**
 * A view centred on a position, `widthNm` miles across, at a given
 * aspect ratio (w / h). Clamped so it never shows beyond the chart.
 */
export function viewAround(centre: LatLon, widthNm: number, aspect = CHART_WIDTH / CHART_HEIGHT): ViewRect {
  const c = project(centre)
  // 1 nm east-west is 1/cos(lat) minutes of longitude.
  let w = (widthNm / Math.cos(centre.lat * DEG)) * (PX_PER_DEG_LON / 60)
  let h = w / aspect
  if (w > CHART_WIDTH) { w = CHART_WIDTH; h = w / aspect }
  if (h > CHART_HEIGHT) { h = CHART_HEIGHT; w = h * aspect }
  const x = Math.min(Math.max(c.x - w / 2, 0), CHART_WIDTH - w)
  const y = Math.min(Math.max(c.y - h / 2, 0), CHART_HEIGHT - h)
  return { x, y, w, h }
}

export function lerpView(a: ViewRect, b: ViewRect, t: number): ViewRect {
  const k = Math.min(1, Math.max(0, t))
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, w: a.w + (b.w - a.w) * k, h: a.h + (b.h - a.h) * k }
}

export function viewBoxString(v: ViewRect): string {
  return `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`
}
