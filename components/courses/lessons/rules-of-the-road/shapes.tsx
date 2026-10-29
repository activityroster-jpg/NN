// Day shapes for Lesson 10 (ported from the Boaty Jobs lesson on navigation
// lights and shapes): the black shapes vessels hoist by day, as data and as
// pure SVG drawings (no hooks), safe in server-rendered notes.

import type { ReactNode } from 'react'
import { r2 } from '@/lib/courses/navigation/chart-geometry'

/* ------------------------------------------------------------------ */

export type Shape = 'ball' | 'cone-up' | 'cone-down' | 'diamond' | 'cylinder'

export const SHAPE_NAME: Record<Shape, string> = {
  ball: 'Ball',
  'cone-up': 'Cone, point up',
  'cone-down': 'Cone, point down',
  diamond: 'Diamond',
  cylinder: 'Cylinder',
}

export interface DaySignal {
  id: string
  /** Top to bottom. */
  shapes: Shape[]
  meaning: string
  detail: string
  rule: string
  hull: 'ship' | 'yacht' | 'fishing' | 'tug'
  /** "Hoist the signal" prompt. */
  task: string
}

export const DAY_SIGNALS: DaySignal[] = [
  {
    id: 'anchor', shapes: ['ball'], meaning: 'At anchor', rule: 'Rule 30',
    detail: 'One black ball in the fore part of the vessel means she is at anchor. Yachts must show it too (only boats under 7 m anchored well away from channels, fairways, anchorages and the routes other vessels use are excused).',
    hull: 'ship', task: 'You have anchored your yacht in a busy anchorage for lunch.',
  },
  {
    id: 'nuc', shapes: ['ball', 'ball'], meaning: 'Not under command', rule: 'Rule 27(a)',
    detail: 'Two balls in a vertical line: not under command — through some exceptional circumstance, such as an engine or steering failure, she cannot manoeuvre as the rules require.',
    hull: 'ship', task: 'Your ship’s steering gear has failed and she cannot manoeuvre.',
  },
  {
    id: 'aground', shapes: ['ball', 'ball', 'ball'], meaning: 'Aground', rule: 'Rule 30(d)',
    detail: 'Three balls in a vertical line: aground. The water around her is too shallow — keep well clear.',
    hull: 'ship', task: 'Your ship has run aground on a sandbank.',
  },
  {
    id: 'ram', shapes: ['ball', 'diamond', 'ball'], meaning: 'Restricted in her ability to manoeuvre', rule: 'Rule 27(b)',
    detail: 'Ball, diamond, ball: restricted in her ability to manoeuvre by the nature of her work — dredging, surveying, laying cable, servicing a buoy and the like.',
    hull: 'ship', task: 'Your vessel is laying a submarine cable.',
  },
  {
    id: 'cbd', shapes: ['cylinder'], meaning: 'Constrained by her draught', rule: 'Rule 28',
    detail: 'A cylinder: constrained by her draught — a deep-draught power-driven vessel that cannot turn far from her course. Showing it is optional.',
    hull: 'ship', task: 'Your deep-draught tanker can only stay in the dredged channel, and you want to warn others.',
  },
  {
    id: 'fishing', shapes: ['cone-down', 'cone-up'], meaning: 'Engaged in fishing (trawling or otherwise)', rule: 'Rule 26',
    detail: 'Two cones with their points together: engaged in fishing. Trawlers and other fishing vessels show the same shape by day.',
    hull: 'fishing', task: 'Your fishing boat is trawling.',
  },
  {
    id: 'motorsail', shapes: ['cone-down'], meaning: 'Sailing vessel also under engine', rule: 'Rule 25(e)',
    detail: 'One cone, point down, forward: a vessel under sail that is also being driven by her engine. She counts as a power-driven vessel.',
    hull: 'yacht', task: 'You are sailing your yacht with the engine running to help her along.',
  },
  {
    id: 'tow', shapes: ['diamond'], meaning: 'Towing — tow longer than 200 m', rule: 'Rule 24',
    detail: 'A diamond: a tow longer than 200 m. The tug and the vessel being towed each show one.',
    hull: 'tug', task: 'You are towing a barge, and the tow is 250 m long.',
  },
]

export const DAY_SIGNAL: Record<string, DaySignal> = Object.fromEntries(DAY_SIGNALS.map((d) => [d.id, d]))

/** Same shapes in the same order? */
export function sameShapes(a: Shape[], b: Shape[]): boolean {
  return a.length === b.length && a.every((s, i) => s === b[i])
}

/* ------------------------------------------------------------------ */

/** Height of each shape in units of the ball's diameter (Annex I: cone as tall as it is wide; cylinder and diamond twice as tall). */
export const SHAPE_HEIGHT: Record<Shape, number> = { ball: 1, 'cone-up': 1, 'cone-down': 1, diamond: 2, cylinder: 2 }

