// Drawing pieces for Lesson 5's scenes, widgets and figures (ported from the
// Boaty Jobs lateral-marks lesson). Pure components (no hooks), so they
// render identically on the server and in the browser.
//
// The shared IalaMark draws Region A only, so this lesson draws its own
// lateral marks with LateralMark, which takes the region.

import type { ReactNode } from 'react'
import type { LatLon } from '@/lib/courses/geo'
import { project, r2, type ViewRect } from '@/lib/courses/navigation/chart-geometry'
import { LIGHT_COLOURS } from '../../marks'
import { bandHue, isCan, mainHue, type Hue, type LateralType, type Region } from './data'

export const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"
export const RED = '#d9342b'
export const GREEN = '#1f9d55'
const INK = '#1d2731'
export const paint = (h: Hue) => (h === 'R' ? RED : GREEN)

/**
 * A lateral mark seen from a boat, in either region, waterline at (x, y).
 * Same proportions as the shared IalaMark, so the two can sit side by side.
 */
export function LateralMark({ type, region, x, y, scale = 1, lit = false }: {
  type: LateralType; region: Region; x: number; y: number; scale?: number; lit?: boolean
}) {
  const main = mainHue(type, region)
  const band = bandHue(type, region)
  const fill = paint(main)
  const can = isCan(type)
  const mastTop = -175
  const glow = LIGHT_COLOURS[main]
  // Cone: apex (0, -150), base ±40 at the waterline. Half-width at height y: 40 × (1 + y / 150).
  const hw = (yy: number) => r2(40 * (1 + yy / 150))
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={0} cy={4} rx={70} ry={10} fill="rgba(0,0,0,0.25)" />
      <rect x={-34} y={-12} width={68} height={14} rx={4} fill="#3b4652" />
      {can ? (
        <g>
          <rect x={-32} y={-120} width={64} height={120} fill={fill} />
          {band && <rect x={-32} y={-80} width={64} height={40} fill={paint(band)} />}
          <rect x={-32} y={-120} width={64} height={120} fill="none" stroke={INK} strokeWidth={2} />
        </g>
      ) : (
        <g>
          <polygon points="0,-150 -40,0 40,0" fill={fill} />
          {band && <polygon points={`${-hw(-100)},-100 ${hw(-100)},-100 ${hw(-50)},-50 ${-hw(-50)},-50`} fill={paint(band)} />}
          <polygon points="0,-150 -40,0 40,0" fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        </g>
      )}
      <line x1={0} y1={can ? -120 : -150} x2={0} y2={mastTop + 4} stroke="#4b5563" strokeWidth={6} />
      <rect x={-7} y={mastTop + 18} width={14} height={16} rx={3} fill={lit ? glow : '#cbd5e1'} stroke={INK} strokeWidth={1.5} />
      {lit && <circle cx={0} cy={mastTop + 26} r={34} fill={glow} opacity={0.35} />}
      {can
        ? <rect x={-14} y={mastTop - 30} width={28} height={30} fill={fill} stroke={INK} strokeWidth={1.5} />
        : <polygon points={`0,${mastTop - 30} -18.6,${mastTop} 18.6,${mastTop}`} fill={fill} stroke={INK} strokeWidth={1.5} />}
    </g>
  )
}

/** A small yacht seen from above, for drawing on the practice chart (chart pixels). */
export function BoatGlyph({ at, heading = 0, size = 12, colour = '#c2410c' }: { at: LatLon; heading?: number; size?: number; colour?: string }) {
  const p = project(at)
  return <PlanBoat x={p.x} y={p.y} heading={heading} size={size} colour={colour} />
}

/** The same yacht at plain SVG coordinates. */
export function PlanBoat({ x, y, heading = 0, size = 12, colour = '#c2410c' }: { x: number; y: number; heading?: number; size?: number; colour?: string }) {
  const s = r2(size / 24)
  return (
    <g transform={`translate(${r2(x)} ${r2(y)}) rotate(${r2(heading)}) scale(${s})`}>
      <path d="M0 -13 C 6 -7 6 4 5 11 L -5 11 C -6 4 -6 -7 0 -13 Z" fill="#fff" stroke={colour} strokeWidth={2.4} strokeLinejoin="round" />
      <circle cx={0} cy={-1} r={1.8} fill={colour} />
    </g>
  )
}

