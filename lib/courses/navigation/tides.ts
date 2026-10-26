// Tidal data for the practice area — all FICTIONAL, for teaching only.
//
//  - Port Kerran is the standard port: a two-week tide table (generated
//    from a small harmonic model so springs and neaps come and go
//    naturally), its mean levels, and its tidal curve.
//  - Kerran Roads is a secondary port with time and height differences.
//  - Tidal diamonds A–D give the stream for each hour from HW−6 to HW+6
//    at Port Kerran, at springs and neaps.
//
// Times are minutes since 0000 UT on day 1 of the table. Heights are
// metres above chart datum (≈ LAT). Rates are knots, directions °T.

import { km } from './practice-chart'
import type { LatLon } from '../geo'

export const STANDARD_PORT = 'Port Kerran'
export const SECONDARY_PORT = 'Kerran Roads'

/** Mean levels at Port Kerran (metres above chart datum). */
export const PORT_KERRAN_LEVELS = { mhws: 5.2, mhwn: 4.0, mlwn: 1.6, mlws: 0.4, msl: 2.8 }
export const MEAN_SPRING_RANGE = PORT_KERRAN_LEVELS.mhws - PORT_KERRAN_LEVELS.mlws // 4.8
export const MEAN_NEAP_RANGE = PORT_KERRAN_LEVELS.mhwn - PORT_KERRAN_LEVELS.mlwn // 2.4

/** First day of the printed table (the table is in UT; add 1 hour for BST). */
export const TABLE_START = { year: 2027, month: 6, day: 1 }
export const TABLE_DAYS = 14

// Harmonic model: M2 (lunar), S2 (solar) and N2 (lunar elliptic). Their
// beat gives the fortnightly springs/neaps cycle; amplitudes chosen so the
// mean spring and neap ranges match PORT_KERRAN_LEVELS.
const M2 = { amp: 1.8, periodMin: 745.236, phase: 0.6 }
const S2 = { amp: 0.6, periodMin: 720, phase: 0.6 }
const N2 = { amp: 0.25, periodMin: 759.73, phase: 2.2 }

/** Model height of tide at Port Kerran (m above CD) at minutes since table start. */
export function modelHeight(minutes: number): number {
  const w = (c: { amp: number; periodMin: number; phase: number }) => c.amp * Math.cos((2 * Math.PI * minutes) / c.periodMin - c.phase)
  return PORT_KERRAN_LEVELS.msl + w(M2) + w(S2) + w(N2)
}

export interface TideEvent {
  kind: 'HW' | 'LW'
  /** Minutes since 0000 UT on day 1. */
  minutes: number
  /** Metres above chart datum, to 0.1 m as printed. */
  height: number
}

/** High and low waters for the table period, as printed (nearest minute, 0.1 m). */
export const PORT_KERRAN_TIDES: TideEvent[] = (() => {
  const out: TideEvent[] = []
  const end = TABLE_DAYS * 1440
  let prev = modelHeight(-1)
  let cur = modelHeight(0)
  for (let m = 0; m <= end; m++) {
    const next = modelHeight(m + 1)
    if (cur >= prev && cur > next) out.push({ kind: 'HW', minutes: m, height: Math.round(cur * 10) / 10 })
    if (cur <= prev && cur < next) out.push({ kind: 'LW', minutes: m, height: Math.round(cur * 10) / 10 })
    prev = cur
    cur = next
  }
  return out
})()

/** "0742" style 24-hour time; day number is 1-based. */
export function clockOf(minutes: number): { day: number; time: string } {
  const day = Math.floor(minutes / 1440) + 1
  const m = ((minutes % 1440) + 1440) % 1440
  return { day, time: `${String(Math.floor(m / 60)).padStart(2, '0')}${String(m % 60).padStart(2, '0')}` }
}

/** The four tides of a table day (some days have three). */
export function tidesOnDay(day: number): TideEvent[] {
  return PORT_KERRAN_TIDES.filter((t) => Math.floor(t.minutes / 1440) + 1 === day)
}

/** Range of a HW and the LW next to it. */
export function rangeOf(hw: TideEvent, lw: TideEvent): number {
  return Math.round((hw.height - lw.height) * 10) / 10
}