/** A black day shape centred on (x, y), `u` = diameter. */
export function ShapeIcon({ shape, x, y, u, fill = '#141a21' }: { shape: Shape; x: number; y: number; u: number; fill?: string }) {
  const h = u / 2
  switch (shape) {
    case 'ball':
      return <circle cx={x} cy={y} r={r2(h)} fill={fill} />
    case 'cone-up':
      return <polygon points={`${x},${r2(y - h)} ${r2(x + h)},${r2(y + h)} ${r2(x - h)},${r2(y + h)}`} fill={fill} />
    case 'cone-down':
      return <polygon points={`${x},${r2(y + h)} ${r2(x + h)},${r2(y - h)} ${r2(x - h)},${r2(y - h)}`} fill={fill} />
    case 'diamond':
      return <polygon points={`${x},${r2(y - u)} ${r2(x + h)},${y} ${x},${r2(y + u)} ${r2(x - h)},${y}`} fill={fill} />
    case 'cylinder':
      return (
        <g>
          <rect x={r2(x - h)} y={r2(y - u)} width={u} height={r2(2 * u)} fill={fill} />
          <ellipse cx={x} cy={r2(y - u)} rx={r2(h)} ry={r2(u * 0.14)} fill="#3a4654" />
        </g>
      )
  }
}

/** Shapes hung in a vertical line from (x, top), listed top to bottom. Returns the bottom y via layout. */
export function shapeLayout(shapes: Shape[], top: number, u: number, gap: number): { shape: Shape; y: number }[] {
  let y = top
  return shapes.map((s) => {
    const hgt = SHAPE_HEIGHT[s] * u
    const out = { shape: s, y: r2(y + hgt / 2) }
    y += hgt + gap
    return out
  })
}

export function stackHeight(shapes: Shape[], u: number, gap: number): number {
  return shapes.reduce((n, s) => n + SHAPE_HEIGHT[s] * u, 0) + Math.max(0, shapes.length - 1) * gap
}

export function ShapeStack({ shapes, x, top, u, gap, line = true }: { shapes: Shape[]; x: number; top: number; u: number; gap: number; line?: boolean }) {
  const lay = shapeLayout(shapes, top, u, gap)
  const bottom = top + stackHeight(shapes, u, gap)
  return (
    <g>
      {line && <line x1={x} y1={r2(top - gap)} x2={x} y2={r2(bottom + gap * 0.6)} stroke="#4b5563" strokeWidth={Math.max(1, u / 18)} />}
      {lay.map((l, i) => <ShapeIcon key={i} shape={l.shape} x={x} y={l.y} u={u} />)}
    </g>
  )
}

/** Tiny inline stack of day shapes for tables. */
export function ShapeStackIcon({ shapes, label }: { shapes: Shape[]; label: string }) {
  const u = 12
  const gap = 4
  const h = stackHeight(shapes, u, gap) + 6
  return (
    <svg viewBox={`0 0 20 ${h}`} width={20} height={h} className="inline-block align-middle" role="img" aria-label={label}>
      <rect width={20} height={h} rx={4} fill="#e6eef5" />
      {shapeLayout(shapes, 3, u, gap).map((l, i) => <ShapeIcon key={i} shape={l.shape} x={10} y={l.y} u={u} />)}
    </svg>
  )
}

const HULL_GREY = '#56636f'
const HULL_DARK = '#3b4652'
const SUPER = '#e9edf1'

/**
 * A vessel by day, side-on, bow to the right, standing on the waterline at
 * (x, y), about 520 × 330 units at scale 1, flying `shapes`.
 */
