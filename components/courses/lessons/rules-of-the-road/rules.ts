// The steering and sailing rules as code. Given two vessels on converging
// courses (positions, headings, speeds, kinds) and the wind, `decide` works
// out which rule applies and who keeps out of the way — from the geometry,
// exactly as the rules describe it. It returns null for anything ambiguous
// or outside what this lesson teaches, so generated questions never hinge on
// a borderline case. Shared by the widgets, the video and the exercises.

export type Kind = 'power' | 'sail' | 'fishing' | 'ram' | 'nuc'
export type Side = 'port' | 'starboard'
export type Who = 'a' | 'b'

export interface Vessel {
  kind: Kind
  /** Position in nautical miles: x east, y north. */
  x: number
  y: number
  /** Heading in degrees, 0–359. */
  heading: number
  /** Speed in knots. */
  speed: number
  /** Only for a sailing vessel running dead before the wind: the side her mainsail is carried on. */
  mainsail?: Side
}

export interface Encounter {
  a: Vessel
  b: Vessel
  /** Direction the wind blows FROM, degrees. Needed when a sailing vessel is involved. */
  windFrom?: number
}

export type RuleId = 'overtaking' | 'head-on' | 'crossing' | 'power-sail' | 'hierarchy' | 'port-starboard' | 'windward-leeward'

export interface Ruling {
  rule: RuleId
  /** The vessel that keeps out of the way, or 'both' (head-on: each alters to starboard). */
  giveWay: Who | 'both'
  /** The vessel that keeps her course and speed (null when both alter). */
  standOn: Who | null
}

/** Closest a sailing yacht can point to the wind (close-hauled), in degrees. */
export const NO_GO = 45
/** Beyond this angle off the wind a yacht is running dead before it, and only the mainsail side tells her tack. */
export const RUNNING = 170
/** The overtaking sector starts 22.5° abaft the beam: 112.5° from the bow. */
export const OVERTAKING_FROM = 112.5

/** Margins that keep generated cases well clear of every boundary. */
export const MARGIN = {
  /** Degrees either side of 112.5° that count as "in doubt" about overtaking. */
  sector: 10,
  /** Both vessels see each other within this many degrees of right ahead: head-on. */
  headOn: 6,
  /** Each vessel sees the other at least this far off the bow: clearly crossing, not head-on. */
  crossing: 12,
  /** Crossing courses must differ by at least this much (not two nearly parallel courses). */
  crossingAngle: 20,
  /** Windward/leeward: the upwind separation must be at least this fraction of the distance apart. */
  windward: 0.26,
}

export const RULE_NUMBER: Record<RuleId, number> = {
  overtaking: 13,
  'head-on': 14,
  crossing: 15,
  'power-sail': 18,
  hierarchy: 18,
  'port-starboard': 12,
  'windward-leeward': 12,
}

/** Short names for each rule, as used in the exercises. */
export const RULE_NAME: Record<RuleId, string> = {
  overtaking: 'Overtaking: the overtaking vessel keeps out of the way (Rule 13)',
  'head-on': 'Head-on: each alters course to starboard (Rule 14)',
  crossing: 'Crossing: the vessel with the other on her starboard side gives way (Rule 15)',
  'power-sail': 'A power-driven vessel keeps out of the way of a sailing vessel (Rule 18)',
  hierarchy: 'Responsibilities between vessels: the more manoeuvrable vessel keeps out of the way (Rule 18)',
  'port-starboard': 'Sailing: port tack keeps out of the way of starboard tack (Rule 12)',
  'windward-leeward': 'Sailing, same tack: windward keeps out of the way of leeward (Rule 12)',
}

export const KIND_NAME: Record<Kind, string> = {
  power: 'power-driven vessel',
  sail: 'sailing vessel',
  fishing: 'vessel engaged in fishing',
  ram: 'vessel restricted in her ability to manoeuvre',
  nuc: 'vessel not under command',
}

/** Rule 18 ranking: a vessel keeps out of the way of any vessel ranked above her. NUC and RAM share the top. */
export const RANK: Record<Kind, number> = { power: 1, sail: 2, fishing: 3, ram: 4, nuc: 4 }

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

export const norm = (deg: number) => ((deg % 360) + 360) % 360
const RAD = Math.PI / 180

/** Unit vector (east, north) for a heading. */
export function dir(heading: number): { x: number; y: number } {
  return { x: Math.sin(heading * RAD), y: Math.cos(heading * RAD) }
}

/** True bearing from p to q (degrees, 0–360). */
export function bearingTo(p: { x: number; y: number }, q: { x: number; y: number }): number {
  return norm(Math.atan2(q.x - p.x, q.y - p.y) / RAD)
}

