'use client'

// Interactive widgets for Lesson 6, ported from the Boaty Jobs
// cardinal-marks and other-marks lessons: a light flashing at night (any
// pattern, including the emergency wreck buoy's alternating light), a
// cardinal-mark trainer, a quadrant explorer on the practice chart, a
// clock-face diagram of the four lights, a "what is it and what do I do?"
// trainer for every mark in the lesson, and a tour of the practice chart's
// isolated danger, safe water and special marks.

import { type LucideIcon, Moon, Sun } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { formatBearing, formatPosition, rhumbBearing, rhumbDestination, rhumbDistance, type LatLon } from '@/lib/courses/geo'
import { lightOn } from '@/lib/courses/navigation/lights'
import { isLand, km, type ChartFeature } from '@/lib/courses/navigation/practice-chart'
import { viewAround } from '@/lib/courses/navigation/chart-geometry'
import { mulberry32, pick, shuffle } from '@/lib/courses/random'
import LightSim from '../../LightSim'
import { LightGlow, MARK_INFO, RhythmBar, type MarkType } from '../../marks'
import PracticeChart, { ChartLine } from '../../PracticeChart'
import { BoatGlyph, ChartDanger, ChartQuadrants, ChartSafeSide, MarkIcon, MarkPicture, PatternBar } from './art'
import {
  ACTION_TEXT, APPROACH, APPROACH_FROM_HARBOUR, APPROACH_PATTERN, CARD, CARDINALS, CHART_CARDINALS, CONFUSE, LESSON_TYPES, LIGHTS, MARK_ACTION, MARK_LIGHTS, MEW,
  MEW_FROM_HARBOUR, MEW_PATTERN, OUTFALL, OUTFALL_FROM_GULL, OUTFALL_PATTERN, actionChoices, beyond, capital, colourAt, depthHere, inDanger, lightText, lightWords,
  miles, opposite, pattern, quadrantOf, quadrantText, shapeText,
  type ActionKey, type Cardinal, type ChartCardinal, type LightPattern, type OtherMark,
} from './data'

const btn = 'min-h-10 rounded-control border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 disabled:cursor-not-allowed disabled:opacity-40'
const btnPlain = `${btn} border-border bg-white text-text-primary hover:bg-teal-light`
const btnTeal = `${btn} border-teal bg-teal text-white hover:bg-teal/90`
const btnChosen = `${btn} border-navy bg-navy text-white`

/** Seconds since mount (or the last restart), advancing while `playing`. */
function useClock(playing: boolean): [number, () => void] {
  const [seconds, setSeconds] = useState(0)
  const last = useRef(0)
  useEffect(() => {
    if (!playing) return
    let raf = 0
    last.current = performance.now()
    const tick = (now: number) => {
      setSeconds((s) => s + (now - last.current) / 1000)
      last.current = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])
  return [seconds, () => setSeconds(0)]
}

/* ------------------------------------------------------------------ */
/* A light at night                                                    */
/* ------------------------------------------------------------------ */

const STARS = Array.from({ length: 22 }, (_, i) => ({ x: (i * 97 + 31) % 600, y: (i * 53) % 120 }))

/**
 * A light flashing in its real rhythm at night, with a stopwatch. The
 * characteristic and rhythm bar show only when `reveal` is set, so learners
 * have to count the flashes. (Timings are representative: see lights.ts.)
 */
export function NightLight({ light, reveal = false, title, caption }: { light: LightPattern; reveal?: boolean; title?: string; caption?: string }) {
  const [playing, setPlaying] = useState(true)
  const [seconds, restart] = useClock(playing)
  const colour = colourAt(light, seconds)
  return (
    <figure className="overflow-hidden rounded-card bg-[#0b1626] text-white">
      <svg viewBox="0 0 600 230" className="block h-auto w-full" role="img" aria-label={title ?? `A light at night: ${light.describe}`}>
        <rect width={600} height={230} fill="#0b1626" />
        {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={1} fill="#94a3b8" opacity={0.5} />)}
        <rect y={150} width={600} height={80} fill="#0e2237" />
        <path d="M0 150 L0 144 Q 80 136 170 141 T 330 140 L 330 150 Z" fill="#0a1626" />
        {colour && <rect x={296} y={156} width={8} height={56} fill="#fff7d6" opacity={0.22} />}
        <LightGlow x={300} y={116} on={colour !== null} colour={colour ?? 'W'} r={13} />
        {reveal && <PatternBar pattern={light} x={60} y={190} width={480} height={20} at={seconds % light.period} />}
        {reveal && <text x={20} y={34} fontSize={24} fontWeight={700} fill="#fff" fontFamily="ui-monospace, monospace">{light.text}</text>}
      </svg>
      <figcaption className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
        <button type="button" onClick={() => setPlaying((p) => !p)} className="min-h-10 rounded-md bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25" aria-pressed={playing}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={restart} className="min-h-10 rounded-md bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25">Restart</button>
        {caption && <span className="text-xs text-white/80">{caption}</span>}
        <span className="ml-auto font-mono text-xs text-white/70" aria-hidden="true">Stopwatch {seconds.toFixed(1)} s</span>
      </figcaption>
    </figure>
  )
}

