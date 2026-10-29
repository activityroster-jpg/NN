// Plays out an encounter: the stand-on vessel keeps her course and speed;
// the give-way vessel makes one early, bold alteration (Rules 8 and 16),
// holds it until the other vessel is past and clear, then resumes her
// course. For a crossing it picks the alteration that passes astern of the
// stand-on vessel; a sailing give-way vessel never turns into the no-go zone.

import {
  NO_GO, RUNNING, closestApproach, dir, distance, mainsailSide, norm, offBow, offWind, relativeBearing, sideOf,
  type Encounter, type Ruling, type Side, type Vessel, type Who,
} from './rules'

export interface Pose {
  x: number
  y: number
  heading: number
}

export interface Order {
  /** Hours after the start. */
  at: number
  /** Degrees: positive to starboard, negative to port. */
  alter: number
  /** Fraction of her speed she keeps (1 = no change). */
  speedFactor: number
}

export interface Manoeuvre {
  /** What each vessel does (null: keeps course and speed). */
  a: Order | null
  b: Order | null
  /** Time to the collision point if nobody acted, hours. */
  T: number
  /** How long to play it for, hours. */
  duration: number
  /** Closest the vessels came, M. */
  closest: number
  /** True if the give-way vessel passed astern of the stand-on vessel. */
  astern: boolean
  /** True if a sailing give-way vessel had to gybe (her mainsail swapped sides). */
  gybe: boolean
}

/** Degrees per hour: 60° in about a minute and a quarter. */
const TURN_RATE = 3000
/** Closest approach the planner accepts, M (the scenarios start about 2 M apart). */
export const SAFE = 0.5

export const STEPS = 240

function turnToward(current: number, desired: number, maxStep: number): number {
  const d = ((desired - current + 540) % 360) - 180
  if (Math.abs(d) <= maxStep) return norm(desired)
  return norm(current + Math.sign(d) * maxStep)
}

/** Step both vessels through `duration` hours, `steps` steps. */
export function simulate(e: Encounter, m: Pick<Manoeuvre, 'a' | 'b' | 'duration'>, steps = STEPS): { a: Pose[]; b: Pose[] } {
  const dt = m.duration / steps
  const state = [e.a, e.b].map((v) => ({ x: v.x, y: v.y, heading: v.heading, base: v.heading, speed: v.speed, resumed: false, lastRange: Infinity }))
  const orders = [m.a, m.b]
  const out: { a: Pose[]; b: Pose[] } = { a: [], b: [] }
  for (let i = 0; i <= steps; i++) {
    const t = i * dt
    out.a.push({ x: state[0]!.x, y: state[0]!.y, heading: state[0]!.heading })
    out.b.push({ x: state[1]!.x, y: state[1]!.y, heading: state[1]!.heading })
    const range = distance(state[0]!, state[1]!)
    state.forEach((s, k) => {
      const o = orders[k]
      const other = state[1 - k]!
      const acting = !!o && t >= o.at && !s.resumed
      if (acting && t > o.at) {
        // Past and clear: the other vessel is well abaft the beam and the range is opening.
        const rel = offBow(norm(Math.atan2(other.x - s.x, other.y - s.y) * (180 / Math.PI) - s.heading))
        if (rel > 100 && range > s.lastRange) s.resumed = true
      }
      s.lastRange = range
      const desired = acting && !s.resumed ? s.base + o.alter : s.base
      s.heading = turnToward(s.heading, desired, TURN_RATE * dt)
      const speed = s.speed * (acting && !s.resumed ? o.speedFactor : 1)
      const d = dir(s.heading)
      s.x += d.x * speed * dt
      s.y += d.y * speed * dt
    })
  }
  return out
}

/**
 * Did the give-way vessel pass astern of the stand-on vessel? Either her
 * track crossed the stand-on vessel's track behind her, or it never crossed
 * and she finished astern of her (not running alongside, ahead of her).
 */
function passedAstern(standOn: Vessel, g: Pose[], s: Pose[]): boolean {
  const d = dir(standOn.heading)
  const across = (p: Pose) => (p.x - standOn.x) * d.y - (p.y - standOn.y) * d.x
  const along = (p: Pose) => (p.x - standOn.x) * d.x + (p.y - standOn.y) * d.y
  for (let i = 1; i < g.length; i++) {
    if (Math.sign(across(g[i - 1]!)) !== Math.sign(across(g[i]!))) return along(g[i]!) < along(s[i]!)
  }
  return along(g[g.length - 1]!) < along(s[s.length - 1]!)
}

/**
 * The side a sailing vessel's mainsail is on at each pose. While she runs
 * dead before the wind it stays where it was; it only swaps over (a gybe)
 * once the wind is clearly on the other side.
 */
