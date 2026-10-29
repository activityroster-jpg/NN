// Dividers and scale markings drawn in any SVG space (chart pixels in the
// widgets and video). Pure components: no hooks, coordinates rounded with
// r2 so server and browser markup agree.

import type { Pt } from '@/lib/courses/navigation/chart-geometry'
import { r2 } from '@/lib/courses/navigation/chart-geometry'

/** Where the hinge sits for points p and q: `side` 1 is to the left of p→q, -1 to the right. */
export function hingeFor(p: Pt, q: Pt, leg: number, side: 1 | -1): Pt {
  const dx = q.x - p.x
  const dy = q.y - p.y
  const len = Math.hypot(dx, dy)
  const half = len / 2
  const L = Math.max(leg, half * 1.08)
  const h = Math.sqrt(L * L - half * half)
  const ux = len > 1e-6 ? dx / len : 1
  const uy = len > 1e-6 ? dy / len : 0
  return { x: r2((p.x + q.x) / 2 + uy * side * h), y: r2((p.y + q.y) / 2 - ux * side * h) }
}

/**
 * A pair of steel dividers with its points on p and q. `leg` is the leg
 * length (it grows if the points are wider apart than the legs allow) and
 * `width` the stroke width, both in the drawing's own units.
 */
export function DividersArt({ p, q, leg, side = 1, width = 1.6, opacity = 1 }: {
  p: Pt; q: Pt; leg: number; side?: 1 | -1; width?: number; opacity?: number
}) {
  const h = hingeFor(p, q, leg, side)
  const a = { x: r2(p.x), y: r2(p.y) }
  const b = { x: r2(q.x), y: r2(q.y) }
  return (
    <g opacity={opacity} strokeLinecap="round" pointerEvents="none">
      <g stroke="#ffffff" strokeWidth={r2(width * 2.2)}>
        <line x1={h.x} y1={h.y} x2={a.x} y2={a.y} />
        <line x1={h.x} y1={h.y} x2={b.x} y2={b.y} />
      </g>
      <line x1={h.x} y1={h.y} x2={a.x} y2={a.y} stroke="#475569" strokeWidth={width} />
      <line x1={h.x} y1={h.y} x2={b.x} y2={b.y} stroke="#334155" strokeWidth={width} />
      <circle cx={h.x} cy={h.y} r={r2(width * 2.4)} fill="#94a3b8" stroke="#1e293b" strokeWidth={r2(width * 0.6)} />
      <circle cx={a.x} cy={a.y} r={r2(width * 1.1)} fill="#c2410c" stroke="#fff" strokeWidth={r2(width * 0.4)} />
      <circle cx={b.x} cy={b.y} r={r2(width * 1.1)} fill="#c2410c" stroke="#fff" strokeWidth={r2(width * 0.4)} />
    </g>
  )
}

/** Rotate point v about c by `deg` degrees (screen coordinates, y down). */
export function rotateAbout(v: Pt, c: Pt, deg: number): Pt {
  const a = (deg * Math.PI) / 180
  const dx = v.x - c.x
  const dy = v.y - c.y
  return { x: c.x + dx * Math.cos(a) - dy * Math.sin(a), y: c.y + dx * Math.sin(a) + dy * Math.cos(a) }
}

export function lerpPt(a: Pt, b: Pt, k: number): Pt {
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }
}

/** Haloed text at drawing coordinates (the chart's own ChartText takes a LatLon). */
export function HaloLabel({ x, y, size, colour, bold, anchor = 'start', opacity = 1, children }: {
  x: number; y: number; size: number; colour: string; bold?: boolean; anchor?: 'start' | 'middle' | 'end'; opacity?: number; children: string
}) {
  return (
    <text
      x={r2(x)} y={r2(y)} fontSize={size} fill={colour} fontWeight={bold ? 700 : 400} textAnchor={anchor} opacity={opacity}
      stroke="#fff" strokeWidth={r2(size * 0.28)} paintOrder="stroke" strokeLinejoin="round"
    >
      {children}
    </text>
  )
}

/**
 * One or more bold lines on a white card, readable over a busy chart. `y` is
 * the first line's baseline; the card is sized from the character count.
 */
export function LabelBox({ x, y, size, lines, anchor = 'start', opacity = 1 }: {
  x: number; y: number; size: number; lines: Array<{ text: string; colour: string }>; anchor?: 'start' | 'middle' | 'end'; opacity?: number
}) {
  const pad = size * 0.35
  const w = Math.max(...lines.map((l) => l.text.length)) * size * 0.56 + pad * 2
  const h = lines.length * size * 1.22 + pad * 1.4
  const left = anchor === 'start' ? x - pad : anchor === 'middle' ? x - w / 2 : x - w + pad
  return (
    <g opacity={opacity} pointerEvents="none">
      <rect x={r2(left)} y={r2(y - size - pad * 0.4)} width={r2(w)} height={r2(h)} rx={r2(size * 0.3)} fill="#fff" fillOpacity={0.93} stroke="#94a3b8" strokeWidth={r2(size * 0.05)} />
      {lines.map((l, i) => (
        <text key={i} x={r2(x)} y={r2(y + i * size * 1.22)} fontSize={size} fontWeight={700} fill={l.colour} textAnchor={anchor}>
          {l.text}
        </text>
      ))}
    </g>
  )
}
