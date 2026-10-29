'use client'

// Interactive widgets for "Collision regulations: steering and sailing rules":
//   - EncounterSim: set up two vessels (power or sail, where she is, the
//     wind and, when running, the mainsail side), say what you should do,
//     then watch the manoeuvre the rules call for.
//   - BearingWatch: take a series of hand-bearing compass bearings of an
//     approaching ship and decide: steady (risk of collision), drawing
//     ahead, or drawing aft.

import { Dices } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { r2 } from '@/lib/courses/navigation/chart-geometry'
import { mulberry32 } from '@/lib/courses/random'
import { Yacht } from '../../scene-art'
import { INK, MUTED, MotorBoat, SEA, TEAL_INK, VesselIcon, WindBadge, WindStreaks, fitX, meetingPoint } from './art'
import { describeOrder, mainsailTrack, plan, simulate, STEPS, type Pose } from './manoeuvre'
import { decide, dir, explain, offBow, relativeBearing, type Side } from './rules'
import { ASPECTS, WINDS, WIND_NAMES, allSetups, running, simEncounter, windProblem, type Aspect, type SimSetup } from './scenarios'
import { INTERVAL, MAX_SIGHTINGS, clock, closest, makeWatch, pad3, positionsAt, rangeAt, reading, type Trend, type Watch } from './watch'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Runs 0 → 1 over `ms` while `playing`, then calls `done`. */
function useProgress(playing: boolean, ms: number, setProgress: (p: number) => void, done: () => void, from = 0) {
  useEffect(() => {
    if (!playing) return
    const start = performance.now() - from * ms
    let raf = 0
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / ms)
      setProgress(k)
      if (k < 1) raf = requestAnimationFrame(step)
      else done()
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, ms])
}