/** Relative bearing of `other` from `v`: clockwise from v's bow, 0–360. */
export function relativeBearing(v: Vessel, other: { x: number; y: number }): number {
  return norm(bearingTo(v, other) - v.heading)
}

/** Angle from the bow, 0–180, either side. */
export function offBow(rel: number): number {
  const r = norm(rel)
  return r <= 180 ? r : 360 - r
}

/** Which side a relative bearing is on (null when right ahead or right astern). */
export function sideOf(rel: number): Side | null {
  const r = norm(rel)
  if (r < 1e-9 || Math.abs(r - 180) < 1e-9 || r > 360 - 1e-9) return null
  return r < 180 ? 'starboard' : 'port'
}

export const opposite = (s: Side): Side => (s === 'port' ? 'starboard' : 'port')

export function distance(p: { x: number; y: number }, q: { x: number; y: number }): number {
  return Math.hypot(q.x - p.x, q.y - p.y)
}

/** Closest point of approach if both hold course and speed: time (hours, from now) and distance (M). */
export function closestApproach(e: Encounter): { tcpa: number; cpa: number; range: number } {
  const da = dir(e.a.heading)
  const db = dir(e.b.heading)
  const rx = e.b.x - e.a.x
  const ry = e.b.y - e.a.y
  const wx = db.x * e.b.speed - da.x * e.a.speed
  const wy = db.y * e.b.speed - da.y * e.a.speed
  const w2 = wx * wx + wy * wy
  const range = Math.hypot(rx, ry)
  if (w2 < 1e-12) return { tcpa: Infinity, cpa: range, range }
  const tcpa = -(rx * wx + ry * wy) / w2
  return { tcpa, cpa: Math.hypot(rx + wx * tcpa, ry + wy * tcpa), range }
}

/* ------------------------------------------------------------------ */
/* Wind and tacks                                                      */
/* ------------------------------------------------------------------ */

/** How far off the wind a vessel is heading: 0 = head to wind, 180 = dead before it. */
export function offWind(heading: number, windFrom: number): number {
  return offBow(windFrom - heading)
}

/** The side the wind comes over (null when right ahead or right astern). */
export function windSide(heading: number, windFrom: number): Side | null {
  return sideOf(windFrom - heading)
}

/**
 * The side a sailing vessel carries her mainsail: opposite the wind, or —
 * when running dead before it — whichever side she has chosen.
 */
export function mainsailSide(heading: number, windFrom: number, chosen?: Side): Side | null {
  if (offWind(heading, windFrom) > RUNNING) return chosen ?? null
  const w = windSide(heading, windFrom)
  return w ? opposite(w) : null
}

/**
 * A sailing vessel's tack. Rule 12(b): the windward side is the side
 * opposite to the one on which the mainsail is carried, so the tack is
 * named after the side opposite the mainsail. Null if she can't be sailing
 * on that heading (inside the no-go zone) or her mainsail side is unknown.
 */
export function tackOf(v: Vessel, windFrom: number | undefined): Side | null {
  if (v.kind !== 'sail' || windFrom === undefined) return null
  if (offWind(v.heading, windFrom) < NO_GO) return null
  const main = mainsailSide(v.heading, windFrom, v.mainsail)
  return main ? opposite(main) : null
}

/** Which vessel is to windward (further upwind), or null if they are too nearly level to say. */
export function windwardOf(e: Encounter): Who | null {
  if (e.windFrom === undefined) return null
  const u = dir(e.windFrom)
  const ua = e.a.x * u.x + e.a.y * u.y
  const ub = e.b.x * u.x + e.b.y * u.y
  const d = distance(e.a, e.b)
  if (Math.abs(ua - ub) < MARGIN.windward * d) return null
  return ua > ub ? 'a' : 'b'
}

/* ------------------------------------------------------------------ */
/* The decision                                                        */
/* ------------------------------------------------------------------ */

const other = (w: Who): Who => (w === 'a' ? 'b' : 'a')
const giveWay = (rule: RuleId, w: Who): Ruling => ({ rule, giveWay: w, standOn: other(w) })

/**
 * Who keeps out of the way, by the steering and sailing rules, for two
 * vessels in sight of one another and approaching with risk of collision.
 * Null when there is no risk of collision, when a sailing vessel couldn't be
 * sailing as described, or when the case is close to a boundary (in doubt).
 */
