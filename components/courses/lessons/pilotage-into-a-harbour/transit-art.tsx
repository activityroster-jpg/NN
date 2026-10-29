// Drawing pieces shared by this lesson's widgets, scenes and exercise
// figures. Pure components (no hooks), so they render identically on the
// server and in the browser; computed coordinates are rounded with r2.

import type { ReactNode } from 'react'
import { norm360, rhumbDestination, reciprocal, type LatLon } from '@/lib/courses/geo'
import { islandRing } from '@/lib/courses/navigation/practice-chart'
import { polyPoints, project, r2 } from '@/lib/courses/navigation/chart-geometry'
import type { Limit } from './transits'

/* ------------------------------------------------------------------ */
/* The view from the boat: two leading lights                          */
/* ------------------------------------------------------------------ */

export const VIEW_W = 640
export const VIEW_H = 280
const HORIZON = 196
/** Width of the view in degrees (about a pair of binoculars). */
export const VIEW_FOV = 8

/** Screen x of the rear light, `offset` degrees right of the front light. */
export function rearX(offset: number): number {
  const px = (offset * VIEW_W) / VIEW_FOV
  return r2(VIEW_W / 2 + Math.max(-VIEW_W / 2 + 40, Math.min(VIEW_W / 2 - 40, px)))
}

function Light({ x, y, on = true }: { x: number; y: number; on?: boolean }) {
  return (
    <g>
      {on && <circle cx={x} cy={y} r={26} fill="#ffe7a3" opacity={0.12} />}
      {on && <circle cx={x} cy={y} r={14} fill="#ffe7a3" opacity={0.28} />}
      <circle cx={x} cy={y} r={7} fill={on ? '#fffbe8' : '#8899aa'} />
    </g>
  )
}

/**
 * Looking at the Port Kerran leading lights from the approach, centred on the
 * front light. `rearOffset` is how far the rear light appears right (+) or
 * left (−) of the front, in degrees. Heights are exaggerated.
 */
export function LightsView({ rearOffset, labels = true, className, title, box }: {
  rearOffset: number; labels?: boolean; className?: string; title?: string
  /** Position inside a parent SVG (scenes); otherwise the view fills its container's width. */
  box?: { x: number; y: number; w: number; h: number }
}) {
  const fx = VIEW_W / 2
  const rx = rearX(rearOffset)
  const label = (x: number, y: number, text: string, anchor: 'start' | 'end') => (
    <text x={x} y={y} fontSize={17} fontWeight={700} fill="#d6e6f5" textAnchor={anchor}>{text}</text>
  )
  // Put each label on the outside of its light, so they never overlap.
  const rearLeft = rx < fx - 0.5
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      {...(box ? { x: box.x, y: box.y, width: box.w, height: box.h } : { className: className ?? 'block h-auto w-full rounded-lg', role: 'img', 'aria-label': title ?? 'View from the boat towards the leading lights' })}
    >
      <rect width={VIEW_W} height={HORIZON} fill="#14294a" />
      <rect width={VIEW_W} height={70} fill="#0f1f3a" />
      <path d={`M0 ${HORIZON} L0 170 Q 70 150 150 162 T 300 158 T 470 150 T ${VIEW_W} 166 L${VIEW_W} ${HORIZON} Z`} fill="#0a1626" />
      <rect y={HORIZON} width={VIEW_W} height={VIEW_H - HORIZON} fill="#08192b" />
      {/* Reflections on the water */}
      <rect x={rx - 2} y={HORIZON + 6} width={4} height={60} fill="#ffe7a3" opacity={0.16} />
      <rect x={fx - 3} y={HORIZON + 4} width={6} height={70} fill="#ffe7a3" opacity={0.22} />
      {/* Rear light: further away, on a taller structure */}
      <rect x={rx - 4} y={96} width={8} height={70} fill="#c9d3dd" opacity={0.55} />
      <Light x={rx} y={90} />
      {/* Front light: nearer, lower */}
      <rect x={fx - 6} y={150} width={12} height={HORIZON - 150} fill="#e6edf3" opacity={0.75} />
      <Light x={fx} y={144} />
      {labels && (
        <>
          {label(rearLeft ? rx - 20 : rx + 20, 96, 'Rear', rearLeft ? 'end' : 'start')}
          {label(rearLeft ? fx + 20 : fx - 20, 150, 'Front', rearLeft ? 'start' : 'end')}
        </>
      )}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Chart overlays                                                      */
/* ------------------------------------------------------------------ */

/** A small yacht in chart pixels, bow towards `heading` (°T). */
export function BoatGlyph({ at, heading = 0, size = 12, colour = '#c2410c' }: { at: LatLon; heading?: number; size?: number; colour?: string }) {
  const p = project(at)
  const s = size / 24
  return (
    <g transform={`translate(${p.x} ${p.y}) rotate(${r2(heading)}) scale(${r2(s * 100) / 100})`}>
      <path d="M0 -13 C 6 -7 6 4 5 11 L -5 11 C -6 4 -6 -7 0 -13 Z" fill="#fff" stroke={colour} strokeWidth={2.4} strokeLinejoin="round" />
      <circle cx={0} cy={-1} r={1.8} fill={colour} />
    </g>
  )
}

/** Points of an annular sector from `centre`, between two true directions from it. */
function sectorPoints(centre: LatLon, fromDir: number, toDir: number, r1: number, r2nm: number): string {
  const steps = 16
  const span = norm360(toDir - fromDir)
  const pts: LatLon[] = []
  for (let i = 0; i <= steps; i++) pts.push(rhumbDestination(centre, norm360(fromDir + (span * i) / steps), r2nm))
  for (let i = steps; i >= 0; i--) pts.push(rhumbDestination(centre, norm360(fromDir + (span * i) / steps), r1))
  return pts.map((q) => {
    const p = project(q)
    return `${p.x},${p.y}`
  }).join(' ')
}

/**
 * The two sides of a clearing bearing on `landmark`: the safe side shaded
 * green, the dangerous side hatched red, between r1 and r2 miles from the
 * landmark and kept off the land. `id` must be unique on the page.
 */
export function ClearingSides({ id, landmark, limit, value, r1, r2: rOut, spread = 45 }: {
  id: string; landmark: LatLon; limit: Limit; value: number; r1: number; r2: number; spread?: number
}) {
  // Directions FROM the landmark out to sea: the reciprocal of each bearing.
  const line = reciprocal(value)
  const safe = limit === 'NLT' ? [line, line + spread] : [line - spread, line]
  const danger = limit === 'NLT' ? [line - spread, line] : [line, line + spread]
  const mask = `${id}-sea`
  const hatch = `${id}-hatch`
  return (
    <g>
      <defs>
        <mask id={mask} maskUnits="userSpaceOnUse" x={0} y={0} width={4000} height={4000}>
          <rect x={0} y={0} width={4000} height={4000} fill="#fff" />
          <polygon points={polyPoints(islandRing(1.06))} fill="#000" />
        </mask>
        <pattern id={hatch} patternUnits="userSpaceOnUse" width={7} height={7} patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={7} stroke="#b42318" strokeWidth={1.6} strokeOpacity={0.55} />
        </pattern>
      </defs>
      <g mask={`url(#${mask})`}>
        <polygon points={sectorPoints(landmark, safe[0]!, safe[1]!, r1, rOut)} fill="#16a34a" fillOpacity={0.16} />
        <polygon points={sectorPoints(landmark, danger[0]!, danger[1]!, r1, rOut)} fill="#b42318" fillOpacity={0.07} />
        <polygon points={sectorPoints(landmark, danger[0]!, danger[1]!, r1, rOut)} fill={`url(#${hatch})`} />
      </g>
    </g>
  )
}

/** A dotted keep-out ring of `radiusNm` round a danger. */
export function KeepOut({ at, radiusNm, colour = '#b42318' }: { at: LatLon; radiusNm: number; colour?: string }) {
  const c = project(at)
  const e = project(rhumbDestination(at, 90, radiusNm))
  return <circle cx={c.x} cy={c.y} r={r2(Math.abs(e.x - c.x))} fill="none" stroke={colour} strokeWidth={1.6} strokeDasharray="2 3" />
}

/* ------------------------------------------------------------------ */
/* Scene helpers (1600×900 stage space)                                */
/* ------------------------------------------------------------------ */

const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"

/** A transparent 1600×900 layer over a chart scene, for big readable labels. */
export function Overlay({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <g fontFamily={FONT}>{children}</g>
    </svg>
  )
}

/** A label on a dark pill; y is the text baseline. */
export function Tag({ x, y, text, size = 48, fill = '#fff', bg = 'rgba(11,25,41,0.9)', anchor = 'start', opacity = 1 }: {
  x: number; y: number; text: string; size?: number; fill?: string; bg?: string; anchor?: 'start' | 'middle' | 'end'; opacity?: number
}) {
  const w = text.length * size * 0.56 + size * 0.9
  const h = size * 1.5
  const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - size * 1.08} width={w} height={h} rx={16} fill={bg} />
      <text x={x0 + w / 2} y={y} textAnchor="middle" fontSize={size} fontWeight={700} fill={fill}>{text}</text>
    </g>
  )
}