/**
 * Port Kerran tidal curve: the factor (0 at LW, 1 at HW) at a time
 * relative to HW, in hours (−6 … +6). Printed for springs and neaps; the
 * neap curve is slightly fuller around HW. Interpolate by range.
 */
export function curveFactor(hoursFromHW: number, range: number): number {
  const h = Math.max(-6.2, Math.min(6.2, hoursFromHW))
  const spring = 0.5 + 0.5 * Math.cos((Math.PI * h) / 6.2)
  const neap = Math.min(1, spring + 0.04 * Math.sin((Math.PI * Math.abs(h)) / 6.2))
  const f = Math.max(0, Math.min(1, (range - MEAN_NEAP_RANGE) / (MEAN_SPRING_RANGE - MEAN_NEAP_RANGE)))
  return Math.round((neap + (spring - neap) * f) * 1000) / 1000
}

/** Height of tide from the curve: LW + factor × range (what learners compute). */
export function heightFromCurve(hwHeight: number, lwHeight: number, hoursFromHW: number): number {
  const range = hwHeight - lwHeight
  return lwHeight + curveFactor(hoursFromHW, range) * range
}

/** Rule of twelfths: fraction of the range risen/fallen after n whole hours (0–6). */
export function twelfths(hours: number): number {
  const steps = [0, 1, 3, 6, 9, 11, 12]
  const h = Math.max(0, Math.min(6, hours))
  const i = Math.floor(h)
  const frac = h - i
  const a = steps[i]!
  const b = steps[Math.min(6, i + 1)]!
  return (a + (b - a) * frac) / 12
}

/** Secondary port differences, as printed in an almanac, relative to Port Kerran. */
export const KERRAN_ROADS_DIFFERENCES = {
  // Standard port times the differences apply at (UT).
  hwTimes: ['0000', '0600'],
  lwTimes: ['0100', '0700'],
  // Minutes to add at those standard port times (HW at 0000, HW at 0600 …).
  hwDiffs: [10, 20],
  lwDiffs: [-5, 15],
  // Metres to add at MHWS, MHWN, MLWN, MLWS.
  heightDiffs: { mhws: -0.3, mhwn: -0.2, mlwn: -0.1, mlws: 0.0 },
}

export interface TidalDiamond {
  id: 'A' | 'B' | 'C' | 'D'
  at: LatLon
  /** 13 rows: HW−6 … HW+6 at Port Kerran. */
  rows: Array<{ hour: number; direction: number; spring: number; neap: number }>
}

function rows(table: Array<[number, number, number]>): TidalDiamond['rows'] {
  return table.map(([direction, spring, neap], i) => ({ hour: i - 6, direction, spring, neap }))
}

// The flood runs east-north-east past the island and the ebb west-south-
// west, strongest off the headlands (B off Gull Point, C off Kerran Head)
// and weaker in the bay approach (A) and Kerran Roads (D).
export const TIDAL_DIAMONDS: TidalDiamond[] = [
  { id: 'A', at: km(3.1, 8.6), rows: rows([
    [245, 0.8, 0.4], [250, 0.5, 0.2], [330, 0.2, 0.1], [60, 0.6, 0.3], [65, 1.0, 0.5], [70, 1.2, 0.6], [70, 1.1, 0.5],
    [70, 0.9, 0.4], [75, 0.5, 0.2], [150, 0.2, 0.1], [240, 0.6, 0.3], [245, 1.0, 0.5], [250, 1.1, 0.5],
  ]) },
  { id: 'B', at: km(8.3, 3.2), rows: rows([
    [230, 1.6, 0.8], [235, 1.0, 0.5], [300, 0.3, 0.1], [40, 1.0, 0.5], [45, 1.9, 0.9], [50, 2.4, 1.2], [50, 2.2, 1.1],
    [50, 1.8, 0.9], [55, 1.1, 0.5], [120, 0.3, 0.1], [220, 1.1, 0.5], [225, 2.0, 1.0], [230, 2.3, 1.1],
  ]) },
  { id: 'C', at: km(6.4, 20.4), rows: rows([
    [250, 1.4, 0.7], [255, 0.9, 0.4], [340, 0.3, 0.1], [65, 0.9, 0.4], [70, 1.7, 0.8], [75, 2.1, 1.0], [75, 2.0, 1.0],
    [75, 1.6, 0.8], [80, 1.0, 0.5], [160, 0.3, 0.1], [245, 1.0, 0.5], [250, 1.8, 0.9], [255, 2.0, 1.0],
  ]) },
  { id: 'D', at: km(11.4, 9.6), rows: rows([
    [270, 0.9, 0.4], [275, 0.6, 0.3], [350, 0.2, 0.1], [85, 0.6, 0.3], [90, 1.1, 0.5], [90, 1.4, 0.7], [95, 1.3, 0.6],
    [95, 1.0, 0.5], [100, 0.6, 0.3], [180, 0.2, 0.1], [265, 0.7, 0.3], [270, 1.1, 0.5], [270, 1.3, 0.6],
  ]) },
]