export function decide(e: Encounter): Ruling | null {
  const { a, b, windFrom } = e

  // Sailing vessels must be able to sail as drawn, with a known tack.
  for (const v of [a, b]) {
    if (v.kind === 'sail' && (windFrom === undefined || tackOf(v, windFrom) === null)) return null
    if (v.speed <= 0) return null
  }

  // Risk of collision: closing, and heading for a close-quarters pass.
  const { tcpa, cpa, range } = closestApproach(e)
  if (!(tcpa > 0) || cpa > Math.max(0.05, 0.1 * range)) return null

  const relA = relativeBearing(a, b) // where b is, seen from a
  const relB = relativeBearing(b, a) // where a is, seen from b
  const offA = offBow(relA)
  const offB = offBow(relB)

  // Rule 13 first: it applies whatever the vessels are (Rules 12 and 18 give way to it).
  if (Math.abs(offA - OVERTAKING_FROM) < MARGIN.sector || Math.abs(offB - OVERTAKING_FROM) < MARGIN.sector) return null
  const aOvertaking = offB > OVERTAKING_FROM // a is coming up from more than 22.5° abaft b's beam
  const bOvertaking = offA > OVERTAKING_FROM
  if (aOvertaking && bOvertaking) return null
  if (aOvertaking || bOvertaking) {
    const overtaker = aOvertaking ? a : b
    // A vessel not under command or restricted in her ability to manoeuvre is not treated here.
    if (overtaker.kind === 'nuc' || overtaker.kind === 'ram') return null
    return giveWay('overtaking', aOvertaking ? 'a' : 'b')
  }

  // Rule 18: different kinds of vessel.
  if (a.kind !== b.kind) {
    if (RANK[a.kind] === RANK[b.kind]) return null
    const rule: RuleId = (a.kind === 'power' && b.kind === 'sail') || (a.kind === 'sail' && b.kind === 'power') ? 'power-sail' : 'hierarchy'
    return giveWay(rule, RANK[a.kind] < RANK[b.kind] ? 'a' : 'b')
  }

  // Two power-driven vessels: Rules 14 and 15.
  if (a.kind === 'power') {
    if (offA <= MARGIN.headOn && offB <= MARGIN.headOn) return { rule: 'head-on', giveWay: 'both', standOn: null }
    if (offA < MARGIN.crossing || offB < MARGIN.crossing) return null
    const courseAngle = offBow(b.heading - a.heading)
    if (courseAngle < MARGIN.crossingAngle) return null
    // Converging courses always put each vessel on opposite sides of the other.
    return giveWay('crossing', sideOf(relA) === 'starboard' ? 'a' : 'b')
  }

  // Two sailing vessels: Rule 12.
  if (a.kind === 'sail') {
    const ta = tackOf(a, windFrom)!
    const tb = tackOf(b, windFrom)!
    if (ta !== tb) return giveWay('port-starboard', ta === 'port' ? 'a' : 'b')
    const windward = windwardOf(e)
    if (!windward) return null
    return giveWay('windward-leeward', windward)
  }

  // Two vessels of the same special kind: outside this lesson.
  return null
}

/* ------------------------------------------------------------------ */
/* Explanations                                                        */
/* ------------------------------------------------------------------ */

/** How to refer to each vessel: "you"/"she" (A is the learner) or "A"/"B". */
export type Voice = 'you' | 'ab'

interface Words {
  /** Subject, capitalised: "You", "She", "A". */
  S: (w: Who) => string
  /** Subject, lower case: "you", "she", "A". */
  s: (w: Who) => string
  /** Object: "you", "her", "A". */
  o: (w: Who) => string
  /** Possessive: "your", "her", "A's". */
  p: (w: Who) => string
  /** Possessive referring back to the subject: "your", "her". */
  self: (w: Who) => string
  /** Verb agreement: v(w, 'keep', 'keeps'). */
  v: (w: Who, plural: string, singular: string) => string
}

export function words(voice: Voice): Words {
  if (voice === 'you') {
    return {
      S: (w) => (w === 'a' ? 'You' : 'She'),
      s: (w) => (w === 'a' ? 'you' : 'she'),
      o: (w) => (w === 'a' ? 'you' : 'her'),
      p: (w) => (w === 'a' ? 'your' : 'her'),
      self: (w) => (w === 'a' ? 'your' : 'her'),
      v: (w, plural, singular) => (w === 'a' ? plural : singular),
    }
  }
  const n = (w: Who) => (w === 'a' ? 'A' : 'B')
  return { S: n, s: n, o: n, p: (w) => `${n(w)}’s`, self: () => 'her', v: (_w, _plural, singular) => singular }
}

const ARTICLE: Record<Kind, string> = {
  power: 'a power-driven vessel',
  sail: 'a sailing vessel',
  fishing: 'a vessel engaged in fishing',
  ram: 'a vessel restricted in her ability to manoeuvre',
  nuc: 'a vessel not under command',
}

