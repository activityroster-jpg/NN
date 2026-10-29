"use client"

// Interactive widgets for the pilotage lesson, ported from the Boaty Jobs
// pilotage and transits lessons: step through the plan on the chart, a
// leading-lights simulator, "what should you see next?", and a clearing
// bearing checker.

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useId, useState } from 'react'
import { formatBearing, reciprocal, rhumbDestination } from '@/lib/courses/geo'
import { r2, viewAround, type ViewRect } from '@/lib/courses/navigation/chart-geometry'
import { km } from '@/lib/courses/navigation/practice-chart'
import { mulberry32 } from '@/lib/courses/random'
import { optionOrder } from '../../Exercises'
import PracticeChart, { CHART_COLOURS, ChartLine, ChartText } from '../../PracticeChart'
import { BoatGlyph, ClearingSides, KeepOut, LightsView, VIEW_FOV } from './transit-art'
import { ViewAhead } from './art'
import {
  ARRIVAL_TRACK, CHURCH, CLEARING_CASES, END, GATE12, GATE34, KA, LEAD_BRG, LEGS, MEW, MEW_ABEAM, MEW_ABEAM_MAG, NEXT_ROUNDS, PLAN_STEPS, SPEED, TIMES,
  WRECK, assess, cab, limitText, spireSafe, toMagnetic, toTrue,
} from './data'
import { CHANNEL_HALF, FRONT, REAR, approachPoint, cables, lightsFrom, sideOf, type Side } from './transits'

const btn = 'rounded-lg border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/50 disabled:cursor-not-allowed disabled:opacity-40'
const btnL = `${btn} border-border bg-white text-text-primary hover:bg-teal-light`
const btnT = `${btn} border-teal bg-teal text-white hover:bg-teal/90`

const C = CHART_COLOURS
const btnTeal = 'rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-40'
const btnPlain = 'rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-text-primary hover:bg-teal-light disabled:cursor-not-allowed disabled:opacity-40'

/** A boat glyph sized to the view (chart pixels). */
const boatSize = (v: ViewRect, k = 0.045) => Math.round(v.w * k)

/* ------------------------------------------------------------------ */
/* 1. Step through the plan                                             */
/* ------------------------------------------------------------------ */

const STEP_VIEWS: Record<string, ViewRect> = {
  arrive: viewAround({ lat: 49 + 43.6 / 60, lon: -(4 + 13.8 / 60) }, 8.6, 1),
  leg1: viewAround({ lat: (KA.at.lat + GATE12.lat) / 2 + 0.15 / 60, lon: KA.at.lon }, 3.4, 1),
  leg2: viewAround({ lat: (GATE12.lat + GATE34.lat) / 2, lon: KA.at.lon - 0.3 / 60 }, 3.3, 1),
  leg3: viewAround({ lat: (GATE34.lat + END.lat) / 2 + 0.1 / 60, lon: KA.at.lon }, 2.7, 1),
  abort: viewAround({ lat: (KA.at.lat + END.lat) / 2, lon: KA.at.lon }, 4.2, 1),
}

