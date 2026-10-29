'use client'

// Interactive widgets for Lesson 7, Lights at night (ported from the Boaty
// Jobs lessons on light characteristics, night and poor visibility, and
// navigation lights): a characteristic decoder, every rhythm side by side,
// a night trainer for the practice chart's lights, the view into Port Kerran
// among the town lights, your own yacht's lights, and an arrive-by-daylight
// planner.

import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { lightOn, type LightCharacteristic } from '@/lib/courses/navigation/lights'
import { viewAround } from '@/lib/courses/navigation/chart-geometry'
import { feature } from '@/lib/courses/navigation/practice-chart'
import { mulberry32, shuffle, type Rng } from '@/lib/courses/random'
import LightSim from '../../LightSim'
import { LightGlow, RhythmBar } from '../../marks'
import PracticeChart from '../../PracticeChart'
import { NightSkyStrip, PANO, PANO_LIGHTS, PanoBackdrop, PanoLights, PatternGlow, TimeStrip, type PanoLight } from './art'
import { NightView, PlanView } from './vessel-art'
import { describeSeen, vessel, whereYouAre } from './vessels'
import {
  CHART_LIGHTS, COLOUR_NAME, RHYTHMS, capital, chartLight, compositeOf, confusable, groupOf, isContinuous, kindOf, lightFraction, lightVsDark,
  matchesOnChart, piecesOf, readLight, rhythmText, sayLight, sec, type ChartLight,
} from './data'

const btn = 'rounded-lg border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/50 disabled:cursor-not-allowed disabled:opacity-40'
const btnPlain = `${btn} border-border bg-white text-text-primary hover:bg-teal-light`
const btnTeal = `${btn} border-teal bg-teal text-white hover:bg-teal/90`
const chip = 'rounded-full border px-2.5 py-1 font-mono text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/50'

/** A clock in seconds that runs while `playing` (requestAnimationFrame). */
function useClock(playing: boolean): number {
  const [now, setNow] = useState(0)
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000)
      last = t
      setNow((s) => s + dt)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])
  return now
}

/* ------------------------------------------------------------------ */
/* 1. Characteristic decoder                                           */
/* ------------------------------------------------------------------ */

const CHART_PRESETS: Array<{ label: string; text: string }> = [
  { label: 'Gull Point', text: chartLight('gull-point-lt').text },
  { label: 'Kerran Head', text: chartLight('kerran-head-lt').text },
  { label: 'Front leading light', text: feature('ldg-front').light! },
  { label: 'Kerran Approach', text: chartLight('kerran-approach').text },
  { label: 'Mew Rock', text: chartLight('mew-rock').text },
  { label: 'No 4 buoy', text: chartLight('no4').text },
  { label: 'North Teeth', text: chartLight('n-teeth').text },
  { label: 'East Teeth', text: chartLight('east-teeth').text },
  { label: 'South Brennan', text: chartLight('s-brennan').text },
  { label: 'Outfall', text: chartLight('outfall').text },
]

const OTHER_PRESETS = ['F R', 'VQ', 'VQ(9) 10s', 'Fl(2+1) R 10s', 'Oc(2) 8s', 'Mo(A) 6s', 'Fl(2) R 10s 9m 7M']

function PartRow({ written, part, children }: { written?: string; part: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-3 py-2 sm:grid-cols-[7rem_minmax(0,1fr)]">
      <span className={`rounded-md px-2 py-1 text-center font-mono text-sm font-bold ${written ? 'bg-navy text-white' : 'border border-dashed border-border text-text-secondary'}`}>
        {written ?? 'none'}
      </span>
      <span className="text-sm leading-relaxed">
        <strong className="text-text-primary">{part}.</strong> <span className="text-text-secondary">{children}</span>
      </span>
    </li>
  )
}