/* ------------------------------------------------------------------ */
/* 1. Cardinal trainer                                                 */
/* ------------------------------------------------------------------ */

type Mode = 'day' | 'night' | 'mixed'
interface Item { type: Cardinal; night: boolean; vq: boolean; n: number }

const SIDE_LABEL: Record<Cardinal, string> = { north: 'Pass north of it', east: 'Pass east of it', south: 'Pass south of it', west: 'Pass west of it' }

function explain(item: Item): string {
  const c = CARD[item.type]
  const side = `Safe water lies to its ${item.type}, so pass ${item.type} of it.`
  if (!item.night) return `${c.topmark}, painted ${c.colours.toLowerCase()}: ${c.aName} mark. The cones point to the black: ${c.black}. ${side}`
  const ch = item.vq ? c.veryQuick : c.quick
  const count = c.flashes ? `${c.flashes} flashes, like ${c.clock} on a clock face${item.type === 'south' ? ', plus the long flash that only the south cardinal has' : ''}` : 'no groups at all, so north, at 12 o’clock'
  return `${capital(lightWords(ch))} (${ch}): ${count}. It is ${c.aName} mark. ${side}`
}

export function CardinalTrainer() {
  const [mode, setMode] = useState<Mode>('day')
  const [item, setItem] = useState<Item>({ type: 'east', night: false, vq: false, n: 0 })
  const [name, setName] = useState<Cardinal | null>(null)
  const [side, setSide] = useState<Cardinal | null>(null)
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState({ right: 0, asked: 0 })
  const uid = useId()

  function next(m: Mode = mode) {
    // Event handler only: a fresh random mark.
    const others = CARDINALS.filter((c) => c !== item.type)
    const type = others[Math.floor(Math.random() * others.length)]!
    const night = m === 'night' || (m === 'mixed' && Math.random() < 0.5)
    setItem({ type, night, vq: Math.random() < 0.5, n: item.n + 1 })
    setName(null)
    setSide(null)
    setChecked(false)
  }

  function check() {
    if (!name || !side) return
    setChecked(true)
    setScore((s) => ({ right: s.right + (name === item.type && side === item.type ? 1 : 0), asked: s.asked + 1 }))
  }

  const nameRight = name === item.type
  const sideRight = side === item.type
  const characteristic = item.vq ? CARD[item.type].veryQuick : CARD[item.type].quick

  const done = 'min-h-10 rounded-control border px-3 py-2 text-sm font-semibold cursor-default'
  const choiceClass = (value: Cardinal, chosen: Cardinal | null) => {
    if (!checked) return chosen === value ? btnChosen : btnPlain
    if (value === item.type) return `${done} border-success bg-success/15 text-text-primary`
    if (chosen === value) return `${done} border-danger bg-danger/10 text-text-primary line-through`
    return `${done} border-border bg-white text-text-secondary`
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Day or night">
          {(['day', 'night', 'mixed'] as Mode[]).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? btnChosen : btnPlain} onClick={() => { setMode(m); next(m) }}>
              {m === 'day' && <Sun size={16} strokeWidth={1.5} className="mr-1.5 inline-block align-[-3px]" aria-hidden="true" />}
              {m === 'night' && <Moon size={16} strokeWidth={1.5} className="mr-1.5 inline-block align-[-3px]" aria-hidden="true" />}
              {m === 'day' ? 'By day' : m === 'night' ? 'By night' : 'Mixed'}
            </button>
          ))}
        </div>
        {item.night ? (
          <NightLight key={`${item.n}-${characteristic}`} light={pattern(characteristic)} reveal={checked} title={`A light at night: ${lightWords(characteristic)}`} />
        ) : (
          <MarkPicture key={item.n} type={item.type} title={`A buoy: ${CARD[item.type].colours.toLowerCase()}, with a topmark of ${CARD[item.type].topmark.toLowerCase()}.`} />
        )}
        <p className="mt-1 text-xs text-text-secondary">
          {item.night ? 'Count the flashes in a group. Restart begins a fresh group; the stopwatch helps you time the period.' : 'Look at the topmark first, then the colours.'}
        </p>
      </div>

      <div className="min-w-0 space-y-3">
        <div role="group" aria-labelledby={`${uid}-q1`}>
          <p id={`${uid}-q1`} className="text-sm font-semibold text-text-primary">1. What is it?</p>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            {CARDINALS.map((c) => (
              <button key={c} type="button" disabled={checked} aria-pressed={name === c} className={choiceClass(c, name)} onClick={() => setName(c)}>{CARD[c].short}</button>
            ))}
          </div>
        </div>
        <div role="group" aria-labelledby={`${uid}-q2`}>
          <p id={`${uid}-q2`} className="text-sm font-semibold text-text-primary">2. Which side do you pass it?</p>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            {CARDINALS.map((c) => (
              <button key={c} type="button" disabled={checked} aria-pressed={side === c} className={choiceClass(c, side)} onClick={() => setSide(c)}>{SIDE_LABEL[c]}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!checked ? (
            <button type="button" className={btnTeal} disabled={!name || !side} onClick={check}>Check</button>
          ) : (
            <button type="button" className={btnTeal} onClick={() => next()}>Next mark</button>
          )}
          <span className="text-sm text-text-secondary" aria-live="polite">Score: {score.right} of {score.asked}</span>
        </div>
        {checked && (
          <div className={`rounded-lg border p-3 ${nameRight && sideRight ? 'border-success/50 bg-success/10' : 'border-warning/60 bg-warning/10'}`} role="status">
            <p className="font-semibold text-text-primary">
              {nameRight && sideRight ? '✓ Both right.' : nameRight ? '✓ Right mark, ✗ wrong side.' : sideRight ? '✗ Wrong name, ✓ right side.' : '✗ Not this time.'}
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{explain(item)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Quadrant explorer on the practice chart                          */
/* ------------------------------------------------------------------ */

const PLACE = 0.5
const EXPLORER_WIDTH = 4.6

type Tone = 'safe' | 'warn' | 'danger'

function verdict(c: ChartCardinal, p: LatLon): { tone: Tone; head: string; body: string } {
  if (isLand(p)) return { tone: 'danger', head: '✗ That is on the island.', body: 'Tap the sea, or use the buttons to place the yacht.' }
  const dist = rhumbDistance(c.danger, p)
  const brg = rhumbBearing(c.danger, p)
  const q = quadrantOf(brg)
  const where = `The yacht is ${miles(dist)} miles from ${c.dangerName}, bearing ${formatBearing(brg, 'T')} from ${c.kind === 'bank' ? 'its shallowest point' : 'them'}: in the ${q} quadrant.`
  const depth = c.kind === 'bank' ? depthHere(p) : null
  const depthText = depth !== null ? ` Charted depth here: ${depth < 21 ? depth.toFixed(1) : Math.round(depth)} m.` : ''
  if (inDanger(c, p)) return { tone: 'danger', head: `✗ You are on ${c.dangerName}!`, body: `${where}${depthText} ${c.name} told you to keep to its ${c.type}.` }
  const b = beyond(p, c.mark.at, c.type)
  if (b > 0.05) return { tone: 'safe', head: `✓ ${capital(c.type)} of ${c.name}: the side it tells you to pass.`, body: `${where}${depthText} As far as this mark is concerned you are in safe water. Keep an eye on the chart for anything else.` }
  if (b >= -0.05) return { tone: 'warn', head: `Level with ${c.name}, but not yet ${c.type} of it.`, body: `${where}${depthText} Keep going ${c.type} until the buoy is clearly ${opposite(c.type)} of you.` }
  return {
    tone: 'danger',
    head: `✗ ${capital(opposite(c.type))} of ${c.name}: the wrong side.`,
    body: `${where}${depthText} ${capital(CARD[c.type].aName)} only promises safe water to its ${c.type}. On this side you are towards ${c.dangerName}${c.kind === 'bank' ? ', and the water shoals as you go' : ', which may spread further than the chart symbol suggests'}.`,
  }
}

function viewFor(c: ChartCardinal) {
  const mid = { lat: (c.danger.lat + c.mark.at.lat) / 2, lon: (c.danger.lon + c.mark.at.lon) / 2 }
  return viewAround(mid, EXPLORER_WIDTH, 4 / 3)
}

export function QuadrantExplorer() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [ci, setCi] = useState(0)
  const c = CHART_CARDINALS[ci]!
  const first = CHART_CARDINALS[0]!
  const [yacht, setYacht] = useState<LatLon>(() => rhumbDestination(first.mark.at, CARD[first.type].dir, PLACE))
  const view = viewFor(c)
  const size = Math.round(view.w * 0.04 * 100) / 100
  const v = verdict(c, yacht)

  function choose(i: number) {
    setCi(i)
    const n = CHART_CARDINALS[i]!
    setYacht(rhumbDestination(n.mark.at, CARD[n.type].dir, PLACE))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Choose a cardinal mark">
        {CHART_CARDINALS.map((m, i) => (
          <button key={m.id} type="button" role="radio" aria-checked={i === ci} onClick={() => choose(i)} className={i === ci ? btnChosen : btnPlain}>
            {m.name.replace(/ buoy$/, '')} <span className="font-normal opacity-80">({CARD[m.type].letter})</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-text-primary">
        <strong>{c.name}</strong> ({c.mark.light}) is {CARD[c.type].aName} mark guarding {c.dangerName}, {c.what}. It stands {miles(c.distance)} miles from{' '}
        {c.kind === 'bank' ? 'the bank’s shallowest point' : 'them'}, bearing {formatBearing(c.bearing, 'T')}: inside the {c.type} quadrant, {quadrantText(c.type)}.
      </p>
      <div className="mt-2">
        <PracticeChart key={c.id} view={view} zoomable mode="pick" marker={null} onPick={setYacht} highlight={[c.id]}
          title={`Practice chart: ${c.name} and ${c.dangerName}, with the quadrants and the safe side shaded`}>
          <ChartSafeSide id={`${uid}${c.id}`} mark={c.mark.at} side={c.type} view={view} />
          <ChartQuadrants danger={c.danger} radiusNm={EXPLORER_WIDTH * 0.75} view={view} size={size} />
          <ChartDanger id={`${uid}${c.id}`} c={c} />
          <ChartLine from={c.danger} to={yacht} colour="#475569" width={0.9} dash="2 2" />
          <BoatGlyph at={yacht} heading={(CARD[c.type].dir + 90) % 360} size={size * 1.1} />
        </PracticeChart>
        <p className="mt-1 text-xs text-text-secondary">Dashed lines: the quadrant boundaries, drawn out from the danger. Green: the side of the mark it tells you to pass. Hatched red: the danger.</p>
      </div>
      <div className="mt-3">
        <p className="text-sm font-semibold text-text-primary">Put the yacht half a mile from the buoy, or tap the chart:</p>
        <div className="mt-1 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {CARDINALS.map((s) => (
            <button key={s} type="button" className={btnPlain} onClick={() => setYacht(rhumbDestination(c.mark.at, CARD[s].dir, PLACE))}>{capital(s)} of the buoy</button>
          ))}
        </div>
      </div>
      <div className={`mt-3 rounded-lg border p-3 ${v.tone === 'safe' ? 'border-success/50 bg-success/10' : v.tone === 'warn' ? 'border-warning/60 bg-warning/10' : 'border-danger/40 bg-danger/5'}`} aria-live="polite">
        <p className="font-semibold text-text-primary">{v.head}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{v.body}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3. The clock face                                                   */
/* ------------------------------------------------------------------ */

const CLOCK_POS: Record<Cardinal, { x: number; y: number; hour: string; hx: number; hy: number; lx: number; ly: number }> = {
  north: { x: 300, y: 140, hour: '12', hx: 300, hy: 96, lx: 300, ly: 205 },
  east: { x: 460, y: 300, hour: '3', hx: 512, hy: 310, lx: 460, ly: 365 },
  south: { x: 300, y: 460, hour: '6', hx: 300, hy: 528, lx: 300, ly: 420 },
  west: { x: 140, y: 300, hour: '9', hx: 88, hy: 310, lx: 140, ly: 365 },
}

const TICKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6
  const r = (n: number) => Math.round(n * 100) / 100
  return { x1: r(300 + Math.sin(a) * 236), y1: r(300 - Math.cos(a) * 236), x2: r(300 + Math.sin(a) * 250), y2: r(300 - Math.cos(a) * 250) }
})

export function ClockFace() {
  const [vq, setVq] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [seconds, restart] = useClock(playing)
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center">
      <svg viewBox="0 0 600 600" className="mx-auto block h-auto w-full max-w-sm rounded-card bg-[#0b1626]" role="img"
        aria-label="A clock face: north at 12 flashes continuously, east at 3 flashes three, south at 6 flashes six and a long flash, west at 9 flashes nine.">
        <circle cx={300} cy={300} r={262} fill="#0e2237" stroke="#3d5a78" strokeWidth={6} />
        {TICKS.map((t, i) => <line key={i} {...t} stroke="#9fb3c8" strokeWidth={i % 3 === 0 ? 6 : 3} />)}
        <circle cx={300} cy={300} r={8} fill="#5d7a98" />
        {CARDINALS.map((c) => {
          const p = CLOCK_POS[c]
          const light = vq ? LIGHTS[c].veryQuick : LIGHTS[c].quick
          return (
            <g key={c}>
              <text x={p.hx} y={p.hy} textAnchor="middle" fontSize={34} fontWeight={700} fill="#9fb3c8">{p.hour}</text>
              <LightGlow x={p.x} y={p.y} on={lightOn(light, seconds)} r={15} />
              <text x={p.lx} y={p.ly} textAnchor="middle" fontSize={40} fontWeight={800} fill="#fff">{CARD[c].letter}</text>
            </g>
          )
        })}
      </svg>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <div role="radiogroup" aria-label="Quick or very quick" className="flex gap-1.5">
            {[false, true].map((v) => (
              <button key={String(v)} type="button" role="radio" aria-checked={vq === v} className={vq === v ? btnChosen : btnPlain} onClick={() => { setVq(v); restart() }}>
                {v ? 'Very quick (VQ)' : 'Quick (Q)'}
              </button>
            ))}
          </div>
          <button type="button" className={btnPlain} onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>{playing ? 'Pause' : 'Play'}</button>
          <button type="button" className={btnPlain} onClick={restart}>Restart</button>
        </div>
        <ul className="not-lesson mt-3 space-y-2">
          {CARDINALS.map((c) => {
            const light = vq ? LIGHTS[c].veryQuick : LIGHTS[c].quick
            return (
              <li key={c} className="rounded-lg border border-border bg-card px-3 py-2">
                <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="font-bold text-text-primary">{CARD[c].short}</span>
                  <span className="text-text-secondary">{CARD[c].clock}</span>
                  <span className="ml-auto font-mono font-semibold text-teal">{light.text}</span>
                </p>
                <svg viewBox="0 0 400 34" className="mt-1 block h-auto w-full" aria-hidden="true">
                  <RhythmBar light={light} x={2} y={6} width={396} height={22} at={seconds % light.period} />
                </svg>
                <p className="text-xs text-text-secondary">{capital(lightWords(light.text))}</p>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-xs text-text-secondary">Each bar is one full period, lit parts in white; the marker shows where each light is now. Flash lengths are representative.</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4. What is it, and what do I do?                                     */
/* ------------------------------------------------------------------ */

interface Round { type: OtherMark; night: boolean; pattern: LightPattern; names: OtherMark[]; actions: ActionKey[] }

const FIRST_SEED = 0

function roundFor(seed: number, mode: Mode): Round {
  const rng = mulberry32(seed)
  const type: OtherMark = seed === FIRST_SEED ? 'isolated-danger' : pick(rng, LESSON_TYPES)
  const coin = rng()
  const night = mode === 'night' || (mode === 'mixed' && seed !== FIRST_SEED && coin < 0.5)
  return { type, night, pattern: pick(rng, MARK_LIGHTS[type]), names: shuffle(rng, [type, ...CONFUSE[type]]), actions: actionChoices(rng, type) }
}

const MODES: Array<{ id: Mode; label: string; icon?: LucideIcon }> = [
  { id: 'day', label: 'By day', icon: Sun },
  { id: 'night', label: 'At night', icon: Moon },
  { id: 'mixed', label: 'Mixed' },
]

function choiceClass(state: 'idle' | 'right' | 'wrong' | 'dim'): string {
  const base = 'min-h-11 rounded-control border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300'
  if (state === 'right') return `${base} border-success bg-success/10 font-semibold text-text-primary`
  if (state === 'wrong') return `${base} border-danger bg-danger/10 text-text-primary`
  if (state === 'dim') return `${base} border-border bg-white text-text-secondary opacity-70`
  return `${base} border-border bg-white text-text-primary hover:border-teal/60 hover:bg-teal-light/50`
}

export function MarkTrainer() {
  const [mode, setMode] = useState<Mode>('mixed')
  const [seed, setSeed] = useState(FIRST_SEED)
  const round = useMemo(() => roundFor(seed, mode), [seed, mode])
  const [named, setNamed] = useState<OtherMark | null>(null)
  const [acted, setActed] = useState<ActionKey | null>(null)
  const [score, setScore] = useState({ marks: 0, named: 0, acted: 0 })
  const info = MARK_INFO[round.type]
  const rightAction = MARK_ACTION[round.type].key

  function next() {
    // Event handler only: a fresh random mark.
    setSeed(1 + Math.floor(Math.random() * 2 ** 31))
    setNamed(null)
    setActed(null)
  }
  function changeMode(m: Mode) {
    setMode(m)
    setNamed(null)
    setActed(null)
  }
  function chooseName(t: OtherMark) {
    if (named) return
    setNamed(t)
    if (t === round.type) setScore((s) => ({ ...s, named: s.named + 1 }))
  }
  function chooseAction(a: ActionKey) {
    if (acted) return
    setActed(a)
    setScore((s) => ({ ...s, marks: s.marks + 1, acted: s.acted + (a === rightAction ? 1 : 0) }))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="What you can see" className="inline-flex rounded-control border border-border bg-white p-0.5">
          {MODES.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} onClick={() => changeMode(m.id)}
              className={`min-h-10 rounded-md px-3 py-1.5 text-sm font-semibold ${mode === m.id ? 'bg-navy text-white' : 'text-text-primary hover:bg-teal-light'}`}>
              {m.icon && <m.icon size={16} strokeWidth={1.5} className="mr-1.5 inline-block align-[-3px]" aria-hidden="true" />}
              {m.label}
            </button>
          ))}
        </div>
        <p className="ml-auto text-sm text-text-secondary" aria-live="polite">
          {score.marks === 0 ? 'Every mark in this lesson' : `Named ${score.named} · right action ${score.acted} · of ${score.marks}`}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="min-w-0">
          {round.night ? (
            <NightLight key={`${seed}-${mode}`} light={round.pattern} reveal={acted !== null} caption="At night you see only the light." />
          ) : (
            <div className="rounded-card border border-border bg-white p-2">
              <MarkPicture type={round.type} className="mx-auto block h-auto w-full max-w-[18rem] rounded-lg" title="A mark seen by day. Identify it from its colour, shape and topmark." />
              <p className="mt-1 text-center text-xs text-text-secondary">By day: topmark first, then the colours.</p>
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-3">
          <fieldset>
            <legend className="text-sm font-bold text-text-primary">1. What is it?</legend>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
              {round.names.map((t) => {
                const state = !named ? 'idle' : t === round.type ? 'right' : t === named ? 'wrong' : 'dim'
                return <button key={t} type="button" onClick={() => chooseName(t)} disabled={named !== null} aria-pressed={named === t} className={choiceClass(state)}>{MARK_INFO[t].name}</button>
              })}
            </div>
            {named && (
              <p className={`mt-1.5 text-sm font-semibold ${named === round.type ? 'text-success-text' : 'text-danger'}`} role="status">
                {named === round.type ? `✓ Yes: ${info.name.toLowerCase()}.` : `✗ It is ${/^[AEIOU]/.test(info.name) ? 'an' : 'a'} ${info.name.toLowerCase()}.`}
              </p>
            )}
          </fieldset>

          {named && (
            <fieldset>
              <legend className="text-sm font-bold text-text-primary">2. What do you do?</legend>
              <div className="mt-1.5 grid gap-2">
                {round.actions.map((a) => {
                  const state = !acted ? 'idle' : a === rightAction ? 'right' : a === acted ? 'wrong' : 'dim'
                  return <button key={a} type="button" onClick={() => chooseAction(a)} disabled={acted !== null} aria-pressed={acted === a} className={choiceClass(state)}>{ACTION_TEXT[a]}</button>
                })}
              </div>
            </fieldset>
          )}

          {acted && (
            <div className={`rounded-lg border p-3 ${acted === rightAction ? 'border-success/50 bg-success/10' : 'border-warning/60 bg-warning/10'}`} role="status">
              <p className="font-semibold text-text-primary">{acted === rightAction ? '✓ ' : '✗ '}{info.name}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{MARK_ACTION[round.type].why}</p>
              <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-xs text-text-secondary">
                <dt className="font-semibold text-text-primary">Colours</dt><dd>{info.colours}</dd>
                <dt className="font-semibold text-text-primary">Shape</dt><dd>{shapeText(round.type)}</dd>
                <dt className="font-semibold text-text-primary">Topmark</dt><dd>{info.topmark}</dd>
                <dt className="font-semibold text-text-primary">Light</dt><dd>{lightText(round.type)}</dd>
                {round.night && <><dt className="font-semibold text-text-primary">You saw</dt><dd><span className="font-mono">{round.pattern.text}</span>: {round.pattern.describe}</dd></>}
              </dl>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={btnTeal} onClick={next}>Next mark</button>
            {score.marks > 0 && <button type="button" className={btnPlain} onClick={() => setScore({ marks: 0, named: 0, acted: 0 })}>Reset score</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 5. The three other marks on the practice chart                       */
/* ------------------------------------------------------------------ */

interface Stop { f: ChartFeature; type: MarkType; meaning: string; todo: string; facts: string[] }

const STOPS: Stop[] = [
  {
    f: MEW,
    type: 'isolated-danger',
    meaning: `An isolated danger mark: a beacon standing on Mew Rock, ${miles(MEW_FROM_HARBOUR.dist)} miles ${MEW_FROM_HARBOUR.dir} of Port Kerran. The rock is a small danger with navigable water all round it.`,
    todo: 'Pass on either side, but give it a wide berth: the beacon shows where the rock is, not how far it spreads underwater.',
    facts: [`Rock dries ${MEW.dries ?? 0} m: often covered`, `Two white flashes every ${MEW_PATTERN.period} s`],
  },
  {
    f: APPROACH,
    type: 'safe-water',
    meaning: `A safe water mark ${miles(APPROACH_FROM_HARBOUR.dist)} miles ${APPROACH_FROM_HARBOUR.dir} of Port Kerran, with navigable water all round it. It marks the seaward start of the harbour approach.`,
    todo: 'No danger at the buoy: pass either side. From here, head north for the channel entrance between No 1 and No 2 buoys.',
    facts: [`One long flash every ${APPROACH_PATTERN.period} s`, 'Red and white vertical stripes, red ball on top'],
  },
  {
    f: OUTFALL,
    type: 'special',
    meaning: `A special mark ${miles(OUTFALL_FROM_GULL.dist)} miles ${OUTFALL_FROM_GULL.dir} of Gull Point lighthouse, marking the end of an outfall pipe. In the Med the same yellow marks surround swimming areas and fish farms.`,
    todo: 'Give it room and do not anchor near it. Yellow means: look on the chart or in the pilot book to see what is there.',
    facts: ['Yellow, with a yellow X topmark', `A yellow flash every ${OUTFALL_PATTERN.period} s`],
  },
]

const OVERVIEW = viewAround(km(5.7, 10.85), 10.5, 4 / 3)

export function MarkChartTour() {
  const [i, setI] = useState<number | null>(0)
  const stop = i === null ? null : STOPS[i]!
  const view = stop ? viewAround(stop.f.at, 4.8, 4 / 3) : OVERVIEW
  const tab = (active: boolean) => `min-h-10 rounded-control border px-3 py-1.5 text-sm ${active ? 'border-teal bg-teal text-white' : 'border-border bg-white hover:bg-teal-light'}`
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Choose a mark">
        {STOPS.map((s, k) => <button key={s.f.id} type="button" role="radio" onClick={() => setI(k)} aria-checked={i === k} className={tab(i === k)}>{s.f.name}</button>)}
        <button type="button" role="radio" onClick={() => setI(null)} aria-checked={i === null} className={tab(i === null)}>All three</button>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          <div>
            <PracticeChart view={view} zoomable highlight={stop ? [stop.f.id] : STOPS.map((s) => s.f.id)}
              title={stop ? `Practice chart zoomed in on ${stop.f.name}` : 'Practice chart showing Mew Rock beacon, Kerran Approach buoy and the Outfall buoy'} />
            {stop && <p className="mt-1 font-mono text-xs text-text-secondary">{stop.f.name}: {formatPosition(stop.f.at)}</p>}
          </div>
          {stop && <LightSim key={stop.f.id} characteristic={stop.f.light ?? ''} label={`${stop.f.name} at night`} />}
        </div>

        <div className="min-w-0 space-y-3" aria-live="polite">
          {stop ? (
            <>
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-lg bg-teal-light/60 p-1"><MarkIcon type={stop.type} className="h-28 w-[4.5rem]" /></div>
                <div className="min-w-0">
                  <p className="font-semibold text-text-primary">{stop.f.name}</p>
                  <p className="text-sm text-text-secondary">{MARK_INFO[stop.type].name} · <span className="font-mono">{stop.f.light}</span></p>
                  <ul className="not-lesson mt-1 space-y-0.5 text-xs text-text-secondary">{stop.facts.map((x) => <li key={x}>• {x}</li>)}</ul>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-text-primary">{stop.meaning}</p>
              <p className="rounded-lg bg-bg px-3 py-2 text-sm leading-relaxed text-text-primary"><strong>What to do: </strong>{stop.todo}</p>
            </>
          ) : (
            <div className="rounded-lg bg-bg px-3 py-3 text-sm leading-relaxed text-text-secondary">
              <p className="font-semibold text-text-primary">Three marks, three messages</p>
              <ul className="not-lesson mt-1 space-y-1">
                {STOPS.map((s) => (
                  <li key={s.f.id} className="flex items-center gap-2">
                    <MarkIcon type={s.type} className="h-10 w-7 shrink-0" />
                    <span><strong className="text-text-primary">{s.f.name}</strong> ({s.f.light}): {s.type === 'isolated-danger' ? 'danger beneath it' : s.type === 'safe-water' ? 'safe water all round' : 'a special feature'}.</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2">Pick a mark to zoom in, see its light at night, and find out what to do.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