export function mainsailTrack(v: Vessel, poses: Pose[], windFrom: number): Side[] {
  let side: Side = mainsailSide(v.heading, windFrom, v.mainsail) ?? 'port'
  return poses.map((p) => {
    if (offWind(p.heading, windFrom) <= RUNNING) side = mainsailSide(p.heading, windFrom) ?? side
    return side
  })
}

function minDistance(tracks: { a: Pose[]; b: Pose[] }): number {
  let best = Infinity
  for (let i = 0; i < tracks.a.length; i++) best = Math.min(best, distance(tracks.a[i]!, tracks.b[i]!))
  return best
}

/** Turning direction that bears a sailing vessel away from the wind: +1 starboard, −1 port. */
function bearAway(v: Vessel, windFrom: number): 1 | -1 {
  return sideOf(windFrom - v.heading) === 'starboard' ? -1 : 1
}

/**
 * Plan the manoeuvre the rules call for. The give-way vessel alters early
 * (after 15% of the time to collision); candidate alterations are tried in
 * order of good seamanship and the first that passes safely is used.
 */
export function plan(e: Encounter, r: Ruling): Manoeuvre {
  const { tcpa } = closestApproach(e)
  const T = tcpa
  const duration = 2 * T
  const at = 0.15 * T

  if (r.giveWay === 'both') {
    const order: Order = { at, alter: 40, speedFactor: 1 }
    const tracks = simulate(e, { a: order, b: order, duration })
    return { a: order, b: order, T, duration, closest: minDistance(tracks), astern: true, gybe: false }
  }

  const g: Who = r.giveWay
  const G = g === 'a' ? e.a : e.b
  const S = g === 'a' ? e.b : e.a
  const relS = relativeBearing(G, S)
  const offS = offBow(relS)
  const toward = sideOf(relS) === 'port' ? -1 : 1
  let dirs: number[]
  let needAstern = true
  if (r.rule === 'overtaking') {
    needAstern = false
    const away = offS < 3 ? (G.kind === 'sail' && e.windFrom !== undefined ? bearAway(G, e.windFrom) : 1) : -toward
    dirs = [away, -away]
  } else if (offS < 10) {
    needAstern = false
    const first = G.kind === 'sail' && e.windFrom !== undefined ? bearAway(G, e.windFrom) : 1
    dirs = [first, -first]
  } else {
    dirs = r.rule === 'crossing' ? [1] : [toward, -toward]
  }

  type Candidate = { order: Order; closest: number; astern: boolean; tackChange: boolean; ok: boolean }
  const tried: Candidate[] = []
  for (const speedFactor of [1, 0.5]) {
    for (const sgn of dirs) {
      for (const mag of [60, 45, 75, 90]) {
        const order: Order = { at, alter: sgn * mag, speedFactor }
        const m = { a: g === 'a' ? order : null, b: g === 'b' ? order : null, duration }
        const tracks = simulate(e, m)
        const gt = g === 'a' ? tracks.a : tracks.b
        const st = g === 'a' ? tracks.b : tracks.a
        let sailOk = true
        let tackChange = false
        if (G.kind === 'sail' && e.windFrom !== undefined) {
          sailOk = gt.every((p) => offWind(p.heading, e.windFrom!) >= NO_GO)
          tackChange = new Set(mainsailTrack(G, gt, e.windFrom)).size > 1
        }
        const closest = minDistance(tracks)
        const astern = passedAstern(S, gt, st)
        const ok = sailOk && closest >= SAFE && (!needAstern || astern)
        tried.push({ order, closest, astern, tackChange, ok })
      }
    }
    const best = tried.find((c) => c.ok && !c.tackChange) ?? tried.find((c) => c.ok)
    if (best) {
      return { a: g === 'a' ? best.order : null, b: g === 'b' ? best.order : null, T, duration, closest: best.closest, astern: best.astern, gybe: best.tackChange }
    }
  }
  // Nothing passes cleanly: show the safest attempt (the tests make sure this never happens in the lesson).
  const safest = tried.reduce((p, c) => (c.closest > p.closest ? c : p))
  return { a: g === 'a' ? safest.order : null, b: g === 'b' ? safest.order : null, T, duration, closest: safest.closest, astern: safest.astern, gybe: safest.tackChange }
}

/** Plain words for what the give-way vessel does: "alters course 60° to starboard", "bears away 45° to port". */
export function describeOrder(v: Vessel, o: Order, windFrom?: number, gybe = false): string {
  const side = o.alter > 0 ? 'starboard' : 'port'
  const deg = Math.abs(o.alter)
  let turn = `alters course ${deg}° to ${side}`
  if (v.kind === 'sail' && windFrom !== undefined) {
    if (gybe) turn = `turns ${deg}° to ${side}, gybing on the way`
    else turn = offWind(v.heading + o.alter, windFrom) > offWind(v.heading, windFrom) ? `bears away ${deg}° to ${side}` : `heads up ${deg}° to ${side}`
  }
  return o.speedFactor < 1 ? `${turn}, and slows down` : turn
}