function Breakdown({ text, light }: { text: string; light: LightCharacteristic }) {
  const p = piecesOf(text)
  const share = Math.round(lightFraction(light) * 100)
  const vs = lightVsDark(light)
  const matches = matchesOnChart(light)
  return (
    <div>
      <ol className="divide-y divide-border">
        <PartRow written={p?.rhythm ?? light.rhythm} part="Rhythm">{capital(rhythmText(light))}.</PartRow>
        <PartRow written={p?.colour} part="Colour">
          {p?.colour ? `${p.colour} = ${COLOUR_NAME[light.colour]}.` : 'No letter, so the light is white (charts usually leave W out).'}
        </PartRow>
        <PartRow written={p?.period} part="Period">
          {isContinuous(light)
            ? kindOf(light) === 'F' ? 'None: a fixed light never goes out.' : 'None: the flashes carry on without a break.'
            : `One complete cycle takes ${sec(light.period)} seconds${compositeOf(light) ? ', from the start of the first group to the start of the next first group' : groupOf(light) || kindOf(light) === 'Mo' ? ', from the start of one group to the start of the next' : ''}.`}
        </PartRow>
        <PartRow written={p?.height} part="Elevation">
          {light.height !== undefined ? `The light is ${light.height} m above MHWS.` : 'Not given (usual for buoys, whose lights are low).'}
        </PartRow>
        <PartRow written={p?.range} part="Nominal range">
          {light.range !== undefined ? `${light.range} M: how far it can be seen on a clear night.` : 'Not given (usual for buoys).'}
        </PartRow>
      </ol>
      <p className="mt-2 rounded-lg bg-bg px-3 py-2 text-sm text-text-primary">
        {kindOf(light) === 'F'
          ? 'Light all the time: no darkness at all.'
          : <>Light for about <strong>{share}%</strong> of each period: <strong>{vs === 'less' ? 'less light than dark' : vs === 'equal' ? 'equal light and dark' : 'more light than dark'}</strong>.</>}
        {matches.length > 0 && <> On the practice chart: <strong>{matches.map((m) => m.name).join(', ')}</strong>.</>}
      </p>
    </div>
  )
}