/** Stage-sized SVG laid over a chart scene, for big labels. */
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

/** A straight arrow on the stage. */
export function Arrow({ x1, y1, x2, y2, colour, width = 10, opacity = 1, dash }: { x1: number; y1: number; x2: number; y2: number; colour: string; width?: number; opacity?: number; dash?: string }) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const hl = 20 + width * 2
  return (
    <g opacity={opacity}>
      <line x1={r2(x1)} y1={r2(y1)} x2={r2(x2 - Math.cos(a) * hl * 0.6)} y2={r2(y2 - Math.sin(a) * hl * 0.6)} stroke={colour} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} />
      <polygon points={`${r2(x2)},${r2(y2)} ${r2(x2 - hl * Math.cos(a - 0.45))},${r2(y2 - hl * Math.sin(a - 0.45))} ${r2(x2 - hl * Math.cos(a + 0.45))},${r2(y2 - hl * Math.sin(a + 0.45))}`} fill={colour} />
    </g>
  )
}

/** Stage position of a chart point in a ChartScene whose view has a 16:9 aspect. */
export function toStage(view: ViewRect, at: LatLon): { x: number; y: number } {
  const p = project(at)
  return { x: ((p.x - view.x) / view.w) * 1600, y: ((p.y - view.y) / view.h) * 900 }
}

/* ------------------------------------------------------------------ */
/* Plan-view symbols (from above, like the chart)                       */
/* ------------------------------------------------------------------ */

/** A can buoy seen on a plan: a square, as on the chart. */
export function PlanCan({ x, y, size = 34, fill = RED, band, opacity = 1 }: { x: number; y: number; size?: number; fill?: string; band?: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <rect x={x - size / 2} y={y - size} width={size} height={size} fill={fill} stroke="#fff" strokeWidth={2.5} />
      {band && <rect x={x - size / 2} y={y - size * 0.65} width={size} height={size * 0.3} fill={band} />}
    </g>
  )
}

/** A conical buoy seen on a plan: a triangle, as on the chart. A band is drawn as a trapezoid (no clip path). */
export function PlanCone({ x, y, size = 40, fill = GREEN, band, opacity = 1 }: { x: number; y: number; size?: number; fill?: string; band?: string; opacity?: number }) {
  const pts = `${x},${y - size} ${r2(x + size * 0.55)},${y} ${r2(x - size * 0.55)},${y}`
  const hw = (f: number) => r2(size * 0.55 * f)
  const top = y - size * 0.62
  const bot = y - size * 0.32
  return (
    <g opacity={opacity}>
      <polygon points={pts} fill={fill} />
      {band && <polygon points={`${r2(x - hw(0.38))},${r2(top)} ${r2(x + hw(0.38))},${r2(top)} ${r2(x + hw(0.68))},${r2(bot)} ${r2(x - hw(0.68))},${r2(bot)}`} fill={band} />}
      <polygon points={pts} fill="none" stroke="#fff" strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  )
}

/** A lateral mark on a plan, in its region's colours. */
export function PlanMark({ type, region, x, y, size = 36, opacity = 1 }: { type: LateralType; region: Region; x: number; y: number; size?: number; opacity?: number }) {
  const fill = paint(mainHue(type, region))
  const b = bandHue(type, region)
  const band = b ? paint(b) : undefined
  return isCan(type)
    ? <PlanCan x={x} y={y} size={size} fill={fill} band={band} opacity={opacity} />
    : <PlanCone x={x} y={y} size={size * 1.2} fill={fill} band={band} opacity={opacity} />
}

/** Turns whatever it filters into a flat dark silhouette (a mark against a low sun). */
export function SilhouetteFilter({ id, colour = '#11161c' }: { id: string; colour?: string }) {
  return (
    <filter id={id} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
      <feFlood floodColor={colour} result="ink" />
      <feComposite in="ink" in2="SourceAlpha" operator="in" />
    </filter>
  )
}
