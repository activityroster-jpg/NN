// Encounters for the simulator, the video and the practice generator. Every
// one is built as a true collision course (both vessels arrive at the same
// point at the same time if neither acts), so the bearing is steady and
// risk of collision exists; `decide` then says who gives way.

import { pick, randInt, randStep, type Rng } from '@/lib/courses/random'
import {
  NO_GO, RUNNING, decide, dir, offWind, type Encounter, type Kind, type Ruling, type Side, type Vessel,
} from './rules'

/* ------------------------------------------------------------------ */
/* The encounter simulator                                             */
/* ------------------------------------------------------------------ */

export type Aspect = 'head-on' | 'starboard' | 'port' | 'overtaken' | 'overtaking'

export const ASPECTS: { id: Aspect; label: string }[] = [
  { id: 'head-on', label: 'Meeting head-on' },
  { id: 'starboard', label: 'Crossing from starboard' },
  { id: 'port', label: 'Crossing from port' },
  { id: 'overtaken', label: 'Catching you up' },
  { id: 'overtaking', label: 'You are catching her up' },
]

/** Wind directions offered (blowing FROM). */
export const WINDS = [0, 45, 90, 135, 180, 225, 270, 315]
export const WIND_NAMES: Record<number, string> = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' }

export interface SimSetup {
  you: 'power' | 'sail'
  her: 'power' | 'sail'
  aspect: Aspect
  windFrom: number
  /** Mainsail sides, used only when a sailing vessel is running dead before the wind. */
  yourMain: Side
  herMain: Side
}

/** Start of each vessel: heading, speed and hours to the collision point (which is the origin). */
const ASPECT_GEOMETRY: Record<Aspect, { a: [number, number]; b: [number, number]; T: number }> = {
  'head-on': { a: [0, 6], b: [180, 6], T: 0.25 },
  starboard: { a: [0, 6], b: [270, 6], T: 0.25 },
  port: { a: [0, 6], b: [90, 6], T: 0.25 },
  overtaken: { a: [0, 3], b: [350, 7], T: 0.3 },
  overtaking: { a: [0, 7], b: [10, 3], T: 0.3 },
}

function onCollisionCourse(kind: Kind, heading: number, speed: number, T: number, mainsail?: Side): Vessel {
  const d = dir(heading)
  return { kind, heading, speed, x: -d.x * speed * T, y: -d.y * speed * T, mainsail }
}

export function simEncounter(s: SimSetup): Encounter {
  const g = ASPECT_GEOMETRY[s.aspect]
  return {
    a: onCollisionCourse(s.you, g.a[0], g.a[1], g.T, s.you === 'sail' ? s.yourMain : undefined),
    b: onCollisionCourse(s.her, g.b[0], g.b[1], g.T, s.her === 'sail' ? s.herMain : undefined),
    windFrom: s.you === 'sail' || s.her === 'sail' ? s.windFrom : undefined,
  }
}

/** Why a wind direction can't be used: a sailing vessel would be pointing inside the no-go zone. */
export function windProblem(s: SimSetup, windFrom: number): string | null {
  const e = simEncounter({ ...s, windFrom })
  if (e.a.kind === 'sail' && offWind(e.a.heading, windFrom) < NO_GO) return 'You can’t sail that close to the wind'
  if (e.b.kind === 'sail' && offWind(e.b.heading, windFrom) < NO_GO) return 'She can’t sail that close to the wind'
  return null
}

/** Which sailing vessels are running dead before the wind (so the mainsail side decides their tack). */
export function running(s: SimSetup): { you: boolean; her: boolean } {
  const e = simEncounter(s)
  return {
    you: e.a.kind === 'sail' && offWind(e.a.heading, s.windFrom) > RUNNING,
    her: e.b.kind === 'sail' && offWind(e.b.heading, s.windFrom) > RUNNING,
  }
}

