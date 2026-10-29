// Lesson 10 (ported from the Boaty Jobs steering and sailing rules tests): the rules engine must give the textbook answer for every
// classic encounter, behave sensibly under rotation, mirroring and swapping
// the two vessels, and every encounter the lesson shows — simulator, video,
// exercises and practice — must be unambiguous and play out safely.

import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/lib/courses/random'
import {
  closestApproach, decide, dir, explain, norm, offBow, relativeBearing, tackOf, windwardOf,
  type Encounter, type Kind, type Ruling, type Side, type Vessel,
} from '@/components/courses/lessons/rules-of-the-road/rules'
import { plan, SAFE, simulate } from '@/components/courses/lessons/rules-of-the-road/manoeuvre'
import { allSetups, encounterFor, randomEncounter, simEncounter, type Shape } from '@/components/courses/lessons/rules-of-the-road/scenarios'
import { NO_GO, offWind } from '@/components/courses/lessons/rules-of-the-road/rules'
import { INTERVAL, MAX_SIGHTINGS, closest, makeWatch, reading, type Trend } from '@/components/courses/lessons/rules-of-the-road/watch'
import { Q_CROSSING, Q_HEAD_ON, Q_MOTORSAILING, Q_SAIL_OVERTAKES, Q_TACKS, Q_TRAWLER, Q_WINDWARD } from '@/components/courses/lessons/rules-of-the-road/cases'
import { powerCase, sailingCase } from '@/components/courses/lessons/rules-of-the-road/art'
import { sideOf } from '@/components/courses/lessons/rules-of-the-road/rules'

/** A vessel that reaches the origin after `T` hours on `heading` at `speed`. */
function v(kind: Kind, heading: number, speed: number, T = 0.25, mainsail?: Side): Vessel {
  const d = dir(heading)
  return { kind, heading, speed, x: -d.x * speed * T, y: -d.y * speed * T, mainsail }
}

const swap = (e: Encounter): Encounter => ({ a: e.b, b: e.a, windFrom: e.windFrom })
const swapRuling = (r: Ruling): Ruling => ({
  rule: r.rule,
  giveWay: r.giveWay === 'both' ? 'both' : r.giveWay === 'a' ? 'b' : 'a',
  standOn: r.standOn === null ? null : r.standOn === 'a' ? 'b' : 'a',
})

function rotate(e: Encounter, deg: number): Encounter {
  const a = (deg * Math.PI) / 180
  const rot = (p: Vessel): Vessel => ({
    ...p,
    x: p.x * Math.cos(a) + p.y * Math.sin(a),
    y: -p.x * Math.sin(a) + p.y * Math.cos(a),
    heading: norm(p.heading + deg),
  })
  return { a: rot(e.a), b: rot(e.b), windFrom: e.windFrom === undefined ? undefined : norm(e.windFrom + deg) }
}

/** Reflect east–west: port and starboard swap over. */
function mirror(e: Encounter): Encounter {
  const m = (p: Vessel): Vessel => ({
    ...p,
    x: -p.x,
    heading: norm(-p.heading),
    mainsail: p.mainsail === undefined ? undefined : p.mainsail === 'port' ? 'starboard' : 'port',
  })
  return { a: m(e.a), b: m(e.b), windFrom: e.windFrom === undefined ? undefined : norm(-e.windFrom) }
}