function StepOverlay({ id, uid }: { id: string; uid: string }) {
  const view = STEP_VIEWS[id]!
  const size = boatSize(view)
  const thin = r2(Math.max(0.6, view.w / 400))
  const leg = LEGS.find((l) => l.id === id)
  const allLegs = LEGS.map((l) => (
    <ChartLine key={l.id} from={l.from} to={l.to} colour={C.plot} width={thin} dash="4 3" />
  ))
  if (id === 'arrive') {
    const lineEnd = rhumbDestination(CHURCH.at, reciprocal(CLEARING_CASES[0]!.value), 7.6)
    return (
      <g>
        <ClearingSides id={`${uid}arr`} landmark={CHURCH.at} limit={CLEARING_CASES[0]!.limit} value={CLEARING_CASES[0]!.value} r1={2.6} r2={7.6} spread={30} />
        <ChartLine from={CHURCH.at} to={lineEnd} colour={C.plotAlt} width={thin * 2.4} />
        <ChartText at={rhumbDestination(CHURCH.at, reciprocal(CLEARING_CASES[0]!.value), 5.2)} colour={C.plotAlt} size={11} dx={-8} anchor="end" bold>
          {`${limitText('NMT', CLEARING_CASES[0]!.value)} (${formatBearing(toMagnetic(CLEARING_CASES[0]!.value), 'M')})`}
        </ChartText>
        <KeepOut at={WRECK.at} radiusNm={0.4} />
        <KeepOut at={MEW.at} radiusNm={0.4} />
        {ARRIVAL_TRACK.slice(1).map((p, i) => <ChartLine key={i} from={ARRIVAL_TRACK[i]!} to={p} colour={C.plot} width={thin * 1.6} dash="5 4" arrow={i === ARRIVAL_TRACK.length - 2} />)}
        {allLegs}
        <BoatGlyph at={ARRIVAL_TRACK[2]!} heading={50} size={size} />
      </g>
    )
  }
  if (id === 'abort') {
    return (
      <g>
        {allLegs}
        <ChartLine from={END} to={KA.at} colour="#b42318" width={thin * 2.4} arrow />
        <BoatGlyph at={GATE34} heading={180} size={size} />
      </g>
    )
  }
  return (
    <g>
      {allLegs}
      {leg && <ChartLine from={leg.from} to={leg.to} colour={C.plot} width={thin * 2.6} arrow />}
      {id === 'leg2' && (
        <>
          <ChartLine from={MEW_ABEAM} to={rhumbDestination(MEW_ABEAM, 270, 1.4)} colour={C.plotAlt} width={thin * 1.4} dash="5 4" />
          <ChartText at={rhumbDestination(MEW_ABEAM, 270, 1.15)} colour={C.plotAlt} size={9} dy={-6} bold>{`Mew Rk ${formatBearing(MEW_ABEAM_MAG, 'M')}`}</ChartText>
        </>
      )}
      {leg && <BoatGlyph at={leg.from} heading={LEAD_BRG} size={size} />}
    </g>
  )
}

