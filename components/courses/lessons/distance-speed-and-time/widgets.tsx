'use client'

// Interactive widgets for "Distance, speed and time". The dividers, the
// walking dividers, the 60D = ST triangle and the six-minute drill are
// ported from the Boaty Jobs lessons measuring-distance and
// speed-time-and-distance; the day planner is new, for charter skippers.

import { useEffect, useRef, useState } from 'react'
import { rhumbBearing, rhumbDestination, rhumbDistance, type LatLon } from '@/lib/courses/geo'
import { CHART_MARGIN, PLOT_HEIGHT, PLOT_WIDTH, project, r2, viewAround, type Pt, type ViewRect } from '@/lib/courses/navigation/chart-geometry'
import { CHART_BOUNDS, feature } from '@/lib/courses/navigation/practice-chart'
import { mulberry32, pick, randStep } from '@/lib/courses/random'
import PracticeChart, { CHART_COLOURS, ChartLine, ChartPoint } from '../../PracticeChart'
import { DividersArt, HaloLabel, LabelBox, hingeFor, lerpPt, rotateAbout } from './art'
import { ROUTE, ROUTE_LEGS, lonMinuteNm, midpoint, nm1 } from './data'
import { clock, hm, num, round1 } from './maths'

const X0 = CHART_MARGIN
const Y1 = CHART_MARGIN + PLOT_HEIGHT
const X1 = CHART_MARGIN + PLOT_WIDTH
const ASPECT = 4 / 3
const ORANGE = CHART_COLOURS.plotAlt

const btn = 'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'
const btnPrimary = `${btn} border-teal bg-teal text-white hover:bg-teal/90`
const btnPlain = `${btn} border-border bg-white text-text-primary hover:bg-teal-light`

/* ------------------------------------------------------------------ */
/* 2. Dividers on the practice chart                                    */
/* ------------------------------------------------------------------ */

interface Pair {
  a: string
  b: string
  /** "the Kerran Approach buoy" — for running text. */
  aText: string
  bText: string
  chip: string
}

const PAIRS: Pair[] = [
  { a: 'kerran-approach', b: 'mew-rock', aText: 'the Kerran Approach buoy', bText: 'Mew Rock', chip: 'Kerran Approach → Mew Rock' },
  { a: 'east-teeth', b: 'gull-point-lt', aText: 'the East Teeth buoy', bText: 'Gull Point lighthouse', chip: 'East Teeth → Gull Point' },
  { a: 'wreck', b: 'mew-rock', aText: 'the wreck', bText: 'Mew Rock', chip: 'Wreck → Mew Rock' },
  { a: 'tower', b: 'mast', aText: 'the old tower', bText: 'the radio mast', chip: 'Tower → Radio mast' },
]

const PAIR_DATA = PAIRS.map((p) => {
  const a = feature(p.a).at
  const b = feature(p.b).at
  const d = rhumbDistance(a, b)
  const brg = rhumbBearing(a, b)
  const mid = midpoint(a, b)
  const start: [LatLon, LatLon] = [rhumbDestination(mid, brg + 90, 0.35), rhumbDestination(mid, brg - 90, 0.35)]
  return {
    ...p,
    at: [a, b] as [LatLon, LatLon],
    d,
    mid,
    start,
    view: viewAround(mid, Math.max(3.6, d + 2, (Math.abs(a.lat - b.lat) * 60 + 1.6) * ASPECT), ASPECT),
  }
})

function latView(mid: LatLon, d: number): ViewRect {
  return viewAround({ lat: mid.lat, lon: CHART_BOUNDS.west }, Math.max(3.6, (d + 1.4) * ASPECT), ASPECT)
}

function lonView(mid: LatLon, d: number): ViewRect {
  // The spread is d miles of chart whatever scale it is laid against.
  return viewAround({ lat: CHART_BOUNDS.south, lon: mid.lon }, Math.max(3.6, d + 2.2), ASPECT)
}

const latAtMin = (m: number) => 49 + m / 60
const lonAtMinW = (m: number) => -(4 + m / 60)

/** The dividers' spread laid against the left-hand latitude scale. */
function LatScaleCheck({ d, mid, view }: { d: number; mid: LatLon; view: ViewRect }) {
  const midMin = (mid.lat - 49) * 60
  const bottom = Math.min(Math.max(Math.round(midMin - d / 2), 40), 52 - d)
  const yTop = project({ lat: latAtMin(bottom + d), lon: CHART_BOUNDS.west }).y
  const yBot = project({ lat: latAtMin(bottom), lon: CHART_BOUNDS.west }).y
  const fs = r2(view.w / 26)
  const x = X0 + 2.5
  const leg = Math.max(((yBot - yTop) / 2) * 1.15, (yBot - yTop) / 2 + fs * 1.5)
  const hinge = hingeFor({ x, y: yBot }, { x, y: yTop }, leg, -1)
  const ly = r2((yTop + yBot) / 2)
  return (
    <g>
      <rect x={X0} y={yTop} width={r2(fs * 0.5)} height={r2(yBot - yTop)} fill={ORANGE} fillOpacity={0.22} />
      <DividersArt p={{ x, y: yBot }} q={{ x, y: yTop }} leg={leg} side={-1} width={r2(view.w / 230)} />
      <LabelBox x={hinge.x + fs * 0.8} y={ly - fs * 0.2} size={fs} lines={[{ text: `${nm1(d)}′ of latitude`, colour: ORANGE }, { text: `= ${nm1(d)} M`, colour: CHART_COLOURS.plot }]} />
    </g>
  )
}