export function CharacteristicDecoder() {
  const uid = useId()
  const [text, setText] = useState(CHART_PRESETS[0]!.text)
  const [shown, setShown] = useState(CHART_PRESETS[0]!.text)
  const result = readLight(text)
  const shownLight = readLight(shown).light!

  function change(v: string) {
    setText(v)
    if (readLight(v).light) setShown(v)
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-text-secondary">On the practice chart</p>
        <div className="flex flex-wrap gap-1.5">
          {CHART_PRESETS.map((pr) => (
            <button key={pr.label} type="button" onClick={() => change(pr.text)} aria-pressed={shown === pr.text}
              className={`${chip} ${shown === pr.text ? 'border-teal bg-teal text-white' : 'border-border bg-white hover:bg-teal-light'}`}>
              <span className="font-sans font-semibold">{pr.label}</span> {pr.text}
            </button>
          ))}
        </div>
        <p className="mb-1 mt-2 text-xs font-bold uppercase tracking-wide text-text-secondary">More examples</p>
        <div className="flex flex-wrap gap-1.5">
          {OTHER_PRESETS.map((t) => (
            <button key={t} type="button" onClick={() => change(t)} aria-pressed={shown === t}
              className={`${chip} ${shown === t ? 'border-teal bg-teal text-white' : 'border-border bg-white hover:bg-teal-light'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor={`${uid}-ch`} className="text-xs font-semibold text-text-secondary">Or type a characteristic, in chart order</label>
        <input
          id={`${uid}-ch`}
          value={text}
          onChange={(e) => change(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          aria-invalid={result.error ? true : undefined}
          aria-describedby={`${uid}-err`}
          className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-base text-text-primary focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
        <p id={`${uid}-err`} className={`mt-1 min-h-[1.25rem] text-sm ${result.error ? 'text-danger' : 'text-text-secondary'}`} aria-live="polite">
          {result.error ?? 'Capitals matter: Fl, LFl, Q, VQ, Iso, Oc, Mo — and M for miles, m for metres.'}
        </p>
      </div>

      <LightSim key={shown} characteristic={shown} />
      <Breakdown text={shown} light={shownLight} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Every rhythm side by side                                        */
/* ------------------------------------------------------------------ */

const STRIP_RHYTHMS = RHYTHMS.filter((r) => r.text !== 'VQ(3) 5s')

export function RhythmStrips() {
  const [playing, setPlaying] = useState(true)
  const now = useClock(playing)
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {STRIP_RHYTHMS.map((r) => (
          <figure key={r.text} className="rounded-lg bg-[#0b1626] px-2 pb-1.5 pt-2 text-white">
            <figcaption className="flex flex-wrap items-baseline justify-between gap-x-2">
              <span className="font-mono text-sm font-bold">{r.text}</span>
              <span className="text-xs font-semibold text-white/80">{r.name}</span>
            </figcaption>
            <svg viewBox="0 0 240 64" className="mt-1 block h-auto w-full" role="img" aria-label={`${r.name}, ${r.text}: ${r.note}`}>
              <PatternGlow pattern={r.pattern} now={now} x={30} y={30} r={9} />
              <TimeStrip pattern={r.pattern} now={now} x={64} y={18} width={168} height={24} />
            </svg>
            <p className="text-[11px] leading-snug text-white/70">{r.note}</p>
          </figure>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="button" className={btnPlain} onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <p className="min-w-0 flex-1 text-xs leading-snug text-text-secondary">
          Each strip shows the last 10 seconds, ticked every second; its right-hand end is now. Timings are representative:
          real lights vary, but the pattern and the period are what you look for.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Identify the light: a night trainer                              */
/* ------------------------------------------------------------------ */

interface Round {
  id: number
  target: number
  options: number[]
  /** Seconds into the light's cycle when the round starts. */
  offset: number
}

function makeRound(rng: Rng, id: number, avoid?: number): Round {
  const all = CHART_LIGHTS.map((_, i) => i)
  const pool = all.filter((i) => i !== avoid)
  const target = pool[Math.floor(rng() * pool.length)]!
  const t = CHART_LIGHTS[target]!.light
  // Never offer two lights that can't be told apart by colour, count and period.
  const fine = (i: number, chosen: number[]) =>
    i !== target && !confusable(CHART_LIGHTS[i]!.light, t) && chosen.every((j) => !confusable(CHART_LIGHTS[i]!.light, CHART_LIGHTS[j]!.light))
  // Up to two "near" distractors (same colour or same period), then any others.
  const isNear = (i: number) => CHART_LIGHTS[i]!.light.colour === t.colour || Math.abs(CHART_LIGHTS[i]!.light.period - t.period) < 0.5
  const near = shuffle(rng, all.filter((i) => i !== target && isNear(i)))
  const rest = shuffle(rng, all.filter((i) => i !== target && !isNear(i)))
  const picked: number[] = []
  for (const i of near) if (picked.length < 2 && fine(i, picked)) picked.push(i)
  for (const i of [...rest, ...near]) if (picked.length < 3 && !picked.includes(i) && fine(i, picked)) picked.push(i)
  return { id, target, options: shuffle(rng, [target, ...picked]), offset: Math.round(rng() * t.period * 10) / 10 }
}

const FIRST_ROUND = makeRound(mulberry32(19), 0)

/** Why `chosen` isn't the light that was showing. */
function difference(shown: ChartLight, chosen: ChartLight): string {
  const a = shown.light
  const b = chosen.light
  if (a.colour !== b.colour) return `${chosen.name} is ${COLOUR_NAME[b.colour]}, but this light was ${COLOUR_NAME[a.colour]}.`
  if (kindOf(a) !== kindOf(b) || a.rhythm.endsWith('+LFl') !== b.rhythm.endsWith('+LFl')) {
    return `${chosen.name} is ${rhythmText(b).split(':')[0]}; this light was ${rhythmText(a).split(':')[0]}.`
  }
  if ((groupOf(a) ?? 1) !== (groupOf(b) ?? 1)) {
    return `${chosen.name} shows ${groupOf(b) ?? 1} in each group; this light showed ${groupOf(a) ?? 1}.`
  }
  return `${chosen.name} repeats every ${sec(b.period)} seconds; this light every ${sec(a.period)} seconds.`
}

function StopwatchView({ light, offset }: { light: LightCharacteristic; offset: number }) {
  const [playing, setPlaying] = useState(true)
  const now = useClock(playing)
  const [sw, setSw] = useState<{ running: boolean; start: number; stopped: number; lastLap: number; laps: number[] }>({
    running: false, start: 0, stopped: 0, lastLap: 0, laps: [],
  })
  const on = lightOn(light, now + offset)
  const elapsed = sw.running ? now - sw.start : sw.stopped

  function startStop() {
    if (sw.running) setSw({ ...sw, running: false, stopped: now - sw.start })
    else setSw({ running: true, start: now, stopped: 0, lastLap: now, laps: [] })
  }
  function lapReset() {
    if (sw.running) setSw({ ...sw, lastLap: now, laps: [...sw.laps, now - sw.lastLap] })
    else setSw({ running: false, start: 0, stopped: 0, lastLap: 0, laps: [] })
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl bg-[#040a14]">
        <svg viewBox="0 0 600 220" className="block h-auto w-full" role="img" aria-label="A light seen at night. Watch its colour, count its flashes and time it.">
          <NightSkyStrip />
          {on && <rect x={292} y={168} width={16} height={46} fill="#ffffff" opacity={0.08} />}
          <LightGlow x={300} y={150} on={on} colour={light.colour} r={9} />
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-navy px-3 py-2 text-white">
        <span className="min-w-[5.5rem] font-mono text-2xl font-bold tabular-nums" aria-live="off">{elapsed.toFixed(1)} s</span>
        <button type="button" onClick={startStop} className={`${btn} ${sw.running ? 'border-warning bg-warning text-navy' : 'border-teal bg-teal text-white'}`}>
          {sw.running ? 'Stop' : 'Start'}
        </button>
        <button type="button" onClick={lapReset} disabled={!sw.running && elapsed === 0} className={`${btn} border-white/40 bg-white/10 text-white hover:bg-white/20`}>
          {sw.running ? 'Lap' : 'Reset'}
        </button>
        <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={!playing} className={`${btn} ml-auto border-white/40 bg-transparent text-white hover:bg-white/10`}>
          {playing ? 'Pause' : 'Resume'}
        </button>
      </div>
      {sw.laps.length > 0 && (
        <p className="mt-1 font-mono text-xs text-text-secondary" aria-live="polite">
          Laps: {sw.laps.slice(-4).map((l) => `${l.toFixed(1)} s`).join(' · ')}
        </p>
      )}
    </div>
  )
}

export function NightTrainer() {
  const [round, setRound] = useState<Round>(FIRST_ROUND)
  const [chosen, setChosen] = useState<number | null>(null)
  const [score, setScore] = useState({ right: 0, asked: 0 })
  const target = CHART_LIGHTS[round.target]!

  function choose(i: number) {
    if (chosen !== null) return
    setChosen(i)
    setScore((s) => ({ right: s.right + (i === round.target ? 1 : 0), asked: s.asked + 1 }))
  }
  function next() {
    // Event handler only: a fresh random light for the learner to identify.
    setRound(makeRound(mulberry32(Math.floor(Math.random() * 2 ** 31)), round.id + 1, round.target))
    setChosen(null)
  }

  const right = chosen === round.target
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <StopwatchView key={round.id} light={target.light} offset={round.offset} />
        <p className="mt-2 text-xs leading-snug text-text-secondary">
          Each lap is one period. For a light that is mostly on, time from one eclipse to the next. Timings are representative.
        </p>
      </div>

      <div className="min-w-0 space-y-3">
        <div role="group" aria-label="Which light is it?">
          <p className="font-semibold text-text-primary">Which light on the practice chart is it?</p>
          <div className="mt-2 grid gap-2">
            {round.options.map((i) => {
              const c = CHART_LIGHTS[i]!
              const isRight = chosen !== null && i === round.target
              const isWrong = chosen === i && i !== round.target
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => choose(i)}
                  disabled={chosen !== null}
                  className={[
                    'flex flex-wrap items-baseline justify-between gap-x-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default',
                    isRight ? 'border-success bg-success/10 font-semibold' : isWrong ? 'border-danger bg-danger/10' : 'border-border bg-white enabled:hover:border-teal/60 enabled:hover:bg-teal-light/50',
                  ].join(' ')}
                >
                  <span>{c.name}</span>
                  <span className="font-mono text-xs text-text-secondary">{c.text}</span>
                </button>
              )
            })}
          </div>
        </div>

        {chosen !== null && (
          <div className={`rounded-lg border p-3 ${right ? 'border-success/50 bg-success/10' : 'border-danger/40 bg-danger/5'}`} role="status">
            <p className="font-semibold text-text-primary">{right ? `✓ Right: ${target.name}.` : `✗ Not quite: it was ${target.name}.`}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">
              <span className="font-mono">{target.text}</span>: {sayLight(target.light, false)}.
              {!right && ` ${difference(target, CHART_LIGHTS[chosen]!)}`}
            </p>
            <svg viewBox="0 0 400 40" className="mt-2 block h-auto w-full max-w-sm rounded bg-[#0b1626]" role="img" aria-label={`One period of ${target.text}`}>
              <RhythmBar light={target.light} x={10} y={8} width={380} height={24} />
            </svg>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {chosen !== null && <button type="button" className={btnTeal} onClick={next}>Next light</button>}
          {score.asked > 0 && <span className="text-sm font-medium text-text-secondary">Score: {score.right} of {score.asked}</span>}
        </div>
      </div>

      {chosen !== null && (
        <div className="min-w-0 md:col-span-2">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-text-secondary">On the chart: {target.name}</p>
          <PracticeChart view={viewAround(target.at, 5, 16 / 9)} zoomable highlight={target.ids} title={`Practice chart: ${target.name}, ${target.text}`} />
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4. Find the navigation lights among the town lights                 */
/* ------------------------------------------------------------------ */

const SHORE_TASKS: Array<{ prompt: string; targets: string[]; done: string }> = [
  {
    prompt: 'Tap the two Port Kerran leading lights (Oc 4s).',
    targets: ['front', 'rear'],
    done: 'Both found: white lights, one above the other, each blinking out once every 4 seconds. The town lights keep no rhythm at all.',
  },
  {
    prompt: `Tap No 4 buoy (${chartLight('no4').text}).`,
    targets: ['no4'],
    done: 'No 4: red, low on the water, flashing in pairs. Leave it to port as you go in (IALA Region A).',
  },
  {
    prompt: 'Some red lights here are not buoys. Tap them.',
    targets: ['mast-top', 'mast-low'],
    done: 'The radio mast’s red obstruction lights: high above the land, where no buoy can be. A buoy’s light is low on the water.',
  },
]

function whyNot(l: PanoLight): string {
  switch (l.kind) {
    case 'town': return 'That light never blinks out: it is a shore light, not a navigation light.'
    case 'mast': return 'That red light is high above the land: the radio mast, not a buoy.'
    case 'buoy': return l.id === 'no3' ? 'That one is green and flashes in pairs, low on the water: No 3 buoy.' : 'That one is red and flashes in pairs, low on the water: No 4 buoy.'
    case 'leading': return 'That white light blinks out once every 4 seconds: one of the leading lights.'
  }
}

export function ShoreLights() {
  const [task, setTask] = useState(0)
  const [found, setFound] = useState<string[]>([])
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [playing, setPlaying] = useState(true)
  const now = useClock(playing)
  const t = SHORE_TASKS[task]!
  const complete = t.targets.every((id) => found.includes(id))

  function tap(l: PanoLight) {
    if (complete) return
    if (t.targets.includes(l.id)) {
      const next = found.includes(l.id) ? found : [...found, l.id]
      setFound(next)
      setMessage({ ok: true, text: t.targets.every((id) => next.includes(id)) ? t.done : 'Yes, that is one. Now find the other.' })
    } else {
      setMessage({ ok: false, text: whyNot(l) })
    }
  }
  function nextTask() {
    setTask((k) => (k + 1) % SHORE_TASKS.length)
    setFound([])
    setMessage(null)
  }
  function onKey(e: KeyboardEvent<SVGGElement>, l: PanoLight) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      tap(l)
    }
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-text-primary">
        <span className="mr-2 rounded bg-navy px-1.5 py-0.5 text-xs text-white">{task + 1} of {SHORE_TASKS.length}</span>
        {t.prompt}
      </p>
      <svg viewBox={`0 0 ${PANO.w} ${PANO.h}`} className="block h-auto w-full rounded-xl" role="group" aria-label="The view ahead at night from between No 1 and No 2 buoys, looking north towards Port Kerran. Each light is a button.">
        <PanoBackdrop id="lan-shore" />
        <PanoLights seconds={now} ring={found} />
        {PANO_LIGHTS.map((l, i) => (
          <g
            key={l.id}
            role="button"
            tabIndex={0}
            aria-label={`Light ${i + 1}: ${l.says}`}
            onClick={() => tap(l)}
            onKeyDown={(e) => onKey(e, l)}
            className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-[#fbbf24]"
          >
            <circle cx={l.x} cy={l.y} r={22} fill="transparent" stroke="transparent" strokeWidth={2.5} />
          </g>
        ))}
        <text x={PANO.w / 2} y={PANO.h - 14} textAnchor="middle" fontSize={15} fill="#9fb3c8">Ahead: 000°T</text>
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" className={btnPlain} onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>{playing ? 'Pause' : 'Play'}</button>
        {complete && <button type="button" className={btnTeal} onClick={nextTask}>{task < SHORE_TASKS.length - 1 ? 'Next' : 'Start again'}</button>}
      </div>
      {message && (
        <div className={`mt-2 rounded-lg border p-3 text-sm leading-relaxed ${message.ok ? 'border-success/50 bg-success/10' : 'border-danger/40 bg-danger/5'}`} role="status">
          {message.text}
        </div>
      )}
      <p className="mt-2 text-xs leading-snug text-text-secondary">Heights are exaggerated so the lights are easy to tap. Timings are representative.</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 5. Your own yacht's lights                                          */
/* ------------------------------------------------------------------ */

const OWN_CASES: Array<{ id: string; label: string; vessel: string; note: string }> = [
  { id: 'sail', label: 'Sailing: deck-level lights', vessel: 'sail-deck', note: 'Under sail alone: red sidelight to port, green to starboard, white sternlight. No white light on the mast.' },
  { id: 'tricolour', label: 'Sailing: tricolour', vessel: 'sail-tricolour', note: 'Under sail alone, a yacht under 20 m may show one tricolour lantern at the masthead instead. It is seen from further away, over the waves. Use it only under sail.' },
  { id: 'motor', label: 'Motoring or motor-sailing', vessel: 'motorsail', note: 'Engine running, sails up or not: you are a power-driven vessel. Deck-level sidelights and sternlight, plus the white steaming light on the front of the mast. Tricolour off.' },
  { id: 'anchor', label: 'At anchor', vessel: 'anchor-small', note: 'At anchor: one all-round white light where it can best be seen, usually the masthead. Switch the navigation lights off.' },
]

const OWN_ASPECTS = [
  { a: 0, label: 'Ahead' },
  { a: 45, label: 'Starboard bow' },
  { a: 90, label: 'Starboard beam' },
  { a: 180, label: 'Astern' },
  { a: 270, label: 'Port beam' },
  { a: 315, label: 'Port bow' },
]

export function OwnLights() {
  const [which, setWhich] = useState(OWN_CASES[0]!.id)
  const [aspect, setAspect] = useState(45)
  const c = OWN_CASES.find((x) => x.id === which)!
  const v = vessel(c.vessel)
  const label = OWN_ASPECTS.find((p) => p.a === aspect)?.label ?? 'Starboard bow'
  const where = label === 'Ahead' ? 'right ahead of you' : label === 'Astern' ? 'right astern of you' : `on your ${label.toLowerCase()}`
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="What is your yacht doing?">
        {OWN_CASES.map((x) => (
          <button key={x.id} type="button" onClick={() => setWhich(x.id)} aria-pressed={which === x.id} className={which === x.id ? btnTeal : btnPlain}>{x.label}</button>
        ))}
      </div>
      <p className="rounded-lg bg-bg px-3 py-2 text-sm leading-relaxed text-text-primary">{c.note}</p>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <figure className="min-w-0">
          <svg viewBox="0 0 300 300" className="mx-auto block w-full max-w-[280px] rounded-xl bg-[#0e2237]" role="img" aria-label={`Plan view of your yacht's light arcs, with another boat ${whereYouAre(aspect)}.`}>
            <PlanView v={v} aspect={aspect} cx={150} cy={150} R={92} fontSize={15} youLabel="Them" />
          </svg>
          <figcaption className="mt-1 text-center text-xs text-text-secondary">From above: where each light can be seen</figcaption>
        </figure>
        <figure className="min-w-0">
          <NightView v={v} aspect={aspect} className="block w-full rounded-xl" />
          <figcaption className="mt-1 text-xs leading-snug text-text-secondary">
            What a boat {where} sees: {describeSeen(v, aspect)}.
          </figcaption>
        </figure>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Where is the other boat?">
        <span className="self-center text-xs font-semibold text-text-secondary">The other boat is on your:</span>
        {OWN_ASPECTS.map((p) => (
          <button key={p.a} type="button" onClick={() => setAspect(p.a)} aria-pressed={aspect === p.a} className={`${chip} font-sans ${aspect === p.a ? 'border-teal bg-teal text-white' : 'border-border bg-white hover:bg-teal-light'}`}>{p.label}</button>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 6. Will we be in before dark?                                       */
/* ------------------------------------------------------------------ */

const toMinutes = (hhmm: string): number | null => {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  return h < 24 && min < 60 ? h * 60 + min : null
}
const hhmm = (mins: number) => `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(Math.round(mins) % 60).padStart(2, '0')}`

export function DaylightPlanner() {
  const uid = useId()
  const [miles, setMiles] = useState(18)
  const [knots, setKnots] = useState(5.5)
  const [leave, setLeave] = useState('10:30')
  const [sunset, setSunset] = useState('19:40')
  const start = toMinutes(leave)
  const dark = toMinutes(sunset)
  const ok = start !== null && dark !== null && miles > 0 && knots > 0
  const passage = ok ? (miles / knots) * 60 : 0
  const arrive = ok ? start! + passage : 0
  const spare = ok ? dark! - arrive : 0
  const latestLeave = ok ? dark! - 120 - passage : 0
  const verdict = !ok ? null : spare >= 120 ? 'good' : spare >= 0 ? 'tight' : 'dark'
  const field = 'mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-base text-text-primary focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30'
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="text-xs font-semibold text-text-secondary" htmlFor={`${uid}-d`}>Distance (miles)
          <input id={`${uid}-d`} type="number" min={1} max={80} step={0.5} value={miles} onChange={(e) => setMiles(Number(e.target.value))} className={field} />
        </label>
        <label className="text-xs font-semibold text-text-secondary" htmlFor={`${uid}-s`}>Average speed (knots)
          <input id={`${uid}-s`} type="number" min={1} max={12} step={0.5} value={knots} onChange={(e) => setKnots(Number(e.target.value))} className={field} />
        </label>
        <label className="text-xs font-semibold text-text-secondary" htmlFor={`${uid}-l`}>Leave at
          <input id={`${uid}-l`} type="time" value={leave} onChange={(e) => setLeave(e.target.value)} className={field} />
        </label>
        <label className="text-xs font-semibold text-text-secondary" htmlFor={`${uid}-u`}>Sunset
          <input id={`${uid}-u`} type="time" value={sunset} onChange={(e) => setSunset(e.target.value)} className={field} />
        </label>
      </div>
      {ok ? (
        <div className={`rounded-lg border p-3 text-sm leading-relaxed ${verdict === 'good' ? 'border-success/50 bg-success/10' : verdict === 'tight' ? 'border-warning/50 bg-warning-bg' : 'border-danger/40 bg-danger/5'}`} role="status" aria-live="polite">
          <p className="font-semibold text-text-primary">
            {verdict === 'good' ? 'Good: in with daylight to spare.' : verdict === 'tight' ? 'Tight: you would arrive in the last hours of light.' : 'You would arrive after dark.'}
          </p>
          <p className="text-text-secondary">
            {miles} miles at {knots} knots takes about {Math.floor(passage / 60)} h {String(Math.round(passage % 60)).padStart(2, '0')} min, so you arrive about <strong>{hhmm(arrive)}</strong>
            {spare >= 0 ? `, ${Math.floor(spare / 60)} h ${String(Math.round(spare % 60)).padStart(2, '0')} min before sunset.` : `, ${Math.round(-spare)} minutes after sunset.`}
            {verdict !== 'good' && latestLeave > 0 && <> To arrive two hours before sunset, leave by <strong>{hhmm(latestLeave)}</strong>, or choose a closer harbour.</>}
          </p>
        </div>
      ) : (
        <p className="text-sm text-danger">Enter a distance, a speed and both times.</p>
      )}
      <p className="text-xs leading-snug text-text-secondary">
        Two hours in hand covers a dying wind, a slow anchoring or a full harbour. Check the sunset time for your date and place in a weather
        app or on the plotter: near the equator, in the Seychelles or Phuket, it changes little through the year and dusk is short.
      </p>
    </div>
  )
}
