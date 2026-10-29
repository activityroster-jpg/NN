'use client'

// Interactive widgets and figures for Lesson 5, ported from the Boaty Jobs
// lateral-marks lesson and extended so the learner can switch between IALA
// Region A and Region B: a mark as seen from the boat (by day, into the sun
// or at night), a "which side?" pilot into and out of harbour, a lateral
// mark identifier with a quiz, a charter-area region finder, and figures.

import { ChevronLeft, ChevronRight, type LucideIcon, Moon, Sun, Sunrise } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { formatBearing, type LatLon } from '@/lib/courses/geo'
import { viewAround } from '@/lib/courses/navigation/chart-geometry'
import { lightOn, parseLight, type LightCharacteristic } from '@/lib/courses/navigation/lights'
import { km } from '@/lib/courses/navigation/practice-chart'
import { Figure } from '../../LessonParts'
import { LightGlow, RhythmBar } from '../../marks'
import PracticeChart, { CHART_COLOURS, ChartHighlight, ChartLine, ChartText } from '../../PracticeChart'
import { BoatGlyph, LateralMark, PlanBoat, PlanMark, SilhouetteFilter } from './art'
import {
  BUOYS, B_BUOYS, CHANNEL_LON_W, CHARTER_AREAS, LATERAL_TYPES, MEANING, REGIONS, SHORT_NAME, buoyById, coloursText, exampleLight,
  hueWord, inOrder, isCan, lightText, mainHue, onChannel, sayLight, shapeText, shapeWord, sideColour, sideToKeep, topmarkText,
  type Buoy, type Dir, type KerranBuoy, type LateralType, type Region, type Side,
} from './data'

export type Look = 'day' | 'sun' | 'night'

const LOOKS: Array<{ id: Look; label: string; icon: LucideIcon }> = [
  { id: 'day', label: 'Day', icon: Sun },
  { id: 'sun', label: 'Into the sun', icon: Sunrise },
  { id: 'night', label: 'Night', icon: Moon },
]

const btn = 'min-h-10 rounded-control border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 disabled:cursor-not-allowed disabled:opacity-40'
const btnPlain = `${btn} border-border bg-white text-text-primary hover:bg-teal-light`
const btnTeal = `${btn} border-teal bg-teal text-white hover:bg-teal/90`
const seg = (active: boolean) => `${btn} ${active ? 'border-navy bg-navy text-white' : 'border-border bg-white text-text-primary hover:bg-teal-light'}`

/** Seconds since the component mounted (or `active` became true), ticking 20 times a second. */
function useClock(active: boolean): number {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!active) return
    const start = performance.now()
    const id = window.setInterval(() => setSeconds((performance.now() - start) / 1000), 50)
    return () => window.clearInterval(id)
  }, [active])
  return active ? seconds : 0
}

function describeView(type: LateralType, region: Region, look: Look, light: LightCharacteristic): string {
  if (look === 'night') return `At night: a light, ${sayLight(light)}. Nothing else can be seen.`
  if (look === 'sun') return `A dark outline against a low sun: a ${shapeWord(type)}-shaped buoy with a ${shapeWord(type)}-shaped topmark. No colours can be seen.`
  return `A buoy by day: ${coloursText(type, region).toLowerCase()}, ${shapeWord(type)}-shaped, with a ${hueWord(mainHue(type, region))} ${shapeWord(type)} topmark.`
}

/* ------------------------------------------------------------------ */
/* Pickers                                                             */
/* ------------------------------------------------------------------ */

export function RegionPicker({ region, onChange, label = 'Buoyage region' }: { region: Region; onChange: (r: Region) => void; label?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {REGIONS.map((r) => (
        <button key={r} type="button" role="radio" aria-checked={region === r} onClick={() => onChange(r)} className={seg(region === r)}>
          Region {r}
          <span className="ml-1.5 text-xs font-normal opacity-80">{r === 'A' ? 'Med, Seychelles, Thailand' : 'Caribbean, BVI'}</span>
        </button>
      ))}
    </div>
  )
}