/** Stream rate at a diamond for the day's range, interpolated between neaps and springs. */
export function streamRate(spring: number, neap: number, range: number): number {
  const f = (range - MEAN_NEAP_RANGE) / (MEAN_SPRING_RANGE - MEAN_NEAP_RANGE)
  return Math.round(Math.max(0, neap + (spring - neap) * f) * 10) / 10
}

const hhmm = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(2))
const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * Kerran Roads time difference (minutes) for a Port Kerran HW or LW,
 * interpolated linearly between the printed standard-port times, which
 * repeat every 12 hours (0000 and 1200 share a difference, as do 0600 and 1800).
 */
export function secondaryTimeDiff(kind: 'HW' | 'LW', standardMinutes: number): number {
  const d = KERRAN_ROADS_DIFFERENCES
  const [t0, t1] = (kind === 'HW' ? d.hwTimes : d.lwTimes).map(hhmm) as [number, number]
  const [d0, d1] = (kind === 'HW' ? d.hwDiffs : d.lwDiffs) as [number, number]
  const span = t1 - t0
  const t = ((((standardMinutes % 1440) - t0) % 720) + 720) % 720
  return t <= span ? d0 + ((d1 - d0) * t) / span : d1 + ((d0 - d1) * (t - span)) / (720 - span)
}

/**
 * Kerran Roads height difference (m) for a Port Kerran HW or LW height,
 * interpolated between the spring and neap differences (and extended
 * beyond them in proportion).
 */
export function secondaryHeightDiff(kind: 'HW' | 'LW', standardHeight: number): number {
  const h = KERRAN_ROADS_DIFFERENCES.heightDiffs
  const L = PORT_KERRAN_LEVELS
  const [lo, hi, dLo, dHi] = kind === 'HW' ? [L.mhwn, L.mhws, h.mhwn, h.mhws] : [L.mlws, L.mlwn, h.mlws, h.mlwn]
  return dLo + ((dHi - dLo) * (standardHeight - lo)) / (hi - lo)
}

/** A Port Kerran high or low water converted to Kerran Roads (nearest minute, 0.1 m). */
export function secondaryPortEvent(e: TideEvent): TideEvent {
  return {
    kind: e.kind,
    minutes: e.minutes + Math.round(secondaryTimeDiff(e.kind, e.minutes)),
    height: round1(e.height + secondaryHeightDiff(e.kind, e.height)),
  }
}

/**
 * Time for a given height, from the curve: hours relative to HW when the
 * tide is at `height` — negative while rising (before HW), positive while
 * falling. Searched minute by minute, as a learner reads the curve. Null if
 * the height is outside LW…HW.
 */
export function timeForHeight(hwHeight: number, lwHeight: number, height: number, side: 'rising' | 'falling'): number | null {
  if (height < lwHeight || height > hwHeight) return null
  const sign = side === 'rising' ? -1 : 1
  // Walk out from HW (factor 1) towards LW until the height drops to the target.
  for (let m = 0; m <= 372; m++) {
    if (heightFromCurve(hwHeight, lwHeight, (sign * m) / 60) <= height + 1e-9) return (sign * m) / 60
  }
  return null
}