/** The same spread laid against the bottom longitude scale: the trap. */
function LonScaleCheck({ d, mid, view }: { d: number; mid: LatLon; view: ViewRect }) {
  const span = d / lonMinuteNm(mid.lat)
  const midW = (-mid.lon - 4) * 60
  const right = Math.min(Math.max(Math.round(midW - span / 2), 0), 24 - span)
  const xL = project({ lat: CHART_BOUNDS.south, lon: lonAtMinW(right + span) }).x
  const xR = project({ lat: CHART_BOUNDS.south, lon: lonAtMinW(right) }).x
  const fs = r2(view.w / 26)
  const y = Y1 - 2.5
  const leg = Math.max(((xR - xL) / 2) * 1.15, (xR - xL) / 2 + fs * 1.5)
  const hinge = hingeFor({ x: xL, y }, { x: xR, y }, leg, 1)
  const lx = r2(Math.min(Math.max((xL + xR) / 2, view.x + fs * 5), X1 - fs * 5))
  return (
    <g>
      <rect x={xL} y={r2(Y1 - fs * 0.5)} width={r2(xR - xL)} height={r2(fs * 0.5)} fill="#b42318" fillOpacity={0.2} />
      <DividersArt p={{ x: xL, y }} q={{ x: xR, y }} leg={leg} side={1} width={r2(view.w / 230)} />
      <LabelBox x={lx} y={hinge.y - fs * 2.2} size={fs} anchor="middle" lines={[{ text: `${span.toFixed(1)}′ of longitude…`, colour: '#b42318' }, { text: `…but only ${nm1(d)} M`, colour: '#b42318' }]} />
    </g>
  )
}

type Stage = 'measure' | 'lat' | 'lon'

