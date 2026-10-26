'use client'

// The course's practice chart, drawn as SVG in the style of an Admiralty
// chart: depth tints, contours, soundings, buoys, lights, a compass rose
// and latitude/longitude border scales. It is used three ways:
//   - static figures in lesson text,
//   - interactive widgets and exercises (zoom/pan, cursor readout, click to
//     plot a position, dividers to measure distance and bearing),
//   - the backdrop of the animated lesson player, with overlays drawn as
//     children in chart pixel coordinates (see `project`).

import { memo, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { formatBearing, formatLat, formatLon, formatPosition, rhumbBearing, rhumbDistance, type LatLon } from '@/lib/courses/geo'
import {
  CHART_BOUNDS, CHART_VARIATION, CONTOUR_DEPTHS, FEATURES, LEADING_LINE, SOUNDINGS, bankRing, islandContourK, islandRing, km,
  type ChartFeature,
} from '@/lib/courses/navigation/practice-chart'
import { TIDAL_DIAMONDS } from '@/lib/courses/navigation/tides'
import {
  CHART_HEIGHT, CHART_MARGIN, CHART_WIDTH, FULL_VIEW, PLOT_HEIGHT, PLOT_WIDTH, polyPoints, project, r2, unproject,
  viewBoxString, type Pt, type ViewRect,
} from '@/lib/courses/navigation/chart-geometry'

export const CHART_COLOURS = {
  sea: '#ffffff',
  shallow: '#b6daf1',
  mid: '#daedf8',
  drying: '#c4d8a0',
  land: '#f1deb0',
  coast: '#3b3a36',
  contour: '#5f88ad',
  ink: '#1d2731',
  magenta: '#b5267a',
  grid: '#a9bccb',
  plot: '#0f766e',
  plotAlt: '#c2410c',
}
const C = CHART_COLOURS

const X0 = CHART_MARGIN
const Y0 = CHART_MARGIN
const X1 = CHART_MARGIN + PLOT_WIDTH
const Y1 = CHART_MARGIN + PLOT_HEIGHT

const latAt = (min: number) => 49 + min / 60
const lonAtW = (minW: number) => -(4 + minW / 60)

/* ------------------------------------------------------------------ */
/* Static layers                                                       */
/* ------------------------------------------------------------------ */

function Graticule() {
  const lines: ReactNode[] = []
  for (let m = 42; m <= 50; m += 2) {
    const { y } = project({ lat: latAt(m), lon: CHART_BOUNDS.west })
    lines.push(<line key={`lat${m}`} x1={X0} x2={X1} y1={y} y2={y} />)
  }
  for (let m = 4; m <= 20; m += 4) {
    const { x } = project({ lat: CHART_BOUNDS.south, lon: lonAtW(m) })
    lines.push(<line key={`lon${m}`} x1={x} x2={x} y1={Y0} y2={Y1} />)
  }
  return <g stroke={C.grid} strokeWidth={0.6}>{lines}</g>
}

function Tints() {
  const k5 = islandContourK(5)
  const k10 = islandContourK(10)
  return (
    <g>
      <polygon points={polyPoints(islandRing(k10))} fill={C.mid} />
      <polygon points={polyPoints(bankRing(10))} fill={C.mid} />
      <polygon points={polyPoints(islandRing(k5))} fill={C.shallow} />
      <polygon points={polyPoints(bankRing(5))} fill={C.shallow} />
      <polygon points={polyPoints(islandRing(1.06))} fill={C.drying} />
      <polygon points={polyPoints(islandRing(1))} fill={C.land} stroke={C.coast} strokeWidth={1.4} strokeLinejoin="round" />
    </g>
  )
}

function Contours() {
  const els: ReactNode[] = []
  for (const d of CONTOUR_DEPTHS) {
    const ring = islandRing(islandContourK(d))
    els.push(<polygon key={`i${d}`} points={polyPoints(ring)} fill="none" stroke={C.contour} strokeWidth={0.8} strokeDasharray={d === 2 ? '3 2' : undefined} />)
    // Label each island contour once, on its south-west side.
    const at = project(ring[Math.round((ring.length * 18) / 28)]!)
    els.push(<HaloText key={`il${d}`} x={at.x} y={at.y + 3} size={8} fill={C.contour}>{d}</HaloText>)
    if (d > 2) {
      const bank = bankRing(d)
      els.push(<polygon key={`b${d}`} points={polyPoints(bank)} fill="none" stroke={C.contour} strokeWidth={0.8} />)
      const b = project(bank[Math.round(bank.length * 0.75)]!)
      els.push(<HaloText key={`bl${d}`} x={b.x} y={b.y + 3} size={8} fill={C.contour}>{d}</HaloText>)
    }
  }
  return <g>{els}</g>
}

function HaloText({ x, y, size = 9, fill = C.ink, anchor = 'middle', italic, bold, children, rotate }: {
  x: number; y: number; size?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'
  italic?: boolean; bold?: boolean; children: ReactNode; rotate?: number
}) {
  return (
    <text
      x={x} y={y} fontSize={size} fill={fill} textAnchor={anchor}
      fontStyle={italic ? 'italic' : undefined} fontWeight={bold ? 700 : undefined}
      stroke="#fff" strokeWidth={2.6} paintOrder="stroke" strokeLinejoin="round"
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
    >
      {children}
    </text>
  )
}

/** "7₄" style sounding; drying heights are underlined. */
export function SoundingText({ at, depth, size = 9.5 }: { at: Pt; depth: number; size?: number }) {
  const v = Math.abs(depth)
  const whole = Math.floor(v + 1e-9)
  const tenth = Math.round((v - whole) * 10)
  const showTenth = v < 21 && tenth > 0
  const baseline = at.y + size * 0.35
  // Drying heights are underlined across the whole figure, decimal included.
  const width = (String(whole).length + (showTenth ? 0.72 : 0)) * size * 0.56
  return (
    <g>
      <text x={at.x} y={baseline} fontSize={size} fill={C.ink} textAnchor="middle" fontStyle="italic">
        {whole}
        {showTenth && <tspan fontSize={size * 0.72} dy={size * 0.3}>{tenth}</tspan>}
      </text>
      {depth < 0 && (
        <line x1={r2(at.x - width / 2)} x2={r2(at.x + width / 2)} y1={r2(baseline + size * 0.45)} y2={r2(baseline + size * 0.45)} stroke={C.ink} strokeWidth={size * 0.08} />
      )}
    </g>
  )
}

// Areas kept clear of soundings so labels and symbols stay readable.
const LABEL_BOXES: Array<{ x: number; y: number; w: number; h: number }> = []

function Soundings() {
  const symbols = [...FEATURES.map((f) => project(f.at)), ...TIDAL_DIAMONDS.map((d) => project(d.at))]
  const lead = project(LEADING_LINE.from)
  return (
    <g>
      {SOUNDINGS.map((s, i) => {
        const p = project(s.at)
        if (symbols.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 16)) return null
        if (Math.abs(p.x - lead.x) < 9 && p.y < lead.y + 6) return null
        if (LABEL_BOXES.some((b) => p.x > b.x - 6 && p.x < b.x + b.w + 6 && p.y > b.y - 6 && p.y < b.y + b.h + 6)) return null
        return <SoundingText key={i} at={p} depth={s.depth} />
      })}
    </g>
  )
}

