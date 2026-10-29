// Depth bands of the practice chart's colour tints, worked out from the
// same depth model the chart is drawn from (depthAt), so what a widget or
// question says always agrees with the colours on screen. The tint edges
// mirror PracticeChart's Tints: drying (green) down to chart datum, blue
// to 5 m, pale blue to 10 m, white beyond.

import type { LatLon } from '@/lib/courses/geo'
import { CHART_VARIATION, CONTOUR_DEPTHS, depthAt, km } from '@/lib/courses/navigation/practice-chart'

/** (minutes north of 49°40'N, minutes west of 004°00'W), as depthAt takes. */
export type MinPt = [latMin: number, lonMinW: number]

export type Band = 'land' | 'drying' | 'shallow' | 'mid' | 'deep'
export const BAND_ORDER: Band[] = ['land', 'drying', 'shallow', 'mid', 'deep']

/** Depths (m below chart datum) where the blue tints change on the practice chart. */
export const TINT_EDGES = { shallow: 5, mid: 10 } as const

export const BAND_INFO: Record<Band, { tint: string; label: string; option: string; meaning: string }> = {
  land: {
    tint: 'Buff', label: 'Land', option: 'Land (buff)',
    meaning: 'Land, above the high-water line. Heights on land are given in metres above MHWS.',
  },
  drying: {
    tint: 'Green', label: 'Dries', option: 'Drying area (green): covered at high water, uncovered at low water',
    meaning: 'A drying area: the seabed here is above chart datum, so it is covered at high water and uncovered at low water. Drying heights are underlined.',
  },
  shallow: {
    tint: 'Blue', label: '0 to 5 m', option: 'Shallow water: less than 5 m at chart datum (blue)',
    meaning: 'Shallow water: less than 5 m deep at chart datum.',
  },
  mid: {
    tint: 'Pale blue', label: '5 to 10 m', option: 'Water 5 m to 10 m deep at chart datum (pale blue)',
    meaning: 'Water between 5 m and 10 m deep at chart datum.',
  },
  deep: {
    tint: 'White', label: 'over 10 m', option: 'Deeper water: more than 10 m at chart datum (white)',
    meaning: 'Deeper water: more than 10 m at chart datum.',
  },
}

export function toMinutes(p: LatLon): MinPt {
  return [(p.lat - 49 - 40 / 60) * 60, (-p.lon - 4) * 60]
}

export function depthAtPoint(p: LatLon): number | null {
  return depthAt(toMinutes(p))
}

export function bandOf(depth: number | null): Band {
  if (depth === null) return 'land'
  if (depth < 0) return 'drying'
  if (depth < TINT_EDGES.shallow) return 'shallow'
  if (depth < TINT_EDGES.mid) return 'mid'
  return 'deep'
}

export function bandAtMin(p: MinPt): Band {
  return bandOf(depthAt(p))
}

/** The charted contours either side of a depth: [shallower, deeper] (null beyond the last one). */
export function contoursAround(depth: number): [number | null, number | null] {
  let lower: number | null = null
  let upper: number | null = null
  for (const c of CONTOUR_DEPTHS) {
    if (c <= depth) lower = c
    else if (upper === null) upper = c
  }
  return [lower, upper]
}

/** A depth rounded the way soundings are: tenths under 21 m, whole metres deeper. */
export function roundDepth(d: number): number {
  return Math.abs(d) < 21 ? Math.round(d * 10) / 10 : Math.round(d)
}

const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']

/** "7₄" — a sounding written the chart way (drying heights are shown positive and underlined). */
export function soundingText(depth: number): string {
  const v = Math.abs(roundDepth(depth))
  const whole = Math.floor(v + 1e-9)
  const tenth = Math.round((v - whole) * 10)
  return v < 21 && tenth > 0 ? `${whole}${SUB[tenth]}` : `${whole}`
}

export interface BandStretch {
  band: Band
  start: MinPt
  end: MinPt
  /** Middle of the stretch. */
  mid: LatLon
}

/** Walk a straight line and list each band it crosses, in order. */
export function bandStretches(from: MinPt, to: MinPt, steps = 300): BandStretch[] {
  const out: BandStretch[] = []
  const at = (i: number): MinPt => [from[0] + ((to[0] - from[0]) * i) / steps, from[1] + ((to[1] - from[1]) * i) / steps]
  let startI = 0
  let current = bandAtMin(at(0))
  const close = (endI: number) => {
    const s = at(startI)
    const e = at(endI)
    out.push({ band: current, start: s, end: e, mid: km((s[0] + e[0]) / 2, (s[1] + e[1]) / 2) })
  }
  for (let i = 1; i <= steps; i++) {
    const b = bandAtMin(at(i))
    if (b !== current) {
      close(i - 1)
      startI = i
      current = b
    }
  }
  close(steps)
  return out
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']

/** Spoken form for narration: 2.1 → "two point one", 8 → "eight" (0–20). */
export function numberWords(n: number): string {
  const whole = Math.floor(Math.abs(n) + 1e-9)
  const tenth = Math.round((Math.abs(n) - whole) * 10)
  const w = NUMBER_WORDS[whole] ?? String(whole)
  return tenth > 0 ? `${w} point ${NUMBER_WORDS[tenth]}` : w
}

/** The compass rose's variation note, decoded from the label printed on it. */
export const VARIATION = (() => {
  const m = CHART_VARIATION.label.match(/VAR (\d+)°(\d+)'([EW]) \((\d{4})\) \((\d+)'([EW])\)/)
  if (!m) throw new Error(`unexpected variation label ${CHART_VARIATION.label}`)
  return {
    degrees: Number(m[1]), minutes: Number(m[2]), dir: m[3] as 'E' | 'W', year: Number(m[4]),
    change: Number(m[5]), changeDir: m[6] as 'E' | 'W',
  }
})()

/** "3°00′W" style. */
export function formatDegMin(totalMinutes: number, dir: string): string {
  const d = Math.floor(totalMinutes / 60)
  const m = Math.round(totalMinutes - d * 60)
  return `${d}°${String(m).padStart(2, '0')}′${dir}`
}
