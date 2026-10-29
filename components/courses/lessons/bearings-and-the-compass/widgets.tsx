'use client'

// Interactive widgets for "Bearings and the compass", ported from the Boaty
// Jobs lessons: a compass rose you can turn (direction-and-bearings), a
// true/magnetic converter, a hand-bearing compass you take bearings with
// from a hidden position (position-lines), a two and three bearing fix
// builder (three-point-fix), a transit figure (transits-and-clearing-lines),
// and a new plotter cross-check.

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { bearingDiff, cutAngle, formatBearing, formatPosition, norm360, positionLineCrossing, reciprocal, rhumbBearing, rhumbDestination, rhumbDistance, type LatLon } from '@/lib/courses/geo'
import { checkBearing } from '@/lib/courses/answers'
import { CHART_HEIGHT, CHART_WIDTH, project, r2, viewAround, type ViewRect } from '@/lib/courses/navigation/chart-geometry'
import { CHART_BOUNDS, feature, km } from '@/lib/courses/navigation/practice-chart'
import { mulberry32 } from '@/lib/courses/random'
import { Figure } from '../../LessonParts'
import PracticeChart, { CHART_COLOURS, ChartFix, ChartLine, ChartPoint, ChartText } from '../../PracticeChart'
import { ChartYacht, CompassSight } from './art'
import {
  DEMO_AT, DEMO_IDS, DEMO_MAG, DEMO_TIME, KIND_LABEL, VAR_DEG, VAR_ROUNDED, cockedHat, fixObject, formatHat, minCut,
  randomScenario, sightingsFrom, toMag, type Hat, type Scenario, type Sighting,
} from './fix'
import { LANDMARKS, SCENARIOS, VAR, VAR_ROUND_TEXT, VAR_TEXT, canSee, distanceOffLine, landmark, observe } from './lines'
import { POINTS, formatDeg, nearestPoint } from './points'
import { landInFront } from './sight'
import type { Transit } from './transit'

const DEG = Math.PI / 180
const btnTeal = 'rounded-lg bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-40'
const btnPlain = 'rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-text-primary hover:bg-teal-light disabled:cursor-not-allowed disabled:opacity-40'

/* ---- compass dial ---- */
interface Challenge {
  prompt: string
  target: number
  explain: string
}

const CHALLENGES: Challenge[] = [
  { prompt: 'Set the pointer to 135°T.', target: 135, explain: '135° is south-east (SE), halfway between east (090°) and south (180°).' },
  { prompt: 'Point to west-south-west (WSW).', target: 247.5, explain: 'WSW is 247½°, halfway between south-west (225°) and west (270°). 247° or 248° is as close as this dial goes.' },
  { prompt: 'A buoy bears 070°T from you. Set the bearing of YOU from the buoy.', target: 250, explain: 'That is the reciprocal: 070 + 180 = 250°T. The pointer now aims back from the buoy towards you.' },
  { prompt: 'Set 005°T — and notice how it is written.', target: 5, explain: 'Just east of north. Always three figures: 005°, never 5° or 05°.' },
  { prompt: 'Point to north-north-west (NNW).', target: 337.5, explain: 'NNW is 337½°: halfway between north-west (315°) and north (360°, or 000°).' },
  { prompt: 'Set the reciprocal of 300°T.', target: 120, explain: '300 is 180 or more, so subtract: 300 − 180 = 120°T.' },
]

const ROSE_R = 168

function polar(r: number, deg: number): { x: number; y: number } {
  return { x: r2(Math.sin(deg * DEG) * r), y: r2(-Math.cos(deg * DEG) * r) }
}

