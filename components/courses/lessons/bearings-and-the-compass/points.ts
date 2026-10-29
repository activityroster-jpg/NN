// Points of the compass and small helpers shared by this lesson's notes,
// widgets, scenes and exercises. Pure functions: safe on the server.

import { norm360 } from '@/lib/courses/geo'

export type PointKind = 'cardinal' | 'intercardinal' | 'three-letter'

export interface CompassPoint {
  abbr: string
  name: string
  deg: number
  kind: PointKind
}

const NAMES = [
  'north', 'north-north-east', 'north-east', 'east-north-east',
  'east', 'east-south-east', 'south-east', 'south-south-east',
  'south', 'south-south-west', 'south-west', 'west-south-west',
  'west', 'west-north-west', 'north-west', 'north-north-west',
]
const ABBRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']

/** The 16 points, 22½° apart, clockwise from north. */
export const POINTS: CompassPoint[] = ABBRS.map((abbr, i) => ({
  abbr,
  name: NAMES[i]!,
  deg: i * 22.5,
  kind: i % 4 === 0 ? 'cardinal' : i % 2 === 0 ? 'intercardinal' : 'three-letter',
}))

/** "022½°", "045°", "337½°" — three-figure notation with halves. */
export function formatDeg(d: number, suffix = ''): string {
  const v = norm360(d)
  const whole = Math.floor(v + 1e-9)
  const half = v - whole > 0.25
  return `${String(whole).padStart(3, '0')}${half ? '½' : ''}°${suffix}`
}

/** The nearest of the 16 points to a direction. */
export function nearestPoint(deg: number): CompassPoint {
  return POINTS[Math.round(norm360(deg) / 22.5) % 16]!
}

export function pointByAbbr(abbr: string): CompassPoint {
  const p = POINTS.find((x) => x.abbr === abbr)
  if (!p) throw new Error(`unknown point ${abbr}`)
  return p
}

/**
 * Where each narration sentence starts and ends as a fraction of the
 * scene (the player advances t by characters, sentence by sentence).
 */
export function sentenceSpans(narration: string): Array<[number, number]> {
  const parts = narration
    .split(/(?<=[.!?…])\s+(?=[A-Z0-9"“‘(£])/)
    .map((s) => s.trim())
    .filter(Boolean)
  const total = parts.reduce((n, s) => n + s.length, 0) || 1
  let at = 0
  return parts.map((s) => {
    const span: [number, number] = [at / total, (at + s.length) / total]
    at += s.length
    return span
  })
}

/** 0 → 1 progress through one sentence (clamped). */
export function within(spans: Array<[number, number]>, sentence: number, t: number): number {
  const s = spans[sentence]
  if (!s) return 1
  return Math.min(1, Math.max(0, (t - s[0]) / (s[1] - s[0] || 1)))
}