function star(cx: number, cy: number, r: number, points = 5): string {
  const out: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45
    const a = (Math.PI * i) / points - Math.PI / 2
    out.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`)
  }
  return out.join(' ')
}

/** Magenta light flare, pointing up-right like on Admiralty charts. */
function Flare({ x, y }: Pt) {
  return <path d={`M${x} ${y} q 5 -5 13 -17 q 2 -1 1 2 q -7 11 -14 15 z`} fill={C.magenta} opacity={0.85} />
}

/** The small circle at the foot of a buoy symbol marks its charted position. */
function PositionCircle({ x, y }: Pt) {
  return <circle cx={x} cy={y} r={1.6} fill="#fff" stroke={C.ink} strokeWidth={0.8} />
}

const Y = '#f5c400'

/**
 * IALA cardinal marks. Colours: N black over yellow, S yellow over black,
 * E black-yellow-black, W yellow-black-yellow. Topmarks (two black cones):
 * N points up, S points down, E base to base, W point to point.
 */
function Cardinal({ x, y, quadrant }: Pt & { quadrant: 'north' | 'east' | 'south' | 'west' }) {
  const bands: Record<typeof quadrant, string[]> = {
    north: [C.ink, Y], south: [Y, C.ink], east: [C.ink, Y, C.ink], west: [Y, C.ink, Y],
  }
  const b = bands[quadrant]
  const h = 14 / b.length
  const cone = (apex: number, base: number) => `${x},${apex} ${x - 3.5},${base} ${x + 3.5},${base}`
  const topmark = {
    north: [cone(y - 27, y - 22.5), cone(y - 21.5, y - 17)],
    south: [cone(y - 22.5, y - 27), cone(y - 17, y - 21.5)],
    east: [cone(y - 26, y - 21.5), cone(y - 17, y - 21.5)],
    west: [cone(y - 22, y - 26.5), cone(y - 22, y - 17.5)],
  }[quadrant]
  return (
    <g>
      <Flare x={x} y={y} />
      {b.map((fill, i) => <rect key={i} x={x - 3.5} y={y - 14 + i * h} width={7} height={h} fill={fill} />)}
      <rect x={x - 3.5} y={y - 14} width={7} height={14} fill="none" stroke={C.ink} strokeWidth={0.8} />
      {topmark.map((pts, i) => <polygon key={i} points={pts} fill={C.ink} />)}
      <PositionCircle x={x} y={y} />
    </g>
  )
}

function Buoy({ x, y, kind }: Pt & { kind: ChartFeature['kind'] }) {
  switch (kind) {
    case 'starboard-mark':
      return <g><Flare x={x} y={y} /><polygon points={`${x - 5},${y} ${x + 5},${y} ${x},${y - 11}`} fill="#1f9d55" stroke={C.ink} strokeWidth={0.8} /><PositionCircle x={x} y={y} /></g>
    case 'port-mark':
      return <g><Flare x={x} y={y} /><rect x={x - 4} y={y - 10} width={8} height={10} fill="#d9342b" stroke={C.ink} strokeWidth={0.8} /><PositionCircle x={x} y={y} /></g>
    case 'cardinal-north':
    case 'cardinal-east':
    case 'cardinal-south':
    case 'cardinal-west':
      return <Cardinal x={x} y={y} quadrant={kind.slice(9) as 'north' | 'east' | 'south' | 'west'} />
    case 'special-mark':
      return (
        <g>
          <Flare x={x} y={y} />
          <rect x={x - 3.5} y={y - 13} width={7} height={13} fill="#f5c400" stroke={C.ink} strokeWidth={0.8} />
          <g stroke="#d4a200" strokeWidth={1.8} strokeLinecap="round">
            <line x1={x - 3} x2={x + 3} y1={y - 22} y2={y - 16} /><line x1={x + 3} x2={x - 3} y1={y - 22} y2={y - 16} />
          </g>
          <PositionCircle x={x} y={y} />
        </g>
      )
    case 'safe-water':
      return (
        <g>
          <Flare x={x} y={y} />
          <rect x={x - 4} y={y - 12} width={8} height={12} fill="#fff" stroke={C.ink} strokeWidth={0.8} />
          <rect x={x - 1.3} y={y - 12} width={2.6} height={12} fill="#d9342b" />
          <circle cx={x} cy={y - 15.5} r={2.6} fill="#d9342b" />
          <PositionCircle x={x} y={y} />
        </g>
      )
    case 'isolated-danger':
      return (
        <g>
          <Flare x={x} y={y} />
          <rect x={x - 3.5} y={y - 13} width={7} height={13} fill={C.ink} />
          <rect x={x - 3.5} y={y - 8.5} width={7} height={4} fill="#d9342b" />
          <circle cx={x} cy={y - 16} r={2.1} fill={C.ink} />
          <circle cx={x} cy={y - 20.6} r={2.1} fill={C.ink} />
          <PositionCircle x={x} y={y} />
        </g>
      )
    default:
      return null
  }
}

/** A feature's chart symbol at its projected position (chart pixel space). */
export function FeatureSymbol({ f }: { f: ChartFeature }) {
  const { x, y } = project(f.at)
  switch (f.kind) {
    case 'lighthouse':
      return <g><Flare x={x} y={y} /><polygon points={star(x, y, 6)} fill={C.ink} /></g>
    case 'starboard-mark':
    case 'port-mark':
    case 'cardinal-north':
    case 'cardinal-east':
    case 'cardinal-south':
    case 'cardinal-west':
    case 'special-mark':
    case 'safe-water':
      return <Buoy x={x} y={y} kind={f.kind} />
    case 'leading-light':
      return <g><Flare x={x} y={y} /><polygon points={star(x, y, 4.5)} fill={C.ink} /></g>
    case 'isolated-danger':
      // Mew Rock: the rock (dries 1.2 m) with its beacon.
      return (
        <g>
          <g stroke={C.ink} strokeWidth={1}><line x1={x - 5} x2={x + 5} y1={y} y2={y} /><line x1={x} x2={x} y1={y - 5} y2={y + 5} /><line x1={x - 3.5} x2={x + 3.5} y1={y - 3.5} y2={y + 3.5} /><line x1={x - 3.5} x2={x + 3.5} y1={y + 3.5} y2={y - 3.5} /></g>
          <Buoy x={x + 9} y={y} kind="isolated-danger" />
          {f.dries !== undefined && <SoundingText at={{ x: x - 11, y: y + 11 }} depth={-f.dries} size={9} />}
        </g>
      )
    case 'rock-awash':
      return (
        <g fill={C.ink}>
          <circle cx={x} cy={y} r={11} fill="none" stroke={C.ink} strokeWidth={0.9} strokeDasharray="1.5 2" />
          <g stroke={C.ink} strokeWidth={1.1}><line x1={x - 5} x2={x + 5} y1={y} y2={y} /><line x1={x} x2={x} y1={y - 5} y2={y + 5} /></g>
          <circle cx={x - 2.6} cy={y - 2.6} r={0.9} /><circle cx={x + 2.6} cy={y - 2.6} r={0.9} />
          <circle cx={x - 2.6} cy={y + 2.6} r={0.9} /><circle cx={x + 2.6} cy={y + 2.6} r={0.9} />
        </g>
      )
    case 'wreck':
      return (
        <g>
          <ellipse cx={x} cy={y} rx={18} ry={10} fill="none" stroke={C.ink} strokeWidth={0.9} strokeDasharray="1.5 2" />
          <SoundingText at={{ x: x - 7, y }} depth={f.depth ?? 0} size={9} />
          <text x={x + 7} y={y + 3} fontSize={7.5} fill={C.ink} textAnchor="middle">Wk</text>
        </g>
      )
    case 'church':
      return <g stroke={C.ink} strokeWidth={1} fill="none"><circle cx={x} cy={y} r={3} /><line x1={x} x2={x} y1={y - 3} y2={y - 10} /><line x1={x - 3} x2={x + 3} y1={y - 7} y2={y - 7} /></g>
    case 'mast':
      return <g stroke={C.ink} strokeWidth={1} fill="none"><circle cx={x} cy={y} r={2.5} /><line x1={x} x2={x} y1={y - 2.5} y2={y - 14} /><line x1={x - 3} x2={x} y1={y - 10} y2={y - 14} /><line x1={x + 3} x2={x} y1={y - 10} y2={y - 14} /></g>
    case 'tower':
      return <g><rect x={x - 3.5} y={y - 9} width={7} height={9} fill="none" stroke={C.ink} strokeWidth={1} /><circle cx={x} cy={y} r={1.4} fill={C.ink} /></g>
    case 'spot-height':
      return <g><circle cx={x} cy={y} r={1.5} fill={C.ink} /><text x={x + 4} y={y + 3} fontSize={8.5} fill={C.ink}>87</text></g>
    case 'anchorage':
      return (
        <g stroke={C.magenta} strokeWidth={1.3} fill="none" strokeLinecap="round">
          <circle cx={x} cy={y - 7} r={1.8} /><line x1={x} x2={x} y1={y - 5} y2={y + 6} />
          <line x1={x - 4} x2={x + 4} y1={y - 2} y2={y - 2} /><path d={`M${x - 6} ${y + 1} q 1 6 6 6 q 5 0 6 -6`} />
        </g>
      )
    case 'harbour':
      return <g stroke={C.coast} strokeWidth={2.4} strokeLinecap="round"><line x1={x - 9} x2={x - 3} y1={y + 2} y2={y + 2} /></g>
    default:
      return null
  }
}

interface Label { x: number; y: number; lines: string[]; anchor?: 'start' | 'middle' | 'end'; italic?: boolean; bold?: boolean; size?: number; fill?: string }

// Feature labels, placed by hand so nothing collides.
function featureLabels(): Label[] {
  const at = (id: string) => project(FEATURES.find((f) => f.id === id)!.at)
  const L: Label[] = []
  const add = (id: string, dx: number, dy: number, lines: string[], anchor: Label['anchor'] = 'start', extra: Partial<Label> = {}) => {
    const p = at(id)
    L.push({ x: p.x + dx, y: p.y + dy, lines, anchor, ...extra })
  }
  add('gull-point-lt', -8, -12, ['Fl(3)10s28m15M'], 'end')
  add('kerran-head-lt', -8, -12, ['Iso4s18m10M'], 'end')
  add('teeth', 0, -15, ['The Teeth'], 'middle', { italic: true })
  add('east-teeth', 8, 12, ['E Teeth', 'Q(3)10s'])
  add('n-teeth', 8, -14, ['N Teeth', 'Q'])
  add('s-brennan', 9, 2, ['S Brennan', 'Q(6)+LFl15s'])
  add('head-ledge', 4, 22, ['Head Ledge'], 'middle', { italic: true })
  add('w-ledge', -9, 4, ['W Ledge', 'Q(9)15s'], 'end')
  add('outfall', 9, 2, ['Outfall', 'Fl Y 5s'])
  add('mew-rock', 16, 2, ['Mew Rk', 'Fl(2)5s'])
  add('kerran-approach', 9, 0, ['Kerran App', 'LFl10s'])
  add('no1', 9, -2, ['No 1', 'Fl G 5s'])
  add('no3', 9, -6, ['No 3', 'Fl(2) G 5s'])
  add('no2', -9, -2, ['No 2', 'Fl R 5s'], 'end')
  add('no4', -9, -6, ['No 4', 'Fl(2) R 5s'], 'end')
  add('church', 6, 3, ['Spire'])
  add('mast', 6, -4, ['Radio Mast', '(R Lts)'])
  add('tower', 6, 3, ['Tower'])
  add('beacon-hill', 0, -8, ['Beacon Hill'], 'middle', { size: 8 })
  add('anchorage', 9, 3, ['Kerran Roads'], 'start', { italic: true })
  add('harbour', -14, -8, ['PORT KERRAN'], 'end', { bold: true, size: 9 })
  // Place names.
  const name = (p: LatLon, text: string, extra: Partial<Label>) => { const q = project(p); L.push({ x: q.x, y: q.y, lines: [text], anchor: 'middle', ...extra }) }
  name(km(7.4, 13.0), 'ISLE OF KERRAN', { bold: true, size: 15 })
  name(km(7.75, 7.7), 'Gull Point', { size: 9 })
  name(km(7.9, 16.0), 'Kerran Head', { size: 9 })
  name(km(3.25, 5.6), 'Brennan Bank', { italic: true, size: 10 })
  name(km(4.7, 8.2), 'Kerran Bay', { italic: true, size: 9 })
  return L
}
const LABELS = featureLabels()
for (const l of LABELS) {
  const size = l.size ?? 8.5
  const w = Math.max(...l.lines.map((t) => t.length)) * size * 0.55
  const x = l.anchor === 'end' ? l.x - w : l.anchor === 'middle' ? l.x - w / 2 : l.x
  LABEL_BOXES.push({ x, y: l.y - size, w, h: size * 1.15 * l.lines.length })
}

function Labels() {
  return (
    <g>
      {LABELS.map((l, i) => {
        const size = l.size ?? 8.5
        return (
          <g key={i}>
            {l.lines.map((line, j) => (
              <HaloText key={j} x={l.x} y={l.y + j * size * 1.15} size={size} anchor={l.anchor} italic={l.italic} bold={l.bold} fill={l.fill}>
                {line}
              </HaloText>
            ))}
          </g>
        )
      })}
    </g>
  )
}

export const ROSE_CENTRE = km(2.0, 21.0)
export const ROSE_RADIUS = 104

function polar(c: Pt, r: number, bearing: number): Pt {
  const a = (bearing * Math.PI) / 180
  return { x: Math.round((c.x + r * Math.sin(a)) * 100) / 100, y: Math.round((c.y - r * Math.cos(a)) * 100) / 100 }
}

function CompassRose() {
  const c = project(ROSE_CENTRE)
  const R = ROSE_RADIUS
  const r2 = R - 30
  const v = CHART_VARIATION.degrees
  const els: ReactNode[] = []
  for (let d = 0; d < 360; d++) {
    const len = d % 10 === 0 ? 9 : d % 5 === 0 ? 6 : 3.2
    const a = polar(c, R, d)
    const b = polar(c, R - len, d)
    els.push(<line key={`t${d}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={d % 10 === 0 ? 0.9 : 0.5} />)
    if (d % 10 === 0) {
      const p = polar(c, R - 16, d)
      els.push(
        <text key={`l${d}`} x={p.x} y={p.y + 2.8} fontSize={d % 90 === 0 ? 9 : 7.5} fontWeight={d % 90 === 0 ? 700 : 400} textAnchor="middle" fill={C.magenta} stroke="none" transform={`rotate(${d} ${p.x} ${p.y})`}>
          {d}
        </text>,
      )
    }
  }
  for (let m = 0; m < 360; m += 2) {
    const len = m % 10 === 0 ? 6 : 3
    const a = polar(c, r2, m + v)
    const b = polar(c, r2 - len, m + v)
    els.push(<line key={`m${m}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={0.5} />)
    if (m % 30 === 0) {
      const p = polar(c, r2 - 13, m + v)
      els.push(
        <text key={`ml${m}`} x={p.x} y={p.y + 2.5} fontSize={7} textAnchor="middle" fill={C.magenta} stroke="none" transform={`rotate(${m + v} ${p.x} ${p.y})`}>
          {m}
        </text>,
      )
    }
  }
  const tip = polar(c, r2 - 20, v)
  const n = polar(c, R + 9, 0)
  return (
    <g stroke={C.magenta} fill="none">
      <circle cx={c.x} cy={c.y} r={R} strokeWidth={1} />
      <circle cx={c.x} cy={c.y} r={r2} strokeWidth={0.8} />
      {els}
      <polygon points={star(n.x, n.y, 7)} fill={C.magenta} stroke="none" />
      <line x1={c.x} y1={c.y} x2={tip.x} y2={tip.y} strokeWidth={1.2} />
      <polygon points={`${tip.x},${tip.y} ${polar(c, r2 - 30, v - 3).x},${polar(c, r2 - 30, v - 3).y} ${polar(c, r2 - 30, v + 3).x},${polar(c, r2 - 30, v + 3).y}`} fill={C.magenta} stroke="none" />
      <text x={c.x} y={c.y + 14} fontSize={7.2} textAnchor="middle" fill={C.magenta} stroke="none">VAR 3°00&apos;W (2025)</text>
      <text x={c.x} y={c.y + 23} fontSize={7.2} textAnchor="middle" fill={C.magenta} stroke="none">(8&apos;E)</text>
    </g>
  )
}

/** Title block rectangle, in chart pixels. */
export const TITLE_BLOCK = { x: X0 + 10, y: Y0 + 10, w: 226, h: 88 }
/** Width of the latitude/longitude border strips, in chart pixels. */
export const BORDER_STRIP = 12

function TitleBlock() {
  return (
    <g>
      <rect x={TITLE_BLOCK.x} y={TITLE_BLOCK.y} width={TITLE_BLOCK.w} height={TITLE_BLOCK.h} fill="#fff" stroke={C.ink} strokeWidth={0.8} />
      <text x={X0 + 123} y={Y0 + 29} fontSize={13} fontWeight={700} textAnchor="middle" fill={C.ink}>ISLE OF KERRAN</text>
      <text x={X0 + 123} y={Y0 + 43} fontSize={8.5} textAnchor="middle" fill={C.ink}>PRACTICE CHART · FICTIONAL AREA</text>
      <text x={X0 + 123} y={Y0 + 57} fontSize={9} fontWeight={700} textAnchor="middle" fill="#b42318">NOT FOR NAVIGATION</text>
      <text x={X0 + 123} y={Y0 + 71} fontSize={7.5} textAnchor="middle" fill={C.ink}>Depths in metres below chart datum</text>
      <text x={X0 + 123} y={Y0 + 82} fontSize={7.5} textAnchor="middle" fill={C.ink}>Heights in metres above MHWS</text>
      <text x={X0 + 123} y={Y0 + 93} fontSize={7.5} textAnchor="middle" fill={C.ink}>Mercator projection · Scale 1:50 000 (approx.)</text>
    </g>
  )
}
// Keep soundings out from under the title block.
LABEL_BOXES.push(TITLE_BLOCK)

function Border() {
  const S = BORDER_STRIP
  const els: ReactNode[] = []
  for (let m = 40; m < 52; m++) {
    const yTop = project({ lat: latAt(m + 1), lon: CHART_BOUNDS.west }).y
    const yBot = project({ lat: latAt(m), lon: CHART_BOUNDS.west }).y
    const fill = m % 2 === 0 ? C.ink : '#fff'
    els.push(<rect key={`ll${m}`} x={X0 - S} y={yTop} width={S / 2} height={yBot - yTop} fill={fill} />)
    els.push(<rect key={`lr${m}`} x={X1 + S / 2} y={yTop} width={S / 2} height={yBot - yTop} fill={fill} />)
    for (let t = 1; t < 10; t++) {
      const y = project({ lat: latAt(m + t / 10), lon: CHART_BOUNDS.west }).y
      const len = t === 5 ? S / 2 : S / 3.5
      els.push(<line key={`lt${m}${t}`} x1={X0 - len} x2={X0} y1={y} y2={y} />)
      els.push(<line key={`rt${m}${t}`} x1={X1} x2={X1 + len} y1={y} y2={y} />)
    }
  }
  for (let m = 40; m <= 52; m++) {
    const y = project({ lat: latAt(m), lon: CHART_BOUNDS.west }).y
    els.push(<line key={`lm${m}`} x1={X0 - S} x2={X0} y1={y} y2={y} />)
    els.push(<line key={`rm${m}`} x1={X1} x2={X1 + S} y1={y} y2={y} />)
    const text = m % 5 === 0 ? `49°${m}'N` : `${m}'`
    els.push(<text key={`lx${m}`} x={X0 - S - 5} y={y} fontSize={8} textAnchor="middle" fill={C.ink} stroke="none" transform={`rotate(-90 ${X0 - S - 5} ${y})`}>{text}</text>)
    els.push(<text key={`rx${m}`} x={X1 + S + 5} y={y} fontSize={8} textAnchor="middle" fill={C.ink} stroke="none" transform={`rotate(90 ${X1 + S + 5} ${y})`}>{text}</text>)
  }
  for (let m = 0; m < 24; m++) {
    const xL = project({ lat: CHART_BOUNDS.south, lon: lonAtW(m + 1) }).x
    const xR = project({ lat: CHART_BOUNDS.south, lon: lonAtW(m) }).x
    const fill = m % 2 === 0 ? C.ink : '#fff'
    els.push(<rect key={`tt${m}`} x={xL} y={Y0 - S} width={xR - xL} height={S / 2} fill={fill} />)
    els.push(<rect key={`bb${m}`} x={xL} y={Y1 + S / 2} width={xR - xL} height={S / 2} fill={fill} />)
    for (let t = 1; t < 10; t++) {
      const x = project({ lat: CHART_BOUNDS.south, lon: lonAtW(m + t / 10) }).x
      const len = t === 5 ? S / 2 : S / 3.5
      els.push(<line key={`ttk${m}${t}`} x1={x} x2={x} y1={Y0 - len} y2={Y0} />)
      els.push(<line key={`bbk${m}${t}`} x1={x} x2={x} y1={Y1} y2={Y1 + len} />)
    }
  }
  for (let m = 0; m <= 24; m++) {
    const x = project({ lat: CHART_BOUNDS.south, lon: lonAtW(m) }).x
    els.push(<line key={`tm${m}`} x1={x} x2={x} y1={Y0 - S} y2={Y0} />)
    els.push(<line key={`bm${m}`} x1={x} x2={x} y1={Y1} y2={Y1 + S} />)
    const text = m % 5 === 0 ? `4°${String(m).padStart(2, '0')}'W` : `${String(m).padStart(2, '0')}'`
    els.push(<text key={`tx${m}`} x={x} y={Y0 - S - 4} fontSize={8} textAnchor="middle" fill={C.ink} stroke="none">{text}</text>)
    els.push(<text key={`bx${m}`} x={x} y={Y1 + S + 10} fontSize={8} textAnchor="middle" fill={C.ink} stroke="none">{text}</text>)
  }
  return (
    <g stroke={C.ink} strokeWidth={0.6}>
      <rect x={0} y={0} width={CHART_WIDTH} height={Y0 - S} fill="#fff" stroke="none" />
      {els}
      <rect x={X0} y={Y0} width={PLOT_WIDTH} height={PLOT_HEIGHT} fill="none" strokeWidth={1} />
      <rect x={X0 - S} y={Y0 - S} width={PLOT_WIDTH + 2 * S} height={PLOT_HEIGHT + 2 * S} fill="none" strokeWidth={1} />
    </g>
  )
}

/** Tidal diamonds: magenta diamonds lettered A, B, C… (stream tables in tides.ts). */
function TidalDiamondSymbols() {
  return (
    <g>
      {TIDAL_DIAMONDS.map((d) => {
        const { x, y } = project(d.at)
        return (
          <g key={d.id}>
            <polygon points={`${x},${y - 10} ${x + 8},${y} ${x},${y + 10} ${x - 8},${y}`} fill="#fff" stroke={C.magenta} strokeWidth={1.4} />
            <text x={x} y={y + 3.5} fontSize={9.5} fontWeight={700} textAnchor="middle" fill={C.magenta}>{d.id}</text>
          </g>
        )
      })}
    </g>
  )
}

/** The Port Kerran leading line, drawn up to the front light, with its label along it. */
function LeadingLine() {
  const a = project(LEADING_LINE.from)
  const front = project(FEATURES.find((f) => f.id === 'ldg-front')!.at)
  const lx = a.x + 6
  const ly = a.y - 26
  return (
    <g>
      <line x1={a.x} y1={a.y} x2={front.x} y2={front.y} stroke={C.ink} strokeWidth={0.9} />
      <HaloText x={lx} y={ly} size={7.5} anchor="start" rotate={-90}>{`${LEADING_LINE.label} ${LEADING_LINE.light}`}</HaloText>
    </g>
  )
}

const ChartBase = memo(function ChartBase({ soundings, labels, clipId }: { soundings: boolean; labels: boolean; clipId: string }) {
  return (
    <g fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif">
      <rect x={0} y={0} width={CHART_WIDTH} height={CHART_HEIGHT} fill="#fff" />
      <g clipPath={`url(#${clipId})`}>
        <Tints />
        <Graticule />
        <Contours />
        {soundings && <Soundings />}
        <LeadingLine />
        <TidalDiamondSymbols />
        {FEATURES.map((f) => <FeatureSymbol key={f.id} f={f} />)}
        <CompassRose />
        {labels && <Labels />}
        <TitleBlock />
      </g>
      <Border />
    </g>
  )
})

/* ------------------------------------------------------------------ */
/* Overlay helpers (children of PracticeChart, chart pixel coords)     */
/* ------------------------------------------------------------------ */

export function ChartLine({ from, to, colour = C.plot, width = 2, dash, progress = 1, arrow }: {
  from: LatLon; to: LatLon; colour?: string; width?: number; dash?: string; progress?: number; arrow?: boolean
}) {
  const a = project(from)
  const b0 = project(to)
  const k = Math.max(0, Math.min(1, progress))
  const b = { x: r2(a.x + (b0.x - a.x) * k), y: r2(a.y + (b0.y - a.y) * k) }
  if (k === 0) return null
  const ang = Math.atan2(b0.y - a.y, b0.x - a.x)
  const head = 9 + width * 1.5
  return (
    <g stroke={colour} strokeWidth={width} strokeLinecap="round" fill={colour}>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeDasharray={dash} />
      {arrow && k > 0.05 && (
        <polygon
          stroke="none"
          points={`${b.x},${b.y} ${r2(b.x - head * Math.cos(ang - 0.4))},${r2(b.y - head * Math.sin(ang - 0.4))} ${r2(b.x - head * Math.cos(ang + 0.4))},${r2(b.y - head * Math.sin(ang + 0.4))}`}
        />
      )}
    </g>
  )
}

export function ChartPoint({ at, colour = C.plot, label, r = 4.5, cross }: { at: LatLon; colour?: string; label?: string; r?: number; cross?: boolean }) {
  const p = project(at)
  return (
    <g>
      {cross ? (
        // Open centre, so the chart under the plotted point stays visible.
        <g stroke={colour} strokeWidth={2} strokeLinecap="round">
          <line x1={p.x - 11} x2={p.x - 4} y1={p.y} y2={p.y} /><line x1={p.x + 4} x2={p.x + 11} y1={p.y} y2={p.y} />
          <line x1={p.x} x2={p.x} y1={p.y - 11} y2={p.y - 4} /><line x1={p.x} x2={p.x} y1={p.y + 4} y2={p.y + 11} />
          <circle cx={p.x} cy={p.y} r={1.3} fill={colour} stroke="none" />
        </g>
      ) : (
        <circle cx={p.x} cy={p.y} r={r} fill={colour} stroke="#fff" strokeWidth={1.5} />
      )}
      {label && <HaloText x={p.x + 10} y={p.y - 8} size={11} anchor="start" fill={colour} bold>{label}</HaloText>}
    </g>
  )
}

export function ChartText({ at, children, colour = C.ink, size = 12, dx = 0, dy = 0, anchor = 'middle', bold }: {
  at: LatLon; children: ReactNode; colour?: string; size?: number; dx?: number; dy?: number; anchor?: 'start' | 'middle' | 'end'; bold?: boolean
}) {
  const p = project(at)
  return <HaloText x={p.x + dx} y={p.y + dy} size={size} anchor={anchor} fill={colour} bold={bold}>{children}</HaloText>
}

export function ChartHighlight({ at, r = 20, colour = C.plot }: { at: LatLon; r?: number; colour?: string }) {
  const p = project(at)
  return (
    <circle cx={p.x} cy={p.y} r={r} fill="none" stroke={colour} strokeWidth={3} vectorEffect="non-scaling-stroke">
      <animate attributeName="r" values={`${r * 0.8};${r * 1.25};${r * 0.8}`} dur="1.6s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite" />
    </circle>
  )
}

/*
 * Standard plotting symbols (RYA/Admiralty conventions), so every lesson
 * draws them the same way:
 *   fix ⊙ circle with a dot · EP triangle with a dot · DR small cross
 *   water track one arrow · ground track two arrows · tidal stream three.
 */
interface PlotSymbolProps {
  at: LatLon
  label?: string
  colour?: string
  /** Label font size in chart pixels (default 11). */
  labelSize?: number
  /** Where the label sits relative to the symbol (default upper right). */
  labelAt?: 'ne' | 'nw' | 'se' | 'sw'
}

function SymbolLabel({ p, label, colour, size = 11, at = 'ne' }: { p: Pt; label?: string; colour: string; size?: number; at?: PlotSymbolProps['labelAt'] }) {
  if (!label) return null
  const east = at === 'ne' || at === 'se'
  const north = at === 'ne' || at === 'nw'
  return (
    <HaloText x={p.x + (east ? 10 : -10)} y={p.y + (north ? -9 : 9 + size * 0.8)} size={size} anchor={east ? 'start' : 'end'} fill={colour} bold>
      {label}
    </HaloText>
  )
}

export function ChartFix({ at, label, colour = C.plotAlt, labelSize, labelAt }: PlotSymbolProps) {
  const p = project(at)
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={7} fill="none" stroke={colour} strokeWidth={2} />
      <circle cx={p.x} cy={p.y} r={1.6} fill={colour} />
      <SymbolLabel p={p} label={label} colour={colour} size={labelSize} at={labelAt} />
    </g>
  )
}