describe('steering-and-sailing-rules: the textbook cases', () => {
  it('two power-driven vessels head-on: both alter to starboard (Rule 14)', () => {
    expect(decide({ a: v('power', 0, 8), b: v('power', 180, 10) })).toEqual({ rule: 'head-on', giveWay: 'both', standOn: null })
  })

  it('power-driven crossing: the vessel with the other on her starboard side gives way (Rule 15)', () => {
    // b comes from a's starboard side, heading west.
    expect(decide({ a: v('power', 0, 8), b: v('power', 270, 8) })).toEqual({ rule: 'crossing', giveWay: 'a', standOn: 'b' })
    // b comes from a's port side, heading east: a has b on her port side, so b gives way.
    expect(decide({ a: v('power', 0, 8), b: v('power', 90, 8) })).toEqual({ rule: 'crossing', giveWay: 'b', standOn: 'a' })
    // Fine crossing angles still count, as long as both see each other well off the bow.
    expect(decide({ a: v('power', 0, 8), b: v('power', 225, 8) })?.giveWay).toBe('a')
  })

  it('overtaking: the overtaking vessel keeps out of the way, whatever she is (Rule 13)', () => {
    // b comes up from a's starboard quarter, faster.
    const e = { a: v('power', 0, 3, 0.3), b: v('power', 350, 7, 0.3) }
    expect(decide(e)).toEqual({ rule: 'overtaking', giveWay: 'b', standOn: 'a' })
    // A yacht under sail overtaking a motor boat must keep clear of her.
    expect(decide({ a: v('power', 0, 3, 0.3), b: v('sail', 350, 7, 0.3), windFrom: 90 })).toEqual({ rule: 'overtaking', giveWay: 'b', standOn: 'a' })
    // A power-driven vessel overtaking a fishing vessel keeps out of the way anyway.
    expect(decide({ a: v('power', 0, 9, 0.3), b: v('fishing', 10, 3, 0.3) })).toEqual({ rule: 'overtaking', giveWay: 'a', standOn: 'b' })
  })

  it('the overtaking sector starts 22.5° abaft the beam, and borderline cases are left out', () => {
    // b on a's starboard side at relative 150: overtaking.
    const at = (rel: number, hB: number, vB: number): Encounter => {
      // Put b at relative bearing `rel` from a (a heads 000 at 4 kn) on a collision course.
      const a = v('power', 0, 4, 0.3)
      const T = 0.3
      const d = dir(hB)
      return { a, b: { kind: 'power', heading: hB, speed: vB, x: -d.x * vB * T, y: -d.y * vB * T } }
    }
    const over = at(0, 340, 8)
    expect(offBow(relativeBearing(over.a, over.b))).toBeGreaterThan(122.5)
    expect(decide(over)?.rule).toBe('overtaking')
    // Find a case near 112.5° and check it is rejected as "in doubt".
    let rejected = 0
    for (let h = 270; h < 360; h += 1) {
      for (const speed of [5, 6, 7, 8, 10, 12]) {
        const e = at(0, h, speed)
        const off = offBow(relativeBearing(e.a, e.b))
        if (Math.abs(off - 112.5) < 10) {
          expect(decide(e)).toBeNull()
          rejected++
        }
      }
    }
    expect(rejected).toBeGreaterThan(0)
  })

  it('power-driven gives way to sail, whichever side she is on (Rule 18)', () => {
    expect(decide({ a: v('power', 0, 8), b: v('sail', 270, 6), windFrom: 0 })).toEqual({ rule: 'power-sail', giveWay: 'a', standOn: 'b' })
    expect(decide({ a: v('power', 0, 8), b: v('sail', 90, 6), windFrom: 0 })).toEqual({ rule: 'power-sail', giveWay: 'a', standOn: 'b' })
    // Head-on, power v sail: not Rule 14 — power keeps out of the way.
    expect(decide({ a: v('sail', 0, 6), b: v('power', 180, 8), windFrom: 90 })).toEqual({ rule: 'power-sail', giveWay: 'b', standOn: 'a' })
  })

  it('the Rule 18 ladder', () => {
    expect(decide({ a: v('sail', 0, 6), b: v('fishing', 270, 4), windFrom: 90 })).toMatchObject({ rule: 'hierarchy', giveWay: 'a' })
    expect(decide({ a: v('fishing', 0, 4), b: v('nuc', 90, 2) })).toMatchObject({ rule: 'hierarchy', giveWay: 'a' })
    expect(decide({ a: v('fishing', 0, 4), b: v('ram', 270, 3) })).toMatchObject({ rule: 'hierarchy', giveWay: 'a' })
    expect(decide({ a: v('power', 0, 8), b: v('ram', 90, 3) })).toMatchObject({ rule: 'hierarchy', giveWay: 'a' })
    expect(decide({ a: v('sail', 0, 6), b: v('nuc', 90, 2), windFrom: 270 })).toMatchObject({ rule: 'hierarchy', giveWay: 'a' })
    // No rule between these two: left out.
    expect(decide({ a: v('ram', 0, 3), b: v('nuc', 90, 2) })).toBeNull()
    expect(decide({ a: v('fishing', 0, 4), b: v('fishing', 90, 4) })).toBeNull()
  })

  it('sailing: port tack gives way to starboard tack (Rule 12)', () => {
    // Wind from the north-east: a (heading 000) is close-hauled on starboard tack; b (heading 090) close-hauled on port tack.
    const e: Encounter = { a: v('sail', 0, 6), b: v('sail', 90, 6), windFrom: 45 }
    expect(tackOf(e.a, 45)).toBe('starboard')
    expect(tackOf(e.b, 45)).toBe('port')
    expect(decide(e)).toEqual({ rule: 'port-starboard', giveWay: 'b', standOn: 'a' })
    // Head-on under sail, the tacks are always opposite.
    expect(decide({ a: v('sail', 0, 6), b: v('sail', 180, 6), windFrom: 90 })).toEqual({ rule: 'port-starboard', giveWay: 'b', standOn: 'a' })
  })

  it('sailing, same tack: windward keeps out of the way of leeward (Rule 12)', () => {
    // Wind from the NE. a heads 000 (starboard tack, close-hauled); b heads 270 from the east (starboard tack, broad reach): b is upwind.
    const e: Encounter = { a: v('sail', 0, 6), b: v('sail', 270, 6), windFrom: 45 }
    expect(tackOf(e.a, 45)).toBe('starboard')
    expect(tackOf(e.b, 45)).toBe('starboard')
    expect(windwardOf(e)).toBe('b')
    expect(decide(e)).toEqual({ rule: 'windward-leeward', giveWay: 'b', standOn: 'a' })
  })

  it('the mainsail decides the tack when running dead before the wind (Rule 12(b))', () => {
    const run = (main: Side) => v('sail', 0, 6, 0.25, main)
    expect(tackOf(run('port'), 180)).toBe('starboard')
    expect(tackOf(run('starboard'), 180)).toBe('port')
    // Without a mainsail side, it is unknown.
    expect(tackOf(v('sail', 0, 6), 180)).toBeNull()
  })

  it('no ruling for a yacht inside the no-go zone, for no risk of collision, or a near-head-on muddle', () => {
    expect(decide({ a: v('sail', 0, 6), b: v('power', 90, 8), windFrom: 20 })).toBeNull()
    // Diverging: no risk of collision.
    const d = { a: v('power', 0, 8), b: v('power', 90, 8) }
    expect(decide({ a: d.a, b: { ...d.b, heading: 270 } })).toBeNull()
    // b nearly ahead of a but a well off b's bow: not clearly head-on or crossing.
    expect(decide({ a: v('power', 0, 4), b: v('power', 200, 12) })).toBeNull()
  })

  it('explanations name the right vessel', () => {
    const e = { a: v('power', 0, 8), b: v('power', 270, 8) }
    const r = decide(e)!
    expect(explain(e, r, 'you')).toMatch(/You have her on your own starboard side/)
    expect(explain(e, r, 'ab')).toMatch(/A has B on her own starboard side/)
  })
})