function LookPicker({ look, onChange, label }: { look: Look; onChange: (l: Look) => void; label: string }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {LOOKS.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={look === o.id} onClick={() => onChange(o.id)} className={seg(look === o.id)}>
          <o.icon size={16} strokeWidth={1.5} className="mr-1.5 inline-block align-[-3px]" aria-hidden="true" />
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* A mark seen from the boat                                           */
/* ------------------------------------------------------------------ */

const STARS: Array<[number, number]> = [[30, 30], [92, 62], [150, 22], [214, 48], [268, 18], [332, 56], [378, 28], [60, 96], [300, 102], [120, 128], [356, 130]]

/**
 * A lateral mark as seen from the boat, in either region. By day in colour;
 * into the sun as a silhouette; at night only its light, in its real rhythm.
 */
export function MarkView({ type, region = 'A', look, light, showBar = false, className }: {
  type: LateralType; region?: Region; look: Look; light?: LightCharacteristic; showBar?: boolean; className?: string
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const l = light ?? exampleLight(type, region)
  const seconds = useClock(look === 'night')
  const lit = lightOn(l, seconds)
  const x = 200
  const y = 228
  const s = 0.7
  return (
    <svg viewBox="0 0 400 260" className={['block h-auto w-full rounded-lg', className].filter(Boolean).join(' ')} role="img" aria-label={describeView(type, region, look, l)}>
      <defs>
        <linearGradient id={`${uid}sky`} x1="0" y1="0" x2="0" y2="1">
          {look === 'day' && <><stop offset="0" stopColor="#9fcbea" /><stop offset="1" stopColor="#e3f1fa" /></>}
          {look === 'sun' && <><stop offset="0" stopColor="#f6b55c" /><stop offset="0.7" stopColor="#ffe6a8" /><stop offset="1" stopColor="#fff6dc" /></>}
          {look === 'night' && <><stop offset="0" stopColor="#030810" /><stop offset="1" stopColor="#0b1a2c" /></>}
        </linearGradient>
        <SilhouetteFilter id={`${uid}sil`} />
      </defs>
      <rect width={400} height={260} fill={`url(#${uid}sky)`} />
      {look === 'night' && STARS.map(([sx, sy], i) => <circle key={i} cx={sx} cy={sy} r={1} fill="#cbd5e1" opacity={0.55} />)}
      {look === 'sun' && (
        <g>
          <circle cx={262} cy={92} r={70} fill="#fff7d6" opacity={0.45} />
          <circle cx={262} cy={92} r={34} fill="#fffdf2" />
        </g>
      )}
      <rect y={176} width={400} height={84} fill={look === 'day' ? '#2b6a8e' : look === 'sun' ? '#8a6a45' : '#07111d'} />
      {look === 'sun' && <polygon points="232,176 292,176 330,260 194,260" fill="#ffe9b0" opacity={0.55} />}
      {look === 'day' && [196, 214, 236].map((wy) => <line key={wy} x1={20} x2={380} y1={wy} y2={wy} stroke="#ffffff" strokeOpacity={0.12} strokeWidth={2} strokeDasharray="30 22" />)}
      {look === 'night' ? (
        <g>
          {lit && <ellipse cx={x} cy={214} rx={6} ry={22} fill={l.colour === 'R' ? '#ff4d4d' : '#3ee07a'} opacity={0.25} />}
          <LightGlow x={x} y={Math.round((y - 149 * s) * 100) / 100} on={lit} colour={l.colour} r={8} />
        </g>
      ) : (
        <g filter={look === 'sun' ? `url(#${uid}sil)` : undefined}>
          <LateralMark type={type} region={region} x={x} y={y} scale={s} />
        </g>
      )}
      {look === 'night' && showBar && <RhythmBar light={l} x={60} y={236} width={280} height={14} at={seconds % l.period} />}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* 1. The "which side?" pilot                                          */
/* ------------------------------------------------------------------ */

interface PilotStep { id: string; dir: Dir }

function defaultSteps(region: Region): PilotStep[] {
  return [
    ...inOrder(region, 'in').map((b) => ({ id: b.id, dir: 'in' as const })),
    ...inOrder(region, 'out').map((b) => ({ id: b.id, dir: 'out' as const })),
  ]
}

function pilotFeedback(region: Region, b: Buoy, dir: Dir, kept: Side, look: Look): { ok: boolean; head: string; body: string } {
  const right = sideToKeep(b.type, dir)
  const colour = hueWord(sideColour(b.type, region))
  const shape = b.type === 'port' ? 'can' : 'cone'
  const what = `That is ${b.name}, a ${b.type}-hand mark (${colour} ${shape}, ${b.light}).`
  const cue = look === 'night'
    ? `At night its ${colour} light tells you: in Region ${region}, ${colour} is the ${b.type}-hand colour.`
    : look === 'sun'
      ? `Even with no colour to see, its ${shape} shape and ${shape} topmark give it away, in either region.`
      : ''
  const why = dir === 'in'
    ? `Entering harbour you are going with the direction of buoyage, so keep it on your ${right} side.`
    : `Leaving harbour you are going against the direction of buoyage, so everything reverses: keep it on your ${right} side.`
  if (kept === right) return { ok: true, head: `✓ Right: keep it on your ${right} side.`, body: [what, cue, why].filter(Boolean).join(' ') }
  return {
    ok: false,
    head: '✗ That takes you outside the channel.',
    body: [what, cue, why, `Keeping it to ${kept} puts you on its far side, outside the buoyed channel.`].filter(Boolean).join(' '),
  }
}

// Region A: Port Kerran on the practice chart.
const latMinOf = (p: LatLon) => (p.lat - 49 - 40 / 60) * 60
const lonMinWOf = (p: LatLon) => (-p.lon - 4) * 60
const PLAN_VIEW = viewAround(onChannel(4.12), 2.5, 1)
const FINISH_A = onChannel(3.3)

function stationA(step: PilotStep): { at: LatLon; heading: number } {
  const gate = buoyById(step.id).gate
  if (step.dir === 'in') return { at: onChannel(gate === 1 ? 3.38 : 4.12), heading: 0 }
  return { at: onChannel(gate === 2 ? 4.85 : 4.12), heading: 180 }
}

function passTrackA(step: PilotStep, kept: Side): [LatLon, LatLon, LatLon] {
  const b = (BUOYS as Record<string, KerranBuoy>)[step.id]!
  const gateLat = latMinOf(b.at)
  const markLonW = lonMinWOf(b.at)
  const right = kept === sideToKeep(b.type, step.dir)
  const lonW = right ? CHANNEL_LON_W : markLonW + (markLonW < CHANNEL_LON_W ? -0.3 : 0.3)
  return [stationA(step).at, km(gateLat, lonW), km(gateLat + (step.dir === 'in' ? 0.25 : -0.25), lonW)]
}

// Region B: a schematic channel, drawn head-up (going in is up the page).
interface Pt { x: number; y: number }
const B_X: Record<Side, number> = { port: 105, starboard: 195 }
const B_GATE_Y: Record<1 | 2, number> = { 1: 250, 2: 150 }
const FINISH_B: Pt = { x: 150, y: 335 }

function stationB(step: PilotStep): { at: Pt; heading: number } {
  const gate = buoyById(step.id).gate
  if (step.dir === 'in') return { at: { x: 150, y: gate === 1 ? 320 : 200 }, heading: 0 }
  return { at: { x: 150, y: gate === 2 ? 80 : 200 }, heading: 180 }
}

function passTrackB(step: PilotStep, kept: Side): [Pt, Pt, Pt] {
  const b = buoyById(step.id)
  const gy = B_GATE_Y[b.gate]
  const mx = B_X[b.type]
  const right = kept === sideToKeep(b.type, step.dir)
  const x = right ? 150 : mx + (mx < 150 ? -38 : 38)
  return [stationB(step).at, { x, y: gy }, { x, y: gy + (step.dir === 'in' ? -34 : 34) }]
}

function polyline(points: Pt[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ')
}

function SchematicChannel({ visited, boat, track, rightTrack, ok, hot }: {
  visited: Pt[]; boat: { at: Pt; heading: number }; track: [Pt, Pt, Pt] | null; rightTrack: [Pt, Pt, Pt] | null; ok: boolean; hot: Buoy | null
}) {
  const marks = Object.values(B_BUOYS)
  const colour = ok ? '#15803d' : '#b42318'
  return (
    <svg viewBox="0 0 300 360" className="block h-auto w-full rounded-lg border border-border" role="img" aria-label="A schematic Region B channel, drawn head-up: going in is up the page. Green cans on the left, red cones on the right.">
      <rect width={300} height={360} fill="#d7ecf7" />
      <path d="M0 0 H300 V40 Q 250 52 200 46 L 175 60 H 125 L 100 46 Q 50 52 0 40 Z" fill="#efe2bd" stroke="#8a7a52" strokeWidth={1.2} />
      <text x={150} y={26} textAnchor="middle" fontSize={11} fontWeight={700} fill="#5b4f30">Harbour</text>
      <rect x={70} y={60} width={160} height={300} fill="#bfe0f2" opacity={0.6} />
      {marks.map((b) => (
        <g key={b.id}>
          {hot?.id === b.id && <circle cx={B_X[b.type]} cy={B_GATE_Y[b.gate] - 10} r={20} fill="none" stroke={colour} strokeWidth={2.5} />}
          <PlanMark type={b.type} region="B" x={B_X[b.type]} y={B_GATE_Y[b.gate]} size={18} />
          <text x={B_X[b.type] + (b.type === 'port' ? -16 : 16)} y={B_GATE_Y[b.gate] - 2} textAnchor={b.type === 'port' ? 'end' : 'start'} fontSize={10} fill="#1d2731">
            {b.name}
          </text>
          <text x={B_X[b.type] + (b.type === 'port' ? -16 : 16)} y={B_GATE_Y[b.gate] + 10} textAnchor={b.type === 'port' ? 'end' : 'start'} fontSize={9} fill="#7a2a6a" fontStyle="italic">
            {b.light}
          </text>
        </g>
      ))}
      <text x={10} y={352} fontSize={10} fill="#3e5468">↑ Direction of buoyage</text>
      {visited.length > 1 && <polyline points={polyline(visited)} fill="none" stroke={CHART_COLOURS.plot} strokeWidth={1.8} strokeDasharray="4 3" />}
      {rightTrack && <polyline points={polyline(rightTrack)} fill="none" stroke="#15803d" strokeWidth={1.8} strokeDasharray="3 3" />}
      {track && <polyline points={polyline(track)} fill="none" stroke={colour} strokeWidth={2.6} />}
      <PlanBoat x={boat.at.x} y={boat.at.y} heading={boat.heading} size={18} />
    </svg>
  )
}

export function PilotWidget() {
  const [region, setRegion] = useState<Region>('A')
  const [steps, setSteps] = useState<PilotStep[]>(() => defaultSteps('A'))
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Array<{ kept: Side; ok: boolean }>>([])
  const [look, setLook] = useState<Look>('day')
  const done = index >= steps.length
  const step = steps[Math.min(index, steps.length - 1)]!
  const answer = answers[index]
  const buoy = buoyById(step.id)
  const score = answers.filter((a) => a.ok).length
  const fb = answer ? pilotFeedback(region, buoy, step.dir, answer.kept, look) : null
  const markType: LateralType = buoy.type

  function choose(kept: Side) {
    if (answer || done) return
    const ok = kept === sideToKeep(buoy.type, step.dir)
    const next = [...answers]
    next[index] = { kept, ok }
    setAnswers(next)
  }

  function restart(r: Region = region, shuffle = true) {
    // Event handler only: swap the order within each pair at random.
    const base = defaultSteps(r)
    const out: PilotStep[] = []
    for (let i = 0; i < base.length; i += 2) {
      const pair = [base[i]!, base[i + 1]!]
      out.push(...(shuffle && Math.random() < 0.5 ? [pair[1]!, pair[0]!] : pair))
    }
    setSteps(out)
    setIndex(0)
    setAnswers([])
  }

  function changeRegion(r: Region) {
    setRegion(r)
    restart(r, false)
  }

  const where = region === 'A' ? 'Port Kerran' : 'the Region B harbour'
  const headingText = step.dir === 'in'
    ? `Entering ${where} from seaward: heading ${formatBearing(0, region === 'A' ? 'T' : '')}${region === 'A' ? '' : ' (up the page)'}, with the direction of buoyage.`
    : `Leaving ${where} for the open sea: heading ${formatBearing(180, region === 'A' ? 'T' : '')}${region === 'A' ? '' : ' (down the page)'}, against the direction of buoyage.`

  // The chart pane, in either region.
  let pane
  if (region === 'A') {
    const visited: LatLon[] = []
    steps.slice(0, Math.min(index + 1, steps.length)).forEach((s) => {
      const at = stationA(s).at
      const last = visited[visited.length - 1]
      if (!last || last.lat !== at.lat || last.lon !== at.lon) visited.push(at)
    })
    if (done) visited.push(FINISH_A)
    const station = done ? { at: FINISH_A, heading: 180 } : stationA(step)
    const track = answer && !done ? passTrackA(step, answer.kept) : null
    const rightTrack = answer && !answer.ok && !done ? passTrackA(step, sideToKeep(buoy.type, step.dir)) : null
    const kb = (BUOYS as Record<string, KerranBuoy>)[step.id]
    pane = (
      <PracticeChart view={PLAN_VIEW} title="Practice chart of the Port Kerran approach, with your boat on it">
        {visited.slice(1).map((p, i) => (
          <ChartLine key={i} from={visited[i]!} to={p} colour={CHART_COLOURS.plot} width={1.6} dash="4 3" />
        ))}
        {rightTrack && (
          <>
            <ChartLine from={rightTrack[0]} to={rightTrack[1]} colour="#15803d" width={1.6} dash="3 3" />
            <ChartLine from={rightTrack[1]} to={rightTrack[2]} colour="#15803d" width={1.6} dash="3 3" arrow />
          </>
        )}
        {track && (
          <>
            <ChartLine from={track[0]} to={track[1]} colour={answer?.ok ? '#15803d' : '#b42318'} width={2.4} />
            <ChartLine from={track[1]} to={track[2]} colour={answer?.ok ? '#15803d' : '#b42318'} width={2.4} arrow />
          </>
        )}
        {answer && !done && kb && <ChartHighlight at={kb.at} r={14} colour={answer.ok ? '#15803d' : '#b42318'} />}
        <BoatGlyph at={station.at} heading={station.heading} size={14} />
      </PracticeChart>
    )
  } else {
    const visited: Pt[] = []
    steps.slice(0, Math.min(index + 1, steps.length)).forEach((s) => {
      const at = stationB(s).at
      const last = visited[visited.length - 1]
      if (!last || last.x !== at.x || last.y !== at.y) visited.push(at)
    })
    if (done) visited.push(FINISH_B)
    pane = (
      <SchematicChannel
        visited={visited}
        boat={done ? { at: FINISH_B, heading: 180 } : stationB(step)}
        track={answer && !done ? passTrackB(step, answer.kept) : null}
        rightTrack={answer && !answer.ok && !done ? passTrackB(step, sideToKeep(buoy.type, step.dir)) : null}
        ok={answer?.ok ?? true}
        hot={answer && !done ? buoy : null}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <RegionPicker region={region} onChange={changeRegion} />
        <LookPicker look={look} onChange={setLook} label="Light conditions" />
      </div>
      <p className="text-sm font-semibold text-text-secondary" aria-live="polite">
        Region {region} · mark {Math.min(index + 1, steps.length)} of {steps.length} · {score} right first time
      </p>

      <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="order-2 min-w-0 md:order-1">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-text-secondary">
            {region === 'A' ? 'Your chart: Port Kerran (practice chart, Region A)' : 'Your plan: an example Region B channel'}
          </p>
          {pane}
          <p className="mt-1 text-xs text-text-secondary">
            {region === 'A'
              ? 'The dashed line is your track so far. Once you answer, the chart shows which buoy it was and where your choice takes you.'
              : 'A made-up channel laid out as in the Caribbean: green cans with odd numbers, red cones with even numbers, counting up from seaward.'}
          </p>
        </div>

        <div className="order-1 min-w-0 space-y-3 md:order-2">
          {!done ? (
            <>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-text-secondary">From the boat: the next mark</p>
                <MarkView key={`${region}-${index}-${look}`} type={markType} region={region} look={look} light={parseLight(buoy.light)} />
              </div>
              <p className="text-sm font-semibold text-text-primary">{headingText}</p>
              {!answer ? (
                <div className="rounded-lg border border-teal/40 bg-teal-light/40 p-3" role="group" aria-label="Which side of the boat do you keep this mark?">
                  <p className="font-semibold text-text-primary">Which side of the boat do you keep this mark?</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" className={`${btnPlain} px-2`} onClick={() => choose('port')}>
                      <ChevronLeft size={16} strokeWidth={1.5} className="mr-1.5 inline-block align-[-3px]" aria-hidden="true" />Keep it to port
                      <span className="block text-xs font-normal text-text-secondary">it passes down my left side</span>
                    </button>
                    <button type="button" className={`${btnPlain} px-2`} onClick={() => choose('starboard')}>
                      Keep it to starboard<ChevronRight size={16} strokeWidth={1.5} className="ml-1.5 inline-block align-[-3px]" aria-hidden="true" />
                      <span className="block text-xs font-normal text-text-secondary">it passes down my right side</span>
                    </button>
                  </div>
                </div>
              ) : (
                fb && (
                  <div className={`rounded-lg border p-3 ${fb.ok ? 'border-success/50 bg-success/10' : 'border-danger/40 bg-danger/5'}`} role="status">
                    <p className="font-semibold text-text-primary">{fb.head}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{fb.body}</p>
                    <button type="button" className={`${btnTeal} mt-2`} onClick={() => setIndex(index + 1)}>
                      {index === steps.length - 1 ? 'Finish' : index === 3 ? 'Turn round and head out to sea' : 'Next mark'}
                    </button>
                  </div>
                )
              )}
            </>
          ) : (
            <div className="rounded-lg border border-success/50 bg-success/10 p-3" role="status">
              <p className="font-semibold text-text-primary">In and out again in Region {region}: {score} of {steps.length} right first time.</p>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                {region === 'A'
                  ? 'Region A, going in: red port-hand marks to port, green starboard-hand marks to starboard. Coming out, everything reverses.'
                  : 'Region B, going in: red to starboard (red right returning), green to port. Coming out, everything reverses.'}{' '}
                Now switch region and go again: the shapes stay on the same side, only the colours swap.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className={btnTeal} onClick={() => changeRegion(region === 'A' ? 'B' : 'A')}>Try Region {region === 'A' ? 'B' : 'A'}</button>
                <button type="button" className={btnPlain} onClick={() => restart()}>Go again</button>
              </div>
            </div>
          )}
          {!done && index > 0 && (
            <button type="button" className={`${btnPlain} text-xs`} onClick={() => restart()}>Start again</button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Mark identifier, with a quiz                                     */
/* ------------------------------------------------------------------ */

interface QuizItem { type: LateralType; region: Region; look: Look; light: LightCharacteristic }

const NIGHT_RHYTHMS = ['Fl {c} 5s', 'Fl(2) {c} 5s', 'Fl(3) {c} 10s', 'Q {c}']

function randomQuizItem(prev?: QuizItem): QuizItem {
  // Event handlers only (Math.random): a fresh mark each time.
  for (let i = 0; i < 10; i++) {
    const type = LATERAL_TYPES[Math.floor(Math.random() * LATERAL_TYPES.length)]!
    const region: Region = Math.random() < 0.5 ? 'A' : 'B'
    const plain = type === 'port' || type === 'starboard'
    const looks: Look[] = plain ? ['day', 'sun', 'night'] : ['day', 'night']
    const look = looks[Math.floor(Math.random() * looks.length)]!
    let light = exampleLight(type, region)
    if (plain) {
      const pattern = NIGHT_RHYTHMS[Math.floor(Math.random() * NIGHT_RHYTHMS.length)]!
      light = parseLight(pattern.replace('{c}', mainHue(type, region)))
    }
    if (!prev || prev.type !== type || prev.look !== look || prev.region !== region) return { type, region, look, light }
  }
  return { type: 'port', region: 'A', look: 'day', light: exampleLight('port', 'A') }
}

function quizExplain(item: QuizItem): string {
  const { type, region } = item
  if (item.look === 'night') {
    const colour = item.light.colour === 'R' ? 'red' : 'green'
    if (item.light.rhythm === 'Fl(2+1)') return `Its ${colour} light flashes two, then one: Fl(2+1), the rhythm kept for preferred channel marks. In Region ${region} a ${colour} Fl(2+1) is on a mark that is mainly ${colour}: ${coloursText(type, region).toLowerCase()}.`
    return `Its light, ${item.light.text}, is ${colour} and not Fl(2+1), so it is a plain lateral mark. In Region ${region}, ${colour} is the ${type}-hand colour.`
  }
  if (item.look === 'sun') return `Against the sun the colours vanish, but its ${shapeWord(type)} shape and ${shapeWord(type)} topmark still show: ${isCan(type) ? 'can for port' : 'cone for starboard'}, in both regions.`
  return `${coloursText(type, region)}, ${shapeWord(type)}-shaped, topmark: ${topmarkText(type, region).toLowerCase()}.`
}

export function MarkIdentifier() {
  const [mode, setMode] = useState<'explore' | 'quiz'>('explore')
  const [region, setRegion] = useState<Region>('A')
  const [type, setType] = useState<LateralType>('port')
  const [look, setLook] = useState<Look>('day')
  const [item, setItem] = useState<QuizItem | null>(null)
  const [picked, setPicked] = useState<LateralType | null>(null)
  const [score, setScore] = useState({ right: 0, asked: 0 })

  function startQuiz() {
    setMode('quiz')
    setItem(randomQuizItem())
    setPicked(null)
  }
  function answer(t: LateralType) {
    if (!item || picked) return
    setPicked(t)
    setScore((s) => ({ right: s.right + (t === item.type ? 1 : 0), asked: s.asked + 1 }))
  }
  function next() {
    setItem(randomQuizItem(item ?? undefined))
    setPicked(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Mode">
        <button type="button" role="radio" aria-checked={mode === 'explore'} onClick={() => setMode('explore')} className={seg(mode === 'explore')}>Explore the marks</button>
        <button type="button" role="radio" aria-checked={mode === 'quiz'} onClick={startQuiz} className={seg(mode === 'quiz')}>Test yourself</button>
      </div>

      {mode === 'explore' ? (
        <>
          <RegionPicker region={region} onChange={setRegion} />
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="radiogroup" aria-label="Choose a mark">
            {LATERAL_TYPES.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)}
                className={`min-h-11 rounded-control border px-2 py-2 text-left text-sm leading-tight ${type === t ? 'border-teal bg-teal text-white' : 'border-border bg-white hover:bg-teal-light'}`}>
                {SHORT_NAME[t]}
              </button>
            ))}
          </div>
          <LookPicker look={look} onChange={setLook} label="Light conditions" />
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <MarkView key={`${region}-${type}-${look}`} type={type} region={region} look={look} showBar />
            <div className="min-w-0 rounded-lg bg-bg p-3 text-sm" aria-live="polite">
              <p className="font-bold text-text-primary">{SHORT_NAME[type]}, Region {region}</p>
              <dl className="mt-1 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-2 gap-y-1">
                <dt className="text-text-secondary">Colour</dt><dd className="text-text-primary">{coloursText(type, region)}</dd>
                <dt className="text-text-secondary">Shape</dt><dd className="text-text-primary">{shapeText(type)}</dd>
                <dt className="text-text-secondary">Topmark</dt><dd className="text-text-primary">{topmarkText(type, region)}</dd>
                <dt className="text-text-secondary">Light</dt><dd className="text-text-primary">{lightText(type, region)}</dd>
              </dl>
              <p className="mt-2 leading-relaxed text-text-primary">{MEANING[type]}</p>
              {look === 'night' && <p className="mt-2 font-mono text-xs text-text-secondary">Showing {exampleLight(type, region).text} (an example)</p>}
              {look === 'sun' && type !== 'port' && type !== 'starboard' && (
                <p className="mt-2 text-xs text-text-secondary">Against the sun the band is invisible: this looks just like a {isCan(type) ? 'port' : 'starboard'}-hand mark, which is how you treat it.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        item && (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <MarkView key={`${score.asked}-${item.region}-${item.type}-${item.look}`} type={item.type} region={item.region} look={item.look} light={item.light} />
              <p className="mt-1 text-xs text-text-secondary">
                <strong className="text-text-primary">Region {item.region}</strong> ({item.region === 'A' ? 'say, Croatia' : 'say, the BVI'}).{' '}
                {item.look === 'night' ? 'At night: only the light.' : item.look === 'sun' ? 'Looking into a low sun: only the outline.' : 'In daylight.'}
              </p>
            </div>
            <div className="min-w-0 space-y-2">
              <p className="font-semibold text-text-primary">What is this mark?</p>
              <div className="grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2">
                {LATERAL_TYPES.map((t) => {
                  const showRight = picked !== null && t === item.type
                  const showWrong = picked === t && t !== item.type
                  return (
                    <button key={t} type="button" disabled={picked !== null} onClick={() => answer(t)}
                      className={`min-h-11 rounded-control border px-3 py-2 text-left text-sm ${showRight ? 'border-success bg-success/10 font-semibold' : showWrong ? 'border-danger bg-danger/10' : 'border-border bg-white hover:bg-teal-light'} disabled:cursor-default`}>
                      {SHORT_NAME[t]}
                    </button>
                  )
                })}
              </div>
              {picked && (
                <div className={`rounded-lg border p-3 ${picked === item.type ? 'border-success/50 bg-success/10' : 'border-danger/40 bg-danger/5'}`} role="status">
                  <p className="font-semibold text-text-primary">{picked === item.type ? '✓ Right' : '✗ Not quite'}: {SHORT_NAME[item.type].toLowerCase()}.</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{quizExplain(item)} {MEANING[item.type]}</p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {picked && <button type="button" className={btnTeal} onClick={next}>Next mark</button>}
                <span className="text-sm text-text-secondary" aria-live="polite">Score: {score.right} of {score.asked}</span>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Which region is my charter in?                                    */
/* ------------------------------------------------------------------ */

export function RegionFinder() {
  const [id, setId] = useState('croatia')
  const area = CHARTER_AREAS.find((a) => a.id === id) ?? CHARTER_AREAS[0]!
  const r = area.region
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="grid grid-cols-2 gap-1.5 self-start" role="radiogroup" aria-label="Charter area">
        {CHARTER_AREAS.map((a) => (
          <button key={a.id} type="button" role="radio" aria-checked={a.id === id} onClick={() => setId(a.id)}
            className={`min-h-11 rounded-control border px-2.5 py-1.5 text-left text-sm leading-tight ${a.id === id ? 'border-teal bg-teal text-white' : 'border-border bg-white text-text-primary hover:bg-teal-light'}`}>
            {a.name}
          </button>
        ))}
      </div>
      <div className="min-w-0 space-y-2" aria-live="polite">
        <p className="text-lg font-bold text-text-primary">{area.name}: Region {r}</p>
        <p className="text-sm text-text-secondary">Charter base: {area.base}</p>
        <svg viewBox="0 0 400 230" className="block h-auto w-full rounded-lg" role="img"
          aria-label={`Entering harbour in Region ${r}: ${hueWord(sideColour('port', r))} can-shaped marks on your port side, ${hueWord(sideColour('starboard', r))} conical marks on your starboard side.`}>
          <rect width={400} height={230} fill="#e3f1fa" />
          <rect y={180} width={400} height={50} fill="#2b6a8e" />
          <LateralMark type="port" region={r} x={90} y={192} scale={0.75} />
          <LateralMark type="starboard" region={r} x={310} y={192} scale={0.75} />
          <polygon points="200,90 186,124 214,124" fill="#0f5c5c" />
          <line x1={200} y1={124} x2={200} y2={200} stroke="#0f5c5c" strokeWidth={8} />
          <text x={200} y={78} textAnchor="middle" fontSize={15} fontWeight={700} fill="#0f5c5c">Going in</text>
          <text x={90} y={30} textAnchor="middle" fontSize={16} fontWeight={800} fill="#1d2731">Port side</text>
          <text x={310} y={30} textAnchor="middle" fontSize={16} fontWeight={800} fill="#1d2731">Starboard side</text>
        </svg>
        <p className="rounded-lg bg-bg px-3 py-2 text-sm font-semibold text-text-primary">
          {r === 'A' ? 'Going in: red to port, green to starboard.' : 'Going in: red to starboard, green to port. Red right returning.'}
        </p>
        <p className="text-sm leading-relaxed text-text-secondary">{area.note}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Figures                                                             */
/* ------------------------------------------------------------------ */

/** Lateral marks side by side, each with its name, in one region. */
function LineupRow({ types, region }: { types: LateralType[]; region: Region }) {
  return (
    <div className={`mx-auto grid max-w-2xl gap-2 ${types.length > 2 ? 'grid-cols-2 sm:grid-cols-4' : 'max-w-sm grid-cols-2'}`}>
      {types.map((t) => (
        <div key={t} className="overflow-hidden rounded-xl bg-[#e3f1fa]">
          <svg viewBox="0 0 220 260" className="block h-auto w-full" role="img" aria-label={`Region ${region} ${SHORT_NAME[t].toLowerCase()}: ${dayLookLabel(t, region)}`}>
            <rect y={226} width={220} height={34} fill="#2b6a8e" />
            <LateralMark type={t} region={region} x={110} y={240} scale={0.95} />
          </svg>
          <p className="bg-navy px-2 py-1.5 text-center text-xs font-semibold leading-tight text-white sm:text-sm">{SHORT_NAME[t]}</p>
        </div>
      ))}
    </div>
  )
}

const dayLookLabel = (t: LateralType, r: Region) => `${coloursText(t, r).toLowerCase()}, ${shapeWord(t)}-shaped, ${topmarkText(t, r).toLowerCase()} topmark`

/** The same lateral marks in Region A and Region B, one row each. */
export function LateralLineup({ types = LATERAL_TYPES, caption, regions = REGIONS }: { types?: LateralType[]; caption: string; regions?: Region[] }) {
  return (
    <Figure caption={caption}>
      <div className="space-y-3">
        {regions.map((r) => (
          <div key={r}>
            {regions.length > 1 && <p className="mb-1 text-center text-sm font-bold text-text-primary">Region {r}</p>}
            <LineupRow types={types} region={r} />
          </div>
        ))}
      </div>
    </Figure>
  )
}

/** The same two marks seen into a low sun: only the shapes are left. */
export function SilhouetteFigure() {
  return (
    <Figure caption="Into a low sun the colours vanish, but the shapes do not: a can with a can topmark (left) is a port-hand mark, and a cone with a cone topmark (right) is a starboard-hand mark, in both regions.">
      <div className="mx-auto grid max-w-xl grid-cols-2 gap-2">
        <MarkView type="port" look="sun" />
        <MarkView type="starboard" look="sun" />
      </div>
    </Figure>
  )
}

const APPROACH_VIEW = viewAround(onChannel(3.85), 3.6, 4 / 5)
/** Just west of the leading line, so the arrow does not hide the line's printed label. */
const ARROW_LON_W = CHANNEL_LON_W + 0.12

/** The Port Kerran approach with the direction of buoyage drawn on it. */
export function ApproachFigure() {
  return (
    <Figure caption="The Port Kerran approach on the practice chart, which uses Region A. The teal arrow (added for this lesson; it is not a chart symbol) shows the direction of buoyage: from seaward, north into the harbour. Green cones (odd numbers) on the starboard side, red cans (even numbers) on the port side.">
      <div className="mx-auto max-w-md">
        <PracticeChart view={APPROACH_VIEW} title="Practice chart: the Port Kerran approach and its lateral marks">
          <ChartLine from={km(2.75, ARROW_LON_W)} to={km(4.9, ARROW_LON_W)} colour={CHART_COLOURS.plot} width={3} arrow />
          <ChartText at={km(3.05, CHANNEL_LON_W)} colour={CHART_COLOURS.plot} size={9} dx={20} anchor="start" bold>Direction</ChartText>
          <ChartText at={km(3.05, CHANNEL_LON_W)} colour={CHART_COLOURS.plot} size={9} dx={20} dy={11} anchor="start" bold>of buoyage</ChartText>
        </PracticeChart>
      </div>
    </Figure>
  )
}

