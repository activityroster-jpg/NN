// Small, pure helpers for the speed–time–distance lesson: clock times,
// hours-and-minutes, rounding, and the chart legs the lesson uses. Shared
// by the server-rendered notes, the widgets, the video and the exercises,
// so every number agrees.

import { rhumbBearing, rhumbDistance, type LatLon } from '@/lib/courses/geo'
import { feature } from '@/lib/courses/navigation/practice-chart'

/** Round to one decimal place (tenths of a mile, tenths of a knot). */
export function round1(n: number): number {
  return Math.round(n * 10 + 1e-9) / 10
}

/** A number for display: at most `dp` decimals, no trailing zeros ("7.5", "6", "0.75"). */
export function num(n: number, dp = 2): string {
  return String(Number(n.toFixed(dp)))
}

/** Minutes after midnight → four-figure 24-hour clock, e.g. 570 → "0930". Wraps past midnight. */
export function clock(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}${String(m % 60).padStart(2, '0')}`
}

/** Whole minutes → "1 h 30 min", "45 min", "2 h". */
export function hm(min: number): string {
  const m = Math.round(min)
  const h = Math.floor(m / 60)
  const r = m % 60
  if (h === 0) return `${r} min`
  return r === 0 ? `${h} h` : `${h} h ${r} min`
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty']

function words(n: number): string {
  if (n < 20) return ONES[n]!
  return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '')
}

/** A clock time the way a navigator says it: 1000 "ten hundred", 0930 "zero nine thirty", 1448 "fourteen forty-eight". */
export function spokenClock(min: number): string {
  const c = clock(min)
  const h = Number(c.slice(0, 2))
  const m = Number(c.slice(2))
  const hours = h < 10 ? `zero ${ONES[h]}` : words(h)
  const mins = m === 0 ? 'hundred' : m < 10 ? `zero ${ONES[m]}` : words(m)
  return `${hours} ${mins}`
}

export interface Leg {
  from: LatLon
  to: LatLon
  fromName: string
  toName: string
  /** Exact rhumb-line distance, M. */
  exact: number
  /** Distance as a navigator measures it: to a tenth of a mile. */
  miles: number
  bearing: number
}

export function leg(fromId: string, toId: string): Leg {
  const a = feature(fromId)
  const b = feature(toId)
  const exact = rhumbDistance(a.at, b.at)
  return { from: a.at, to: b.at, fromName: a.name, toName: b.name, exact, miles: round1(exact), bearing: rhumbBearing(a.at, b.at) }
}

/** Worked example on the chart: how long from the Kerran Approach buoy to Mew Rock beacon at 6 kn. */
export const DEMO = (() => {
  const l = leg('kerran-approach', 'mew-rock')
  const speed = 6
  const depart = 10 * 60
  const minutes = Math.round((60 * l.miles) / speed)
  return { ...l, speed, depart, minutes, arrive: depart + minutes }
})()

/** Worked example on the chart: speed from two fixes, at the wreck and at the Kerran Approach buoy. */
export const FIXES = (() => {
  const l = leg('wreck', 'kerran-approach')
  const first = 14 * 60 + 15
  const minutes = 33
  return { ...l, first, second: first + minutes, minutes, speed: round1((60 * l.miles) / minutes) }
})()