describe('steering-and-sailing-rules: invariants over random encounters', () => {
  const kinds: Kind[] = ['power', 'sail', 'fishing', 'ram', 'nuc']
  const rng = mulberry32(2027)
  const samples: Encounter[] = []
  for (let i = 0; i < 6000; i++) {
    const ka = kinds[Math.floor(rng() * kinds.length)]
    const kb = kinds[Math.floor(rng() * kinds.length)]
    const hA = Math.floor(rng() * 360)
    const hB = Math.floor(rng() * 360)
    const T = 0.1 + rng() * 0.3
    const a = v(ka!, hA, 1 + rng() * 12, T, rng() < 0.5 ? 'port' : 'starboard')
    const b = v(kb!, hB, 1 + rng() * 12, T, rng() < 0.5 ? 'port' : 'starboard')
    samples.push({ a, b, windFrom: Math.floor(rng() * 360) })
  }
  const decided = samples.map((e) => ({ e, r: decide(e) })).filter((x): x is { e: Encounter; r: Ruling } => x.r !== null)

  it('finds plenty of clear cases of every kind', () => {
    const rules = new Set(decided.map((d) => d.r.rule))
    expect([...rules].sort()).toEqual(['crossing', 'head-on', 'hierarchy', 'overtaking', 'port-starboard', 'power-sail', 'windward-leeward'])
  })

  it('swapping the two vessels swaps the answer', () => {
    for (const { e, r } of decided) expect(decide(swap(e))).toEqual(swapRuling(r))
  })

  it('turning the whole picture round changes nothing', () => {
    for (const { e, r } of decided.slice(0, 1500)) {
      for (const deg of [37, 90, 211]) expect(decide(rotate(e, deg))).toEqual(r)
    }
  })

  it('mirror images: crossing and port/starboard swap over; the rest stay the same', () => {
    for (const { e, r } of decided) {
      const m = decide(mirror(e))
      if (r.rule === 'crossing' || r.rule === 'port-starboard') expect(m).toEqual(swapRuling(r))
      else expect(m).toEqual(r)
    }
  })

  it('the give-way vessel in a power-driven crossing always has the other on her starboard side', () => {
    for (const { e, r } of decided.filter((d) => d.r.rule === 'crossing')) {
      const g = r.giveWay === 'a' ? e.a : e.b
      const s = r.giveWay === 'a' ? e.b : e.a
      expect(norm(relativeBearing(g, s))).toBeLessThan(180)
      expect(norm(relativeBearing(s, g))).toBeGreaterThan(180)
    }
  })

  it('an overtaking vessel is always more than 22.5° abaft the other’s beam', () => {
    for (const { e, r } of decided.filter((d) => d.r.rule === 'overtaking')) {
      const o = r.giveWay === 'a' ? e.a : e.b
      const s = r.giveWay === 'a' ? e.b : e.a
      expect(offBow(relativeBearing(s, o))).toBeGreaterThan(122.5)
    }
  })
})