export function ChartEP({ at, label, colour = C.plotAlt, labelSize, labelAt }: PlotSymbolProps) {
  const p = project(at)
  return (
    <g>
      <polygon points={`${p.x},${r2(p.y - 9)} ${r2(p.x - 8)},${r2(p.y + 5.5)} ${r2(p.x + 8)},${r2(p.y + 5.5)}`} fill="none" stroke={colour} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={p.x} cy={p.y} r={1.6} fill={colour} />
      <SymbolLabel p={p} label={label} colour={colour} size={labelSize} at={labelAt} />
    </g>
  )
}

export function ChartDR({ at, label, colour = C.plotAlt, labelSize, labelAt }: PlotSymbolProps) {
  const p = project(at)
  return (
    <g>
      <g stroke={colour} strokeWidth={2} strokeLinecap="round">
        <line x1={p.x - 6} x2={p.x + 6} y1={p.y} y2={p.y} />
        <line x1={p.x} x2={p.x} y1={p.y - 6} y2={p.y + 6} />
      </g>
      <SymbolLabel p={p} label={label} colour={colour} size={labelSize} at={labelAt} />
    </g>
  )
}

/** A track or stream vector with 1 (water track), 2 (ground track) or 3 (tidal stream) arrowheads mid-line. */
export function ChartVector({ from, to, arrows, colour = C.plot, width = 2, progress = 1 }: {
  from: LatLon; to: LatLon; arrows: 1 | 2 | 3; colour?: string; width?: number; progress?: number
}) {
  const a = project(from)
  const b0 = project(to)
  const k = Math.max(0, Math.min(1, progress))
  if (k === 0) return null
  const b = { x: r2(a.x + (b0.x - a.x) * k), y: r2(a.y + (b0.y - a.y) * k) }
  const ang = Math.atan2(b0.y - a.y, b0.x - a.x)
  const len = Math.hypot(b.x - a.x, b.y - a.y)
  const head = 8
  const heads = Array.from({ length: arrows }, (_, i) => {
    const d = len / 2 + (i - (arrows - 1) / 2) * 7
    const hx = a.x + Math.cos(ang) * d
    const hy = a.y + Math.sin(ang) * d
    return `M${r2(hx - head * Math.cos(ang - 0.45))} ${r2(hy - head * Math.sin(ang - 0.45))} L${r2(hx)} ${r2(hy)} L${r2(hx - head * Math.cos(ang + 0.45))} ${r2(hy - head * Math.sin(ang + 0.45))}`
  })
  return (
    <g stroke={colour} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
      {k > 0.6 && heads.map((d, i) => <path key={i} d={d} />)}
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* The chart                                                           */
/* ------------------------------------------------------------------ */

export type ChartMode = 'view' | 'readout' | 'pick' | 'measure'

export interface PracticeChartProps {
  /** Area shown (defaults to the whole chart). */
  view?: ViewRect
  /** view: look only · readout: show cursor position · pick: click to plot · measure: dividers. */
  mode?: ChartMode
  /** Show zoom buttons and allow panning when zoomed in. */
  zoomable?: boolean
  onPick?: (p: LatLon) => void
  /** Plotted position (pick mode shows the last click if this is omitted). */
  marker?: LatLon | null
  /** Initial divider points for measure mode. */
  dividers?: [LatLon, LatLon]
  /** Called as the dividers move: distance (M), bearing (°T) and the two points. */
  onMeasure?: (distanceNm: number, bearing: number, points: [LatLon, LatLon]) => void
  /** Feature ids to pulse. */
  highlight?: string[]
  soundings?: boolean
  labels?: boolean
  /** Fill the parent box (used by the lesson player) instead of sizing itself. */
  fill?: boolean
  className?: string
  title?: string
  /** Overlays in chart pixels, clipped to the plotting area. */
  children?: ReactNode
  /** Overlays in chart pixels drawn over everything, border scales included (not clipped). */
  overlay?: ReactNode
}

function clampView(v: ViewRect): ViewRect {
  const w = Math.min(v.w, CHART_WIDTH)
  const h = Math.min(v.h, CHART_HEIGHT)
  return { w, h, x: Math.min(Math.max(v.x, 0), CHART_WIDTH - w), y: Math.min(Math.max(v.y, 0), CHART_HEIGHT - h) }
}

function inPlot(p: Pt): boolean {
  return p.x >= X0 && p.x <= X1 && p.y >= Y0 && p.y <= Y1
}

export default function PracticeChart({
  view, mode = 'view', zoomable = false, onPick, marker, dividers, onMeasure, highlight, soundings = true,
  labels = true, fill = false, className, title = 'Practice chart of the fictional Isle of Kerran', children, overlay,
}: PracticeChartProps) {
  const clipId = `plot${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const svgRef = useRef<SVGSVGElement>(null)
  const baseView = view ?? FULL_VIEW
  const [userView, setUserView] = useState<ViewRect | null>(null)
  const [lastBase, setLastBase] = useState(baseView)
  // A new `view` prop (e.g. the next exercise) discards the user's zoom.
  if (zoomable && lastBase !== baseView && viewBoxString(lastBase) !== viewBoxString(baseView)) {
    setLastBase(baseView)
    setUserView(null)
  }
  const current = userView ?? baseView
  const [hover, setHover] = useState<LatLon | null>(null)
  const [picked, setPicked] = useState<LatLon | null>(null)
  const [pins, setPins] = useState<[LatLon, LatLon]>(dividers ?? [km(3.0, 9.0), km(1.5, 7.0)])
  const [focusedPin, setFocusedPin] = useState<0 | 1 | null>(null)
  const drag = useRef<{ kind: 'pan' | 'pin'; pin?: 0 | 1; startX: number; startY: number; view: ViewRect; moved: boolean } | null>(null)

  function movePin(i: 0 | 1, p: LatLon) {
    const next: [LatLon, LatLon] = [...pins] as [LatLon, LatLon]
    next[i] = p
    setPins(next)
    onMeasure?.(rhumbDistance(next[0], next[1]), rhumbBearing(next[0], next[1]), next)
  }

  // Arrow keys move a focused divider point 0.05' (Shift: 0.5').
  function onPinKey(i: 0 | 1, e: ReactKeyboardEvent<SVGCircleElement>) {
    const step = (e.shiftKey ? 0.5 : 0.05) / 60
    const p = pins[i]
    const cos = Math.cos((p.lat * Math.PI) / 180)
    let { lat, lon } = p
    if (e.key === 'ArrowUp') lat += step
    else if (e.key === 'ArrowDown') lat -= step
    else if (e.key === 'ArrowLeft') lon -= step / cos
    else if (e.key === 'ArrowRight') lon += step / cos
    else return
    e.preventDefault()
    lat = Math.min(Math.max(lat, CHART_BOUNDS.south), CHART_BOUNDS.north)
    lon = Math.min(Math.max(lon, CHART_BOUNDS.west), CHART_BOUNDS.east)
    movePin(i, { lat, lon })
  }

  function toChart(e: { clientX: number; clientY: number }): Pt {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return { x: 0, y: 0 }
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }

  function zoom(factor: number) {
    const v = current
    const w = Math.max(140, Math.min(CHART_WIDTH, v.w * factor))
    const h = (w / v.w) * v.h
    if (h > CHART_HEIGHT) return setUserView(null)
    setUserView(clampView({ x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h }))
  }

  function onPointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    if (mode === 'view' && !zoomable) return
    const target = e.target as Element
    const pinAttr = target.getAttribute('data-pin')
    if (mode === 'measure' && pinAttr !== null) {
      drag.current = { kind: 'pin', pin: pinAttr === '1' ? 1 : 0, startX: e.clientX, startY: e.clientY, view: current, moved: false }
    } else {
      drag.current = { kind: 'pan', startX: e.clientX, startY: e.clientY, view: current, moved: false }
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    const d = drag.current
    if (!d) {
      if (mode === 'readout' && e.pointerType === 'mouse') {
        const p = toChart(e)
        setHover(inPlot(p) ? unproject(p) : null)
      }
      return
    }
    if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 4) d.moved = true
    if (d.kind === 'pin' && d.pin !== undefined) {
      const p = toChart(e)
      const clamped = { x: Math.min(Math.max(p.x, X0), X1), y: Math.min(Math.max(p.y, Y0), Y1) }
      movePin(d.pin, unproject(clamped))
    } else if (zoomable && d.moved && current.w < CHART_WIDTH - 1) {
      const svg = svgRef.current
      if (!svg) return
      const scale = d.view.w / svg.clientWidth
      setUserView(clampView({ ...d.view, x: d.view.x - (e.clientX - d.startX) * scale, y: d.view.y - (e.clientY - d.startY) * scale }))
    }
  }

  function onPointerUp(e: ReactPointerEvent<SVGSVGElement>) {
    const d = drag.current
    drag.current = null
    if (!d || d.moved || d.kind !== 'pan') return
    const p = toChart(e)
    if (!inPlot(p)) return
    const ll = unproject(p)
    if (mode === 'pick') {
      setPicked(ll)
      onPick?.(ll)
    } else if (mode === 'readout') {
      setHover(ll)
    }
  }

  const shownMarker = marker !== undefined ? marker : picked
  const dist = rhumbDistance(pins[0], pins[1])
  const brg = rhumbBearing(pins[0], pins[1])
  const zoomed = zoomable && current.w < CHART_WIDTH - 1
  const interactive = mode !== 'view' || zoomable

  const svg = (
    <svg
      ref={svgRef}
      viewBox={viewBoxString(current)}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={title}
      className={fill ? 'absolute inset-0 w-full h-full select-none' : 'block w-full h-auto select-none'}
      style={{
        touchAction: mode === 'measure' || zoomed ? 'none' : 'manipulation',
        cursor: mode === 'pick' || mode === 'readout' ? 'crosshair' : zoomed ? 'grab' : undefined,
      }}
      onPointerDown={interactive ? onPointerDown : undefined}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerUp={interactive ? onPointerUp : undefined}
      onPointerLeave={mode === 'readout' ? () => setHover(null) : undefined}
    >
      <defs>
        <clipPath id={clipId}><rect x={X0} y={Y0} width={PLOT_WIDTH} height={PLOT_HEIGHT} /></clipPath>
      </defs>
      <ChartBase soundings={soundings} labels={labels} clipId={clipId} />
      <g clipPath={`url(#${clipId})`}>
        {highlight?.map((id) => {
          const f = FEATURES.find((x) => x.id === id)
          return f ? <ChartHighlight key={id} at={f.at} /> : null
        })}
        {children}
        {shownMarker && <ChartPoint at={shownMarker} cross colour={C.plotAlt} />}
        {mode === 'measure' && (
          <g>
            <ChartLine from={pins[0]} to={pins[1]} colour={C.plotAlt} width={1.6} dash="5 4" />
            {pins.map((p, i) => {
              const q = project(p)
              return (
                <g key={i}>
                  {focusedPin === i && <circle cx={q.x} cy={q.y} r={19} fill="none" stroke={C.plot} strokeWidth={3} vectorEffect="non-scaling-stroke" />}
                  <circle
                    cx={q.x} cy={q.y} r={16} fill={C.plotAlt} fillOpacity={0.12} data-pin={i} style={{ cursor: 'move', outline: 'none' }}
                    tabIndex={0} role="button" aria-label={`Divider point ${i === 0 ? 'A' : 'B'}: drag, or use the arrow keys to move it (Shift for bigger steps)`}
                    onKeyDown={(e) => onPinKey(i as 0 | 1, e)} onFocus={() => setFocusedPin(i as 0 | 1)} onBlur={() => setFocusedPin(null)}
                  />
                  <circle cx={q.x} cy={q.y} r={3} fill={C.plotAlt} pointerEvents="none" />
                  <text x={q.x + 12} y={q.y - 10} fontSize={11} fontWeight={700} fill={C.plotAlt} pointerEvents="none">{i === 0 ? 'A' : 'B'}</text>
                </g>
              )
            })}
          </g>
        )}
      </g>
      {overlay}
    </svg>
  )

  if (fill) return svg

  return (
    <figure className={['relative', className].filter(Boolean).join(' ')}>
      <div className="relative overflow-hidden rounded-lg border border-border bg-white">
        {svg}
        {zoomable && (
          <div className="absolute right-2 top-2 flex flex-col gap-1.5">
            <button type="button" onClick={() => zoom(0.6)} className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-xl font-bold leading-none text-white shadow-lg ring-2 ring-white hover:bg-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal" aria-label="Zoom in">+</button>
            <button type="button" onClick={() => zoom(1 / 0.6)} className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-xl font-bold leading-none text-white shadow-lg ring-2 ring-white hover:bg-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal" aria-label="Zoom out">−</button>
            {userView && (
              <button type="button" onClick={() => setUserView(null)} className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-xl font-bold leading-none text-white shadow-lg ring-2 ring-white hover:bg-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal" aria-label="Reset view">⟲</button>
            )}
          </div>
        )}
      </div>
      {(mode === 'readout' || mode === 'measure' || mode === 'pick') && (
        <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-navy px-3 py-2 font-mono text-xs text-white" aria-live="polite">
          {mode === 'readout' && (hover ? <span>Position: {formatPosition(hover)}</span> : <span className="text-white/70">Point at (or tap) the chart to read a position</span>)}
          {mode === 'pick' && (shownMarker ? <span>Plotted: {formatLat(shownMarker.lat)} {formatLon(shownMarker.lon)}</span> : <span className="text-white/70">Tap the chart to plot a position</span>)}
          {mode === 'measure' && (
            <>
              <span>Distance A→B: {dist.toFixed(2)} M</span>
              <span>Bearing A→B: {formatBearing(brg, 'T')}</span>
              <span className="text-white/70">Drag A and B, or Tab to them and use the arrow keys</span>
            </>
          )}
          {zoomable && <span className="ml-auto text-white/60">Zoom with + / −, drag to pan</span>}
        </figcaption>
      )}
    </figure>
  )
}