export function DividersOnChart() {
  const [pairIndex, setPairIndex] = useState(0)
  const [nonce, setNonce] = useState(0)
  const [snapped, setSnapped] = useState(false)
  const [measured, setMeasured] = useState<number | null>(null)
  const [stage, setStage] = useState<Stage>('measure')
  const P = PAIR_DATA[pairIndex]!
  const fA = feature(P.a)
  const fB = feature(P.b)

  function choose(i: number) {
    setPairIndex(i)
    setNonce((n) => n + 1)
    setSnapped(false)
    setMeasured(null)
    setStage('measure')
  }

  function showMe() {
    setNonce((n) => n + 1)
    setSnapped(true)
    setMeasured(P.d)
    setStage('measure')
  }

  const view = stage === 'lat' && measured !== null ? latView(P.mid, measured) : stage === 'lon' && measured !== null ? lonView(P.mid, measured) : P.view
  const close = measured !== null && Math.abs(measured - P.d) <= 0.1

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose what to measure">
        {PAIRS.map((p, i) => (
          <button key={p.chip} type="button" onClick={() => choose(i)} aria-pressed={i === pairIndex} className={`${btn} ${i === pairIndex ? 'border-teal bg-teal text-white' : 'border-border bg-white hover:bg-teal-light'}`}>
            {p.chip}
          </button>
        ))}
      </div>

      <ol className="not-lesson space-y-1 rounded-lg bg-bg px-3 py-2 text-sm leading-snug">
        <li className={stage === 'measure' ? 'font-semibold text-text-primary' : 'text-text-secondary'}>
          1. Drag <span className="font-bold text-[#c2410c]">A</span> onto {P.aText} and <span className="font-bold text-[#c2410c]">B</span> onto {P.bText} (both are pulsing). Zoom in with + to place the points exactly on the symbols.
        </li>
        <li className={stage === 'lat' ? 'font-semibold text-text-primary' : 'text-text-secondary'}>
          2. Carry the dividers, without changing their spread, to the latitude scale at the same latitude, and read the minutes and tenths.
        </li>
        <li className={stage === 'lon' ? 'font-semibold text-text-primary' : 'text-text-secondary'}>3. For comparison, see what the longitude scale would (wrongly) tell you.</li>
      </ol>

      <PracticeChart
        key={`${pairIndex}-${nonce}`}
        mode={stage === 'measure' ? 'measure' : 'view'}
        zoomable
        view={view}
        dividers={snapped ? P.at : P.start}
        onMeasure={(d) => setMeasured(d)}
        highlight={stage === 'measure' ? [P.a, P.b] : undefined}
        title={`Practice chart: measure from ${fA.name} to ${fB.name}`}
      >
        {stage === 'lat' && measured !== null && <LatScaleCheck d={measured} mid={P.mid} view={view} />}
        {stage === 'lon' && measured !== null && <LonScaleCheck d={measured} mid={P.mid} view={view} />}
      </PracticeChart>

      <div className="flex flex-wrap gap-2">
        {stage === 'measure' ? (
          <>
            <button type="button" className={btnPrimary} disabled={measured === null} onClick={() => setStage('lat')}>Carry to the latitude scale</button>
            <button type="button" className={btnPlain} onClick={showMe}>Show me</button>
          </>
        ) : (
          <>
            {stage === 'lat' ? (
              <button type="button" className={btnPlain} onClick={() => setStage('lon')}>Try the longitude scale</button>
            ) : (
              <button type="button" className={btnPlain} onClick={() => setStage('lat')}>Back to the latitude scale</button>
            )}
            <button type="button" className={btnPrimary} onClick={() => setStage('measure')}>Back to the chart</button>
          </>
        )}
      </div>

      <div className="min-h-[3rem] rounded-lg border border-border bg-white px-3 py-2 text-sm leading-relaxed" aria-live="polite">
        {measured === null && <p className="text-text-secondary">Move the dividers to start. The bar under the chart shows their spread, like reading it off the scale.</p>}
        {measured !== null && stage === 'measure' && (
          <p>
            The dividers are open to <strong>{measured.toFixed(2)} M</strong>.{' '}
            {close ? 'Now carry them to the latitude scale to see where that reading comes from.' : 'Keep adjusting until A and B sit exactly on the two symbols.'}
          </p>
        )}
        {measured !== null && stage === 'lat' && (
          <p>
            Against the latitude scale the points span <strong>{nm1(measured)}′</strong>, so the distance is <strong>{nm1(measured)} M</strong>.{' '}
            {close ? (
              <span className="font-semibold text-success-text">That agrees with the chart: {fA.name} to {fB.name} is {P.d.toFixed(2)} M.</span>
            ) : (
              <span className="text-danger">
                The true distance is {P.d.toFixed(2)} M — put A and B exactly on the symbols (or press Show me) and try again.
              </span>
            )}
          </p>
        )}
        {measured !== null && stage === 'lon' && (
          <p>
            The same spread covers <strong>{(measured / lonMinuteNm(P.mid.lat)).toFixed(1)}′</strong> of the longitude scale. Read as miles, that is{' '}
            {Math.round((1 / lonMinuteNm(P.mid.lat) - 1) * 100)}% too much: here a minute of longitude is only {lonMinuteNm(P.mid.lat).toFixed(2)} M. Always use the
            latitude scale.
          </p>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Walking the dividers along a route                                */
/* ------------------------------------------------------------------ */

type WalkMode = 'walk' | 'gap' | 'done'

const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2)

function legView(i: number): ViewRect {
  const L = ROUTE_LEGS[i]!
  const dLatMin = Math.abs(L.to.at.lat - L.from.at.lat) * 60
  return viewAround(midpoint(L.from.at, L.to.at), Math.max(L.distance + 2.4, (dLatMin + 1.6) * ASPECT, 4.5), ASPECT)
}
const LEG_VIEWS = ROUTE_LEGS.map((_, i) => legView(i))
const ROUTE_VIEW = viewAround(midpoint(ROUTE[0]!.at, ROUTE[ROUTE.length - 1]!.at), 13.2, ASPECT)

export function WalkingDividers() {
  const [spread, setSpread] = useState<1 | 2>(1)
  const [leg, setLeg] = useState(0)
  const [steps, setSteps] = useState(0)
  const [mode, setMode] = useState<WalkMode>('walk')
  const [results, setResults] = useState<number[]>([])
  const [k, setK] = useState(1)
  const raf = useRef(0)

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  function animate() {
    cancelAnimationFrame(raf.current)
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return setK(1)
    const t0 = performance.now()
    setK(0)
    const tick = (now: number) => {
      const x = Math.min(1, (now - t0) / 550)
      setK(x)
      if (x < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }

  function reset(s: 1 | 2 = spread) {
    cancelAnimationFrame(raf.current)
    setSpread(s)
    setLeg(0)
    setSteps(0)
    setMode('walk')
    setResults([])
    setK(1)
  }

  const L = ROUTE_LEGS[Math.min(leg, ROUTE_LEGS.length - 1)]!
  const canStep = mode === 'walk' && (steps + 1) * spread <= L.distance + 1e-9
  const gap = L.distance - steps * spread
  const gapRead = Number(nm1(gap))
  const legRead = steps * spread + gapRead
  const view = mode === 'done' ? ROUTE_VIEW : LEG_VIEWS[leg]!
  const fs = r2(view.w / 28)
  const w = r2(view.w / 240)

  const markAt = (s: number): Pt => project(s >= L.distance ? L.to.at : rhumbDestination(L.from.at, L.bearing, s))

  function step() {
    if (!canStep) return
    setSteps((n) => n + 1)
    animate()
  }

  function measureGap() {
    setMode('gap')
    setResults((r) => [...r.slice(0, leg), legRead])
    animate()
  }

  function nextLeg() {
    if (leg >= ROUTE_LEGS.length - 1) {
      setMode('done')
      return
    }
    setLeg(leg + 1)
    setSteps(0)
    setMode('walk')
    setK(1)
  }

  // The dividers: opening onto the first mark, swinging over a mark, or closing onto the gap.
  let dividers: { p: Pt; q: Pt; side: 1 | -1 } | null = null
  const e = ease(k)
  if (mode === 'walk' && steps >= 1) {
    const side: 1 | -1 = steps % 2 === 1 ? 1 : -1
    const to = markAt(steps * spread)
    if (steps === 1) {
      const from = markAt(0)
      dividers = { p: from, q: k >= 1 ? to : lerpPt(from, to, e), side }
    } else {
      const pivot = markAt((steps - 1) * spread)
      const from = markAt((steps - 2) * spread)
      dividers = { p: pivot, q: k >= 1 ? to : rotateAbout(from, pivot, 180 * e * side), side }
    }
  } else if (mode === 'gap') {
    const side: 1 | -1 = steps % 2 === 1 ? -1 : 1
    const p = markAt(steps * spread)
    const q = project(L.to.at)
    if (steps >= 1 && k < 1) {
      // Swing over the last mark while closing from a full step to the gap.
      const from = markAt((steps - 1) * spread)
      const r = rotateAbout(from, p, 180 * e * side)
      const f = 1 + (gap / spread - 1) * e
      dividers = { p, q: { x: p.x + (r.x - p.x) * f, y: p.y + (r.y - p.y) * f }, side }
    } else {
      dividers = { p, q, side }
    }
  }

  const legLabel = (i: number) => {
    const l = ROUTE_LEGS[i]!
    const m = project(midpoint(l.from.at, l.to.at))
    const a = project(l.from.at)
    const b = project(l.to.at)
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
    const nx = -(b.y - a.y) / len
    const ny = (b.x - a.x) / len
    // Offset the label to the right of the direction of travel, far enough that the
    // horizontal text (about 5 characters wide, 1 high) clears the line and its step marks.
    const off = Math.abs(nx) * fs * 1.5 + Math.abs(ny) * fs * 0.55 + fs * 0.6
    return { x: r2(m.x + nx * off), y: r2(m.y + ny * off + fs * 0.35) }
  }

  const doneLegs = mode === 'done' ? ROUTE_LEGS.length : mode === 'gap' ? leg + 1 : leg

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">Dividers set to</span>
        <div className="flex gap-1" role="group" aria-label="Divider spread">
          {([1, 2] as const).map((s) => (
            <button key={s} type="button" onClick={() => reset(s)} aria-pressed={spread === s} className={`${btn} ${spread === s ? 'border-teal bg-teal text-white' : 'border-border bg-white hover:bg-teal-light'}`}>
              {s} M
            </button>
          ))}
        </div>
        <span className="text-text-secondary">(set on the latitude scale, level with the route)</span>
      </div>

      <PracticeChart mode="view" zoomable view={view} title="Practice chart: walking the dividers along a three-leg route">
        {ROUTE_LEGS.map((l, i) => (
          <ChartLine
            key={i}
            from={l.from.at}
            to={l.to.at}
            colour={i < doneLegs ? CHART_COLOURS.plot : i === leg ? ORANGE : '#94a3b8'}
            width={r2(w * 1.3)}
            dash={i < doneLegs ? undefined : `${r2(w * 5)} ${r2(w * 4)}`}
          />
        ))}
        <ChartPoint at={ROUTE[2]!.at} colour={CHART_COLOURS.plot} label="WP1" />
        {mode !== 'done' &&
          Array.from({ length: steps }, (_, i) => {
            const s = (i + 1) * spread
            const p = markAt(s)
            const a = project(L.from.at)
            const b = project(L.to.at)
            const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
            const nx = -(b.y - a.y) / len
            const ny = (b.x - a.x) / len
            const t = fs * 0.45
            return (
              <g key={i}>
                <line x1={r2(p.x - nx * t)} y1={r2(p.y - ny * t)} x2={r2(p.x + nx * t)} y2={r2(p.y + ny * t)} stroke={CHART_COLOURS.ink} strokeWidth={r2(w * 1.2)} />
                <HaloLabel x={r2(p.x - nx * fs * 1.3)} y={r2(p.y - ny * fs * 1.3 + fs * 0.35)} size={r2(fs * 0.8)} colour={CHART_COLOURS.ink} anchor="middle" bold>
                  {`${s}`}
                </HaloLabel>
              </g>
            )
          })}
        {mode === 'gap' && (
          <line x1={markAt(steps * spread).x} y1={markAt(steps * spread).y} x2={project(L.to.at).x} y2={project(L.to.at).y} stroke={ORANGE} strokeWidth={r2(w * 3.5)} strokeOpacity={0.35} strokeLinecap="round" />
        )}
        {dividers && <DividersArt p={dividers.p} q={dividers.q} leg={r2(Math.max(spread, gap) * 58 * 0.62)} side={dividers.side} width={w} />}
        {Array.from({ length: doneLegs }, (_, i) => {
          const pos = legLabel(i)
          return results[i] !== undefined ? (
            <HaloLabel key={`l${i}`} x={pos.x} y={pos.y} size={fs} colour={CHART_COLOURS.plot} anchor="middle" bold>{`${nm1(results[i])} M`}</HaloLabel>
          ) : null
        })}
      </PracticeChart>

      <div className="flex flex-wrap gap-2">
        {mode === 'walk' && (
          <>
            <button type="button" className={btnPrimary} onClick={step} disabled={!canStep}>{steps === 0 ? 'Place the dividers' : 'Step'}</button>
            <button type="button" className={btnPlain} onClick={measureGap} disabled={canStep}>Measure the gap</button>
          </>
        )}
        {mode === 'gap' && (
          <button type="button" className={btnPrimary} onClick={nextLeg}>{leg < ROUTE_LEGS.length - 1 ? 'Next leg' : 'Add up the legs'}</button>
        )}
        <button type="button" className={btnPlain} onClick={() => reset()}>Start again</button>
      </div>

      <div className="min-h-[3.5rem] rounded-lg border border-border bg-white px-3 py-2 text-sm leading-relaxed" aria-live="polite">
        {mode !== 'done' && (
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-teal">
            Leg {leg + 1} of {ROUTE_LEGS.length}: {L.from.name} → {L.to.name}
          </p>
        )}
        {mode === 'walk' && steps === 0 && <p>Put one point on {L.from.name} and the other along the line, then step the dividers along it, counting as you go.</p>}
        {mode === 'walk' && steps > 0 && canStep && (
          <p>
            {steps} {steps === 1 ? 'step' : 'steps'} = <strong>{steps * spread} M</strong> so far. Swing the dividers over the leading point and step again.
          </p>
        )}
        {mode === 'walk' && steps > 0 && !canStep && (
          <p>
            {steps} {steps === 1 ? 'step' : 'steps'} = <strong>{steps * spread} M</strong>. Less than {spread} M is left, so close the dividers onto the gap and measure it on the
            latitude scale.
          </p>
        )}
        {mode === 'gap' && (
          <p>
            The gap measures <strong>{nm1(gap)}′</strong> on the latitude scale, so this leg is {steps * spread} + {nm1(gap)} = <strong>{nm1(legRead)} M</strong>. Write it beside
            the leg.
          </p>
        )}
        {mode === 'done' && (
          <p>
            Add the legs: {results.map((r) => nm1(r)).join(' + ')} = <strong>{nm1(results.reduce((n, r) => n + r, 0))} M</strong> from the Kerran Approach buoy to the
            anchorage at Kerran Roads.
          </p>
        )}
      </div>
    </div>
  )
}


const btn2 = 'rounded-lg border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-teal/40'
const btnOn = 'border-teal bg-teal text-white'
const btnOff = 'border-border bg-white text-text-primary hover:bg-teal-light'
const input = 'rounded-md border border-border bg-white px-2 py-1.5 text-sm text-text-primary focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30'

/* ------------------------------------------------------------------ */
/* A slider with a typed number beside it                              */
/* ------------------------------------------------------------------ */

function NumberField({ id, label, unit, value, onChange, min, max, step }: {
  id: string; label: string; unit: string; value: number; onChange: (n: number) => void; min: number; max: number; step: number
}) {
  const [text, setText] = useState(String(value))
  const [shown, setShown] = useState(value)
  // Keep the box in step with the slider (and with a new unknown) without fighting the user's typing.
  if (value !== shown) {
    setShown(value)
    setText(String(value))
  }
  return (
    <div>
      <label htmlFor={`${id}-n`} className="text-sm font-semibold text-text-primary">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={Math.min(max, Math.max(min, value))}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={`${label} slider`}
          className="h-8 min-w-0 flex-1 accent-teal"
        />
        <input
          id={`${id}-n`}
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            const n = Number(e.target.value.replace(',', '.'))
            if (e.target.value.trim() !== '' && Number.isFinite(n) && n >= min && n <= max) {
              setShown(n)
              onChange(n)
            }
          }}
          className={`${input} w-20 text-right font-mono`}
        />
        <span className="w-8 text-sm text-text-secondary">{unit}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 1. The 60D = ST calculator and triangle                             */
/* ------------------------------------------------------------------ */

type Unknown = 'D' | 'S' | 'T'

/** "=" when rounding changes nothing, otherwise "≈". */
const eq = (exact: number, rounded: number) => (Math.abs(exact - rounded) < 1e-9 ? '=' : '≈')

const CELLS: Record<Unknown, { points: string; label: string; x: number; y: number }> = {
  D: { points: '110,10 47,110 173,110', label: '60D', x: 110, y: 92 },
  S: { points: '47,110 110,110 110,200 -10,200', label: 'S', x: 72, y: 168 },
  T: { points: '110,110 173,110 230,200 110,200', label: 'T', x: 148, y: 168 },
}

function Triangle({ unknown }: { unknown: Unknown }) {
  return (
    <svg viewBox="-14 0 248 206" className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label={`60D = ST triangle with ${unknown === 'D' ? 'distance' : unknown === 'S' ? 'speed' : 'time'} covered`}>
      {(Object.keys(CELLS) as Unknown[]).map((k) => (
        <g key={k}>
          <polygon points={CELLS[k].points} fill={k === unknown ? '#f5b301' : '#E0F2F7'} stroke="#0B5563" strokeWidth={2} strokeLinejoin="round" />
          <text x={CELLS[k].x} y={CELLS[k].y} textAnchor="middle" fontSize={k === 'D' ? 30 : 36} fontWeight={800} fill="#0B1929">
            {k === unknown ? '?' : CELLS[k].label}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function SpeedTriangle() {
  const [unknown, setUnknown] = useState<Unknown>('T')
  const [d, setD] = useState(7.5)
  const [s, setS] = useState(5)
  const [t, setT] = useState(90)

  const D = unknown === 'D' ? (s * t) / 60 : d
  const S = unknown === 'S' ? (60 * d) / t : s
  const T = unknown === 'T' ? (60 * d) / s : t

  function choose(u: Unknown) {
    // The old answer becomes a known value, rounded as a navigator would.
    if (unknown === 'D') setD(Math.max(0.1, round1(D)))
    if (unknown === 'S') setS(Math.max(0.5, round1(S)))
    if (unknown === 'T') setT(Math.max(1, Math.round(T)))
    setUnknown(u)
  }

  let working: string[]
  let answer: string
  if (unknown === 'D') {
    working = ['D = S × T ÷ 60', `  = ${num(S)} × ${num(T)} ÷ 60`, `  = ${num(S * T)} ÷ 60`, `  = ${num(D, 3)} M`]
    answer = `D ${eq(D, round1(D))} ${round1(D).toFixed(1)} M`
  } else if (unknown === 'S') {
    working = ['S = 60 × D ÷ T', `  = 60 × ${num(D)} ÷ ${num(T)}`, `  = ${num(60 * D)} ÷ ${num(T)}`, `  = ${num(S, 3)} kn`]
    answer = `S ${eq(S, round1(S))} ${round1(S).toFixed(1)} kn`
  } else {
    working = ['T = 60 × D ÷ S', `  = 60 × ${num(D)} ÷ ${num(S)}`, `  = ${num(60 * D)} ÷ ${num(S)}`, `  = ${num(T, 1)} min`]
    answer = `T ${eq(T, Math.round(T))} ${Math.round(T)} min${T >= 59.5 ? ` = ${hm(T)}` : ''}`
  }

  const names: Record<Unknown, string> = { D: 'distance', S: 'speed', T: 'time' }

  return (
    <div className="grid gap-4 md:grid-cols-[15rem_minmax(0,1fr)]">
      <div>
        <div className="flex gap-1.5" role="radiogroup" aria-label="What do you want to find?">
          {(['D', 'S', 'T'] as Unknown[]).map((u) => (
            <button
              key={u}
              type="button"
              role="radio"
              aria-checked={unknown === u}
              onClick={() => choose(u)}
              className={`${btn2} flex-1 px-2 ${unknown === u ? btnOn : btnOff}`}
            >
              Find {names[u]}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Triangle unknown={unknown} />
        </div>
        <p className="mt-1 text-center text-xs text-text-secondary">Cover the one you want; the rest is the sum.</p>
      </div>

      <div className="min-w-0 space-y-3">
        {unknown !== 'D' && <NumberField id="std-d" label="Distance" unit="M" value={d} onChange={setD} min={0.1} max={40} step={0.1} />}
        {unknown !== 'S' && <NumberField id="std-s" label="Speed" unit="kn" value={s} onChange={setS} min={0.5} max={20} step={0.1} />}
        {unknown !== 'T' && <NumberField id="std-t" label="Time" unit="min" value={t} onChange={setT} min={1} max={600} step={1} />}

        <div className="rounded-lg bg-navy px-4 py-3 text-white" aria-live="polite">
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-white/85">{working.join('\n')}</pre>
          <p className="mt-2 text-lg font-bold text-teal-light">{answer}</p>
        </div>
      </div>
    </div>
  )
}


/* ------------------------------------------------------------------ */
/* 3. Six-minute rule quick-fire                                       */
/* ------------------------------------------------------------------ */

function sixMinuteQuestion(seed: number) {
  const rng = mulberry32(seed * 7919 + 17)
  const speed = randStep(rng, 3, 12, 0.5)
  const lots = pick(rng, [1, 1, 2, 3, 5, 10])
  return { speed, minutes: lots * 6, lots, answer: (speed * lots) / 10 }
}

export function SixMinuteQuickFire() {
  const [seed, setSeed] = useState(1)
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'right' | 'wrong' | 'shown'>('idle')
  const [attempts, setAttempts] = useState(0)
  const [streak, setStreak] = useState(0)
  const [score, setScore] = useState({ right: 0, tried: 0 })
  const q = sixMinuteQuestion(seed)
  const tenth = q.speed / 10

  function check() {
    const n = Number(text.replace(',', '.').replace(/[^\d.]/g, ''))
    if (text.trim() === '' || !Number.isFinite(n)) return
    const ok = Math.abs(n - q.answer) <= 0.05 + 1e-9
    // Only the first try at each question counts towards the score.
    if (attempts === 0) {
      setScore((s) => ({ right: s.right + (ok ? 1 : 0), tried: s.tried + 1 }))
      setStreak((s) => (ok ? s + 1 : 0))
    }
    setAttempts((a) => a + 1)
    setStatus(ok ? 'right' : 'wrong')
  }

  function next() {
    setSeed((s) => s + 1)
    setText('')
    setAttempts(0)
    setStatus('idle')
  }

  const finished = status === 'right' || status === 'shown'

  return (
    <div className="rounded-xl bg-bg p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-lg font-semibold text-text-primary">
          At <span className="font-mono text-teal">{num(q.speed)} kn</span>, how far in <span className="font-mono text-teal">{q.minutes} min</span>?
        </p>
        <p className="text-xs text-text-secondary" aria-live="polite">Score {score.right}/{score.tried} · Streak {streak}</p>
      </div>
      <form
        className="mt-3 flex flex-wrap items-center gap-2"
        onSubmit={(e) => { e.preventDefault(); if (finished) next(); else check() }}
      >
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); if (status === 'wrong') setStatus('idle') }}
          inputMode="decimal"
          aria-label="Distance in nautical miles"
          placeholder="Miles"
          disabled={finished}
          className={`${input} w-28 font-mono disabled:bg-white/60`}
        />
        <span className="text-sm text-text-secondary">M</span>
        {!finished && <button type="submit" className={`${btn2} ${btnOn}`}>Check</button>}
        {status === 'wrong' && (
          <button type="button" onClick={() => { setStatus('shown'); setStreak(0) }} className={`${btn2} ${btnOff}`}>Show me</button>
        )}
        {finished && <button type="submit" className={`${btn2} ${btnOn}`}>Next question</button>}
      </form>
      <div className="mt-2 min-h-[3rem] text-sm leading-relaxed" role="status">
        {status === 'wrong' && <p className="font-medium text-danger">Not quite — try again. Start with one tenth of the speed.</p>}
        {finished && (
          <p className={status === 'right' ? 'text-success-text' : 'text-text-primary'}>
            <strong>{num(q.answer)} M.</strong>{' '}
            In 6 minutes: {num(q.speed)} ÷ 10 = {num(tenth)} M.
            {q.lots > 1 ? ` ${q.minutes} minutes is ${q.lots} × 6 minutes, so ${q.lots} × ${num(tenth)} = ${num(q.answer)} M.` : ''}
          </p>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Day planner: work back from the time you want to arrive             */
/* ------------------------------------------------------------------ */

export interface PlannerLeg {
  area: string
  from: string
  to: string
  /** Approximate planning distance, nautical miles. */
  nm: number
}

const SPEEDS = [4, 4.5, 5, 5.5, 6, 6.5, 7]
const STOPS = [0, 30, 60, 90, 120]
const halfHours = (from: number, to: number) => Array.from({ length: (to - from) * 2 + 1 }, (_, i) => from * 60 + i * 30)
const ARRIVE_TIMES = halfHours(12, 19)
const SUNSET_TIMES = halfHours(17, 21)
const T0 = 7 * 60
const T1 = 22 * 60
const pct = (m: number) => `${(((m - T0) / (T1 - T0)) * 100).toFixed(2)}%`

export function DayPlanner({ legs }: { legs: PlannerLeg[] }) {
  const areas = [...new Set(legs.map((l) => l.area))]
  const [choice, setChoice] = useState(() => String(Math.max(0, legs.findIndex((l) => l.nm >= 15 && l.nm <= 20))))
  const [own, setOwn] = useState(18)
  const [speed, setSpeed] = useState(5)
  const [stops, setStops] = useState(60)
  const [arrive, setArrive] = useState(15 * 60)
  const [sunset, setSunset] = useState(20 * 60)

  const leg = choice === 'own' ? null : legs[Number(choice)] ?? null
  const miles = leg ? leg.nm : own
  const sailing = Math.round((60 * miles) / speed)
  const leave = arrive - sailing - stops
  const spare = sunset - arrive

  const notes: Array<{ tone: 'ok' | 'warn'; text: string }> = []
  if (sailing > 300) notes.push({ tone: 'warn', text: `Over five hours of sailing: a long day for a charter crew. Save it for a settled forecast, or split it with a stop overnight.` })
  else if (miles >= 15 && miles <= 20) notes.push({ tone: 'ok', text: 'A classic charter day: enough sailing to feel you have been somewhere, with time to stop.' })
  if (leave < 8 * 60) notes.push({ tone: 'warn', text: `You would have to leave at ${clock(leave)}. Shorten the day, cut the stops or plan to arrive later.` })
  if (arrive > 16 * 60) notes.push({ tone: 'warn', text: 'Arriving after four: the afternoon breeze is at its strongest and the best berths and buoys may be gone.' })
  if (spare < 120) notes.push({ tone: 'warn', text: `Only ${hm(Math.max(0, spare))} of daylight in hand. Charter contracts usually forbid sailing after dark, so build in more margin.` })
  if (!notes.some((n) => n.tone === 'warn')) notes.push({ tone: 'ok', text: `Leave by ${clock(leave)} and you have ${hm(spare)} of daylight in hand when you arrive.` })

  const pill = (on: boolean) => `rounded-lg border px-2.5 py-1.5 text-sm ${on ? 'border-teal bg-teal font-semibold text-white' : 'border-border bg-white hover:bg-teal-light'}`

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-text-primary">
          Leg
          <select value={choice} onChange={(e) => setChoice(e.target.value)} className={`${input} mt-1 block w-full font-normal`}>
            {areas.map((a) => (
              <optgroup key={a} label={a}>
                {legs.map((l, i) => (l.area === a ? <option key={i} value={i}>{`${l.from} to ${l.to}: ${l.nm} M`}</option> : null))}
              </optgroup>
            ))}
            <option value="own">My own distance</option>
          </select>
        </label>
        {choice === 'own' ? (
          <NumberField id="dp-own" label="Distance" unit="M" value={own} onChange={setOwn} min={1} max={60} step={1} />
        ) : (
          <p className="self-end rounded-lg bg-bg px-3 py-2 text-sm text-text-secondary">
            {miles} miles, from our cruising guide. Measure it yourself on the chart or the plotter before you go.
          </p>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold">Planning speed</p>
        <div className="mt-1 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Planning speed">
          {SPEEDS.map((s) => (
            <button key={s} type="button" role="radio" aria-checked={s === speed} onClick={() => setSpeed(s)} className={`${pill(s === speed)} font-mono`}>{num(s)} kn</button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold">Stops on the way (swim, lunch)</p>
        <div className="mt-1 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Stops on the way">
          {STOPS.map((s) => (
            <button key={s} type="button" role="radio" aria-checked={s === stops} onClick={() => setStops(s)} className={pill(s === stops)}>{s === 0 ? 'None' : hm(s)}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Arrive by
          <select value={arrive} onChange={(e) => setArrive(Number(e.target.value))} className={`${input} mt-1 block w-full font-mono font-normal`}>
            {ARRIVE_TIMES.map((m) => <option key={m} value={m}>{clock(m)}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Sunset on your dates
          <select value={sunset} onChange={(e) => setSunset(Number(e.target.value))} className={`${input} mt-1 block w-full font-mono font-normal`}>
            {SUNSET_TIMES.map((m) => <option key={m} value={m}>{clock(m)}</option>)}
          </select>
        </label>
      </div>

      <div aria-hidden="true">
        <div className="relative h-12 overflow-hidden rounded-lg border border-border bg-white">
          <div className="absolute inset-y-0 bg-[#fdf3d7]" style={{ left: pct(13 * 60), width: `calc(${pct(18 * 60)} - ${pct(13 * 60)})` }} />
          <div className="absolute inset-y-0 bg-navy/80" style={{ left: pct(sunset), right: 0 }} />
          {leave >= T0 && <div className="absolute inset-y-2 rounded bg-teal" style={{ left: pct(leave), width: `calc(${pct(arrive - stops)} - ${pct(leave)})` }} />}
          {stops > 0 && <div className="absolute inset-y-2 rounded bg-[#f5b301]" style={{ left: pct(arrive - stops), width: `calc(${pct(arrive)} - ${pct(arrive - stops)})` }} />}
          <div className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: pct(arrive) }} />
        </div>
        <div className="relative mt-1 h-4 text-[11px] text-text-secondary">
          {[8, 10, 12, 14, 16, 18, 20].map((h) => (
            <span key={h} className="absolute -translate-x-1/2 font-mono" style={{ left: pct(h * 60) }}>{String(h).padStart(2, '0')}00</span>
          ))}
        </div>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
          <span><span className="mr-1 inline-block h-2.5 w-4 rounded bg-teal align-middle" />Sailing</span>
          <span><span className="mr-1 inline-block h-2.5 w-4 rounded bg-[#f5b301] align-middle" />Stops</span>
          <span><span className="mr-1 inline-block h-2.5 w-4 rounded bg-[#fdf3d7] align-middle" />Afternoon breeze</span>
          <span><span className="mr-1 inline-block h-2.5 w-4 rounded bg-navy/80 align-middle" />After sunset</span>
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3" aria-live="polite">
        <div className="rounded-lg bg-bg px-3 py-2">
          <p className="text-xs text-text-secondary">Sailing time</p>
          <p className="font-mono text-lg font-bold">{hm(sailing)}</p>
          <p className="font-mono text-xs text-text-secondary">60 × {num(miles)} ÷ {num(speed)} = {sailing} min</p>
        </div>
        <div className="rounded-lg bg-bg px-3 py-2">
          <p className="text-xs text-text-secondary">Leave by</p>
          <p className="font-mono text-lg font-bold">{clock(leave)}</p>
          <p className="font-mono text-xs text-text-secondary">{clock(arrive)} − {hm(sailing + stops)}</p>
        </div>
        <div className="rounded-lg bg-bg px-3 py-2">
          <p className="text-xs text-text-secondary">Daylight in hand on arrival</p>
          <p className="font-mono text-lg font-bold">{hm(Math.max(0, spare))}</p>
          <p className="font-mono text-xs text-text-secondary">sunset {clock(sunset)}</p>
        </div>
      </div>
      <ul className="not-lesson space-y-1.5 text-sm">
        {notes.map((n, i) => (
          <li key={i} className={`rounded-lg px-3 py-2 ${n.tone === 'ok' ? 'bg-success-bg text-success-text' : 'bg-warning-bg text-warning-text'}`}>{n.text}</li>
        ))}
      </ul>
    </div>
  )
}