describe('steering-and-sailing-rules: the encounter simulator', () => {
  const setups = allSetups()

  it('offers a good range of set-ups', () => {
    expect(setups.length).toBeGreaterThan(100)
  })

  for (const s of setups) {
    const name = `${s.you} v ${s.her}, ${s.aspect}, wind ${s.windFrom}, mains ${s.yourMain}/${s.herMain}`
    it(`${name}: a clear ruling and a safe manoeuvre`, () => {
      const e = simEncounter(s)
      const r = decide(e)
      expect(r, name).not.toBeNull()
      expect(closestApproach(e).cpa).toBeLessThan(1e-6)
      const m = plan(e, r!)
      expect(m.closest, `${name} closest`).toBeGreaterThanOrEqual(SAFE)
      if (r!.rule === 'crossing') expect(m.astern).toBe(true)
      // Except when overtaking or meeting nearly head-on, the give-way vessel passes astern of the stand-on vessel.
      if (r!.rule !== 'overtaking' && r!.giveWay !== 'both') {
        const G = r!.giveWay === 'a' ? e.a : e.b
        const S = r!.giveWay === 'a' ? e.b : e.a
        if (offBow(relativeBearing(G, S)) >= 10) expect(m.astern, `${name} astern`).toBe(true)
      }
      // A power-driven give-way vessel in a crossing turns to starboard.
      if (r!.rule === 'crossing') expect((r!.giveWay === 'a' ? m.a : m.b)!.alter).toBeGreaterThan(0)
      if (r!.rule === 'head-on') expect(m.a!.alter > 0 && m.b!.alter > 0).toBe(true)
      // Stand-on vessel holds her course and speed.
      if (r!.standOn) expect(r!.standOn === 'a' ? m.a : m.b).toBeNull()
      // A sailing vessel never ends up pointing inside the no-go zone.
      const tracks = simulate(e, m)
      for (const [k, vessel] of [['a', e.a], ['b', e.b]] as const) {
        if (vessel.kind !== 'sail') continue
        for (const p of tracks[k]) expect(offWind(p.heading, e.windFrom!)).toBeGreaterThanOrEqual(NO_GO)
      }
      // No slowing down needed: course alteration alone does it (Rule 8(c)).
      const order = r!.giveWay === 'both' ? m.a! : (r!.giveWay === 'a' ? m.a : m.b)!
      expect(order.speedFactor).toBe(1)
    })
  }

  it('matches the textbook in the simulator’s classic set-ups', () => {
    const base = { windFrom: 45, yourMain: 'port', herMain: 'port' } as const
    expect(decide(simEncounter({ ...base, you: 'power', her: 'power', aspect: 'starboard' }))?.giveWay).toBe('a')
    expect(decide(simEncounter({ ...base, you: 'power', her: 'power', aspect: 'port' }))?.giveWay).toBe('b')
    expect(decide(simEncounter({ ...base, you: 'power', her: 'power', aspect: 'head-on' }))?.giveWay).toBe('both')
    expect(decide(simEncounter({ ...base, you: 'power', her: 'sail', aspect: 'overtaken' }))).toMatchObject({ rule: 'overtaking', giveWay: 'b' })
    expect(decide(simEncounter({ ...base, you: 'sail', her: 'power', aspect: 'overtaking' }))).toMatchObject({ rule: 'overtaking', giveWay: 'a' })
  })
})