export function PlanStepper() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [i, setI] = useState(1)
  const [ticked, setTicked] = useState<Record<string, boolean>>({})
  const step = PLAN_STEPS[i]!
  const tickTime: Record<string, string> = { leg1: TIMES.gate12, leg2: TIMES.gate34, leg3: TIMES.end }
  const tickWhat: Record<string, string> = { leg1: 'No 1 and No 2', leg2: 'No 3 and No 4', leg3: 'off the harbour' }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Parts of the pilotage plan">
        {PLAN_STEPS.map((s, k) => (
          <button key={s.id} type="button" role="tab" aria-selected={k === i} aria-controls={`${uid}-panel`} onClick={() => setI(k)}
            className={`min-h-10 rounded-lg border px-3 py-1.5 text-sm font-semibold ${k === i ? 'border-teal bg-teal text-white' : 'border-border bg-white hover:bg-teal-light'}`}>
            {ticked[s.id] ? '✓ ' : ''}{s.short}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <PracticeChart view={STEP_VIEWS[step.id]!} highlight={step.highlight} labels title={`Practice chart: ${step.title}`}>
          <StepOverlay id={step.id} uid={uid} />
        </PracticeChart>

        <div id={`${uid}-panel`} role="tabpanel" aria-live="polite" className="rounded-xl border border-border bg-[#fffdf3] p-3 sm:p-4">
          <p className="text-base font-bold leading-snug text-text-primary">{step.title}</p>
          {step.heading && (
            <p className="mt-2 flex flex-wrap items-baseline gap-x-3">
              <span className="font-mono text-3xl font-extrabold text-teal">{formatBearing(step.heading.m, 'M')}</span>
              <span className="font-mono text-sm text-text-secondary">({formatBearing(step.heading.t, 'T')})</span>
              {step.distance !== undefined && (
                <span className="text-sm font-semibold text-text-primary">
                  {step.distance < 1 ? `${cab(step.distance)} cables` : `${step.distance.toFixed(1)} miles`} · {step.minutes} min at {SPEED} knots
                </span>
              )}
            </p>
          )}
          <dl className="mt-2 space-y-2 text-sm leading-relaxed">
            <div>
              <dt className="font-semibold text-text-primary">Expect to see</dt>
              <dd><ul className="ml-4 list-disc text-text-secondary">{step.see.map((s) => <li key={s}>{s}</li>)}</ul></dd>
            </div>
            <div>
              <dt className="font-semibold text-text-primary">Depth</dt>
              <dd className="text-text-secondary">{step.depth}</dd>
            </div>
            <div>
              <dt className="font-semibold text-text-primary">Check</dt>
              <dd className="text-text-secondary">{step.check}</dd>
            </div>
          </dl>
          {tickTime[step.id] && (
            <button type="button" aria-pressed={!!ticked[step.id]} onClick={() => setTicked((t) => ({ ...t, [step.id]: !t[step.id] }))}
              className={`mt-3 w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold ${ticked[step.id] ? 'border-success bg-success/10 text-text-primary' : 'border-border bg-white hover:bg-teal-light'}`}>
              {ticked[step.id] ? `✓ Ticked off: ${tickWhat[step.id]} at ${tickTime[step.id]}` : `☐ Tick off ${tickWhat[step.id]} (due ${tickTime[step.id]})`}
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" className={btnPlain} disabled={i === 0} onClick={() => setI(i - 1)}>← Previous</button>
        <span className="text-xs text-text-secondary">{i + 1} of {PLAN_STEPS.length}</span>
        <button type="button" className={btnTeal} disabled={i === PLAN_STEPS.length - 1} onClick={() => setI(i + 1)}>Next →</button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2. What should you see next?                                         */
/* ------------------------------------------------------------------ */

export function NextMarkQuiz() {
  const [r, setR] = useState(0)
  const [choice, setChoice] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const round = NEXT_ROUNDS[r]!
  const answered = choice !== null
  const view = viewAround({ lat: round.at.lat + 0.55 / 60, lon: round.at.lon }, 3.2, 1.5)

  function answer(k: number) {
    if (answered) return
    setChoice(k)
    if (k === round.answer) setScore((s) => s + 1)
  }
  function next() {
    if (r === NEXT_ROUNDS.length - 1) {
      setDone(true)
      return
    }
    setR(r + 1)
    setChoice(null)
  }
  function restart() {
    setR(0)
    setChoice(null)
    setScore(0)
    setDone(false)
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-card p-4" role="status">
        <p className="font-semibold text-text-primary">You scored {score} out of {NEXT_ROUNDS.length}.</p>
        <p className="mt-1 text-sm text-text-secondary">
          {score === NEXT_ROUNDS.length ? 'Every mark where you expected it. That is what the plan is for.' : 'Read the plan’s “expect to see” notes again, then have another go.'}
        </p>
        <button type="button" className={`${btnTeal} mt-3`} onClick={restart}>Start again</button>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Position {r + 1} of {NEXT_ROUNDS.length}</p>
      <p className="mt-1 text-sm font-semibold text-text-primary">{round.where}</p>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <PracticeChart key={round.id} view={view} title="Practice chart: where you are">
          <BoatGlyph at={round.at} heading={LEAD_BRG} size={boatSize(view, 0.07)} />
        </PracticeChart>
        <div>
          {answered ? (
            <ViewAhead at={round.at} ids={round.show} lights={round.lights} title="The view ahead from the boat" />
          ) : (
            <div className="flex aspect-[800/340] w-full items-center justify-center rounded-lg border border-dashed border-border bg-bg p-3 text-center text-sm text-text-secondary">
              What should you see when you look ahead? Choose below, then the view appears here.
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-text-primary">What should you see next, and where?</p>
      <div className="mt-2 grid gap-2" role="radiogroup" aria-label="What should you see next?">
        {optionOrder(`next-${round.id}`, round.options.length).map((k) => {
          const right = answered && k === round.answer
          const wrong = answered && k === choice && k !== round.answer
          return (
            <button key={k} type="button" role="radio" aria-checked={choice === k} disabled={answered} onClick={() => answer(k)}
              className={`rounded-lg border px-3 py-2 text-left text-sm ${right ? 'border-success bg-success/10 font-semibold' : wrong ? 'border-error bg-error/10' : 'border-border bg-white hover:bg-teal-light'}`}>
              {round.options[k]}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className="mt-3 rounded-lg bg-bg px-3 py-2 text-sm leading-relaxed text-text-primary" role="status">
          <p className={`font-semibold ${choice === round.answer ? 'text-success-text' : 'text-error-text'}`}>{choice === round.answer ? '✓ Right.' : 'Not quite.'}</p>
          <p className="mt-0.5">{round.explain}</p>
          <button type="button" className={`${btnTeal} mt-2`} onClick={next}>{r === NEXT_ROUNDS.length - 1 ? 'See your score' : 'Next position →'}</button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Clearing-bearing checker                                          */
/* ------------------------------------------------------------------ */

const CHECK_VIEW = viewAround({ lat: 49 + 43.4 / 60, lon: -(4 + 14.2 / 60) }, 8.2, 1.15)

function parseBearing(text: string): number | null {
  const m = text.trim().replace(/°?\s*[mM]$/, '').replace(/°$/, '')
  if (!/^\d{1,3}(\.\d+)?$/.test(m)) return null
  const v = Number(m)
  return v >= 0 && v < 360 ? Math.round(v) : null
}

interface CheckResult {
  magnetic: number
  trueBearing: number
  safe: boolean
  lines: string[]
}

function judge(caseIndex: number, magnetic: number): CheckResult {
  const c = CLEARING_CASES[caseIndex]!
  const trueBearing = Math.round(toTrue(magnetic))
  const safe = spireSafe(c.limit, c.value, trueBearing)
  const lines = c.dangers.map((d) => {
    const a = assess(d.at, CHURCH.at, c.limit, trueBearing)
    if (a.distance < 0.05) return `Your position line runs right over ${d.name}.`
    return a.excluded
      ? `Your position line passes ${cab(a.distance)} cables south-east of ${d.name}.`
      : `Your position line passes ${cab(a.distance)} cables north-west of ${d.name}: you could be on the wrong side of it.`
  })
  return { magnetic, trueBearing, safe, lines }
}

export function ClearingChecker() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [ci, setCi] = useState(0)
  const [text, setText] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [seed, setSeed] = useState(7)
  const c = CLEARING_CASES[ci]!
  const parsed = parseBearing(text)
  const limitM = toMagnetic(c.value)
  const lineEnd = rhumbDestination(CHURCH.at, reciprocal(c.value), 7.6)
  const obsEnd = result ? rhumbDestination(CHURCH.at, reciprocal(result.trueBearing), 7.6) : null
  const thin = r2(CHECK_VIEW.w / 400)

  function check(m = parsed) {
    if (m === null) return
    setResult(judge(ci, m))
  }
  function nudge(d: number) {
    const base = parsed ?? limitM
    const v = (base + d + 360) % 360
    setText(String(v).padStart(3, '0'))
    setResult(null)
  }
  function randomReading() {
    const rng = mulberry32(seed)
    setSeed((s) => s + 1)
    const v = (limitM + Math.floor(rng() * 13) - 6 + 360) % 360
    const t = String(v).padStart(3, '0')
    setText(t)
    setResult(judge(ci, v))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Which clearing bearing">
        {CLEARING_CASES.map((k, n) => (
          <button key={k.id} type="button" aria-pressed={n === ci} onClick={() => { setCi(n); setResult(null) }}
            className={`min-h-10 rounded-lg border px-3 py-1.5 text-sm ${n === ci ? 'border-teal bg-teal text-white' : 'border-border bg-white hover:bg-teal-light'}`}>
            {k.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-text-primary">
        Clearing bearing: church spire <strong>{limitText(c.limit, c.value)}</strong> = <strong>{limitText(c.limit, limitM, 'M')}</strong> on the
        hand-bearing compass. Enter the spire’s bearing as you read it (°M).
      </p>

      <div className="mt-2">
        <PracticeChart view={CHECK_VIEW} zoomable highlight={['church']} title="Practice chart: the clearing bearing on the church spire">
          <ClearingSides id={`${uid}${c.id}`} landmark={CHURCH.at} limit={c.limit} value={c.value} r1={2.6} r2={7.6} spread={30} />
          <ChartLine from={CHURCH.at} to={lineEnd} colour={C.plot} width={thin * 2} />
          <ChartText at={rhumbDestination(CHURCH.at, reciprocal(c.value), 4.6)} colour={C.plot} size={10} dx={8} anchor="start" bold>{limitText(c.limit, c.value)}</ChartText>
          <KeepOut at={WRECK.at} radiusNm={0.4} />
          <KeepOut at={MEW.at} radiusNm={0.4} />
          {result && obsEnd && (
            <>
              <ChartLine from={CHURCH.at} to={obsEnd} colour={C.plotAlt} width={thin * 2.2} dash="7 4" />
              <ChartText at={obsEnd} colour={C.plotAlt} size={10} dy={14} bold>{`Spire ${formatBearing(result.trueBearing, 'T')}`}</ChartText>
            </>
          )}
        </PracticeChart>
        <p className="mt-1 text-xs text-text-secondary">
          Green: the safe side of the clearing line. Hatched red: the side it keeps you off. Dotted rings: 4 cables round the wreck and Mew Rock.
          {result ? ' Orange dashed: your position line — you are somewhere on it.' : ''}
        </p>
      </div>

      <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); check() }}>
        <div>
          <label htmlFor={`${uid}-brg`} className="block text-xs font-semibold text-text-secondary">Spire bearing (°M)</label>
          <div className="mt-1 flex items-center gap-1.5">
            <button type="button" className={`${btnPlain} px-3`} onClick={() => nudge(-1)} aria-label="One degree less">−1</button>
            <input id={`${uid}-brg`} value={text} inputMode="numeric" placeholder={String(limitM).padStart(3, '0')}
              onChange={(e) => { setText(e.target.value); setResult(null) }}
              className="w-20 rounded-md border border-border bg-white px-3 py-2 font-mono text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30" />
            <button type="button" className={`${btnPlain} px-3`} onClick={() => nudge(1)} aria-label="One degree more">+1</button>
          </div>
        </div>
        <button type="submit" className={btnTeal} disabled={parsed === null}>Safe or not?</button>
        <button type="button" className={btnPlain} onClick={randomReading}>Random reading</button>
      </form>

      {result && (
        <div className={`mt-3 rounded-lg border p-3 ${result.safe ? 'border-success/50 bg-success/10' : 'border-error/40 bg-error/5'}`} role="status" aria-live="polite">
          <p className="font-semibold text-text-primary">
            {result.safe ? '✓ Safe' : '✗ Not safe'}: {formatBearing(result.magnetic, 'M')} is {formatBearing(result.trueBearing, 'T')} —{' '}
            {result.safe ? 'not more than' : 'more than'} {formatBearing(c.value, 'T')}.
          </p>
          <ul className="mt-1 list-disc pl-5 text-sm leading-relaxed text-text-secondary">
            {result.lines.map((l) => <li key={l}>{l}</li>)}
          </ul>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            {result.safe
              ? ci === 1 && !spireSafe(CLEARING_CASES[0]!.limit, CLEARING_CASES[0]!.value, result.trueBearing)
                ? `Safe from Mew Rock, which this bearing was drawn for — but check the wreck line above. That is why this plan uses ${limitText('NMT', CLEARING_CASES[0]!.value)} instead.`
                : 'Carry on, and keep taking bearings while you are near the dangers.'
              : `You are on the hatched side. Head east, away from the line, until the spire bears ${formatBearing(limitM, 'M')} or less.`}
          </p>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 1. Leading-lights simulator                                         */
/* ------------------------------------------------------------------ */

const PLAN_VIEW = viewAround(km(4.5, 11.5), 2.8, 0.72)
const CROSS_MAX = 0.25
const ALONG_MIN = 1.2
const ALONG_MAX = 3.1

function crossText(cross: number): string {
  if (Math.abs(cross) < 0.005) return 'on the leading line'
  return `${cables(Math.abs(cross))} cables ${cross < 0 ? 'west (left)' : 'east (right)'} of the line`
}

export const STEER: Record<Side, { head: string; body: string }> = {
  on: { head: 'In line', body: 'The rear light is directly above the front one: you are on the leading line. Steer to keep them that way.' },
  left: { head: 'Rear light open to the left', body: 'You are left (west) of the line. Alter course to starboard until the rear light is back above the front, then steer to keep them in line.' },
  right: { head: 'Rear light open to the right', body: 'You are right (east) of the line. Alter course to port until the rear light is back above the front, then steer to keep them in line.' },
}

type Answer = 'port' | 'hold' | 'starboard'
const RIGHT_ANSWER: Record<Side, Answer> = { left: 'starboard', on: 'hold', right: 'port' }

export function LeadingLightsSim() {
  const [cross, setCross] = useState(-0.12)
  const [along, setAlong] = useState(2)
  const [quiz, setQuiz] = useState<{ answer: Answer | null; score: number; asked: number } | null>(null)
  const p = approachPoint(along, cross)
  const look = lightsFrom(p)
  const side = sideOf(look.rearOffset)
  const steer = STEER[side]
  const asking = quiz !== null && quiz.answer === null
  const nearEdge = Math.abs(cross) > CHANNEL_HALF - 0.04

  function move(d: number) {
    setCross((c) => Math.round(Math.max(-CROSS_MAX, Math.min(CROSS_MAX, c + d)) * 100) / 100)
  }

  function newQuestion() {
    // Event handler only: a fresh random position for the learner to judge.
    const r = Math.random()
    const c = r < 0.2 ? 0 : (Math.random() < 0.5 ? -1 : 1) * Math.round((0.06 + Math.random() * 0.16) * 100) / 100
    setCross(c)
    setAlong(Math.round((ALONG_MIN + Math.random() * (ALONG_MAX - ALONG_MIN)) * 10) / 10)
    setQuiz((q) => ({ answer: null, score: q?.score ?? 0, asked: q?.asked ?? 0 }))
  }

  function answer(a: Answer) {
    if (!quiz || quiz.answer) return
    setQuiz({ answer: a, score: quiz.score + (a === RIGHT_ANSWER[side] ? 1 : 0), asked: quiz.asked + 1 })
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div className="min-w-0">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-text-secondary">From above: the chart</p>
        <PracticeChart view={PLAN_VIEW} highlight={['ldg-front', 'ldg-rear']} title="Practice chart of the Port Kerran approach with your boat on it">
          {!asking && (
            <>
              <ChartLine from={p} to={REAR.at} colour="#b45309" width={1} dash="3 3" />
              <ChartLine from={p} to={FRONT.at} colour="#b45309" width={1} dash="1.5 2.5" />
              <BoatGlyph at={p} heading={0} size={17} />
            </>
          )}
        </PracticeChart>
        {asking && <p className="mt-1 text-xs text-text-secondary">Your position is hidden until you answer.</p>}
      </div>

      <div className="min-w-0 space-y-3">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-text-secondary">From the boat: looking at the lights</p>
          <LightsView rearOffset={look.rearOffset} title={asking ? 'View from the boat towards the leading lights' : `View from the boat: ${steer.head.toLowerCase()}`} />
          <p className="mt-1 text-[11px] leading-snug text-text-secondary">About {VIEW_FOV}° across, centred on the front light. Angles to scale; heights exaggerated.</p>
        </div>

        {asking ? (
          <div className="rounded-lg border border-teal/40 bg-teal-light/40 p-3" role="group" aria-label="Which way do you steer?">
            <p className="font-semibold text-text-primary">You are heading in towards the lights on 000°T. Which way do you steer?</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button type="button" className={`${btnL} px-2`} onClick={() => answer('port')}><ChevronLeft size={16} strokeWidth={1.5} className="mr-1.5 inline-block align-[-3px]" aria-hidden="true" />Alter to port</button>
              <button type="button" className={`${btnL} px-2`} onClick={() => answer('hold')}>Hold your course</button>
              <button type="button" className={`${btnL} px-2`} onClick={() => answer('starboard')}>Alter to starboard<ChevronRight size={16} strokeWidth={1.5} className="ml-1.5 inline-block align-[-3px]" aria-hidden="true" /></button>
            </div>
          </div>
        ) : (
          <div className={`rounded-lg border p-3 ${side === 'on' ? 'border-success/50 bg-success/10' : 'border-warning/60 bg-warning/10'}`} aria-live="polite">
            {quiz?.answer && (
              <p className={`mb-1 text-sm font-bold ${quiz.answer === RIGHT_ANSWER[side] ? 'text-success-text' : 'text-error-text'}`}>
                {quiz.answer === RIGHT_ANSWER[side] ? '✓ Right.' : '✗ Not quite.'} Score: {quiz.score} of {quiz.asked}
              </p>
            )}
            <p className="font-semibold text-text-primary">{steer.head}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{steer.body}</p>
            <p className="mt-1 font-mono text-xs text-text-secondary">
              {side === 'on' ? 'Lights in line' : `Rear ${Math.abs(look.rearOffset).toFixed(2)}° ${look.rearOffset < 0 ? 'left' : 'right'} of front`} · {crossText(cross)} · {along.toFixed(1)} M from the front light
            </p>
            {nearEdge && <p className="mt-1 text-sm font-semibold text-error-text">You are at the edge of the buoyed channel.</p>}
          </div>
        )}

        {!asking && (
          <div className="space-y-2">
            <div>
              <label htmlFor="ll-cross" className="text-xs font-semibold text-text-secondary">Across the channel: {crossText(cross)}</label>
              <div className="mt-1 flex items-center gap-1.5">
                <button type="button" className={`${btnL} px-2.5`} onClick={() => move(-0.02)} aria-label="Move 0.2 cables west"><ChevronLeft size={16} strokeWidth={1.5} className="mr-1.5 inline-block align-[-3px]" aria-hidden="true" />W</button>
                <input
                  id="ll-cross" type="range" min={-CROSS_MAX} max={CROSS_MAX} step={0.01} value={cross}
                  onChange={(e) => setCross(Number(e.target.value))}
                  aria-valuetext={crossText(cross)}
                  className="h-9 min-w-0 flex-1 accent-teal"
                />
                <button type="button" className={`${btnL} px-2.5`} onClick={() => move(0.02)} aria-label="Move 0.2 cables east">E<ChevronRight size={16} strokeWidth={1.5} className="ml-1.5 inline-block align-[-3px]" aria-hidden="true" /></button>
              </div>
            </div>
            <div>
              <label htmlFor="ll-along" className="text-xs font-semibold text-text-secondary">Distance from the front light: {along.toFixed(1)} M</label>
              <input
                id="ll-along" type="range" min={ALONG_MIN} max={ALONG_MAX} step={0.1} value={along}
                onChange={(e) => setAlong(Number(e.target.value))}
                aria-valuetext={`${along.toFixed(1)} miles from the front light`}
                className="mt-1 h-9 w-full accent-teal"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={btnT} onClick={newQuestion}>{quiz ? 'Next position' : 'Test yourself'}</button>
              {quiz && <button type="button" className={btnL} onClick={() => setQuiz(null)}>Stop the test</button>}
              <button type="button" className={btnL} onClick={() => setCross(0)}>Put me on the line</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