export function Arrow({ x1, y1, x2, y2, colour, width = 8, dash, opacity = 1 }: { x1: number; y1: number; x2: number; y2: number; colour: string; width?: number; dash?: string; opacity?: number }) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const hl = 18 + width * 2
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={x2 - Math.cos(a) * hl * 0.6} y2={y2 - Math.sin(a) * hl * 0.6} stroke={colour} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} />
      <polygon points={`${x2},${y2} ${x2 - hl * Math.cos(a - 0.45)},${y2 - hl * Math.sin(a - 0.45)} ${x2 - hl * Math.cos(a + 0.45)},${y2 - hl * Math.sin(a + 0.45)}`} fill={colour} />
    </g>
  )
}

/** A lighthouse seen side-on, base at (x, y). */
export function StageLighthouse({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-80 -150 L-14 -128 L-14 -118 Z M80 -150 L14 -128 L14 -118 Z" fill="#f5b301" opacity={0.7} />
      <polygon points="-24,0 24,0 14,-100 -14,-100" fill="#fff" />
      <rect x={-19} y={-70} width={38} height={14} fill="#d9342b" />
      <rect x={-22} y={-34} width={44} height={14} fill="#d9342b" />
      <rect x={-16} y={-126} width={32} height={26} rx={4} fill="#f5b301" />
      <polygon points="-22,-126 22,-126 0,-146" fill="#5b6b7b" />
    </g>
  )
}

/** A rock awash seen from above: a dotted ring with a cross. */
export function StageRock({ x, y, r = 40 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="rgba(217,52,43,0.18)" stroke="#ff8a80" strokeWidth={4} strokeDasharray="6 7" />
      <line x1={x - r * 0.45} x2={x + r * 0.45} y1={y} y2={y} stroke="#ff8a80" strokeWidth={5} />
      <line x1={x} x2={x} y1={y - r * 0.45} y2={y + r * 0.45} stroke="#ff8a80" strokeWidth={5} />
    </g>
  )
}