/** One or two sentences explaining a ruling, worked from the geometry. */
export function explain(e: Encounter, r: Ruling, voice: Voice): string {
  const W = words(voice)
  const vessel = (w: Who) => (w === 'a' ? e.a : e.b)
  const offFrom = (w: Who) => Math.round(offBow(relativeBearing(vessel(w), vessel(w === 'a' ? 'b' : 'a'))))
  switch (r.rule) {
    case 'overtaking': {
      const o = r.giveWay as Who
      const s = r.standOn!
      const off = offFrom(s)
      const where = off >= 177 ? `right astern of ${W.o(s)}` : `${off}° from ${W.p(s)} bow`
      return `${W.S(o)} ${W.v(o, 'are', 'is')} ${where} — more than 22.5° abaft ${W.p(s)} beam — and closing, so ${W.s(o)} ${W.v(o, 'are', 'is')} the overtaking vessel and ${W.v(o, 'keep', 'keeps')} out of the way (Rule 13), whatever kinds of vessel ${voice === 'you' ? 'you both are' : 'they are'}.`
    }
    case 'head-on':
      return `${voice === 'you' ? 'You are both' : 'Both are'} power-driven and meeting head-on: each sees the other ahead or nearly ahead, on a nearly reciprocal course. Each alters course to starboard so that they pass port side to port side (Rule 14).`
    case 'crossing': {
      const g = r.giveWay as Who
      const s = r.standOn!
      return `${voice === 'you' ? 'You are both' : 'Both are'} power-driven and crossing. ${W.S(g)} ${W.v(g, 'have', 'has')} ${W.o(s)} on ${W.self(g)} own starboard side, so ${W.s(g)} ${W.v(g, 'keep', 'keeps')} out of the way and, if the circumstances allow, ${W.v(g, 'avoid', 'avoids')} crossing ahead — usually a bold alteration to starboard to pass astern (Rule 15).`
    }
    case 'power-sail':
    case 'hierarchy': {
      const g = r.giveWay as Who
      const s = r.standOn!
      // Rule 18(c): a vessel engaged in fishing keeps out of the way of NUC and RAM vessels only "so far as possible".
      const asFar = vessel(g).kind === 'fishing' ? ', so far as possible' : ''
      return `${W.S(g)} ${W.v(g, 'are', 'is')} ${ARTICLE[vessel(g).kind]} and ${W.s(s)} ${W.v(s, 'are', 'is')} ${ARTICLE[vessel(s).kind]}, so ${W.s(g)} ${W.v(g, 'keep', 'keeps')} out of ${W.p(s)} way${asFar} (Rule 18).`
    }
    case 'port-starboard': {
      const g = r.giveWay as Who
      const s = r.standOn!
      return `${W.S(g)} ${W.v(g, 'have', 'has')} the wind on ${W.self(g)} port side (port tack) and ${W.s(s)} ${W.v(s, 'have', 'has')} it on ${W.self(s)} starboard side (starboard tack). Port tack keeps out of the way of starboard tack (Rule 12).`
    }
    case 'windward-leeward': {
      const g = r.giveWay as Who
      const t = tackOf(vessel(g), e.windFrom)
      return `${voice === 'you' ? 'You are both' : 'Both are'} on ${t} tack, with the wind on the same side. ${W.S(g)} ${W.v(g, 'are', 'is')} to windward — further upwind — so ${W.s(g)} ${W.v(g, 'keep', 'keeps')} out of the way of the leeward vessel (Rule 12).`
    }
  }
}

/** Plain-English summary of what each vessel should do. */
export function actions(e: Encounter, r: Ruling, voice: Voice): string {
  const W = words(voice)
  if (r.giveWay === 'both') return `${voice === 'you' ? 'You and she' : 'A and B'} each alter course to starboard, early and boldly, and pass port to port.`
  const g = r.giveWay
  const s = r.standOn!
  const give = `${W.S(g)} ${W.v(g, 'keep', 'keeps')} out of the way with early, substantial action (Rule 16).`
  // A vessel not under command or restricted in her ability to manoeuvre may not be able to do much herself.
  const limited = (s === 'a' ? e.a : e.b).kind === 'nuc' || (s === 'a' ? e.a : e.b).kind === 'ram'
  if (limited) return `${give} ${W.S(s)} ${W.v(s, 'are', 'is')} the stand-on vessel (Rule 17), but with only limited ability to manoeuvre.`
  return `${give} ${W.S(s)} ${W.v(s, 'keep', 'keeps')} ${W.self(s)} course and speed, and ${W.v(s, 'watch', 'watches')} closely (Rule 17).`
}
