// Answer checking for course exercises. Lenient about how numbers are
// typed ("2,5", "045°T", "6 kn") but strict about the value.

import { bearingDiff, rhumbDistance, type LatLon } from './geo'

/** First number in a string, accepting a comma as the decimal point. */
export function parseNumber(input: string): number | null {
  const m = input.replace(/,/g, '.').match(/-?\d+(?:\.\d+)?|-?\.\d+/)
  if (!m) return null
  const n = Number(m[0])
  return Number.isFinite(n) ? n : null
}

export function checkNumeric(input: string, answer: number, tolerance: number): boolean {
  const n = parseNumber(input)
  return n !== null && Math.abs(n - answer) <= tolerance + 1e-9
}

export function checkBearing(input: string, answer: number, tolerance: number): boolean {
  const n = parseNumber(input)
  return n !== null && n >= 0 && n <= 360 && bearingDiff(n, answer) <= tolerance + 1e-9
}

export interface PositionInput {
  latDeg: string
  latMin: string
  latHemi: 'N' | 'S'
  lonDeg: string
  lonMin: string
  lonHemi: 'E' | 'W'
}

export function parsePosition(p: PositionInput): LatLon | null {
  const ld = parseNumber(p.latDeg)
  const lm = parseNumber(p.latMin)
  const od = parseNumber(p.lonDeg)
  const om = parseNumber(p.lonMin)
  if (ld === null || lm === null || od === null || om === null) return null
  if (ld < 0 || ld > 90 || od < 0 || od > 180 || lm < 0 || lm >= 60 || om < 0 || om >= 60) return null
  const lat = (ld + lm / 60) * (p.latHemi === 'S' ? -1 : 1)
  const lon = (od + om / 60) * (p.lonHemi === 'W' ? -1 : 1)
  return { lat, lon }
}

/** Both latitude and longitude within `toleranceMin` minutes of arc. */
export function checkPosition(p: PositionInput, answer: LatLon, toleranceMin: number): boolean {
  const got = parsePosition(p)
  if (!got) return false
  return Math.abs(got.lat - answer.lat) * 60 <= toleranceMin + 1e-9 && Math.abs(got.lon - answer.lon) * 60 <= toleranceMin + 1e-9
}

/** A plotted point within `toleranceNm` nautical miles. */
export function checkPlot(got: LatLon, answer: LatLon, toleranceNm: number): boolean {
  return rhumbDistance(got, answer) <= toleranceNm
}

/** A 24-hour clock time ("1454", "14:54", "14.54", "1454 BST") → minutes after midnight; null if it isn't one. */
export function parseClock(input: string): number | null {
  const digits = input.replace(/\D/g, '')
  if (digits.length < 3 || digits.length > 4) return null
  const v = digits.padStart(4, '0')
  const h = Number(v.slice(0, 2))
  const m = Number(v.slice(2))
  if (h > 23 || m > 59) return null
  return h * 60 + m
}

/** Clock time within `toleranceMin` minutes of `answer` (minutes after midnight), across midnight too. */
export function checkClock(input: string, answer: number, toleranceMin: number): boolean {
  const t = parseClock(input)
  if (t === null) return false
  const d = Math.abs(t - (((answer % 1440) + 1440) % 1440)) % 1440
  return Math.min(d, 1440 - d) <= toleranceMin + 1e-9
}

/** Minutes after midnight → "1454". */
export function formatClock(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}${String(m % 60).padStart(2, '0')}`
}
