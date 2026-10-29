// Pure SVG drawing helpers for this lesson: an orthographic globe with
// its grid of parallels and meridians, a cross-section showing latitude as
// an angle, and a view from above the North Pole showing longitude. No
// hooks, so they work in the server-rendered notes, client widgets and
// the lesson player alike. Every coordinate is rounded with r2 so the
// server and browser produce identical markup.

import { r2 } from '@/lib/courses/navigation/chart-geometry'

const DEG = Math.PI / 180

/** Where the globe sits on the page, and which point faces the viewer. */
export interface GlobeView {
  cx: number
  cy: number
  r: number
  /** Latitude at the centre of the visible disc. */
  lat0: number
  /** Longitude at the centre of the visible disc (east positive). */
  lon0: number
}

/** Orthographic projection. `z` ≥ 0 means the point faces the viewer. */
export function globePoint(v: GlobeView, lat: number, lon: number): { x: number; y: number; z: number } {
  const p = lat * DEG
  const l = (lon - v.lon0) * DEG
  const p0 = v.lat0 * DEG
  const x = Math.cos(p) * Math.sin(l)
  const y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)
  const z = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l)
  return { x: r2(v.cx + v.r * x), y: r2(v.cy - v.r * y), z }
}

/** Path through [lat, lon] samples, drawing only the side facing the viewer. */
function visiblePath(v: GlobeView, samples: Array<[number, number]>): string {
  let d = ''
  let pen = false
  let prev: [number, number] | null = null
  let prevZ = 0
  const edge = (a: [number, number], b: [number, number], za: number, zb: number) => {
    const f = za / (za - zb)
    return globePoint(v, a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f)
  }
  for (const s of samples) {
    const q = globePoint(v, s[0], s[1])
    if (q.z >= 0) {
      if (!pen) {
        if (prev && prevZ < 0) {
          const e = edge(prev, s, prevZ, q.z)
          d += `M${e.x} ${e.y}L${q.x} ${q.y}`
        } else {
          d += `M${q.x} ${q.y}`
        }
        pen = true
      } else {
        d += `L${q.x} ${q.y}`
      }
    } else if (pen && prev) {
      const e = edge(prev, s, prevZ, q.z)
      d += `L${e.x} ${e.y}`
      pen = false
    }
    prev = s
    prevZ = q.z
  }
  return d
}

function range(from: number, to: number, step: number): number[] {
  const out: number[] = []
  const n = Math.max(1, Math.ceil(Math.abs(to - from) / step))
  for (let i = 0; i <= n; i++) out.push(from + ((to - from) * i) / n)
  return out
}

/** A parallel of latitude (optionally only part of it, between two longitudes). */
export function parallelPath(v: GlobeView, lat: number, fromLon = -180, toLon = 180): string {
  return visiblePath(v, range(fromLon, toLon, 2).map((lon) => [lat, lon]))
}

/** A meridian (optionally only part of it, between two latitudes). */
export function meridianPath(v: GlobeView, lon: number, fromLat = -90, toLat = 90): string {
  return visiblePath(v, range(fromLat, toLat, 2).map((lat) => [lat, lon]))
}

/** The globe's disc and outline. */
export function GlobeDisc({ v, fill = '#123a5a', stroke = '#5d8bb0' }: { v: GlobeView; fill?: string; stroke?: string }) {
  return <circle cx={v.cx} cy={v.cy} r={v.r} fill={fill} stroke={stroke} strokeWidth={Math.max(1.5, v.r / 120)} />
}

/** Parallels and meridians every `step` degrees. */
export function GlobeGrid({ v, step = 15, stroke = '#ffffff', opacity = 0.3, width = 1, parallels = true, meridians = true }: {
  v: GlobeView; step?: number; stroke?: string; opacity?: number; width?: number; parallels?: boolean; meridians?: boolean
}) {
  const lats = range(-90 + step, 90 - step, step)
  const lons = range(-180, 180 - step, step)
  return (
    <g fill="none" stroke={stroke} strokeOpacity={opacity} strokeWidth={width}>
      {parallels && lats.map((lat) => <path key={`p${lat}`} d={parallelPath(v, lat)} />)}
      {meridians && lons.map((lon) => <path key={`m${lon}`} d={meridianPath(v, lon)} />)}
    </g>
  )
}

interface DiagramColours {
  ink: string
  muted: string
  lat: string
  lon: string
  point: string
  fill: string
}

export const DARK: DiagramColours = { ink: '#ffffff', muted: '#9fb3c8', lat: '#f5b301', lon: '#2bb3c0', point: '#ff6b5e', fill: '#123a5a' }
export const LIGHT: DiagramColours = { ink: '#1A1A2E', muted: '#6B7280', lat: '#b45309', lon: '#0B5563', point: '#d9342b', fill: '#E0F2F7' }

/**
 * Cross-section through the poles: latitude is the angle between the
 * equator and a line from the Earth's centre to the place.
 */