describe('steering-and-sailing-rules: the practice generator’s encounters', () => {
  const PAIRS: Array<[Kind, Kind, Shape[]]> = [
    ['power', 'power', ['head-on', 'crossing', 'overtaking']],
    ['sail', 'sail', ['head-on', 'crossing', 'overtaking']],
    ['power', 'sail', ['head-on', 'crossing', 'overtaking']],
    ['sail', 'power', ['head-on', 'crossing', 'overtaking']],
    ['sail', 'fishing', ['crossing']],
    ['power', 'fishing', ['crossing']],
    ['fishing', 'ram', ['crossing']],
    ['power', 'nuc', ['crossing']],
    ['sail', 'ram', ['crossing']],
  ]
  for (const [ka, kb, shapes] of PAIRS) {
    for (const shape of shapes) {
      for (const headUp of [true, false]) {
        it(`${ka} v ${kb}, ${shape}${headUp ? ', head-up' : ''}: always finds a clear case`, () => {
          for (let seed = 1; seed <= 150; seed++) {
            const g = encounterFor(mulberry32(seed * 31 + 7), [ka, kb], shape, headUp)
            expect(decide(g.e)).toEqual(g.r)
            expect(closestApproach(g.e).cpa).toBeLessThan(1e-6)
            if (headUp) expect(g.e.a.heading).toBe(0)
            if (shape === 'overtaking') expect(g.r.rule).toBe('overtaking')
            else expect(g.r.rule).not.toBe('overtaking')
          }
        })
      }
    }
  }

  it('gives up quietly on ambiguous attempts (null), never a wrong answer', () => {
    let nulls = 0
    for (let seed = 1; seed <= 300; seed++) {
      const g = randomEncounter(mulberry32(seed), ['power', 'power'], 'crossing', false)
      if (!g) nulls++
      else expect(decide(g.e)).toEqual(g.r)
    }
    expect(nulls).toBeLessThan(300)
  })
})

