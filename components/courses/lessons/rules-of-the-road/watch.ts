// "Is she on a collision course?" — a ship is sighted on the bow and its
// compass bearing is taken every three minutes while you hold a steady
// course. The ship's course is worked out so that her bearing stays steady
// (collision course), draws ahead (she passes ahead of you) or draws aft
// (she passes astern). Readings carry the degree or so of scatter you get
// from a hand-bearing compass on a moving boat.

import { pick, randInt, randStep, type Rng } from '@/lib/courses/random'
import { dir, norm, offBow, type Side } from './rules'

export type Trend = 'steady' | 'ahead' | 'astern'

export interface Watch {
  /** Your course (°M) and speed (kn). You start at the origin. */
  heading: number
  speed: number
  /** The ship at the first sighting: position (M, x east, y north), course, speed. */
  ship: { x: number; y: number; heading: number; speed: number }
  /** Which bow she is sighted on. */
  side: Side
  trend: Trend
  /** Scatter added to each rounded reading, degrees. */
  noise: number[]
  /** Clock time of the first sighting, minutes after midnight. */
  start: number
}

/** Minutes between bearings. */
export const INTERVAL = 3
export const MAX_SIGHTINGS = 5

export function positionsAt(w: Watch, minutes: number) {
  const h = minutes / 60
  const d = dir(w.heading)
  const s = dir(w.ship.heading)
  return {
    own: { x: d.x * w.speed * h, y: d.y * w.speed * h },
    ship: { x: w.ship.x + s.x * w.ship.speed * h, y: w.ship.y + s.y * w.ship.speed * h },
  }
}

/** Exact compass bearing of the ship from you after `minutes`. */
export function bearingAt(w: Watch, minutes: number): number {
  const p = positionsAt(w, minutes)
  return norm((Math.atan2(p.ship.x - p.own.x, p.ship.y - p.own.y) * 180) / Math.PI)
}

export function rangeAt(w: Watch, minutes: number): number {
  const p = positionsAt(w, minutes)
  return Math.hypot(p.ship.x - p.own.x, p.ship.y - p.own.y)
}

/** The i-th hand-bearing compass reading (whole degrees, with scatter). */
export function reading(w: Watch, i: number): number {
  return norm(Math.round(bearingAt(w, i * INTERVAL)) + (w.noise[i] ?? 0))
}

/** Closest approach if both hold on: when (minutes), how close (M), and whether she crosses ahead of your bow. */
export function closest(w: Watch): { minutes: number; distance: number; ahead: boolean } {
  const d = dir(w.heading)
  const s = dir(w.ship.heading)
  const rx = w.ship.x
  const ry = w.ship.y
  const vx = s.x * w.ship.speed - d.x * w.speed
  const vy = s.y * w.ship.speed - d.y * w.speed
  const t = -(rx * vx + ry * vy) / (vx * vx + vy * vy)
  const cx = rx + vx * t
  const cy = ry + vy * t
  // Where her relative track crosses your fore-and-aft line: ahead of you or astern.
  const across0 = rx * d.y - ry * d.x
  const acrossV = vx * d.y - vy * d.x
  const k = acrossV === 0 ? 0 : -across0 / acrossV
  const along = (rx + vx * k) * d.x + (ry + vy * k) * d.y
  return { minutes: t * 60, distance: Math.hypot(cx, cy), ahead: along > 0 }
}

/** How far the relative bearing has moved towards the bow (+) or towards the stern (−) between two times. */
export function drift(w: Watch, from: number, to: number): number {
  const rel = (m: number) => offBow(bearingAt(w, m) - w.heading)
  return rel(from) - rel(to)
}

/**
 * The course a ship at `ship` (M from you) must steer at `shipSpeed` so that
 * her motion relative to you heads for a point `offset` miles ahead of you
 * (0: straight at you — a steady bearing; negative: astern of you).
 */
export function solveShipCourse(heading: number, speed: number, ship: { x: number; y: number }, shipSpeed: number, offset: number): number | null {
  const own = dir(heading)
  const ux = own.x * offset - ship.x
  const uy = own.y * offset - ship.y
  const ul = Math.hypot(ux, uy)
  const r = { x: ux / ul, y: uy / ul }
  const wv = { x: own.x * speed, y: own.y * speed }
  const wr = wv.x * r.x + wv.y * r.y
  const disc = wr * wr - (speed * speed - shipSpeed * shipSpeed)
  if (disc < 0) return null
  const k = -wr + Math.sqrt(disc)
  if (k <= 0) return null
  return norm((Math.atan2(wv.x + k * r.x, wv.y + k * r.y) * 180) / Math.PI)
}

/**
 * A ship sighted on the bow with the wanted trend. Her course is solved so
 * that her motion relative to you heads straight for you (steady bearing),
 * or for a point ahead of or astern of you.
 */
export function makeWatch(rng: Rng, trend: Trend): Watch {
  for (let attempt = 0; attempt < 200; attempt++) {
    const heading = randInt(rng, 2, 34) * 10
    const speed = randStep(rng, 4, 6, 1)
    const side: Side = rng() < 0.5 ? 'starboard' : 'port'
    const rel = randInt(rng, 7, 14) * 5 * (side === 'starboard' ? 1 : -1)
    const range = randStep(rng, 3, 3.8, 0.1)
    const shipSpeed = randInt(rng, 10, 16)
    const at = dir(heading + rel)
    const ship = { x: at.x * range, y: at.y * range }
    const offset = trend === 'steady' ? 0 : trend === 'ahead' ? 1 : -1
    const shipHeading = solveShipCourse(heading, speed, ship, shipSpeed, offset)
    if (shipHeading === null) continue
    const noise = [0, ...Array.from({ length: MAX_SIGHTINGS - 1 }, () => pick(rng, [-1, 0, 0, 1]))]
    const w: Watch = { heading, speed, side, trend, noise, start: randInt(rng, 9, 16) * 60 + randInt(rng, 0, 11) * 5, ship: { ...ship, heading: shipHeading, speed: shipSpeed } }
    // The trend must be clear in the first three bearings (six minutes) — or absent.
    const moved = drift(w, 0, 2 * INTERVAL)
    const c = closest(w)
    if (trend === 'steady' && (Math.abs(moved) > 0.5 || c.distance > 0.02)) continue
    if (trend === 'ahead' && (moved < 4 || !c.ahead)) continue
    if (trend === 'astern' && (moved > -4 || c.ahead)) continue
    if (c.minutes < 4 * INTERVAL + 2) continue
    const rs = Array.from({ length: MAX_SIGHTINGS }, (_, i) => reading(w, i))
    if (trend === 'steady') {
      // A steady bearing must not look like a trend: no three readings in a row all moving one way.
      const steps = rs.slice(1).map((v, i) => Math.sign(((v - rs[i]! + 540) % 360) - 180))
      if (steps.some((s, i) => i > 0 && s !== 0 && s === steps[i - 1])) continue
    } else {
      // A drawing bearing must never step back against the trend, even with the scatter.
      const towardBow = rs.map((v) => -offBow(v - heading))
      const steps = towardBow.slice(1).map((v, i) => (v - towardBow[i]!) * (trend === 'ahead' ? 1 : -1))
      if (steps.some((s) => s < 0) || towardBow[2]! - towardBow[0]! === 0) continue
    }
    return w
  }
  throw new Error('No watch scenario')
}

export function clock(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}${String(m % 60).padStart(2, '0')}`
}

export const pad3 = (n: number) => String(norm(Math.round(n))).padStart(3, '0')