function RoseFace() {
  const els: ReactNode[] = []
  for (let d = 0; d < 360; d += 5) {
    const a = polar(ROSE_R, d)
    const b = polar(ROSE_R - (d % 10 === 0 ? 11 : 6), d)
    els.push(<line key={`t${d}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#b5267a" strokeWidth={d % 10 === 0 ? 1.4 : 0.8} />)
    if (d % 30 === 0) {
      const p = polar(ROSE_R - 25, d)
      els.push(
        <text key={`l${d}`} x={p.x} y={r2(p.y + 5)} fontSize={14} fontWeight={600} textAnchor="middle" fill="#b5267a" transform={`rotate(${d} ${p.x} ${p.y})`}>
          {String(d).padStart(3, '0')}
        </text>,
      )
    }
  }
  return (
    <g>
      <circle r={ROSE_R} fill="#fff" stroke="#b5267a" strokeWidth={1.6} />
      <circle r={ROSE_R - 40} fill="none" stroke="#b5267a" strokeOpacity={0.35} strokeWidth={1} />
      {els}
      <text x={0} y={56} fontSize={11} textAnchor="middle" fill="#b5267a" fontWeight={600} opacity={0.8}>TRUE</text>
    </g>
  )
}

/** Point names, drawn over the pointer with a white halo so they stay readable. */
function PointLabels() {
  return (
    <g stroke="#fff" strokeWidth={3.5} paintOrder="stroke" strokeLinejoin="round">
      {POINTS.map((pt) => {
        const r = pt.kind === 'cardinal' ? 100 : pt.kind === 'intercardinal' ? 104 : 118
        const p = polar(r, pt.deg)
        const size = pt.kind === 'cardinal' ? 24 : pt.kind === 'intercardinal' ? 16 : 11
        return (
          <text key={pt.abbr} x={p.x} y={r2(p.y + size * 0.36)} fontSize={size} fontWeight={pt.kind === 'three-letter' ? 600 : 800} textAnchor="middle" fill={pt.kind === 'three-letter' ? '#6B7280' : '#0B1929'}>
            {pt.abbr}
          </text>
        )
      })}
    </g>
  )
}

export function CompassDial() {
  const [deg, setDeg] = useState(45)
  const [ci, setCi] = useState<number | null>(null)
  const [verdict, setVerdict] = useState<'idle' | 'right' | 'wrong'>('idle')
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  function set(d: number) {
    setDeg(Math.round(norm360(d)) % 360)
    if (verdict === 'wrong') setVerdict('idle')
  }

  function fromPointer(e: { clientX: number; clientY: number }) {
    const box = svgRef.current?.getBoundingClientRect()
    if (!box) return
    const dx = e.clientX - (box.left + box.width / 2)
    const dy = e.clientY - (box.top + box.height / 2)
    if (Math.hypot(dx, dy) < 6) return
    set(Math.atan2(dx, -dy) / DEG)
  }

  function down(e: ReactPointerEvent<SVGSVGElement>) {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    fromPointer(e)
  }

  const recip = reciprocal(deg)
  const near = nearestPoint(deg)
  const exact = bearingDiff(deg, near.deg) < 0.01
  const tip = polar(ROSE_R - 14, deg)
  const back = polar(ROSE_R - 14, recip)
  const head = [polar(ROSE_R - 2, deg), polar(ROSE_R - 30, deg - 5), polar(ROSE_R - 30, deg + 5)]
  const challenge = ci === null ? null : CHALLENGES[ci]

  function check() {
    if (!challenge) return
    setVerdict(bearingDiff(deg, challenge.target) <= 1 + 1e-9 ? 'right' : 'wrong')
  }

  return (
    <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <div className="mx-auto w-full max-w-[20rem]">
        <svg
          ref={svgRef}
          viewBox="-190 -190 380 380"
          className="block h-auto w-full cursor-grab select-none"
          style={{ touchAction: 'none' }}
          role="img"
          aria-label={`Compass rose with the pointer on ${formatBearing(deg, 'T')}`}
          onPointerDown={down}
          onPointerMove={(e) => { if (dragging.current) fromPointer(e) }}
          onPointerUp={() => { dragging.current = false }}
          onPointerCancel={() => { dragging.current = false }}
        >
          <g fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif">
            <RoseFace />
            <line x1={0} y1={0} x2={back.x} y2={back.y} stroke={CHART_COLOURS.plotAlt} strokeWidth={3} strokeDasharray="7 6" strokeLinecap="round" />
            <circle cx={back.x} cy={back.y} r={6} fill="#fff" stroke={CHART_COLOURS.plotAlt} strokeWidth={2.5} />
            <line x1={0} y1={0} x2={tip.x} y2={tip.y} stroke="#0B5563" strokeWidth={5} strokeLinecap="round" />
            <polygon points={head.map((p) => `${p.x},${p.y}`).join(' ')} fill="#0B5563" />
            <circle r={8} fill="#0B5563" />
            <circle cx={tip.x} cy={tip.y} r={15} fill="#0B5563" fillOpacity={0.15} stroke="#0B5563" strokeWidth={1.5} />
            <PointLabels />
          </g>
        </svg>
        <p className="mt-1 text-center text-xs text-text-secondary">Drag anywhere on the rose · solid = your direction · dashed = reciprocal</p>
      </div>

      <div className="min-w-0 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center" aria-live="polite">
          <div className="rounded-lg bg-navy px-2 py-2 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Bearing</p>
            <p className="font-mono text-2xl font-bold">{formatBearing(deg, 'T')}</p>
          </div>
          <div className="rounded-lg border border-border bg-bg px-2 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{exact ? 'Point' : 'Nearest point'}</p>
            <p className="text-2xl font-bold text-text-primary">{near.abbr}</p>
            <p className="text-[11px] leading-tight text-text-secondary">{formatDeg(near.deg)}</p>
          </div>
          <div className="rounded-lg border border-[#c2410c]/40 bg-[#c2410c]/5 px-2 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#c2410c]">Reciprocal</p>
            <p className="font-mono text-2xl font-bold text-[#c2410c]">{formatBearing(recip, 'T')}</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary">
          {exact ? <>Exactly <strong className="text-text-primary">{near.name}</strong>.</> : <>Nearest point: <strong className="text-text-primary">{near.name}</strong> ({formatDeg(near.deg)}).</>}
        </p>

        <div>
          <label htmlFor="db-dial-range" className="text-xs font-semibold text-text-secondary">Fine adjust (or use the arrow keys)</label>
          <div className="mt-1 flex items-center gap-1.5">
            <button type="button" onClick={() => set(deg - 10)} className="h-9 min-w-9 rounded-md border border-border px-2 text-sm font-semibold hover:bg-teal-light" aria-label="Turn 10 degrees anticlockwise">−10</button>
            <button type="button" onClick={() => set(deg - 1)} className="h-9 min-w-9 rounded-md border border-border px-2 text-sm font-semibold hover:bg-teal-light" aria-label="Turn 1 degree anticlockwise">−1</button>
            <input
              id="db-dial-range"
              type="range"
              min={0}
              max={359}
              step={1}
              value={deg}
              onChange={(e) => set(Number(e.target.value))}
              aria-valuetext={`${formatBearing(deg, 'T')}, nearest point ${near.name}`}
              className="h-9 min-w-0 flex-1 accent-teal"
            />
            <button type="button" onClick={() => set(deg + 1)} className="h-9 min-w-9 rounded-md border border-border px-2 text-sm font-semibold hover:bg-teal-light" aria-label="Turn 1 degree clockwise">+1</button>
            <button type="button" onClick={() => set(deg + 10)} className="h-9 min-w-9 rounded-md border border-border px-2 text-sm font-semibold hover:bg-teal-light" aria-label="Turn 10 degrees clockwise">+10</button>
          </div>
        </div>

        <div className="rounded-lg border border-teal/30 bg-teal-light/40 p-3">
          {challenge ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wide text-teal">Challenge {ci! + 1} of {CHALLENGES.length}</p>
              <p className="mt-0.5 font-semibold text-text-primary">{challenge.prompt}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {verdict !== 'right' && (
                  <button type="button" onClick={check} className="rounded-lg bg-teal px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal/90">Check</button>
                )}
                <button
                  type="button"
                  onClick={() => { setCi((ci! + 1) % CHALLENGES.length); setVerdict('idle') }}
                  className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium hover:bg-bg"
                >
                  {verdict === 'right' ? 'Next challenge' : 'Skip'}
                </button>
                <span role="status" className="text-sm">
                  {verdict === 'right' && <span className="font-semibold text-success-text">✓ Spot on.</span>}
                  {verdict === 'wrong' && <span className="font-medium text-error-text">Not yet — you are on {formatBearing(deg)}. Try again.</span>}
                </span>
              </div>
              {verdict === 'right' && <p className="mt-2 text-sm text-text-secondary">{challenge.explain}</p>}
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <p className="flex-1 text-sm text-text-secondary">Ready? Set the rose to a bearing, a compass point or a reciprocal.</p>
              <button type="button" onClick={() => { setCi(0); setVerdict('idle') }} className="rounded-lg bg-teal px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal/90">
                Start the challenges
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


/* ---- take a bearing ---- */
/** "1015" + 2 minutes → "1017". */
function addMinutes(time: string, mins: number): string {
  const t = Number(time.slice(0, 2)) * 60 + Number(time.slice(2)) + mins
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}${String(t % 60).padStart(2, '0')}`
}

type Stage = 'pick' | 'ready' | 'swing' | 'read' | 'converted' | 'drawn'

interface Drawn {
  id: string
  fromObject: number
  trueBrg: number
  time: string
}

const SWING_SECONDS = 2.4

/** A view of the area around a scenario: the boat and the landmarks it can see, without giving the boat away. */
function scenarioView(at: LatLon): ViewRect {
  const pts = [at, ...LANDMARKS.filter((l) => canSee(at, l)).map((l) => feature(l.id).at)]
  const lat = (Math.max(...pts.map((p) => p.lat)) + Math.min(...pts.map((p) => p.lat))) / 2
  const lon = (Math.max(...pts.map((p) => p.lon)) + Math.min(...pts.map((p) => p.lon))) / 2
  return viewAround({ lat, lon }, 10, 1)
}

export function TakeABearing() {
  const [si, setSi] = useState(0)
  const [lid, setLid] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('pick')
  const [swing, setSwing] = useState(0)
  const [text, setText] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const [lines, setLines] = useState<Drawn[]>([])
  const [showBoat, setShowBoat] = useState(false)

  const sc = SCENARIOS[si]!
  const obs = lid ? observe(sc.at, lid) : null
  const time = addMinutes(sc.time, lines.length * 2)

  useEffect(() => {
    if (stage !== 'swing') return
    let raf = 0
    const t0 = performance.now()
    const step = (now: number) => {
      const t = (now - t0) / 1000
      if (t >= SWING_SECONDS) {
        setSwing(0)
        setStage('read')
        return
      }
      // The card swings as the boat rolls, the swings dying away.
      setSwing(10 * Math.exp(-t / 0.7) * Math.sin(t * 6.5))
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [stage])

  function newScenario() {
    setSi((si + 1) % SCENARIOS.length)
    setLid(null)
    setStage('pick')
    setLines([])
    setShowBoat(false)
    setText('')
    setHint(null)
  }

  function choose(id: string) {
    setLid(id)
    setStage('ready')
    setText('')
    setHint(null)
  }

  function take() {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setStage(reduce ? 'read' : 'swing')
  }

  function check() {
    if (!obs) return
    if (checkBearing(text, obs.trueBrg, 0.5)) {
      setHint(null)
      setStage('converted')
    } else if (checkBearing(text, obs.magnetic - VAR, 0.5)) {
      setHint(`You added the variation. Westerly variation makes the magnetic figure bigger, so take ${Math.abs(VAR)}° away.`)
    } else if (checkBearing(text, obs.magnetic, 0.5)) {
      setHint('That is still the magnetic reading. Apply the variation before you plot it.')
    } else {
      setHint(`Not quite. Start from ${formatBearing(obs.magnetic, 'M')} and apply ${VAR_ROUND_TEXT} variation.`)
    }
  }

  function draw() {
    if (!obs) return
    setLines([...lines, { id: obs.l.id, fromObject: obs.fromObject, trueBrg: obs.trueBrg, time }])
    setStage('drawn')
  }

  function another() {
    setLid(null)
    setStage('pick')
    setText('')
    setHint(null)
  }

  const used = new Set(lines.map((l) => l.id))
  const cardValue = obs && stage !== 'pick' && stage !== 'ready' ? obs.magnetic + swing : null
  const crossing = lines.length >= 2
    ? positionLineCrossing(feature(lines[0]!.id).at, lines[0]!.trueBrg, feature(lines[1]!.id).at, lines[1]!.trueBrg)
    : null
  const cut = lines.length >= 2 ? Math.round(cutAngle(lines[0]!.trueBrg, lines[1]!.trueBrg)) : 0
  // The second object sits on (or very near) the first line: the two are in transit.
  const inLine = lines.length >= 2 && cut < 5 && distanceOffLine(feature(lines[0]!.id).at, lines[0]!.fromObject, feature(lines[1]!.id).at) < 0.15
  const last = lines[lines.length - 1]
  const offLine = last ? distanceOffLine(feature(last.id).at, last.fromObject, sc.at) : 0
  const btn = 'rounded-lg px-3 py-2 text-sm font-semibold'

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-bg px-3 py-2">
          <p className="min-w-0 flex-1 text-sm text-text-primary">
            <span className="font-semibold">Position {si + 1} of {SCENARIOS.length}:</span> you are somewhere {sc.where}.
          </p>
          <button type="button" onClick={newScenario} className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium hover:bg-teal-light">
            New position
          </button>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Landmarks</p>
          <div className="mt-1 grid grid-cols-2 gap-1.5 sm:grid-cols-3" role="group" aria-label="Choose a landmark">
            {LANDMARKS.map((l) => {
              const seen = canSee(sc.at, l)
              const done = used.has(l.id)
              const on = lid === l.id && !done
              const busy = stage === 'swing' || stage === 'read' || stage === 'converted'
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => choose(l.id)}
                  disabled={!seen || done || busy}
                  aria-pressed={on}
                  className={[
                    'min-h-11 rounded-lg border px-2 py-1.5 text-left text-sm leading-tight',
                    on ? 'border-teal bg-teal text-white' : 'border-border bg-white hover:bg-teal-light',
                    'disabled:cursor-not-allowed disabled:opacity-100',
                    !seen ? 'disabled:bg-bg disabled:text-text-secondary/70' : done ? 'disabled:border-success/50 disabled:bg-success/10' : '',
                  ].join(' ')}
                >
                  {l.label}
                  <span className="block text-[11px] font-normal opacity-80">{!seen ? 'not in view' : done ? '✓ line drawn' : 'in view'}</span>
                </button>
              )
            })}
          </div>
        </div>

        <CompassSight
          art={obs ? obs.l.art : null}
          value={cardValue}
          dim={stage === 'swing'}
          label={obs ? `Hand-bearing compass sighted on ${obs.l.called}${stage === 'read' || stage === 'converted' || stage === 'drawn' ? `, reading ${formatBearing(obs.magnetic, 'M')}` : ''}` : 'Hand-bearing compass: no landmark chosen yet'}
        />

        <div className="rounded-lg border border-teal/30 bg-teal-light/40 p-3 text-sm leading-relaxed" aria-live="polite">
          {stage === 'pick' && (
            <p><strong>1. Choose a landmark</strong> you can see. Greyed-out ones are hidden behind the island or too far away to use.</p>
          )}
          {stage === 'ready' && obs && (
            <div className="space-y-2">
              <p><strong>2. Take the bearing.</strong> Brace yourself, hold the compass level at eye height and put {obs.l.called} on the lubber line.</p>
              <button type="button" onClick={take} className={`${btn} bg-teal text-white hover:bg-teal/90`}>Take the bearing</button>
            </div>
          )}
          {stage === 'swing' && <p className="font-medium">Hold steady… the card is still swinging. Wait for it to settle.</p>}
          {stage === 'read' && obs && (
            <div className="space-y-2">
              <p>
                Card settled: <strong className="font-mono text-base">{formatBearing(obs.magnetic, 'M')}</strong>. Note it straight away
                with the time and log: <span className="font-mono">{time} · log {obs ? sc.log.toFixed(1) : ''}</span>.
              </p>
              <p><strong>3. Convert to true.</strong> Variation on the practice chart is {VAR_TEXT} for the course year: call it {VAR_ROUND_TEXT}.</p>
              <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) check() }}>
                <label htmlFor="pl-true" className="sr-only">True bearing</label>
                <input
                  id="pl-true"
                  value={text}
                  onChange={(e) => { setText(e.target.value); setHint(null) }}
                  inputMode="numeric"
                  placeholder="e.g. 045"
                  className="w-24 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
                <span className="text-sm text-text-secondary">°T</span>
                <button type="submit" disabled={!text.trim()} className={`${btn} bg-teal text-white hover:bg-teal/90 disabled:opacity-40`}>Check</button>
                <button type="button" onClick={() => { setText(String(Math.round(obs.trueBrg)).padStart(3, '0')); setHint(null); setStage('converted') }} className={`${btn} border border-border bg-white font-medium hover:bg-bg`}>
                  Show me
                </button>
              </form>
              {hint && <p className="font-medium text-error-text">{hint}</p>}
            </div>
          )}
          {stage === 'converted' && obs && (
            <div className="space-y-2">
              <p>
                <span className="font-semibold text-success-text">✓ {formatBearing(obs.trueBrg, 'T')}.</span> Variation west, magnetic best:
                {' '}{formatBearing(obs.magnetic, 'M')} − {Math.abs(VAR)}° = {formatBearing(obs.trueBrg, 'T')}. No deviation: you were well away from the
                boat’s magnetic influences.
              </p>
              <p>
                <strong>4. Plot it.</strong> From {obs.l.called} the line runs back out towards you on the reciprocal,{' '}
                <strong>{formatBearing(obs.fromObject, 'T')}</strong>.
              </p>
              <button type="button" onClick={draw} className={`${btn} bg-teal text-white hover:bg-teal/90`}>Draw the position line</button>
            </div>
          )}
          {stage === 'drawn' && last && (
            <div className="space-y-2">
              <p className="font-medium text-teal md:hidden">Your line is drawn on the chart below ↓</p>
              <p>
                You are <strong>somewhere on the {last.time} line</strong> — but one line can’t say where along it.
                {lines.length >= 2 && (crossing && cut >= 30
                  ? <> Your first two lines cross close to where you are: that is the start of a <strong>fix</strong>, and a third bearing (the fix builder below) makes it reliable.</>
                  : <> {inLine
                    ? <>Your first two lines lie almost on top of each other: from here the two objects are nearly in line (a transit, see below), so they can’t cross to give a fix.</>
                    : crossing ? <>Your first two lines cross at only {cut}°, a shallow angle, so a small error slides their crossing a long way along them.</> : <>Your first two lines are parallel, so they don’t cross at all.</>} The fix builder below shows how to choose objects whose lines cross at a good angle.</>)}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setShowBoat(!showBoat)} className={`${btn} bg-teal text-white hover:bg-teal/90`} aria-pressed={showBoat}>
                  {showBoat ? 'Hide the boat' : 'Show where the boat is'}
                </button>
                {LANDMARKS.some((l) => canSee(sc.at, l) && !used.has(l.id)) && (
                  <button type="button" onClick={another} className={`${btn} border border-border bg-white font-medium hover:bg-bg`}>Take another bearing</button>
                )}
              </div>
              {showBoat && (
                <p className="text-text-secondary">
                  The boat is {Math.round((offLine * 1852) / 10) * 10} m off your latest line — the compass reads only to the nearest degree, and the
                  variation was rounded. That is as close as a hand-bearing compass gets.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <PracticeChart view={scenarioView(sc.at)} zoomable highlight={lid && stage !== 'drawn' ? [lid] : undefined} title="Practice chart: your position lines">
          {lines.map((l) => {
            const lm = landmark(l.id)
            return (
              <g key={l.id}>
                <ChartLine from={lm.f.at} to={rhumbDestination(lm.f.at, l.fromObject, 16)} colour={CHART_COLOURS.plotAlt} width={2.4} />
                <ChartText at={rhumbDestination(lm.f.at, l.fromObject, landInFront(sc.at, l.id) + 1)} colour={CHART_COLOURS.plotAlt} size={17} bold dx={12} anchor="start">
                  {l.time}
                </ChartText>
              </g>
            )
          })}
          {showBoat && <ChartYacht at={sc.at} heading={sc.heading} scale={0.3} />}
        </PracticeChart>
        <p className="mt-1 text-xs text-text-secondary">Use + / − to zoom, and drag to move around the chart.</p>
      </div>
    </div>
  )
}


/* ---- fix ---- */
/** Colours for the three position lines (the fix itself is drawn in the standard orange). */
export const LINE_COLOURS = ['#0f766e', '#1d4ed8', '#7c3aed']
const REAL_COLOUR = '#15803d'

/** A position line through an object, drawn from just beyond it back towards the boat. */
export function PositionLine({ through, bearing, colour, width = 2, progress = 1, dash, beyond = 0.4, length = 9 }: {
  through: LatLon; bearing: number; colour: string; width?: number; progress?: number; dash?: string; beyond?: number; length?: number
}) {
  const start = beyond > 0 ? rhumbDestination(through, bearing, beyond) : through
  const end = rhumbDestination(through, reciprocal(bearing), length)
  return <ChartLine from={start} to={end} colour={colour} width={width} progress={progress} dash={dash} />
}

/** The cocked hat as a shaded triangle. */
export function HatShape({ hat, colour = '#c2410c', opacity = 1, width = 1.2 }: { hat: Hat; colour?: string; opacity?: number; width?: number }) {
  if (!hat.corners) return null
  const pts = hat.corners.map((c) => project(c))
  return <polygon points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill={colour} fillOpacity={0.18} stroke={colour} strokeWidth={width} strokeLinejoin="round" opacity={opacity} />
}

/** Scale a chart symbol about its own position (so it stays a sensible size in a zoomed view). */
function Scaled({ at, k, children }: { at: LatLon; k: number; children: ReactNode }) {
  const p = project(at)
  return <g transform={`translate(${p.x} ${p.y}) scale(${r2(k)}) translate(${-p.x} ${-p.y})`}>{children}</g>
}

function onChart(p: LatLon | null): p is LatLon {
  return !!p && p.lat > CHART_BOUNDS.south && p.lat < CHART_BOUNDS.north && p.lon > CHART_BOUNDS.west && p.lon < CHART_BOUNDS.east
}

/** A 4:3 view that shows every point given, at least `minNm` across. */
export function fitView(points: LatLon[], minNm = 4, margin = 1.25, aspect = 4 / 3): ViewRect {
  const lats = points.map((p) => p.lat)
  const lons = points.map((p) => p.lon)
  const centre = { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lon: (Math.min(...lons) + Math.max(...lons)) / 2 }
  const cos = Math.cos((centre.lat * Math.PI) / 180)
  const widthNm = (Math.max(...lons) - Math.min(...lons)) * 60 * cos
  const heightNm = (Math.max(...lats) - Math.min(...lats)) * 60
  return viewAround(centre, Math.max(minNm, widthNm * margin + 1, heightNm * aspect * margin + 1), aspect)
}

/* ------------------------------------------------------------------ */
/* 1. The three-point fix builder                                      */
/* ------------------------------------------------------------------ */

interface Observation {
  sighting: Sighting
  /** Read on the hand-bearing compass (°M, whole degrees). */
  magnetic: number
  /** What it converts to (°T). */
  trueBearing: number
}

interface Round {
  scenario: Scenario
  observations: Observation[]
  time: string
}

const DEMO_ROUND_SCENARIO: Scenario = { at: DEMO_AT, sightings: sightingsFrom(DEMO_AT) }

function makeRound(n: number): Round {
  const rng = mulberry32(n * 7919 + 101)
  const scenario = n === 0 ? DEMO_ROUND_SCENARIO : randomScenario(rng, { needPoor: true, minObjects: 5 })
  const observations = scenario.sightings.map((s) => {
    // A hand-bearing compass is good to a degree or two; a rounded hill top is much harder to pin down.
    const spread = s.obj.kind === 'summit' ? 4 : 1.5
    const err = (rng() * 2 - 1) * spread
    const demo = n === 0 ? DEMO_IDS.indexOf(s.obj.id) : -1
    const magnetic = demo >= 0 ? DEMO_MAG[demo]! : toMag(Math.round(s.bearing + err) % 360)
    return { sighting: s, magnetic, trueBearing: (magnetic - VAR_DEG + 360) % 360 }
  })
  const time = n === 0 ? DEMO_TIME : `${String(8 + Math.floor(rng() * 9)).padStart(2, '0')}${String(Math.floor(rng() * 12) * 5).padStart(2, '0')}`
  return { scenario, observations, time }
}

interface Attempt {
  names: string
  cut: number
  hat: number
  error: number
}

function verdict(cut: number): { text: string; tone: string } {
  if (cut >= 45) return { text: 'Well spread: the lines cut at good, wide angles.', tone: 'text-success-text' }
  if (cut >= 30) return { text: 'Fair: usable, but one pair of lines cuts at a fairly shallow angle.', tone: 'text-text-primary' }
  return { text: 'Poorly spread: at least two lines cut at a shallow angle, so small errors slide the crossing a long way.', tone: 'text-error-text' }
}

export function FixBuilder() {
  const [n, setN] = useState(0)
  const round = useMemo(() => makeRound(n), [n])
  const [chosen, setChosen] = useState<string[]>([])
  const [typed, setTyped] = useState<Record<string, string>>({})
  const [plotted, setPlotted] = useState<Record<string, boolean>>({})
  const [wrong, setWrong] = useState<Record<string, boolean>>({})
  const [revealed, setRevealed] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const [attempts, setAttempts] = useState<Attempt[]>([])

  const obsById = (id: string) => round.observations.find((o) => o.sighting.obj.id === id)!
  const picked = chosen.map(obsById)
  const allPlotted = picked.length === 3 && picked.every((o) => plotted[o.sighting.obj.id])
  const hat = allPlotted ? cockedHat(picked.map((o) => o.sighting.at), picked.map((o) => o.trueBearing)) : null
  const cut = allPlotted ? minCut(picked.map((o) => o.trueBearing)) : 0
  const error = hat?.centre ? rhumbDistance(hat.centre, round.scenario.at) : Infinity
  const fixShown = hat && onChart(hat.centre) && hat.size < 15

  const wideView = useMemo(
    () => fitView([round.scenario.at, ...round.observations.map((o) => o.sighting.at)], 5),
    [round],
  )
  const hatView = hat?.centre && fixShown
    ? fitView(revealed ? [hat.centre, round.scenario.at, ...(hat.corners ?? [])] : [hat.centre, ...(hat.corners ?? [])], 2.5, 1.6)
    : null
  const view = zoomed && hatView ? hatView : wideView
  // Symbols and lines shrink with the zoom, so the hat isn't hidden under the fix symbol.
  const k = Math.max(0.25, view.w / wideView.w)

  function resetPlot() {
    setChosen([])
    setTyped({})
    setPlotted({})
    setWrong({})
    setRevealed(false)
    setZoomed(false)
  }

  function newPosition() {
    setN(n + 1)
    setAttempts([])
    resetPlot()
  }

  function toggle(id: string) {
    if (chosen.includes(id)) {
      setChosen(chosen.filter((x) => x !== id))
      setPlotted({ ...plotted, [id]: false })
      setRevealed(false)
      setZoomed(false)
    } else if (chosen.length < 3) {
      setChosen([...chosen, id])
    }
  }

  function plot(o: Observation) {
    const id = o.sighting.obj.id
    const v = Number((typed[id] ?? '').replace(/[^\d.]/g, ''))
    const ok = (typed[id] ?? '').trim() !== '' && Math.round(v) % 360 === o.trueBearing
    setWrong({ ...wrong, [id]: !ok })
    if (ok) setPlotted({ ...plotted, [id]: true })
  }

  function convertAll() {
    const t = { ...typed }
    const p = { ...plotted }
    for (const o of picked) {
      t[o.sighting.obj.id] = String(o.trueBearing).padStart(3, '0')
      p[o.sighting.obj.id] = true
    }
    setTyped(t)
    setPlotted(p)
    setWrong({})
  }

  function reveal() {
    setRevealed(true)
    if (hat) {
      setAttempts([...attempts, { names: picked.map((o) => o.sighting.obj.label).join(', '), cut, hat: hat.size, error }])
    }
  }

  const v = allPlotted ? verdict(cut) : null

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 text-sm text-text-primary">
          <strong>Position {n + 1}</strong> · time {round.time} · the boat is hidden somewhere on this chart.
        </p>
        <button type="button" onClick={newPosition} className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium hover:bg-bg">
          New position
        </button>
      </div>

      <div className="mt-2">
        <PracticeChart view={view} zoomable highlight={chosen} title="Practice chart for the three-point fix builder">
          {picked.map((o, i) => plotted[o.sighting.obj.id] && (
            <PositionLine key={o.sighting.obj.id} through={o.sighting.at} bearing={o.trueBearing} colour={LINE_COLOURS[i]!} width={r2(1.8 * Math.max(k, 0.4))} length={o.sighting.distance + 3} />
          ))}
          {hat && fixShown && <HatShape hat={hat} width={r2(1.2 * k)} />}
          {hat && fixShown && <Scaled at={hat.centre!} k={k}><ChartFix at={hat.centre!} label={round.time} /></Scaled>}
          {revealed && <Scaled at={round.scenario.at} k={k}><ChartPoint at={round.scenario.at} colour={REAL_COLOUR} r={3.5} /></Scaled>}
        </PracticeChart>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">1. Choose three objects <span className="font-normal text-text-secondary">({chosen.length}/3) — each shows its hand-bearing compass reading</span></p>
          <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Objects in sight">
            {round.observations.map((o) => {
              const id = o.sighting.obj.id
              const on = chosen.includes(id)
              const slot = chosen.indexOf(id)
              const full = !on && chosen.length >= 3
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  aria-pressed={on}
                  disabled={full}
                  className={[
                    'flex min-h-11 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors disabled:opacity-40',
                    on ? 'border-teal bg-teal-light' : 'border-border bg-white hover:bg-teal-light/50',
                  ].join(' ')}
                >
                  {on && <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ background: LINE_COLOURS[slot] }} />}
                  <span>
                    <span className="block font-semibold leading-tight text-text-primary">{o.sighting.obj.label}</span>
                    <span className="block text-xs leading-tight text-text-secondary">{KIND_LABEL[o.sighting.obj.kind]} · <span className="font-mono">{formatBearing(o.magnetic, 'M')}</span></span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {picked.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-text-primary">2. Convert each bearing to true and plot it</p>
            <p className="text-xs text-text-secondary">Variation {VAR_TEXT} on the practice chart, {VAR_ROUNDED} for chart work. Variation west, magnetic best: true is {VAR_DEG}° less than magnetic.</p>
            <ul className="not-lesson mt-1.5 space-y-1.5">
              {picked.map((o, i) => {
                const id = o.sighting.obj.id
                const done = plotted[id]
                return (
                  <li key={id} className="flex flex-wrap items-center gap-2 rounded-lg bg-bg px-2.5 py-1.5 text-sm">
                    <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ background: LINE_COLOURS[i] }} />
                    <span className="min-w-[9rem] flex-1 font-medium">{o.sighting.obj.label}</span>
                    <span className="font-mono">{formatBearing(o.magnetic, 'M')} →</span>
                    {done ? (
                      <span className="font-mono font-semibold text-success-text">{formatBearing(o.trueBearing, 'T')} ✓ plotted</span>
                    ) : (
                      <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); plot(o) }}>
                        <input
                          value={typed[id] ?? ''}
                          onChange={(e) => { setTyped({ ...typed, [id]: e.target.value }); setWrong({ ...wrong, [id]: false }) }}
                          inputMode="numeric"
                          aria-label={`True bearing of ${o.sighting.obj.label}`}
                          placeholder="°T"
                          className="w-20 rounded-md border border-border bg-white px-2 py-1.5 font-mono focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
                        />
                        <button type="submit" className="rounded-md bg-teal px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal/90">Plot</button>
                      </form>
                    )}
                    {wrong[id] && !done && (
                      <span className="w-full text-xs font-medium text-error-text" role="status">
                        Not quite: with westerly variation, true = magnetic − {VAR_DEG}°.
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
            {picked.length === 3 && !allPlotted && (
              <button type="button" onClick={convertAll} className="mt-2 text-sm font-medium text-teal underline underline-offset-2 hover:text-teal/80">
                Convert and plot them all for me
              </button>
            )}
          </div>
        )}

        {allPlotted && hat && (
          <div className="rounded-lg border border-teal/30 bg-teal-light/40 p-3" aria-live="polite">
            <p className="text-sm font-semibold text-text-primary">3. Your cocked hat</p>
            <ul className="not-lesson mt-1 space-y-0.5 text-sm">
              <li>Longest side of the hat: <strong>{formatHat(hat.size)}</strong></li>
              <li>Angles of cut between the lines: <strong>{hat.cuts.map((c) => `${Math.round(c)}°`).join(', ')}</strong> (smallest {Math.round(cut)}°)</li>
              {fixShown && <li>Fix {round.time}: <strong className="font-mono">{formatPosition(hat.centre!)}</strong></li>}
            </ul>
            {v && <p className={`mt-1 text-sm font-medium ${v.tone}`}>{v.text}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {fixShown && (
                <button type="button" onClick={() => setZoomed(!zoomed)} className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium hover:bg-bg">
                  {zoomed ? 'Show the whole area' : 'Zoom to the cocked hat'}
                </button>
              )}
              {!revealed && (
                <button type="button" onClick={reveal} className="rounded-lg bg-teal px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal/90">
                  Reveal the real position
                </button>
              )}
              <button type="button" onClick={resetPlot} className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium hover:bg-bg">
                Try three other objects
              </button>
            </div>
            {revealed && (
              <p className="mt-2 text-sm text-text-primary" role="status">
                The boat was really at <span className="font-mono">{formatPosition(round.scenario.at)}</span> (the green dot).{' '}
                {Number.isFinite(error) ? <>Your fix is <strong>{formatHat(error)}</strong> from it.</> : <>Two of the lines are parallel, so there is no fix.</>}{' '}
                {Number.isFinite(error) && error > 2 * hat.size && error > 0.15 ? 'The hat was small, but the fix is well out: shallow cuts let errors slide along the lines without the hat growing much.' : ''}
              </p>
            )}
          </div>
        )}

        {attempts.length > 0 && (
          <div className="not-lesson overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs sm:text-sm">
              <caption className="bg-bg px-3 py-1.5 text-left text-xs font-semibold text-text-secondary">Your tries at this position — compare a well-spread three with a bunched one</caption>
              <thead className="bg-bg">
                <tr><th className="px-3 py-1.5 font-semibold">Objects</th><th className="px-3 py-1.5 font-semibold">Smallest cut</th><th className="px-3 py-1.5 font-semibold">Hat</th><th className="px-3 py-1.5 font-semibold">Fix error</th></tr>
              </thead>
              <tbody>
                {attempts.map((a, i) => (
                  <tr key={i} className="border-t border-border align-top">
                    <td className="px-3 py-1.5">{a.names}</td>
                    <td className="px-3 py-1.5">{Math.round(a.cut)}°</td>
                    <td className="px-3 py-1.5">{formatHat(a.hat)}</td>
                    <td className="px-3 py-1.5">{Number.isFinite(a.error) ? formatHat(a.error) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * The plotter for exercise questions: type the true bearing of each object
 * and its position line is drawn through it, exactly as typed.
 */
export function FixPlotFigure({ ids, view }: { ids: string[]; view?: ViewRect }) {
  const [typed, setTyped] = useState<string[]>(ids.map(() => ''))
  const [drawn, setDrawn] = useState<Array<number | null>>(ids.map(() => null))
  const points = ids.map((id) => feature(id).at)

  function draw(i: number) {
    const v = Number(typed[i]!.replace(/[^\d.]/g, ''))
    if (typed[i]!.trim() === '' || !Number.isFinite(v) || v < 0 || v > 360) return
    const next = [...drawn]
    next[i] = v % 360
    setDrawn(next)
  }

  return (
    <div className="rounded-lg border border-border bg-white p-2">
      <p className="px-1 text-xs font-semibold uppercase tracking-wide text-teal">Your plotter</p>
      <PracticeChart view={view} zoomable highlight={ids} title="Plotting chart: draw your position lines">
        {drawn.map((b, i) => b !== null && <PositionLine key={i} through={points[i]!} bearing={b} colour={LINE_COLOURS[i]!} width={1.4} beyond={1.5} length={16} />)}
      </PracticeChart>
      <ul className="not-lesson mt-2 space-y-1.5">
        {ids.map((id, i) => {
          const name = fixObject(id).label
          return (
            <li key={id}>
              <form className="flex flex-wrap items-center gap-2 text-sm" onSubmit={(e) => { e.preventDefault(); draw(i) }}>
                <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ background: LINE_COLOURS[i] }} />
                <span className="min-w-[8rem] flex-1">{name}</span>
                <input
                  value={typed[i]}
                  onChange={(e) => { const t = [...typed]; t[i] = e.target.value; setTyped(t) }}
                  inputMode="numeric"
                  aria-label={`True bearing to draw through ${name}`}
                  placeholder="°T"
                  className="w-20 rounded-md border border-border bg-white px-2 py-1.5 font-mono focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
                <button type="submit" className="rounded-md bg-teal px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal/90">Draw</button>
                {drawn[i] !== null && <span className="font-mono text-xs text-text-secondary">{formatBearing(drawn[i]!, 'T')} drawn</span>}
              </form>
            </li>
          )
        })}
      </ul>
      <p className="mt-1.5 px-1 text-xs text-text-secondary">Type each bearing in °T and press Draw. Then tap the middle of your cocked hat on the chart below.</p>
    </div>
  )
}

/* ---- transit ---- */
export function TransitFigure({ transit, seaward, label, highlight = true, extra }: {
  transit: Transit; seaward: number; label: string; highlight?: boolean; extra?: ReactNode
}) {
  const far = rhumbDestination(transit.front.at, reciprocal(transit.bearing), seaward)
  const tag = rhumbDestination(transit.front.at, reciprocal(transit.bearing), seaward * 0.7)
  // Frame the whole line, from the rear object out to sea, with a margin.
  const a = project(transit.rear.at)
  const b = project(far)
  const aspect = 4 / 3
  const w = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y) * aspect) * 1.3
  const view = clampView({ x: (a.x + b.x) / 2 - w / 2, y: (a.y + b.y) / 2 - w / aspect / 2, w, h: w / aspect })
  const east = norm360(reciprocal(transit.bearing)) < 180
  return (
    <Figure caption={label}>
      <PracticeChart view={view} highlight={highlight ? [transit.front.id, transit.rear.id] : undefined} title={`Practice chart: ${label}`}>
        <ChartLine from={far} to={transit.front.at} colour={CHART_COLOURS.plot} width={2} />
        <ChartLine from={transit.front.at} to={transit.rear.at} colour={CHART_COLOURS.plot} width={1.4} dash="5 4" />
        <ChartText at={tag} colour={CHART_COLOURS.plot} size={10} dx={east ? -8 : 8} dy={-4} anchor={east ? 'end' : 'start'} bold>{formatBearing(transit.bearing)}</ChartText>
        {extra}
      </PracticeChart>
    </Figure>
  )
}

function clampView(v: ViewRect): ViewRect {
  const w = Math.min(v.w, CHART_WIDTH)
  const h = Math.min(v.h, CHART_HEIGHT)
  return { w, h, x: Math.min(Math.max(v.x, 0), CHART_WIDTH - w), y: Math.min(Math.max(v.y, 0), CHART_HEIGHT - h) }
}

/* ------------------------------------------------------------------ */
/* True and magnetic: a converter                                       */
/* ------------------------------------------------------------------ */

const PRESETS: Array<{ label: string; v: number }> = [
  { label: 'Practice chart: 3°W', v: -3 },
  { label: 'A few degrees east: 4°E', v: 4 },
  { label: 'None: 0°', v: 0 },
  { label: 'A big westerly: 14°W', v: -14 },
]

export function VariationFlip() {
  const [mag, setMag] = useState(120)
  const [v, setV] = useState(-3)
  const tru = norm360(mag + v)
  const east = v > 0
  const sign = v === 0 ? 'no change' : east ? `add ${v}°` : `take off ${-v}°`
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Variation from the compass rose">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" onClick={() => setV(p.v)} aria-pressed={v === p.v}
            className={`min-h-10 rounded-lg border px-3 py-1.5 text-sm ${v === p.v ? 'border-teal bg-teal text-white' : 'border-border bg-white hover:bg-teal-light'}`}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="bc-var" className="text-xs font-semibold text-text-secondary">Variation: <span className="text-text-primary">{v === 0 ? '0°' : `${Math.abs(v)}°${east ? 'E' : 'W'}`}</span></label>
          <input id="bc-var" type="range" min={-15} max={15} step={1} value={v} onChange={(e) => setV(Number(e.target.value))}
            aria-valuetext={v === 0 ? 'no variation' : `${Math.abs(v)} degrees ${east ? 'east' : 'west'}`} className="mt-1 h-9 w-full accent-teal" />
        </div>
        <div>
          <label htmlFor="bc-mag" className="text-xs font-semibold text-text-secondary">Compass reading: <span className="font-mono text-text-primary">{formatBearing(mag, 'M')}</span></label>
          <input id="bc-mag" type="range" min={0} max={359} step={1} value={mag} onChange={(e) => setMag(Number(e.target.value))}
            aria-valuetext={formatBearing(mag, 'M')} className="mt-1 h-9 w-full accent-teal" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-navy px-3 py-2 text-white" aria-live="polite">
        <span className="font-mono text-xl font-bold">{formatBearing(mag, 'M')} → {formatBearing(tru, 'T')}</span>
        <span className="text-sm text-white/80">{sign} to go from the compass to the chart</span>
      </div>
      <p className="text-sm text-text-secondary">
        {v === 0
          ? 'With no variation, compass and chart agree.'
          : east
            ? <>Variation <strong>east</strong>, magnetic <strong>least</strong>: the compass figure is the smaller one, so add {v}° to get true. Going the other way, chart to compass, take {v}° off.</>
            : <>Variation <strong>west</strong>, magnetic <strong>best</strong>: the compass figure is the bigger one, so take {-v}° off to get true. Going the other way, chart to compass, add {-v}°.</>}
        {Math.abs(v) <= 5 && v !== 0 ? ' At this size, a quick glance at the hand-bearing compass is barely affected, but convert anything you plot.' : ''}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* When the plotter and your eyes disagree                              */
/* ------------------------------------------------------------------ */

interface CheckCase {
  id: string
  label: string
  where: string
  /** Where the plotter puts the boat. */
  plotter: LatLon
  /** Where the boat really is. */
  real: LatLon
  landmarkId: string
  why: string
}

export const CHECK_CASES: CheckCase[] = [
  {
    id: 'agree', label: 'Off Port Kerran', where: 'motoring south-east of Port Kerran',
    plotter: SCENARIOS[5]!.at, real: SCENARIOS[5]!.at, landmarkId: 'church',
    why: 'The plotter is right. This is what you should find nearly every time: a quick bearing that agrees is worth having, because now you trust the screen for a reason.',
  },
  {
    id: 'shifted', label: 'South of the island', where: 'sailing along the south of the island',
    plotter: km(2.5, 13.6), real: km(1.9, 14.3), landmarkId: 'kerran-head-lt',
    why: 'The boat is well south-west of where the plotter shows it. On a real charter this happens with an old or badly surveyed electronic chart: the GPS position is fine, but the coastline under it is drawn in the wrong place.',
  },
  {
    id: 'mast', label: 'North-west of Kerran Head', where: 'heading for the anchorage north of the island',
    plotter: km(9.1, 17.2), real: km(9.6, 18.0), landmarkId: 'mast',
    why: 'The plotter has frozen on an old position: the signal dropped out and the screen has not updated, so it shows where you were several minutes ago.',
  },
]

const TOLERANCE = 4

/** What the plotter predicts for a check (°T, and °M with the course's 3°W) and what the hand-bearing compass really reads. */
export function plotterCheck(c: CheckCase): { expectT: number; expectM: number; realM: number; diff: number } {
  const l = landmark(c.landmarkId)
  const expectT = Math.round(rhumbBearing(c.plotter, l.f.at)) % 360
  const expectM = toMag(expectT)
  const realM = observe(c.real, l.id).magnetic
  return { expectT, expectM, realM, diff: Math.round(bearingDiff(realM, expectM)) }
}

export function PlotterCheck() {
  const [ci, setCi] = useState(0)
  const [taken, setTaken] = useState(false)
  const [reveal, setReveal] = useState(false)
  const c = CHECK_CASES[ci]!
  const l = landmark(c.landmarkId)
  const { expectT, expectM, diff } = plotterCheck(c)
  const real = observe(c.real, l.id)
  const ok = diff <= TOLERANCE
  const pts = [c.plotter, c.real, l.f.at]
  const lat = (Math.max(...pts.map((p) => p.lat)) + Math.min(...pts.map((p) => p.lat))) / 2
  const lon = (Math.max(...pts.map((p) => p.lon)) + Math.min(...pts.map((p) => p.lon))) / 2
  const view = viewAround({ lat, lon }, Math.max(6, rhumbDistance(c.plotter, l.f.at) * 1.8), 4 / 3)

  function pick(i: number) {
    setCi(i)
    setTaken(false)
    setReveal(false)
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose a situation">
          {CHECK_CASES.map((k, i) => (
            <button key={k.id} type="button" onClick={() => pick(i)} aria-pressed={i === ci}
              className={`min-h-10 rounded-lg border px-3 py-1.5 text-sm ${i === ci ? 'border-teal bg-teal text-white' : 'border-border bg-white hover:bg-teal-light'}`}>
              {k.label}
            </button>
          ))}
        </div>
        <div className="mt-2">
          <PracticeChart key={c.id} view={view} zoomable highlight={[l.id]} title={`Practice chart: where the plotter puts the boat, ${c.where}`}>
            <ChartLine from={c.plotter} to={l.f.at} colour={CHART_COLOURS.plot} width={1.6} dash="6 4" />
            <ChartPoint at={c.plotter} colour={CHART_COLOURS.plot} r={6} />
            <ChartText at={c.plotter} colour={CHART_COLOURS.plot} size={13} dy={22} bold>Plotter</ChartText>
            {taken && <ChartLine from={l.f.at} to={rhumbDestination(l.f.at, real.fromObject, rhumbDistance(l.f.at, c.real) + 2)} colour={CHART_COLOURS.plotAlt} width={2.2} />}
            {reveal && <ChartYacht at={c.real} heading={90} scale={0.3} />}
          </PracticeChart>
          <p className="mt-1 text-xs text-text-secondary">Green dot: where the plotter says you are. Dashed: the bearing it predicts. Orange: the bearing you actually take.</p>
        </div>
      </div>
      <div className="min-w-0 space-y-3">
        <div className="rounded-lg bg-bg p-3 text-sm leading-relaxed">
          <p>You are {c.where}. The coast does not look quite like the screen, so you check.</p>
          <p className="mt-1">
            <strong>1. Ask the plotter.</strong> From its position, {l.called} bears <span className="font-mono">{formatBearing(expectT, 'T')}</span>,
            which is <strong className="font-mono">{formatBearing(expectM, 'M')}</strong> on the hand-bearing compass (variation {VAR_ROUND_TEXT}).
          </p>
        </div>
        <CompassSight art={l.art} value={taken ? real.magnetic : null} label={taken ? `Hand-bearing compass on ${l.called}, reading ${formatBearing(real.magnetic, 'M')}` : `Hand-bearing compass, not yet read`} />
        {!taken ? (
          <button type="button" className={btnTeal} onClick={() => setTaken(true)}>2. Take the real bearing</button>
        ) : (
          <div className={`rounded-lg border p-3 text-sm leading-relaxed ${ok ? 'border-success/50 bg-success/10' : 'border-warning/60 bg-warning/10'}`} aria-live="polite">
            <p className="font-semibold text-text-primary">
              Compass {formatBearing(real.magnetic, 'M')}, plotter {formatBearing(expectM, 'M')}: {diff === 0 ? 'they agree exactly.' : `${diff}° apart.`}
            </p>
            <p className="mt-1 text-text-secondary">
              {ok
                ? 'Within a few degrees: the plotter and your eyes agree. Carry on, and check again near the next danger.'
                : 'More than a few degrees out, so something is wrong. Slow down, watch the depth sounder, keep clear of anything close, and navigate by what you can see until you know which one to believe.'}
            </p>
            <button type="button" className={`${btnPlain} mt-2`} onClick={() => setReveal(!reveal)} aria-pressed={reveal}>{reveal ? 'Hide the boat' : 'Show where the boat really is'}</button>
            {reveal && <p className="mt-2 text-text-secondary">{c.why}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