describe('steering-and-sailing-rules: the bearing watch', () => {
  const trends: Trend[] = ['steady', 'ahead', 'astern']
  for (const trend of trends) {
    it(`${trend}: the readings and the outcome agree`, () => {
      for (let seed = 1; seed <= 200; seed++) {
        const w = makeWatch(mulberry32(seed), trend)
        const c = closest(w)
        const rs = Array.from({ length: MAX_SIGHTINGS }, (_, i) => reading(w, i))
        const towardBow = rs.map((b) => -offBow(b - w.heading))
        // She is sighted on the bow, well forward of the beam, a few miles off.
        expect(offBow(rs[0]! - w.heading)).toBeGreaterThanOrEqual(30)
        expect(offBow(rs[0]! - w.heading)).toBeLessThanOrEqual(75)
        expect(c.minutes).toBeGreaterThan(4 * INTERVAL)
        if (trend === 'steady') {
          expect(c.distance).toBeLessThan(0.02)
          // Readings stay within a degree or so of each other.
          expect(Math.max(...towardBow) - Math.min(...towardBow)).toBeLessThanOrEqual(2)
        } else {
          expect(c.distance).toBeGreaterThan(0.2)
          expect(c.ahead).toBe(trend === 'ahead')
          // The first three bearings already show the trend, and it never steps back.
          const sign = trend === 'ahead' ? 1 : -1
          expect((towardBow[2]! - towardBow[0]!) * sign).toBeGreaterThanOrEqual(2)
          for (let i = 1; i < rs.length; i++) expect((towardBow[i]! - towardBow[i - 1]!) * sign).toBeGreaterThanOrEqual(0)
        }
      }
    })
  }
})

describe('steering-and-sailing-rules: the fixed exercise and notes cases', () => {
  it('each written answer matches the rules engine', () => {
    expect(decide(Q_CROSSING)).toEqual({ rule: 'crossing', giveWay: 'a', standOn: 'b' })
    expect(decide(Q_HEAD_ON)).toEqual({ rule: 'head-on', giveWay: 'both', standOn: null })
    expect(decide(Q_TACKS)).toEqual({ rule: 'port-starboard', giveWay: 'a', standOn: 'b' })
    expect(tackOf(Q_TACKS.a, Q_TACKS.windFrom)).toBe('port')
    expect(tackOf(Q_TACKS.b, Q_TACKS.windFrom)).toBe('starboard')
    expect(decide(Q_WINDWARD)).toEqual({ rule: 'windward-leeward', giveWay: 'b', standOn: 'a' })
    expect(tackOf(Q_WINDWARD.a, Q_WINDWARD.windFrom)).toBe('starboard')
    expect(tackOf(Q_WINDWARD.b, Q_WINDWARD.windFrom)).toBe('starboard')
    expect(decide(Q_SAIL_OVERTAKES)).toEqual({ rule: 'overtaking', giveWay: 'a', standOn: 'b' })
    expect(decide(Q_MOTORSAILING)).toEqual({ rule: 'power-sail', giveWay: 'a', standOn: 'b' })
    expect(sideOf(relativeBearing(Q_MOTORSAILING.a, Q_MOTORSAILING.b))).toBe('port')
    expect(decide(Q_TRAWLER)).toEqual({ rule: 'hierarchy', giveWay: 'a', standOn: 'b' })
    expect(sideOf(relativeBearing(Q_TRAWLER.a, Q_TRAWLER.b))).toBe('port')
    // The crossing vessel in Q_CROSSING is on your starboard bow.
    expect(sideOf(relativeBearing(Q_CROSSING.a, Q_CROSSING.b))).toBe('starboard')
  })

  it('the notes’ sailing and power figures show the textbook answers', () => {
    expect(decide(sailingCase('tacks'))).toMatchObject({ rule: 'port-starboard', giveWay: 'a' })
    expect(decide(sailingCase('same'))).toMatchObject({ rule: 'windward-leeward', giveWay: 'b' })
    expect(decide(powerCase('head-on'))).toMatchObject({ rule: 'head-on', giveWay: 'both' })
    expect(decide(powerCase('crossing'))).toMatchObject({ rule: 'crossing', giveWay: 'a' })
  })

  it('the sail-overtakes-power case is clearly in the overtaking sector', () => {
    const off = offBow(relativeBearing(Q_SAIL_OVERTAKES.b, Q_SAIL_OVERTAKES.a))
    console.log('Q_SAIL_OVERTAKES off the motor boat’s bow:', off.toFixed(1))
    expect(off).toBeGreaterThan(130)
    expect(off).toBeLessThan(140)
    expect(sideOf(relativeBearing(Q_SAIL_OVERTAKES.b, Q_SAIL_OVERTAKES.a))).toBe('starboard')
  })
})