/** Every set-up the simulator can show (used by the tests and by "random encounter"). */
export function allSetups(): SimSetup[] {
  const out: SimSetup[] = []
  const kinds = ['power', 'sail'] as const
  for (const you of kinds) {
    for (const her of kinds) {
      for (const { id: aspect } of ASPECTS) {
        const winds: number[] = you === 'sail' || her === 'sail' ? WINDS : [WINDS[0]!]
        for (const windFrom of winds) {
          for (const yourMain of ['port', 'starboard'] as Side[]) {
            for (const herMain of ['port', 'starboard'] as Side[]) {
              const s: SimSetup = { you, her, aspect, windFrom, yourMain, herMain }
              if (windProblem(s, windFrom)) continue
              const r = running(s)
              // Only vary the mainsail side when it matters.
              if (!r.you && yourMain !== 'port') continue
              if (!r.her && herMain !== 'port') continue
              out.push(s)
            }
          }
        }
      }
    }
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Random encounters for the practice generator                        */
/* ------------------------------------------------------------------ */

export type Shape = 'head-on' | 'crossing' | 'overtaking'

const SPEED: Record<Kind, [number, number]> = {
  power: [6, 14],
  sail: [4, 7],
  fishing: [3, 6],
  ram: [2, 5],
  nuc: [1, 3],
}

export interface Generated {
  e: Encounter
  r: Ruling
  /** Minutes to the collision point if nobody acts. */
  minutes: number
}

/**
 * A random encounter of the given kinds and shape, or null if the attempt
 * was ambiguous (the caller simply tries again). With `headUp`, vessel A
 * heads 000 so a figure can show her bow up the page, as seen from on board.
 */
export function randomEncounter(rng: Rng, kinds: [Kind, Kind], shape: Shape, headUp: boolean): Generated | null {
  const hA = headUp ? 0 : randInt(rng, 0, 71) * 5
  let hB: number
  let vA = randStep(rng, SPEED[kinds[0]][0], SPEED[kinds[0]][1], 1)
  let vB = randStep(rng, SPEED[kinds[1]][0], SPEED[kinds[1]][1], 1)
  if (shape === 'head-on') {
    hB = hA + 180 + randInt(rng, -2, 2)
  } else if (shape === 'crossing') {
    hB = hA + pick(rng, [-1, 1]) * randInt(rng, 8, 28) * 5
  } else {
    hB = hA + randInt(rng, -5, 5) * 5
    // The overtaking vessel is clearly faster.
    const aFaster = rng() < 0.5
    const fast = (k: Kind) => Math.max(SPEED[k][1] - 1, 5)
    const slow = (k: Kind) => Math.max(1, Math.min(3, SPEED[k][0]))
    vA = aFaster ? fast(kinds[0]) : slow(kinds[0])
    vB = aFaster ? slow(kinds[1]) : fast(kinds[1])
    if ((aFaster ? vA / vB : vB / vA) < 1.6) return null
  }
  hB = ((hB % 360) + 360) % 360
  const minutes = randInt(rng, 12, 20)
  const T = minutes / 60
  const a = onCollisionCourse(kinds[0], hA, vA, T)
  const b = onCollisionCourse(kinds[1], hB, vB, T)
  let windFrom: number | undefined
  if (kinds.includes('sail')) {
    // A wind every sailing vessel can clearly sail with: well out of the no-go zone, and not dead astern.
    const ok = (w: number) => [a, b].every((v) => v.kind !== 'sail' || (offWind(v.heading, w) >= NO_GO + 10 && offWind(v.heading, w) <= 160))
    const options = Array.from({ length: 72 }, (_, i) => i * 5).filter(ok)
    if (!options.length) return null
    windFrom = pick(rng, options)
  }
  const e: Encounter = { a, b, windFrom }
  const r = decide(e)
  if (!r) return null
  if (shape === 'overtaking' && r.rule !== 'overtaking') return null
  if (shape !== 'overtaking' && r.rule === 'overtaking') return null
  return { e, r, minutes }
}

/** Keep trying until an unambiguous encounter turns up. */
export function encounterFor(rng: Rng, kinds: [Kind, Kind], shape: Shape, headUp: boolean): Generated {
  for (let i = 0; i < 400; i++) {
    const g = randomEncounter(rng, kinds, shape, headUp)
    if (g) return g
  }
  throw new Error(`No clear ${shape} encounter for ${kinds.join('/')}`)
}