export function LatitudeSection({ cx, cy, R, angle, size, c = DARK, parallels = false, labels = true }: {
  cx: number; cy: number; R: number; angle: number; size: number; c?: DiagramColours; parallels?: boolean; labels?: boolean
}) {
  const a = angle * DEG
  const px = r2(cx + R * Math.cos(a))
  const py = r2(cy - R * Math.sin(a))
  const ar = R * 0.34
  const ax = r2(cx + ar * Math.cos(a))
  const ay = r2(cy - ar * Math.sin(a))
  const mid = (angle / 2) * DEG
  const lx = r2(cx + ar * 1.45 * Math.cos(mid))
  const ly = r2(cy - ar * 1.45 * Math.sin(mid) + size * 0.35)
  const sw = Math.max(1.5, R / 90)
  return (
    <g>
      <circle cx={cx} cy={cy} r={R} fill={c.fill} stroke={c.ink} strokeOpacity={0.6} strokeWidth={sw} />
      {parallels && [-60, -30, 30, 60].map((lat) => {
        const y = r2(cy - R * Math.sin(lat * DEG))
        const hw = r2(R * Math.cos(lat * DEG))
        return <line key={lat} x1={cx - hw} x2={cx + hw} y1={y} y2={y} stroke={c.lat} strokeWidth={sw * 0.8} strokeOpacity={0.75} strokeDasharray={`${sw * 4} ${sw * 3}`} />
      })}
      <line x1={cx} x2={cx} y1={cy - R - size * 0.4} y2={cy + R + size * 0.4} stroke={c.muted} strokeWidth={sw} strokeDasharray={`${sw * 3} ${sw * 3}`} />
      <line x1={cx - R} x2={cx + R} y1={cy} y2={cy} stroke={c.lat} strokeWidth={sw * 2} />
      {angle > 0.5 && (
        <>
          <line x1={cx} y1={cy} x2={px} y2={py} stroke={c.ink} strokeWidth={sw * 1.4} />
          <path d={`M${r2(cx + ar)} ${cy} A ${r2(ar)} ${r2(ar)} 0 0 0 ${ax} ${ay}`} fill="none" stroke={c.lat} strokeWidth={sw * 1.6} />
          <text x={lx} y={ly} fontSize={size} fontWeight={700} fill={c.lat} textAnchor="start">{Math.round(angle)}°</text>
          <circle cx={px} cy={py} r={sw * 4} fill={c.point} stroke="#fff" strokeWidth={sw} />
        </>
      )}
      <circle cx={cx} cy={cy} r={sw * 2.5} fill={c.ink} />
      {labels && (
        <g fontSize={size} fontWeight={700} textAnchor="middle">
          <text x={cx} y={r2(cy - R - size * 0.7)} fill={c.ink}>90°N</text>
          <text x={cx} y={r2(cy + R + size * 1.45)} fill={c.ink}>90°S</text>
          <text x={r2(cx + R + size * 0.3)} y={r2(cy + size * 0.35)} fill={c.lat} textAnchor="start">0°</text>
        </g>
      )}
    </g>
  )
}

/**
 * The Earth seen from above the North Pole, Greenwich at the bottom:
 * east is anticlockwise (to the right), west clockwise (to the left).
 * `angle` is the longitude shown, east positive.
 */
export function PolarView({ cx, cy, R, angle, size, c = DARK, showAngle = true }: {
  cx: number; cy: number; R: number; angle: number; size: number; c?: DiagramColours; showAngle?: boolean
}) {
  const sw = Math.max(1.5, R / 90)
  const at = (deg: number, r: number) => ({ x: r2(cx + r * Math.sin(deg * DEG)), y: r2(cy + r * Math.cos(deg * DEG)) })
  const p = at(angle, R)
  const ar = R * 0.34
  const a0 = at(0, ar)
  const a1 = at(angle, ar)
  const lab = at(angle, R + size * 0.9)
  const ticks = Array.from({ length: 24 }, (_, i) => i * 15)
  return (
    <g>
      <circle cx={cx} cy={cy} r={R} fill={c.fill} stroke={c.ink} strokeOpacity={0.6} strokeWidth={sw} />
      {ticks.map((d) => {
        const q = at(d, R)
        return <line key={d} x1={cx} y1={cy} x2={q.x} y2={q.y} stroke={c.ink} strokeOpacity={0.18} strokeWidth={sw * 0.7} />
      })}
      <line x1={cx} y1={cy} x2={cx} y2={r2(cy + R)} stroke={c.lon} strokeWidth={sw * 2.2} />
      <line x1={cx} y1={cy} x2={cx} y2={r2(cy - R)} stroke={c.muted} strokeWidth={sw * 1.2} strokeDasharray={`${sw * 4} ${sw * 3}`} />
      {showAngle && Math.abs(angle) > 0.5 && (
        <>
          <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={c.ink} strokeWidth={sw * 1.4} />
          <path d={`M${a0.x} ${a0.y} A ${r2(ar)} ${r2(ar)} 0 ${Math.abs(angle) > 180 ? 1 : 0} ${angle > 0 ? 0 : 1} ${a1.x} ${a1.y}`} fill="none" stroke={c.lon} strokeWidth={sw * 1.6} />
          <text x={lab.x} y={r2(lab.y + size * 0.35)} fontSize={size} fontWeight={700} fill={c.lon} textAnchor={angle > 0 ? 'start' : 'end'}>
            {Math.round(Math.abs(angle))}°{angle > 0 ? 'E' : 'W'}
          </text>
          <circle cx={p.x} cy={p.y} r={sw * 4} fill={c.point} stroke="#fff" strokeWidth={sw} />
        </>
      )}
      <circle cx={cx} cy={cy} r={sw * 3} fill={c.ink} />
      <g fontSize={size} fontWeight={700} textAnchor="middle">
        <text x={cx} y={r2(cy + R + size * 1.3)} fill={c.lon}>0°</text>
        <text x={cx} y={r2(cy - R - size * 0.5)} fill={c.ink}>180°</text>
        <text x={r2(cx + R + size * 0.9)} y={r2(cy + size * 0.35)} fill={c.ink}>E</text>
        <text x={r2(cx - R - size * 0.9)} y={r2(cy + size * 0.35)} fill={c.ink}>W</text>
      </g>
    </g>
  )
}