export function DayVessel({ hull, shapes, x, y, scale = 1 }: { hull: DaySignal['hull']; shapes: Shape[]; x: number; y: number; scale?: number }) {
  const u = 38
  const gap = 18
  let art: ReactNode
  if (hull === 'ship') {
    art = (
      <g>
        <polygon points="-260,0 250,0 268,-48 -250,-44" fill={HULL_GREY} />
        <polygon points="-250,-44 268,-48 270,-58 -252,-54" fill={HULL_DARK} />
        <rect x={-235} y={-130} width={95} height={76} fill={SUPER} />
        <rect x={-228} y={-150} width={80} height={22} fill={SUPER} />
        {[-220, -195, -170].map((wx) => <rect key={wx} x={wx} y={-144} width={16} height={10} fill="#3b4652" />)}
        <rect x={-210} y={-190} width={20} height={40} fill="#c2410c" />
        <line x1={150} y1={-56} x2={150} y2={-300} stroke={HULL_DARK} strokeWidth={6} />
        <line x1={128} y1={-286} x2={210} y2={-286} stroke={HULL_DARK} strokeWidth={5} />
        <line x1={150} y1={-300} x2={265} y2={-58} stroke="#8a96a3" strokeWidth={1.5} />
        <rect x={-30} y={-80} width={140} height={24} fill="#7c8a96" />
        <ShapeStack shapes={shapes} x={205} top={-286 + gap} u={u} gap={gap} />
      </g>
    )
  } else if (hull === 'yacht') {
    art = (
      <g>
        <path d="M-150 0 L150 0 Q 175 -10 190 -34 L-160 -30 Q-158 -12 -150 0 Z" fill="#f4f1ea" stroke="#5b5348" strokeWidth={2} />
        <path d="M-20 0 L20 0 L12 34 L-8 34 Z" fill={HULL_DARK} />
        <line x1={0} y1={-30} x2={0} y2={-310} stroke={HULL_DARK} strokeWidth={5} />
        <polygon points="-6,-300 -6,-46 -150,-46" fill="#ffffff" stroke="#b9c6cf" strokeWidth={2} />
        <polygon points="8,-292 182,-36 20,-40" fill="#ffffff" stroke="#b9c6cf" strokeWidth={2} />
        <line x1={0} y1={-300} x2={188} y2={-34} stroke="#8a96a3" strokeWidth={1.5} />
        <line x1={0} y1={-210} x2={-26} y2={-210} stroke={HULL_DARK} strokeWidth={3} />
        <ShapeStack shapes={shapes} x={60} top={-200} u={u} gap={gap} />
        <line x1={60} y1={-200 - gap} x2={4} y2={-240} stroke="#4b5563" strokeWidth={1.5} />
      </g>
    )
  } else if (hull === 'fishing') {
    art = (
      <g>
        <path d="M-200 0 L190 0 Q 215 -30 225 -70 L-205 -54 Z" fill="#2f5d7c" />
        <rect x={-150} y={-120} width={110} height={66} fill={SUPER} />
        {[-140, -110, -80].map((wx) => <rect key={wx} x={wx} y={-110} width={20} height={14} fill="#3b4652" />)}
        <line x1={110} y1={-62} x2={110} y2={-290} stroke={HULL_DARK} strokeWidth={6} />
        <line x1={-180} y1={-54} x2={-180} y2={-200} stroke={HULL_DARK} strokeWidth={5} />
        <line x1={-180} y1={-200} x2={-80} y2={-120} stroke={HULL_DARK} strokeWidth={3} />
        <line x1={110} y1={-276} x2={160} y2={-276} stroke={HULL_DARK} strokeWidth={4} />
        <ShapeStack shapes={shapes} x={155} top={-276 + gap} u={u} gap={gap} />
      </g>
    )
  } else {
    // Tug (right) towing a barge (left); each flies the shapes.
    art = (
      <g>
        <path d="M60 0 L250 0 Q 265 -20 270 -52 L52 -46 Z" fill="#b8402e" />
        <rect x={110} y={-112} width={100} height={64} fill={SUPER} />
        <rect x={130} y={-138} width={64} height={26} fill={SUPER} />
        <line x1={170} y1={-138} x2={170} y2={-290} stroke={HULL_DARK} strokeWidth={5} />
        <line x1={150} y1={-276} x2={204} y2={-276} stroke={HULL_DARK} strokeWidth={4} />
        <ShapeStack shapes={shapes} x={200} top={-276 + gap} u={u} gap={gap} />
        <path d="M60 -30 Q -10 8 -80 -24" fill="none" stroke="#4b5563" strokeWidth={2.5} />
        <rect x={-270} y={-40} width={190} height={40} fill={HULL_GREY} />
        <line x1={-110} y1={-40} x2={-110} y2={-170} stroke={HULL_DARK} strokeWidth={4} />
        <line x1={-110} y1={-160} x2={-80} y2={-160} stroke={HULL_DARK} strokeWidth={3} />
        <ShapeStack shapes={shapes} x={-84} top={-160 + gap} u={u} gap={gap} />
      </g>
    )
  }
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>{art}</g>
}

/** A day scene: a vessel flying her shapes. */
export function DayView({ signal, shapes, className = 'mx-auto block w-full max-w-lg rounded-xl', label }: { signal: string; shapes?: Shape[]; className?: string; label?: string }) {
  const s = DAY_SIGNAL[signal]!
  const flown = shapes ?? s.shapes
  return (
    <svg viewBox="0 0 640 380" className={className} role="img" aria-label={label ?? `By day, a vessel flying black shapes in a vertical line, from top to bottom: ${flown.map((x) => SHAPE_NAME[x].toLowerCase()).join('; ')}.`}>
      <rect width={640} height={380} fill="#dcebf6" />
      <rect y={318} width={640} height={62} fill="#7fa6c2" />
      <path d="M0 330 Q 80 322 160 330 T 320 330 T 480 330 T 640 330" fill="none" stroke="#a9c6da" strokeWidth={3} />
      <DayVessel hull={s.hull} shapes={flown} x={330} y={322} scale={0.95} />
    </svg>
  )
}