const chip = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${on ? 'border-teal bg-teal text-white' : 'border-border bg-white text-text-primary hover:bg-teal-light'}`

/* ------------------------------------------------------------------ */
/* Encounter simulator                                                 */
/* ------------------------------------------------------------------ */

const DEFAULT_SETUP: SimSetup = { you: 'power', her: 'power', aspect: 'starboard', windFrom: 45, yourMain: 'port', herMain: 'port' }
const SETUPS = allSetups()

/** Keep the set-up sailable: if the wind no longer works, take the first one that does. */
function normalise(s: SimSetup): SimSetup {
  if (s.you === 'power' && s.her === 'power') return s
  if (!windProblem(s, s.windFrom)) return s
  const w = WINDS.find((x) => !windProblem(s, x))
  return w === undefined ? s : { ...s, windFrom: w }
}

type OptionId = 'give' | 'stand' | 'both' | 'port'
const OPTIONS: { id: OptionId; text: string }[] = [
  { id: 'give', text: 'Keep out of her way: act early and boldly' },
  { id: 'stand', text: 'Stand on: hold your course and speed, and watch her' },
  { id: 'both', text: 'Alter course to starboard — and so should she' },
  { id: 'port', text: 'Alter course to port and cross ahead of her' },
]

const SIM_SIZE = 560
/** Pixels per mile and the north–south centre of the view (M). */
const SIM_K = SIM_SIZE / 2 / 2.4
const SIM_CY = -0.25
const ANIM_MS = 7000

function aspectWords(a: Aspect): string {
  switch (a) {
    case 'head-on': return 'meeting you head-on'
    case 'starboard': return 'crossing from your starboard side'
    case 'port': return 'crossing from your port side'
    case 'overtaken': return 'coming up from astern, catching you up'
    case 'overtaking': return 'ahead of you, and you are catching her up'
  }
}

export function EncounterSim() {
  const [setup, setSetup] = useState<SimSetup>(DEFAULT_SETUP)
  const [choice, setChoice] = useState<OptionId | null>(null)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [shuffles, setShuffles] = useState(0)

  const e = useMemo(() => simEncounter(setup), [setup])
  const ruling = useMemo(() => decide(e), [e])
  const m = useMemo(() => (ruling ? plan(e, ruling) : null), [e, ruling])
  // Play until both are well past: 1.7 × the time to the meeting point.
  const shown = useMemo(() => (m ? { ...m, duration: m.T * 1.7 } : null), [m])
  const tracks = useMemo(() => (shown ? simulate(e, shown) : null), [e, shown])
  const mains = useMemo(() => {
    if (!tracks || e.windFrom === undefined) return null
    return { a: e.a.kind === 'sail' ? mainsailTrack(e.a, tracks.a, e.windFrom) : null, b: e.b.kind === 'sail' ? mainsailTrack(e.b, tracks.b, e.windFrom) : null }
  }, [e, tracks])

  useProgress(playing, ANIM_MS, setProgress, () => setPlaying(false))

  const correct: OptionId | null = ruling ? (ruling.giveWay === 'both' ? 'both' : ruling.giveWay === 'a' ? 'give' : 'stand') : null
  const answered = choice !== null
  const sail = setup.you === 'sail' || setup.her === 'sail'
  const runs = running(setup)

  function change(next: Partial<SimSetup>) {
    setSetup((s) => normalise({ ...s, ...next }))
    setChoice(null)
    setPlaying(false)
    setProgress(0)
  }

  function answer(id: OptionId) {
    if (answered) return
    setChoice(id)
    if (prefersReducedMotion()) {
      setProgress(1)
    } else {
      setProgress(0)
      setPlaying(true)
    }
  }

  function replay() {
    if (prefersReducedMotion()) {
      setProgress(1)
      return
    }
    setProgress(0)
    setPlaying(true)
  }

  function randomise() {
    const n = shuffles + 1
    setShuffles(n)
    const rng = mulberry32(n * 7919 + 101)
    let next = SETUPS[Math.floor(rng() * SETUPS.length)]!
    if (next.aspect === setup.aspect && next.you === setup.you && next.her === setup.her) next = SETUPS[Math.floor(rng() * SETUPS.length)]!
    setSetup(next)
    setChoice(null)
    setPlaying(false)
    setProgress(0)
  }

  // One fixed scale for every set-up (all tracks stay within about ±2.1 M), so encounters compare fairly.
  const sx = (x: number) => r2(SIM_SIZE / 2 + x * SIM_K)
  const sy = (y: number) => r2(SIM_SIZE / 2 - (y - SIM_CY) * SIM_K)

  const idx = answered && tracks ? Math.round(progress * STEPS) : 0
  const pose = (who: 'a' | 'b'): Pose => (tracks ? tracks[who][idx]! : { x: e[who].x, y: e[who].y, heading: e[who].heading })
  const pa = pose('a')
  const pb = pose('b')
  const meet = meetingPoint(e)
  const scale = 0.55
  const giveWayWho = ruling?.giveWay

  const whatHappens = (() => {
    if (!ruling || !m) return ''
    if (ruling.giveWay === 'both') return 'You both alter course 40° to starboard in good time and pass port side to port side.'
    const g = ruling.giveWay
    const G = g === 'a' ? e.a : e.b
    const o = (g === 'a' ? m.a : m.b)!
    const verb = describeOrder(G, o, e.windFrom, m.gybe)
    const S = g === 'a' ? e.b : e.a
    const meeting = ruling.rule !== 'overtaking' && offBow(relativeBearing(G, S)) < 10
    const subject = g === 'a' ? 'You' : 'She'
    const verbFor = g === 'a' ? verb.replace(/^(\w+)s\b/, '$1') : verb
    const how = meeting
      ? `, so you pass ${o.alter > 0 ? 'port side to port side' : 'starboard side to starboard side'}`
      : ruling.rule === 'overtaking' || !m.astern
        ? ` and ${g === 'a' ? 'pass' : 'passes'} well clear`
        : ` and ${g === 'a' ? 'pass astern of her' : 'passes astern of you'}`
    const resume = g === 'a' ? 'You resume your course once she is past and clear.' : 'She resumes her course once you are past and clear.'
    const stand = g === 'a' ? 'She keeps her course and speed throughout.' : 'You keep your course and speed throughout.'
    return `${subject} ${verbFor}${how}. ${resume} ${stand}`
  })()

  const label = `Plan view, north up. You are ${setup.you === 'power' ? 'a power-driven vessel' : 'a yacht under sail'} heading up the page; the other vessel is ${setup.her === 'power' ? 'power-driven' : 'a yacht under sail'}, ${aspectWords(setup.aspect)}${sail ? `, with the wind from the ${WIND_NAMES[setup.windFrom]}` : ''}. Her bearing is steady and the range is closing.`

  const vesselLabel = (who: 'a' | 'b', p: Pose) => {
    const v = e[who]
    const back = dir(p.heading + 180)
    const name = who === 'a' ? 'You' : 'Other vessel'
    const sub = `${v.kind === 'sail' ? 'under sail' : 'power-driven'} · ${v.speed} kn`
    const lx = fitX(sx(p.x) + back.x * 62, sub, 15, 8, SIM_SIZE - 8)
    const ly = Math.max(24, Math.min(SIM_SIZE - 44, r2(sy(p.y) - back.y * 62)))
    return (
      <g textAnchor="middle" fontWeight={700} stroke={SEA} strokeWidth={5} paintOrder="stroke" strokeLinejoin="round">
        <text x={lx} y={ly} fontSize={21} fill={who === 'a' ? TEAL_INK : '#9a3412'}>{name}</text>
        <text x={lx} y={ly + 19} fontSize={15} fontWeight={600} fill={MUTED}>{sub}</text>
      </g>
    )
  }

  return (
    <div className="space-y-3">
      {/* Set-up */}
      <div className="grid gap-3 rounded-xl bg-bg p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5" role="group" aria-label="You are">
              <span className="w-14 text-xs font-semibold uppercase tracking-wide text-text-secondary">You</span>
              <button type="button" className={chip(setup.you === 'power')} aria-pressed={setup.you === 'power'} onClick={() => change({ you: 'power' })}>Power</button>
              <button type="button" className={chip(setup.you === 'sail')} aria-pressed={setup.you === 'sail'} onClick={() => change({ you: 'sail' })}>Sail</button>
            </div>
            <div className="flex items-center gap-1.5" role="group" aria-label="The other vessel is">
              <span className="w-14 text-xs font-semibold uppercase tracking-wide text-text-secondary">Other</span>
              <button type="button" className={chip(setup.her === 'power')} aria-pressed={setup.her === 'power'} onClick={() => change({ her: 'power' })}>Power</button>
              <button type="button" className={chip(setup.her === 'sail')} aria-pressed={setup.her === 'sail'} onClick={() => change({ her: 'sail' })}>Sail</button>
            </div>
          </div>
          <div role="group" aria-label="Where the other vessel is">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">She is…</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {ASPECTS.map((a) => (
                <button key={a.id} type="button" className={chip(setup.aspect === a.id)} aria-pressed={setup.aspect === a.id} onClick={() => change({ aspect: a.id })}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          {(runs.you || runs.her) && (
            <div className="space-y-1.5">
              {(['you', 'her'] as const).filter((w) => runs[w]).map((w) => {
                const key = w === 'you' ? 'yourMain' : 'herMain'
                return (
                  <div key={w} className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`${w === 'you' ? 'Your' : 'Her'} mainsail, running dead before the wind`}>
                    <span className="text-xs font-semibold text-text-secondary">{w === 'you' ? 'You are' : 'She is'} running dead downwind — mainsail on the</span>
                    {(['port', 'starboard'] as Side[]).map((side) => (
                      <button key={side} type="button" className={chip(setup[key] === side)} aria-pressed={setup[key] === side} onClick={() => change({ [key]: side } as Partial<SimSetup>)}>
                        {side === 'port' ? 'Port side' : 'Starboard side'}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
          <button type="button" onClick={randomise} className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-teal-light">
            <Dices size={16} strokeWidth={1.5} className="mr-1.5 inline-block align-[-3px]" aria-hidden="true" />Random encounter
          </button>
        </div>
        {sail && (
          <div role="group" aria-label="Wind direction">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Wind from</p>
            <div className="mt-1 grid w-[9.5rem] grid-cols-3 gap-1">
              {[315, 0, 45, 270, -1, 90, 225, 180, 135].map((w) =>
                w < 0 ? (
                  <span key="c" className="flex items-center justify-center text-lg text-text-secondary" aria-hidden="true">✛</span>
                ) : (
                  <button
                    key={w}
                    type="button"
                    disabled={!!windProblem(setup, w)}
                    title={windProblem(setup, w) ?? `Wind from the ${WIND_NAMES[w]}`}
                    aria-label={`Wind from ${WIND_NAMES[w]}${windProblem(setup, w) ? ` (not possible: ${windProblem(setup, w)})` : ''}`}
                    aria-pressed={setup.windFrom === w}
                    onClick={() => change({ windFrom: w })}
                    className={`h-9 rounded-lg border text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${setup.windFrom === w ? 'border-teal bg-teal text-white' : 'border-border bg-white text-text-primary hover:bg-teal-light'}`}
                  >
                    {WIND_NAMES[w]}
                  </button>
                ),
              )}
            </div>
            <p className="mt-1 max-w-[9.5rem] text-[11px] leading-snug text-text-secondary">Greyed out: a yacht can’t sail that close to the wind.</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start">
        <svg viewBox={`0 0 ${SIM_SIZE} ${SIM_SIZE}`} className="mx-auto block w-full max-w-[460px] rounded-xl border border-border" role="img" aria-label={label}>
          <rect width={SIM_SIZE} height={SIM_SIZE} fill={SEA} />
          {e.windFrom !== undefined && <WindStreaks x={0} y={0} w={SIM_SIZE} h={SIM_SIZE} windFrom={e.windFrom} spacing={92} len={40} />}
          {/* Courses if nobody acts */}
          {!answered && (
            <>
              <line x1={sx(e.a.x)} y1={sy(e.a.y)} x2={sx(meet.x)} y2={sy(meet.y)} stroke={TEAL_INK} strokeWidth={2.5} strokeDasharray="8 7" />
              <line x1={sx(e.b.x)} y1={sy(e.b.y)} x2={sx(meet.x)} y2={sy(meet.y)} stroke="#c2410c" strokeWidth={2.5} strokeDasharray="8 7" />
              <circle cx={sx(meet.x)} cy={sy(meet.y)} r={9} fill="none" stroke="#c2410c" strokeWidth={2.5} />
            </>
          )}
          {/* Tracks so far */}
          {answered && tracks && idx > 0 && (
            <>
              <polyline points={tracks.a.slice(0, idx + 1).map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')} fill="none" stroke={TEAL_INK} strokeWidth={3} strokeOpacity={0.7} />
              <polyline points={tracks.b.slice(0, idx + 1).map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')} fill="none" stroke="#c2410c" strokeWidth={3} strokeOpacity={0.7} />
            </>
          )}
          <VesselIcon v={e.a} x={sx(pa.x)} y={sy(pa.y)} heading={pa.heading} scale={scale} windFrom={e.windFrom} main={mains?.a?.[idx]} />
          <VesselIcon v={e.b} x={sx(pb.x)} y={sy(pb.y)} heading={pb.heading} scale={scale} windFrom={e.windFrom} main={mains?.b?.[idx]} />
          {!answered && vesselLabel('a', pa)}
          {!answered && vesselLabel('b', pb)}
          {answered && (
            <g fontSize={18} fontWeight={700} stroke={SEA} strokeWidth={5} paintOrder="stroke">
              <line x1={18} y1={SIM_SIZE - 50} x2={48} y2={SIM_SIZE - 50} stroke={TEAL_INK} strokeWidth={4} />
              <text x={56} y={SIM_SIZE - 44} fill={TEAL_INK}>You</text>
              <line x1={18} y1={SIM_SIZE - 22} x2={48} y2={SIM_SIZE - 22} stroke="#c2410c" strokeWidth={4} />
              <text x={56} y={SIM_SIZE - 16} fill="#9a3412">Other vessel</text>
            </g>
          )}
          {e.windFrom !== undefined && <WindBadge x={SIM_SIZE - 44} y={42} windFrom={e.windFrom} r={27} />}
          {!answered && (
            <text x={16} y={SIM_SIZE - 16} fontSize={17} fontWeight={700} fill="#9a3412" stroke={SEA} strokeWidth={4} paintOrder="stroke">Steady bearing, range closing</text>
          )}
        </svg>

        <div className="flex flex-col gap-3">
          <div>
            <p className="font-semibold text-text-primary">What should you do?</p>
            <div className="mt-2 grid gap-1.5">
              {OPTIONS.map((o) => {
                const picked = choice === o.id
                const right = answered && o.id === correct
                const wrong = picked && o.id !== correct
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => answer(o.id)}
                    disabled={answered && !picked && !right}
                    aria-pressed={picked}
                    className={[
                      'rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors',
                      right ? 'border-success bg-success/10 text-text-primary' : wrong ? 'border-danger bg-danger/10 text-text-primary' : 'border-border bg-white text-text-primary hover:bg-teal-light disabled:opacity-60 disabled:hover:bg-white',
                    ].join(' ')}
                  >
                    {right && '✓ '}{wrong && '✗ '}{o.text}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="min-h-[6rem] rounded-xl bg-bg px-4 py-3 text-sm leading-relaxed" aria-live="polite">
            {!answered && <p className="text-text-secondary">Choose an answer and the manoeuvre plays out on the plan.</p>}
            {answered && ruling && (
              <>
                <p className={`font-semibold ${choice === correct ? 'text-success-text' : 'text-danger'}`}>
                  {choice === correct ? 'Yes.' : choice === 'port' ? 'No — don’t turn to port to cross ahead of her.' : 'Not quite.'}
                </p>
                <p className="mt-1 text-text-primary">{explain(e, ruling, 'you')}</p>
                <p className="mt-1 text-text-secondary">{whatHappens}</p>
                {giveWayWho === 'b' && <p className="mt-1 text-text-secondary">As the stand-on vessel you keep watching: if she does nothing, you may act — and must, if it comes to it (Rule 17).</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={replay} className="rounded-lg bg-teal px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal/90">{playing ? 'Playing…' : '↺ Replay'}</button>
                  <button type="button" onClick={randomise} className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium hover:bg-teal-light">Try another</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Bearing watch: is she on a collision course?                        */
/* ------------------------------------------------------------------ */

const TRENDS: Trend[] = ['steady', 'astern', 'ahead', 'steady', 'ahead', 'astern']
const WATCH_W = 520
const WATCH_H = 400

function watchFor(n: number): Watch {
  return makeWatch(mulberry32(n * 104729 + 17), TRENDS[n % TRENDS.length]!)
}

const DECISIONS: { id: Trend; text: string }[] = [
  { id: 'steady', text: 'Steady bearing: risk of collision' },
  { id: 'ahead', text: 'Drawing ahead: she should pass ahead of me' },
  { id: 'astern', text: 'Drawing aft: she should pass astern of me' },
]

export function BearingWatch() {
  const [n, setN] = useState(0)
  const [taken, setTaken] = useState(1)
  const [decision, setDecision] = useState<Trend | null>(null)
  const [reveal, setReveal] = useState(0)
  const [revealing, setRevealing] = useState(false)

  const w = useMemo(() => watchFor(n), [n])
  const c = useMemo(() => closest(w), [w])
  const end = Math.max((taken - 1) * INTERVAL, c.minutes + 5)
  const lastSight = (taken - 1) * INTERVAL
  const now = decision ? lastSight + (end - lastSight) * reveal : lastSight

  useProgress(revealing, 4500, setReveal, () => setRevealing(false))

  // Fit the whole story (first sighting to just past the closest approach) in the view.
  const view = useMemo(() => {
    const tEnd = Math.max(c.minutes + 5, (MAX_SIGHTINGS - 1) * INTERVAL)
    const a = positionsAt(w, 0)
    const b = positionsAt(w, tEnd)
    const xs = [a.own.x, a.ship.x, b.own.x, b.ship.x]
    const ys = [a.own.y, a.ship.y, b.own.y, b.ship.y]
    const pad = 0.9
    const minX = Math.min(...xs) - pad
    const maxX = Math.max(...xs) + pad
    const minY = Math.min(...ys) - pad
    const maxY = Math.max(...ys) + pad
    const k = Math.min(WATCH_W / (maxX - minX), WATCH_H / (maxY - minY))
    return { k, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 }
  }, [w, c])
  const sx = (x: number) => r2(WATCH_W / 2 + (x - view.cx) * view.k)
  const sy = (y: number) => r2(WATCH_H / 2 - (y - view.cy) * view.k)

  const readings = Array.from({ length: taken }, (_, i) => reading(w, i))
  const p = positionsAt(w, now)
  const ownTrack = Array.from({ length: 21 }, (_, i) => positionsAt(w, (now * i) / 20).own)
  const shipTrack = Array.from({ length: 21 }, (_, i) => positionsAt(w, (now * i) / 20).ship)
  const shipHeading = w.ship.heading

  function next() {
    setN((x) => x + 1)
    setTaken(1)
    setDecision(null)
    setReveal(0)
    setRevealing(false)
  }

  function choose(id: Trend) {
    if (decision) return
    setDecision(id)
    if (prefersReducedMotion()) setReveal(1)
    else {
      setReveal(0)
      setRevealing(true)
    }
  }

  const change = ((readings[readings.length - 1]! - readings[0]! + 540) % 360) - 180
  const r0 = rangeAt(w, 0)
  const rNow = rangeAt(w, lastSight)
  const sideWord = w.side === 'starboard' ? 'starboard' : 'port'
  const result = (() => {
    const at = clock(w.start + c.minutes)
    if (w.trend === 'steady') return `Collision course. Her bearing stayed at about ${pad3(readings[0]!)}°M while the range closed from ${r0.toFixed(1)} M to ${rNow.toFixed(1)} M. If nobody acted, she would hit you at about ${at}. Risk of collision exists — now the steering rules decide who keeps out of the way.`
    const moved = w.trend === 'ahead' ? 'forward, towards your bow' : 'aft, towards your stern'
    return `Her bearing drew ${moved}, so she ${w.trend === 'ahead' ? 'crosses ahead of you' : 'passes astern of you'}: closest approach ${c.distance.toFixed(1)} M at ${at}. Keep watching her until she is past and clear — at close range, or with a big ship, a changing bearing alone is no guarantee.`
  })()

  const label = `Plan view, north up. You are heading ${pad3(w.heading)}° at ${w.speed} knots; a ship ${rNow.toFixed(1)} miles away on your ${sideWord} bow. ${readings.length} bearing${readings.length > 1 ? 's' : ''} taken: ${readings.map((b) => pad3(b)).join(', ')} degrees magnetic.`

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-start">
      <svg viewBox={`0 0 ${WATCH_W} ${WATCH_H}`} className="block w-full rounded-xl border border-border" role="img" aria-label={label}>
        <rect width={WATCH_W} height={WATCH_H} fill={SEA} />
        {/* North arrow */}
        <g transform="translate(28 40)">
          <line x1={0} y1={14} x2={0} y2={-14} stroke={INK} strokeWidth={2} />
          <polygon points="0,-20 -6,-8 6,-8" fill={INK} />
          <text x={0} y={32} textAnchor="middle" fontSize={14} fontWeight={700} fill={INK}>N</text>
        </g>
        {/* Bearing lines at each sighting */}
        {readings.map((_, i) => {
          const q = positionsAt(w, i * INTERVAL)
          return (
            <g key={i}>
              <line x1={sx(q.own.x)} y1={sy(q.own.y)} x2={sx(q.ship.x)} y2={sy(q.ship.y)} stroke="#d97706" strokeWidth={2} strokeOpacity={0.85} />
              <circle cx={sx(q.ship.x)} cy={sy(q.ship.y)} r={3.5} fill="#c2410c" />
              <circle cx={sx(q.own.x)} cy={sy(q.own.y)} r={3.5} fill={TEAL_INK} />
            </g>
          )
        })}
        {now > 0 && (
          <>
            <polyline points={ownTrack.map((o) => `${sx(o.x)},${sy(o.y)}`).join(' ')} fill="none" stroke={TEAL_INK} strokeWidth={2} strokeDasharray="6 5" />
            <polyline points={shipTrack.map((o) => `${sx(o.x)},${sy(o.y)}`).join(' ')} fill="none" stroke="#c2410c" strokeWidth={2} strokeDasharray="6 5" />
          </>
        )}
        <MotorBoat x={sx(p.ship.x)} y={sy(p.ship.y)} heading={shipHeading} scale={0.55} />
        <Yacht x={sx(p.own.x)} y={sy(p.own.y)} heading={w.heading} scale={0.42} />
        <text x={WATCH_W - 14} y={WATCH_H - 14} textAnchor="end" fontSize={15} fontWeight={700} fill={MUTED}>{clock(w.start + now)}</text>
      </svg>

      <div className="flex flex-col gap-3">
        <p className="text-sm text-text-secondary">
          You are steering <strong className="text-text-primary">{pad3(w.heading)}°M</strong> at {w.speed} knots. A ship is sighted on your {sideWord} bow. Take a bearing every three minutes with the hand-bearing compass.
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-text-secondary">
              <th className="py-1 font-semibold">Time</th>
              <th className="py-1 font-semibold">Bearing</th>
              <th className="py-1 font-semibold">Change</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {readings.map((b, i) => {
              const d = i === 0 ? null : ((b - readings[i - 1]! + 540) % 360) - 180
              return (
                <tr key={i} className="border-t border-border">
                  <td className="py-1">{clock(w.start + i * INTERVAL)}</td>
                  <td className="py-1 font-bold text-teal">{pad3(b)}°M</td>
                  <td className="py-1 text-text-secondary">{d === null ? '—' : d === 0 ? '0' : `${d > 0 ? '+' : '−'}${Math.abs(d)}°`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!decision && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTaken((t) => Math.min(MAX_SIGHTINGS, t + 1))}
              disabled={taken >= MAX_SIGHTINGS}
              className="rounded-lg bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-40"
            >
              {taken >= MAX_SIGHTINGS ? 'That’s enough bearings' : `Take a bearing at ${clock(w.start + taken * INTERVAL)}`}
            </button>
            {taken < 3 && <span className="text-xs text-text-secondary">Take at least three before you decide.</span>}
          </div>
        )}
        {taken >= 3 && (
          <div>
            <p className="text-sm font-semibold text-text-primary">What do the bearings tell you?</p>
            <div className="mt-1.5 grid gap-1.5">
              {DECISIONS.map((d) => {
                const picked = decision === d.id
                const right = !!decision && d.id === w.trend
                const wrong = picked && d.id !== w.trend
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => choose(d.id)}
                    disabled={!!decision && !picked && !right}
                    aria-pressed={picked}
                    className={[
                      'rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors',
                      right ? 'border-success bg-success/10' : wrong ? 'border-danger bg-danger/10' : 'border-border bg-white hover:bg-teal-light disabled:opacity-60 disabled:hover:bg-white',
                    ].join(' ')}
                  >
                    {right && '✓ '}{wrong && '✗ '}{d.text}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <div aria-live="polite" className="text-sm leading-relaxed">
          {decision && (
            <div className="rounded-xl bg-bg px-4 py-3">
              <p className={`font-semibold ${decision === w.trend ? 'text-success-text' : 'text-danger'}`}>
                {decision === w.trend ? 'Yes.' : 'Not this time.'} The bearing changed by {Math.abs(change)}° over {(readings.length - 1) * INTERVAL} minutes{w.trend === 'steady' ? ' — no more than the scatter of the readings.' : '.'}
              </p>
              <p className="mt-1 text-text-primary">{result}</p>
              <button type="button" onClick={next} className="mt-2 rounded-lg bg-teal px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal/90">Next ship</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
