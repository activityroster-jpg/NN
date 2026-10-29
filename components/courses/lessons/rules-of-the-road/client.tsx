'use client'

// Lesson 10, Rules of the road for charter skippers. Scenes, questions and
// practice ported and adapted from the Boaty Jobs lessons on the steering
// and sailing rules, navigation lights and shapes, and sound signals. The
// narration lives in script.ts.

import { Cog } from 'lucide-react'
import type { ReactNode } from 'react'
import { choices, pick, randInt, shuffle, type Rng } from '@/lib/courses/random'
import { ExerciseSet, type PracticeGenerator, type Question } from '../../Exercises'
import LessonPlayer, { SceneTitle, Stage, fade, phase, type Scene } from '../../LessonPlayer'
import { ART, SceneIcon, Yacht } from '../../scene-art'
import {
  KIND_TAG, MotorBoat, PlanFigure, SailBoat, VesselIcon, WindBadge, WindStreaks, arcPath, polar, powerCase, sailingCase, sectorPath,
} from './art'
import { Q_CROSSING, Q_HEAD_ON, Q_MOTORSAILING, Q_TACKS, Q_WINDWARD } from './cases'
import { mainsailTrack, plan, simulate, type Pose } from './manoeuvre'
import {
  KIND_NAME, OVERTAKING_FROM, RULE_NAME, actions, decide, dir, explain, offWind, relativeBearing, sideOf, tackOf,
  type Encounter, type Kind, type RuleId, type Ruling, type Side,
} from './rules'
import { encounterFor, type Shape } from './scenarios'
import { INTERVAL, clock, makeWatch, pad3, reading, solveShipCourse, type Trend } from './watch'
import { rulesOfTheRoad as SCRIPT } from './script'
import { DayVessel, DayView, type Shape as DayShape } from './shapes'
import { Ship, SoundWaves } from './sound-art'
import { HEARD_PROMPT, SIGNALS, explainSignal, isMessage, optionSignals, signalById, totalSeconds, type SignalId, type SoundSignal } from './signals'
import { TimelineBars } from './timeline'

/* ------------------------------------------------------------------ */
/* Scene helpers                                                       */
/* ------------------------------------------------------------------ */

const RED_TEXT = '#ff7a7a'
const GREEN_TEXT = '#5fe39a'
const ORANGE = '#ffb366'

function Word({ x, y, children, size = 60, fill = '#fff', anchor = 'middle', weight = 800, opacity = 1 }: {
  x: number; y: number; children: ReactNode; size?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; weight?: number; opacity?: number
}) {
  return (
    <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor} opacity={opacity} stroke="#0e2237" strokeWidth={10} paintOrder="stroke" strokeLinejoin="round">
      {children}
    </text>
  )
}

function Arrow({ x1, y1, x2, y2, colour, width = 8, head = 26 }: { x1: number; y1: number; x2: number; y2: number; colour: string; width?: number; head?: number }) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const l = { x: x2 - Math.cos(a - 0.45) * head, y: y2 - Math.sin(a - 0.45) * head }
  const r = { x: x2 - Math.cos(a + 0.45) * head, y: y2 - Math.sin(a + 0.45) * head }
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - Math.cos(a) * head * 0.6} y2={y2 - Math.sin(a) * head * 0.6} stroke={colour} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${l.x},${l.y} ${r.x},${r.y}`} fill={colour} />
    </g>
  )
}

/** Splits narration exactly as the lesson player does, for timing within a sentence. */
function sentenceSpans(narration: string): { start: number; end: number }[] {
  const parts = narration.split(/(?<=[.!?…])\s+(?=[A-Z0-9"“‘(£])/).map((s) => s.trim()).filter(Boolean)
  const total = parts.reduce((n, s) => n + s.length, 0) || 1
  let at = 0
  return parts.map((s) => {
    const span = { start: at / total, end: (at + s.length) / total }
    at += s.length
    return span
  })
}

/** Progress 0 → 1 through the given sentence, from the scene progress t. */
function within(narration: string) {
  const spans = sentenceSpans(narration)
  return (t: number, sentence: number): number => {
    const s = spans[Math.min(sentence, spans.length - 1)]
    if (!s) return t
    return Math.max(0, Math.min(1, (t - s.start) / (s.end - s.start || 1)))
  }
}

/** World (M, north up) → stage. */
function mapper(cx: number, cy: number, k: number) {
  return { x: (x: number) => cx + x * k, y: (y: number) => cy - y * k }
}

/** Pose along a precomputed track at fraction u (0 → 1). */
function at(track: Pose[], u: number): Pose {
  const i = Math.max(0, Math.min(track.length - 1, Math.round(u * (track.length - 1))))
  return track[i]!
}

function trackPath(track: Pose[], u: number, m: { x: (x: number) => number; y: (y: number) => number }): string {
  const n = Math.max(1, Math.round(u * (track.length - 1)))
  return track.slice(0, n + 1).map((p) => `${m.x(p.x)},${m.y(p.y)}`).join(' ')
}

/** Everything needed to play an encounter in a scene. */
function played(e: Encounter, span = 1.7) {
  const r = decide(e)!
  const m = plan(e, r)
  const tracks = simulate(e, { ...m, duration: m.T * span }, 200)
  const mains = e.windFrom === undefined ? null : {
    a: e.a.kind === 'sail' ? mainsailTrack(e.a, tracks.a, e.windFrom) : null,
    b: e.b.kind === 'sail' ? mainsailTrack(e.b, tracks.b, e.windFrom) : null,
  }
  return { e, r, m, tracks, mains }
}

/* ------------------------------------------------------------------ */
/* Scene 1: the rules of the road                                      */
/* ------------------------------------------------------------------ */

const N1 = SCRIPT.scenes[0]!.narration
const W1 = within(N1)

function sceneRules(t: number, s: number) {
  const w = W1(t, s)
  if (s === 0) {
    return (
      <Stage>
        <SceneTitle t={t}>The rules of the road</SceneTitle>
        <g opacity={fade(w, 0.05, 0.25)} transform="translate(250 200)">
          <rect x={0} y={0} width={380} height={470} rx={18} fill="#1d4d6b" stroke="#7fb3cf" strokeWidth={5} />
          <rect x={0} y={0} width={44} height={470} rx={12} fill="#163b53" />
          <text x={212} y={200} textAnchor="middle" fontSize={78} fontWeight={800} fill="#fff">COLREGs</text>
          <text x={212} y={275} textAnchor="middle" fontSize={50} fill={ART.tealBright}>1972</text>
          <line x1={90} y1={330} x2={334} y2={330} stroke="#7fb3cf" strokeWidth={4} />
        </g>
        <g opacity={fade(w, 0.4, 0.6)}>
          <Word x={760} y={360} anchor="start" size={56} weight={700}>International Regulations</Word>
          <Word x={760} y={430} anchor="start" size={56} weight={700}>for Preventing</Word>
          <Word x={760} y={500} anchor="start" size={56} weight={700}>Collisions at Sea</Word>
        </g>
      </Stage>
    )
  }
  if (s === 1) {
    return (
      <Stage>
        <Word x={800} y={150} size={68}>Every vessel</Word>
        <Word x={800} y={225} size={44} fill={ART.muted} weight={600} opacity={fade(w, 0.45, 0.6)}>on the high seas and connected waters</Word>
        <rect x={0} y={560} width={1600} height={340} fill="#123a5a" />
        <g opacity={fade(w, 0.08, 0.25)} transform="translate(160 560)">
          <path d="M0 -70 L760 -70 L720 0 L40 0 Z" fill="#3b4b5c" />
          <rect x={540} y={-190} width={150} height={120} fill="#e8edf2" />
          <rect x={560} y={-170} width={110} height={26} fill="#5b6b7b" />
          <rect x={600} y={-250} width={34} height={60} fill="#d9342b" />
          {[80, 200, 320, 440].map((x) => <rect key={x} x={x} y={-150} width={100} height={80} fill={['#c2410c', '#0B5563', '#a16207', '#4d7c0f'][x / 120 | 0]} stroke="#1f2937" strokeWidth={3} />)}
        </g>
        <g opacity={fade(w, 0.28, 0.42)} transform="translate(1260 560)">
          <path d="M-60 -18 L60 -18 L44 0 L-44 0 Z" fill="#f4f1ea" />
          <line x1={0} y1={-18} x2={0} y2={-150} stroke="#cfd8e3" strokeWidth={5} />
          <path d="M4 -146 L4 -24 L70 -24 Z" fill="#ffffff" />
        </g>
        <Word x={540} y={660} size={40} fill={ART.muted} weight={600} opacity={fade(w, 0.08, 0.25)}>the biggest ship…</Word>
        <Word x={1260} y={660} size={40} fill={ART.muted} weight={600} opacity={fade(w, 0.28, 0.42)}>…the smallest dinghy</Word>
      </Stage>
    )
  }
  if (s === 2) {
    return (
      <Stage>
        <rect x={0} y={520} width={1600} height={380} fill="#123a5a" />
        <path d="M0 520 L0 300 L420 300 L420 520 Z" fill="#5d6f82" />
        <rect x={380} y={300} width={60} height={220} fill="#6f8399" />
        <g opacity={fade(w, 0.05, 0.25)}>
          <rect x={170} y={150} width={12} height={150} fill="#cfd8e3" />
          <rect x={60} y={90} width={300} height={110} rx={10} fill="#f8f4e8" stroke={ART.amber} strokeWidth={6} />
          <text x={210} y={163} textAnchor="middle" fontSize={44} fontWeight={800} fill="#1A1A2E">Local rules</text>
        </g>
        <Word x={1000} y={260} size={56} opacity={fade(w, 0.1, 0.3)}>Harbours and coasts</Word>
        <Word x={1000} y={330} size={56} opacity={fade(w, 0.1, 0.3)}>may add their own</Word>
        <Word x={1000} y={430} size={46} fill={ART.amber} weight={700} opacity={fade(w, 0.55, 0.75)}>Check the pilot book</Word>
      </Stage>
    )
  }
  const u = phase(w, 0, 0.8)
  return (
    <Stage>
      <Word x={800} y={140} size={60}>Who keeps out of the way?</Word>
      <MotorBoat x={300 + 330 * u} y={450} heading={90} scale={1.6} />
      <SailBoat x={800} y={720 - 160 * u} heading={0} scale={1.6} main="port" off={90} />
      <text x={800} y={480} textAnchor="middle" fontSize={140} fontWeight={800} fill={ART.amber} opacity={fade(w, 0.5, 0.7)}>?</text>
    </Stage>
  )
}

/* ------------------------------------------------------------------ */
/* Scene 3: risk of collision                                          */
/* ------------------------------------------------------------------ */

const N3 = SCRIPT.scenes[1]!.narration
const W3 = within(N3)

/** Own yacht heading 000 at 6 kn; a ship sighted at 050° relative, 3 M off, doing 13 kn. */
const RISK = (() => {
  const ship = { x: 3 * Math.sin((50 * Math.PI) / 180), y: 3 * Math.cos((50 * Math.PI) / 180) }
  const steady = solveShipCourse(0, 6, ship, 13, 0)!
  const astern = solveShipCourse(0, 6, ship, 13, -1.1)!
  const pos = (heading: number, min: number) => {
    const d = dir(heading)
    const h = min / 60
    return { own: { x: 0, y: 6 * h }, ship: { x: ship.x + d.x * 13 * h, y: ship.y + d.y * 13 * h } }
  }
  const bearing = (heading: number, min: number) => {
    const p = pos(heading, min)
    return Math.round(((Math.atan2(p.ship.x - p.own.x, p.ship.y - p.own.y) * 180) / Math.PI + 360) % 360)
  }
  return { steady, astern, pos, bearing }
})()
const RISK_TIMES = [0, 4, 8]

function sceneRisk(t: number, s: number) {
  const w = W3(t, s)
  const M = mapper(470, 700, 150)
  if (s === 3) {
    // A big ship crossing close ahead: her bow and stern bear quite differently.
    const own = { x: 520, y: 640 }
    const bow = { x: 560, y: 300 }
    const stern = { x: 1160, y: 300 }
    return (
      <Stage>
        <path d="M560 300 L640 252 L1160 252 L1160 348 L640 348 Z" fill="#3b4b5c" stroke="#9fb3c8" strokeWidth={4} />
        <rect x={1050} y={266} width={90} height={68} fill="#e8edf2" />
        <Yacht x={own.x} y={own.y} heading={0} scale={0.9} />
        <g opacity={fade(w, 0.1, 0.25)}>
          <line x1={own.x} y1={own.y - 50} x2={bow.x} y2={bow.y} stroke={ART.amber} strokeWidth={5} strokeDasharray="14 10" />
          <line x1={own.x} y1={own.y - 50} x2={stern.x} y2={stern.y} stroke={ART.amber} strokeWidth={5} strokeDasharray="14 10" />
          <Word x={560} y={225} size={40} fill={ART.amber} weight={700}>her bow</Word>
          <Word x={1160} y={225} size={40} fill={ART.amber} weight={700}>her stern</Word>
        </g>
        <Word x={860} y={490} anchor="start" size={40} fill={ART.amber} weight={700} opacity={fade(w, 0.05, 0.2)}>No compass? Use a stanchion</Word>
        <Word x={860} y={585} anchor="start" size={50} opacity={fade(w, 0.4, 0.55)}>Big ship or close:</Word>
        <Word x={860} y={660} anchor="start" size={46} fill={RED_TEXT} weight={700} opacity={fade(w, 0.6, 0.75)}>treat doubt as risk</Word>
      </Stage>
    )
  }
  const astern = s === 2
  const heading = astern ? RISK.astern : RISK.steady
  const minutes = s === 0 ? 8 * phase(w, 0.05, 0.95) : s === 1 ? 8 : 8 * phase(w, 0.02, 0.6)
  const p = RISK.pos(heading, minutes)
  const shown = RISK_TIMES.filter((m) => m <= minutes + 1e-6)
  const readings = shown.map((m) => RISK.bearing(heading, m))
  return (
    <Stage>
      <SceneTitle t={1}>{astern ? 'Drawing aft: passes astern' : s === 1 ? 'Steady bearing = danger' : 'Take a series of bearings'}</SceneTitle>
      {shown.map((m) => {
        const q = RISK.pos(heading, m)
        return <line key={m} x1={M.x(q.own.x)} y1={M.y(q.own.y)} x2={M.x(q.ship.x)} y2={M.y(q.ship.y)} stroke={ART.amber} strokeWidth={5} opacity={0.85} />
      })}
      <MotorBoat x={M.x(p.ship.x)} y={M.y(p.ship.y)} heading={heading} scale={0.75} />
      <Yacht x={M.x(p.own.x)} y={M.y(p.own.y)} heading={0} scale={0.75} />
      <g transform="translate(1130 210)">
        <rect width={400} height={300} rx={22} fill="rgba(255,255,255,0.07)" stroke={ART.tealBright} strokeWidth={3} />
        <text x={200} y={56} textAnchor="middle" fontSize={40} fill={ART.muted}>Bearings</text>
        {readings.map((b, i) => (
          <text key={i} x={200} y={130 + i * 66} textAnchor="middle" fontSize={56} fontWeight={800} fill="#fff" fontFamily="ui-monospace, Menlo, monospace">
            {pad3(b)}°
          </text>
        ))}
      </g>
      {s === 1 && (
        <g opacity={fade(w, 0.1, 0.25)}>
          <Word x={1330} y={590} size={44} fill={ART.amber} weight={700}>Range closing</Word>
          <Word x={1330} y={665} size={52} fill={RED_TEXT}>Risk of collision</Word>
        </g>
      )}
      {astern && (
        <g opacity={fade(w, 0.6, 0.75)}>
          <Word x={1330} y={590} size={40} fill={GREEN_TEXT} weight={700}>Bearing moving aft</Word>
          <Word x={1330} y={650} size={40} fill={ART.muted} weight={600}>(ahead: passes ahead)</Word>
        </g>
      )}
    </Stage>
  )
}

/* ------------------------------------------------------------------ */
/* Scene 4: overtaking                                                 */
/* ------------------------------------------------------------------ */

const N4 = SCRIPT.scenes[4]!.narration
const W4 = within(N4)

const OVERTAKE = played({ a: { kind: 'power', heading: 0, speed: 4, x: 0, y: -1.2 }, b: { kind: 'sail', heading: 355, speed: 8, x: 0.209, y: -2.391 }, windFrom: 80 }, 2)

function sceneOvertaking(t: number, s: number) {
  const w = W4(t, s)
  const cx = 760
  const cy = 430
  const R = 290
  const night = s === 1
  const k = 210
  // Show the yacht relative to the motor boat, which stays in the middle.
  const u = s < 2 ? 0 : s === 2 ? 0.62 * phase(w, 0.05, 1) : 0.62 + 0.38 * phase(w, 0, 0.8)
  const pa = at(OVERTAKE.tracks.a, u)
  const pb = at(OVERTAKE.tracks.b, u)
  const yx = cx + (pb.x - pa.x) * k
  const yy = cy - (pb.y - pa.y) * k
  const main = OVERTAKE.mains?.b?.[Math.round(u * (OVERTAKE.tracks.b.length - 1))] ?? 'port'
  const edge = polar(cx, cy, R, OVERTAKING_FROM)
  const edgeP = polar(cx, cy, R, 360 - OVERTAKING_FROM)
  const sweep = s === 0 ? fade(w, 0.25, 0.6) : 1
  return (
    <Stage background={night ? '#07111d' : '#0e2237'}>
      <SceneTitle t={1}>{s === 3 ? 'Overtaking until past and clear' : 'Overtaking'}</SceneTitle>
      <path d={sectorPath(cx, cy, R, OVERTAKING_FROM, 360 - OVERTAKING_FROM)} fill="#fff" fillOpacity={(night ? 0.3 : 0.14) * sweep} />
      {night && (
        <>
          <path d={sectorPath(cx, cy, R, 0, OVERTAKING_FROM)} fill={ART.starboard} fillOpacity={0.3} />
          <path d={sectorPath(cx, cy, R, 360 - OVERTAKING_FROM, 360)} fill={ART.port} fillOpacity={0.3} />
        </>
      )}
      <g opacity={sweep}>
        <line x1={cx} y1={cy} x2={edge.x} y2={edge.y} stroke="#fff" strokeWidth={4} />
        <line x1={cx} y1={cy} x2={edgeP.x} y2={edgeP.y} stroke="#fff" strokeWidth={4} />
        <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke={ART.muted} strokeWidth={3} strokeDasharray="12 10" />
        {s === 0 && (
          <>
            <path d={arcPath(cx, cy, 170, 90, OVERTAKING_FROM)} fill="none" stroke={ART.amber} strokeWidth={8} />
            <Word x={cx + 280} y={cy + 140} anchor="start" size={52} fill={ART.amber}>22.5°</Word>
            <Word x={cx + 280} y={cy + 195} anchor="start" size={40} fill={ART.amber} weight={700}>abaft the beam</Word>
          </>
        )}
      </g>
      <MotorBoat x={cx} y={cy} scale={1.3} sidelights={night} />
      {night && <circle cx={cx} cy={cy + 73} r={9} fill="#fff" />}
      {s === 1 && (
        <g opacity={fade(w, 0.15, 0.3)}>
          <Word x={1160} y={300} anchor="start" size={50}>From here:</Word>
          <Word x={1160} y={370} anchor="start" size={50}>sternlight only</Word>
        </g>
      )}
      {s >= 1 && <SailBoat x={yx} y={yy} heading={pb.heading} scale={0.95} main={main} off={offWind(pb.heading, 80)} />}
      {s === 2 && (
        <g opacity={fade(w, 0.15, 0.3)}>
          <Word x={1090} y={330} anchor="start" size={48}>Overtaking vessel</Word>
          <Word x={1090} y={395} anchor="start" size={48}>keeps clear</Word>
          <Word x={1090} y={470} anchor="start" size={40} fill={ART.amber} weight={700} opacity={fade(w, 0.45, 0.6)}>even sail</Word>
          <Word x={1090} y={520} anchor="start" size={40} fill={ART.amber} weight={700} opacity={fade(w, 0.45, 0.6)}>overtaking power</Word>
        </g>
      )}
      {s === 3 && <WindBadge x={1480} y={200} windFrom={80} r={60} dark />}
    </Stage>
  )
}

/* ------------------------------------------------------------------ */
/* Scenes 5 and 6: head-on and crossing                                */
/* ------------------------------------------------------------------ */

const N5 = SCRIPT.scenes[2]!.narration
const W5 = within(N5)
const HEAD_ON = played(powerCase('head-on'), 1.8)

function sceneHeadOn(t: number, s: number) {
  const w = W5(t, s)
  const M = mapper(640, 420, 125)
  const night = s === 1
  // The turn starts at 15% of the time to the meeting point (about 8% of this track): hold before it.
  const u = s === 0 ? 0.07 * phase(w, 0, 1) : s === 1 ? 0.07 : s === 2 ? 0.07 + 0.93 * phase(w, 0.02, 1) : 1
  const pa = at(HEAD_ON.tracks.a, u)
  const pb = at(HEAD_ON.tracks.b, u)
  return (
    <Stage background={night ? '#07111d' : '#0e2237'}>
      <SceneTitle t={1}>{s === 3 ? 'In doubt? Assume head-on' : 'Head-on'}</SceneTitle>
      {s >= 2 && (
        <>
          <polyline points={trackPath(HEAD_ON.tracks.a, u, M)} fill="none" stroke={ART.tealBright} strokeWidth={5} strokeDasharray="14 10" />
          <polyline points={trackPath(HEAD_ON.tracks.b, u, M)} fill="none" stroke={ORANGE} strokeWidth={5} strokeDasharray="14 10" />
        </>
      )}
      <MotorBoat x={M.x(pa.x)} y={M.y(pa.y)} heading={pa.heading} scale={1.3} sidelights={night} masthead={night} />
      <MotorBoat x={M.x(pb.x)} y={M.y(pb.y)} heading={pb.heading} scale={1.3} sidelights={night} masthead={night} />
      {night && (
        <g opacity={fade(w, 0.25, 0.4)} transform="translate(1080 220)">
          <rect width={440} height={300} rx={20} fill="#000" stroke="#5d6f82" strokeWidth={3} />
          <circle cx={220} cy={110} r={11} fill="#fff" />
          <circle cx={220} cy={70} r={11} fill="#fff" />
          <text x={250} y={102} fontSize={30} fontWeight={600} fill={ART.muted}>in line</text>
          <circle cx={170} cy={180} r={16} fill={ART.starboard} />
          <circle cx={270} cy={180} r={16} fill={ART.port} />
          <text x={220} y={270} textAnchor="middle" fontSize={36} fontWeight={700} fill="#fff">both sidelights</text>
        </g>
      )}
      {s === 0 && (
        <g opacity={fade(w, 0.2, 0.4)}>
          <Word x={1250} y={420} size={44} fill={ART.muted} weight={600}>both power-driven</Word>
          <Word x={1250} y={480} size={38} fill={ART.amber} weight={600} opacity={fade(w, 0.5, 0.7)}>a yacht under engine counts</Word>
        </g>
      )}
      {s === 2 && (
        <g opacity={fade(w, 0.3, 0.45)}>
          <Word x={1250} y={360} size={50}>Each turns</Word>
          <Word x={1250} y={425} size={50} fill={GREEN_TEXT}>to starboard</Word>
          <Word x={1250} y={510} size={44} fill={RED_TEXT} weight={700} opacity={fade(w, 0.6, 0.75)}>port to port</Word>
        </g>
      )}
      {s === 3 && (
        <Word x={1250} y={430} size={46} fill={ART.amber} weight={700}>Turn to starboard</Word>
      )}
    </Stage>
  )
}

const N6 = SCRIPT.scenes[3]!.narration
const W6 = within(N6)
const CROSSING = played(powerCase('crossing'), 1.8)

function sceneCrossing(t: number, s: number) {
  const w = W6(t, s)
  const M = mapper(560, 440, 125)
  const u = s === 0 ? 0.08 * phase(w, 0, 1) : s === 1 ? 0.08 + 0.62 * phase(w, 0.02, 1) : s === 2 ? 0.7 + 0.3 * phase(w, 0, 1) : 0.08
  const pa = at(CROSSING.tracks.a, u)
  const pb = at(CROSSING.tracks.b, u)
  const night = s === 3
  return (
    <Stage background={night ? '#07111d' : '#0e2237'}>
      <SceneTitle t={1}>{night ? 'If to starboard red appear…' : 'Crossing'}</SceneTitle>
      {s === 0 && <path d={sectorPath(M.x(pa.x), M.y(pa.y), 330, 0, 112.5)} fill={ART.starboard} fillOpacity={0.25 * fade(w, 0.15, 0.4)} />}
      {s >= 1 && s <= 2 && (
        <>
          <polyline points={trackPath(CROSSING.tracks.a, u, M)} fill="none" stroke={ART.tealBright} strokeWidth={5} strokeDasharray="14 10" />
          <polyline points={trackPath(CROSSING.tracks.b, u, M)} fill="none" stroke={ORANGE} strokeWidth={5} strokeDasharray="14 10" />
        </>
      )}
      <MotorBoat x={M.x(pa.x)} y={M.y(pa.y)} heading={pa.heading} scale={1.3} sidelights={night} />
      <MotorBoat x={M.x(pb.x)} y={M.y(pb.y)} heading={pb.heading} scale={1.3} sidelights={night} />
      {s === 0 && (
        <g opacity={fade(w, 0.4, 0.55)}>
          <Word x={M.x(pa.x) - 110} y={M.y(pa.y) + 20} anchor="end" size={50} fill={ORANGE}>Give way</Word>
          <Word x={M.x(pa.x) + 120} y={M.y(pa.y) - 50} anchor="start" size={42} fill={GREEN_TEXT} weight={700}>her starboard side</Word>
        </g>
      )}
      {s === 1 && (
        <g opacity={fade(w, 0.2, 0.35)}>
          <Word x={1220} y={560} anchor="start" size={46}>Early, bold,</Word>
          <Word x={1220} y={620} anchor="start" size={46}>pass astern</Word>
        </g>
      )}
      {s === 2 && (
        <g opacity={fade(w, 0.05, 0.2)}>
          <Word x={1180} y={600} anchor="start" size={50} fill={GREEN_TEXT}>Stand-on vessel:</Word>
          <Word x={1180} y={665} anchor="start" size={46} weight={700}>course and speed</Word>
        </g>
      )}
      {night && (
        <g opacity={fade(w, 0.25, 0.4)}>
          <g transform="translate(1030 200)">
            <rect width={520} height={250} rx={20} fill="#000" stroke="#5d6f82" strokeWidth={3} />
            <circle cx={290} cy={90} r={11} fill="#fff" />
            <circle cx={260} cy={150} r={18} fill={ART.port} />
            <text x={260} y={225} textAnchor="middle" fontSize={34} fontWeight={700} fill="#fff">red, on your starboard bow</text>
          </g>
          <Word x={1290} y={560} size={46} fill={RED_TEXT} weight={700}>’tis your duty</Word>
          <Word x={1290} y={620} size={46} fill={RED_TEXT} weight={700}>to keep clear</Word>
        </g>
      )}
    </Stage>
  )
}

/* ------------------------------------------------------------------ */
/* Scene 7: two sailing vessels                                        */
/* ------------------------------------------------------------------ */

const N7 = SCRIPT.scenes[5]!.narration
const W7 = within(N7)
const TACKS = played(sailingCase('tacks'), 1.7)
const SAME = played(sailingCase('same'), 1.7)

function SailPair({ p, u, M }: { p: ReturnType<typeof played>; u: number; M: ReturnType<typeof mapper> }) {
  const g = p.r.giveWay === 'a' ? 'a' : 'b'
  const sd = g === 'a' ? 'b' : 'a'
  const i = Math.round(u * (p.tracks.a.length - 1))
  const pg = at(p.tracks[g], u)
  const ps = at(p.tracks[sd], u)
  return (
    <>
      <polyline points={trackPath(p.tracks[g], u, M)} fill="none" stroke={ORANGE} strokeWidth={5} strokeDasharray="14 10" />
      <polyline points={trackPath(p.tracks[sd], u, M)} fill="none" stroke={GREEN_TEXT} strokeWidth={5} strokeDasharray="14 10" />
      <VesselIcon v={p.e[g]} x={M.x(pg.x)} y={M.y(pg.y)} heading={pg.heading} scale={0.85} windFrom={p.e.windFrom} main={p.mains?.[g]?.[i] ?? undefined} />
      <VesselIcon v={p.e[sd]} x={M.x(ps.x)} y={M.y(ps.y)} heading={ps.heading} scale={0.85} windFrom={p.e.windFrom} main={p.mains?.[sd]?.[i] ?? undefined} />
    </>
  )
}

function Legend({ give, stand }: { give: string; stand: string }) {
  return (
    <g>
      <rect x={50} y={560} width={470} height={160} rx={18} fill="rgba(14,34,55,0.85)" />
      <line x1={80} y1={610} x2={140} y2={610} stroke={ORANGE} strokeWidth={8} />
      <Word x={160} y={624} anchor="start" size={42} fill={ORANGE} weight={700}>{give}</Word>
      <line x1={80} y1={680} x2={140} y2={680} stroke={GREEN_TEXT} strokeWidth={8} />
      <Word x={160} y={694} anchor="start" size={42} fill={GREEN_TEXT} weight={700}>{stand}</Word>
    </g>
  )
}

const MOTOR_VS_SAIL = played(Q_MOTORSAILING, 1.7)

// Sentences: 0 power keeps clear of sail, 1 engine on = power, 2 port tack keeps clear, 3 windward keeps clear, 4 ships.
function sceneSailPower(t: number, s: number) {
  const w = W7(t, s)
  const M = mapper(860, 450, 150)
  if (s === 0) {
    const M0 = mapper(760, 470, 150)
    const u = 0.85 * phase(w, 0.05, 1)
    return (
      <Stage>
        <WindStreaks x={0} y={150} w={1600} h={620} windFrom={MOTOR_VS_SAIL.e.windFrom!} colour="rgba(207,230,245,0.16)" spacing={170} len={80} width={5} />
        <SceneTitle t={1}>Power keeps clear of sail</SceneTitle>
        <SailPair p={MOTOR_VS_SAIL} u={u} M={M0} />
        <Legend give="Power-driven: keeps clear" stand="Under sail" />
        <WindBadge x={1480} y={220} windFrom={MOTOR_VS_SAIL.e.windFrom!} r={60} dark />
      </Stage>
    )
  }
  if (s === 1) {
    return (
      <Stage>
        <SceneTitle t={1}>Engine on = power-driven</SceneTitle>
        <SailBoat x={560} y={500} heading={90} scale={2.2} main="port" off={95} />
        <SceneIcon icon={Cog} x={560} y={330} size={80} colour={ART.amber} />
        <g opacity={fade(w, 0.35, 0.5)}>
          <Word x={1000} y={420} anchor="start" size={52}>Sails up, engine driving:</Word>
          <Word x={1000} y={495} anchor="start" size={52} fill={ART.amber}>you give way like</Word>
          <Word x={1000} y={570} anchor="start" size={52} fill={ART.amber}>a motor boat</Word>
        </g>
      </Stage>
    )
  }
  if (s === 4) {
    return (
      <Stage>
        <SceneTitle t={1}>Don’t count on it</SceneTitle>
        <rect x={0} y={560} width={1600} height={340} fill="#123a5a" />
        <g transform="translate(150 560)">
          <path d="M0 -90 L900 -90 L860 0 L40 0 Z" fill="#3b4b5c" />
          <rect x={620} y={-230} width={200} height={140} fill="#e8edf2" />
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={640 + i * 28} y={-200} width={18} height={14} fill="#5b6b7b" />)}
          <rect x={60} y={-150} width={520} height={60} fill="#0B5563" />
          <text x={320} y={-108} textAnchor="middle" fontSize={40} fontWeight={800} fill="#fff">FERRY</text>
        </g>
        <SailBoat x={1300} y={640} heading={270} scale={0.9} main="port" off={95} />
        <g opacity={fade(w, 0.3, 0.45)}>
          <Word x={800} y={250} size={50}>Ships can’t stop or turn quickly,</Word>
          <Word x={800} y={320} size={50} fill={ART.amber}>and may not have seen you</Word>
        </g>
      </Stage>
    )
  }
  const wind = 0
  const p = s === 3 ? SAME : TACKS
  const u = 0.85 * phase(w, 0.05, 1)
  return (
    <Stage>
      <WindStreaks x={0} y={150} w={1600} h={620} windFrom={wind} colour="rgba(207,230,245,0.16)" spacing={170} len={80} width={5} />
      <SceneTitle t={1}>{s === 2 ? 'Port tack keeps clear' : 'Windward keeps clear'}</SceneTitle>
      <SailPair p={p} u={u} M={M} />
      <Legend give={s === 2 ? 'Port tack: keeps clear' : 'Windward: keeps clear'} stand={s === 2 ? 'Starboard tack' : 'Leeward'} />
      <WindBadge x={1480} y={220} windFrom={wind} r={60} dark />
    </Stage>
  )
}

/* ------------------------------------------------------------------ */
/* Scene 8: who gives way to whom (Rule 18)                            */
/* ------------------------------------------------------------------ */

const N8 = SCRIPT.scenes[6]!.narration
const W8 = within(N8)

const RUNGS: { id: Kind; lines: string[]; x: number; y: number; w: number }[] = [
  { id: 'nuc', lines: ['Not under command'], x: 150, y: 170, w: 560 },
  { id: 'ram', lines: ['Restricted in ability', 'to manoeuvre'], x: 750, y: 170, w: 560 },
  { id: 'fishing', lines: ['Engaged in fishing'], x: 350, y: 330, w: 760 },
  { id: 'sail', lines: ['Sailing vessel'], x: 350, y: 460, w: 760 },
  { id: 'power', lines: ['Power-driven vessel'], x: 350, y: 590, w: 760 },
]
const RANK_OF: Record<Kind, number> = { power: 1, sail: 2, fishing: 3, ram: 4, nuc: 4 }

function sceneLadder(t: number, s: number) {
  const w = W8(t, s)
  // Sentences: 0 some have right of way, 1 fishing and restricted, 2 not under command, 3 channels and ferries, 4 fishing boat motoring home.
  const giver: Kind | null = s === 1 || s === 2 ? 'sail' : null
  return (
    <Stage>
      <SceneTitle t={1}>{s === 0 ? 'Who keeps clear of whom?' : s >= 3 ? 'Judge by what she is doing' : 'A yacht keeps out of the way of…'}</SceneTitle>
      {RUNGS.map((r) => {
        const isGiver = giver === r.id
        const above = giver !== null && RANK_OF[r.id] > RANK_OF[giver]
        const h = r.lines.length > 1 ? 120 : 96
        return (
          <g key={r.id} opacity={s === 0 ? fade(w, 0.1 + RANK_OF[r.id] * 0.08, 0.2 + RANK_OF[r.id] * 0.08) : s >= 3 ? 0.25 : s === 2 && r.id !== 'nuc' && r.id !== 'sail' ? 0.45 : 1}>
            <rect x={r.x} y={r.y} width={r.w} height={h} rx={18} fill={isGiver ? 'rgba(245,179,1,0.22)' : above ? 'rgba(43,179,192,0.22)' : 'rgba(255,255,255,0.07)'} stroke={isGiver ? ART.amber : above ? ART.tealBright : '#5d6f82'} strokeWidth={isGiver || above ? 6 : 3} />
            {r.lines.map((l, i) => (
              <text key={l} x={r.x + r.w / 2} y={r.y + (r.lines.length > 1 ? 52 + i * 46 : 62)} textAnchor="middle" fontSize={r.lines.length > 1 ? 40 : 46} fontWeight={700} fill="#fff">{l}</text>
            ))}
          </g>
        )
      })}
      {giver && (
        <g>
          <Arrow x1={1220} y1={RUNGS.find((r) => r.id === giver)!.y + 48} x2={1220} y2={300} colour={ART.amber} width={10} head={32} />
          <Word x={1260} y={RUNGS.find((r) => r.id === giver)!.y + 64} anchor="start" size={40} fill={ART.amber} weight={700}>keeps clear</Word>
        </g>
      )}
      {s === 3 && (
        <g opacity={fade(w, 0.05, 0.2)}>
          <rect x={250} y={300} width={1100} height={260} rx={24} fill="rgba(11,25,41,0.95)" stroke={ART.amber} strokeWidth={3} />
          <Word x={800} y={390} size={50}>Narrow channels, harbour entrances:</Word>
          <Word x={800} y={470} size={50} fill={ART.amber}>don’t impede ferries and ships</Word>
        </g>
      )}
      {s === 4 && (
        <g opacity={fade(w, 0.05, 0.2)}>
          <rect x={250} y={300} width={1100} height={300} rx={24} fill="rgba(11,25,41,0.95)" stroke={ART.tealBright} strokeWidth={3} />
          <Word x={800} y={385} size={48}>Nets or lines out: fishing</Word>
          <Word x={800} y={455} size={48} fill={ART.muted}>Motoring home: power-driven</Word>
          <Word x={800} y={540} size={44} fill={ART.amber} weight={700} opacity={fade(w, 0.5, 0.65)}>what she is doing, not what she is</Word>
        </g>
      )}
    </Stage>
  )
}

/* ------------------------------------------------------------------ */
/* Scene 9: giving way and standing on                                 */
/* ------------------------------------------------------------------ */

const N9 = SCRIPT.scenes[7]!.narration
const W9 = within(N9)

function sceneAction(t: number, s: number) {
  const w = W9(t, s)
  if (s === 0 || s === 1) {
    const turn = s === 0 ? 60 * phase(w, 0.2, 0.6) : 0
    const start = { x: 430, y: 700 }
    const pivot = { x: 430, y: 520 }
    const go = s === 0 ? phase(w, 0.6, 1) : 0
    const end = polar(pivot.x, pivot.y, 260 * go, turn)
    const boat = s === 0 ? (go > 0 ? end : { x: pivot.x, y: pivot.y + 160 * (1 - phase(w, 0, 0.2)) }) : pivot
    const zig = Array.from({ length: 9 }, (_, i) => `${1060 + (i % 2 === 0 ? 0 : 30)},${700 - i * 60}`).join(' ')
    return (
      <Stage>
        <SceneTitle t={1}>{s === 0 ? 'Give way: early and bold' : 'Not a string of small ones'}</SceneTitle>
        <line x1={start.x} y1={start.y} x2={pivot.x} y2={180} stroke={ART.muted} strokeWidth={4} strokeDasharray="14 12" />
        {s === 0 && turn > 1 && (
          <>
            <path d={arcPath(pivot.x, pivot.y, 160, 0, turn)} fill="none" stroke={ART.amber} strokeWidth={8} />
            <Word x={pivot.x + 140} y={pivot.y - 170} anchor="start" size={56} fill={ART.amber}>{Math.round(turn)}°</Word>
            {go > 0 && <line x1={pivot.x} y1={pivot.y} x2={end.x} y2={end.y} stroke={ART.tealBright} strokeWidth={6} />}
          </>
        )}
        <MotorBoat x={boat.x} y={boat.y} heading={s === 0 ? turn : 0} scale={1.1} />
        {s === 1 && (
          <g opacity={fade(w, 0.05, 0.25)}>
            <polyline points={zig} fill="none" stroke={ART.tealBright} strokeWidth={6} />
            <MotorBoat x={1060} y={220} heading={0} scale={0.9} />
            <line x1={980} y1={260} x2={1160} y2={640} stroke={RED_TEXT} strokeWidth={14} strokeLinecap="round" opacity={fade(w, 0.4, 0.55)} />
            <line x1={1160} y1={260} x2={980} y2={640} stroke={RED_TEXT} strokeWidth={14} strokeLinecap="round" opacity={fade(w, 0.4, 0.55)} />
          </g>
        )}
        {s === 0 && <Word x={1020} y={430} anchor="start" size={48} opacity={fade(w, 0.65, 0.8)}>Easy to see</Word>}
      </Stage>
    )
  }
  if (s === 2 || s === 3) {
    const cards = [
      { title: 'Stand on', lines: ['Hold course', 'and speed'], show: s >= 2 ? fade(w, 0.02, 0.12) : 0, colour: GREEN_TEXT },
      { title: 'May act', lines: ['once she is clearly', 'not giving way'], show: s === 3 ? fade(w, 0.02, 0.15) : 0, colour: ART.amber },
      { title: 'Must act', lines: ['if she alone', 'can’t avoid it'], show: s === 3 ? fade(w, 0.5, 0.62) : 0, colour: RED_TEXT },
    ]
    return (
      <Stage>
        <SceneTitle t={1}>Stand on — but keep watching</SceneTitle>
        {cards.map((c, i) => (
          <g key={c.title} opacity={s === 3 && i === 0 ? 1 : c.show} transform={`translate(${70 + i * 500} 250)`}>
            <rect width={460} height={330} rx={22} fill="rgba(255,255,255,0.07)" stroke={c.colour} strokeWidth={5} />
            <text x={230} y={90} textAnchor="middle" fontSize={58} fontWeight={800} fill={c.colour}>{c.title}</text>
            {c.lines.map((l, j) => <text key={l} x={230} y={180 + j * 56} textAnchor="middle" fontSize={40} fill="#fff">{l}</text>)}
            {i < 2 && <text x={482} y={180} textAnchor="middle" fontSize={56} fill={ART.muted}>›</text>}
          </g>
        ))}
      </Stage>
    )
  }
  // The crossing from chapter 6 again: the give-way vessel holds her new course until the other is past and clear.
  const u = 0.35 + 0.65 * phase(w, 0, 0.85)
  const M = mapper(560, 440, 125)
  const pa = at(CROSSING.tracks.a, u)
  const pb = at(CROSSING.tracks.b, u)
  return (
    <Stage>
      <SceneTitle t={1}>Until past and clear</SceneTitle>
      <polyline points={trackPath(CROSSING.tracks.a, u, M)} fill="none" stroke={ART.tealBright} strokeWidth={5} strokeDasharray="14 10" />
      <polyline points={trackPath(CROSSING.tracks.b, u, M)} fill="none" stroke={ORANGE} strokeWidth={5} strokeDasharray="14 10" />
      <MotorBoat x={M.x(pa.x)} y={M.y(pa.y)} heading={pa.heading} scale={1.1} />
      <MotorBoat x={M.x(pb.x)} y={M.y(pb.y)} heading={pb.heading} scale={1.1} />
      <Word x={1200} y={520} size={56} fill={GREEN_TEXT} opacity={fade(w, 0.65, 0.8)}>Past and clear ✓</Word>
    </Stage>
  )
}

/* ------------------------------------------------------------------ */
/* Narrow channels and harbour entrances                               */
/* ------------------------------------------------------------------ */

const WC = within(SCRIPT.scenes[8]!.narration)

/** A ferry seen from above, bow towards `heading`, about 300 units long at scale 1. */
function Ferry({ x, y, heading = 0, scale = 1 }: { x: number; y: number; heading?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${heading}) scale(${scale})`}>
      <path d="M0 -150 C 34 -120 44 -80 44 -40 L 44 140 Q 44 150 34 150 L -34 150 Q -44 150 -44 140 L -44 -40 C -44 -80 -34 -120 0 -150 Z" fill="#f1f4f7" stroke="#1f2a36" strokeWidth={3} />
      <rect x={-32} y={-60} width={64} height={150} rx={8} fill="#0B5563" />
      <rect x={-20} y={-100} width={40} height={30} rx={4} fill="#5b6b7b" />
      <rect x={-12} y={10} width={24} height={40} rx={4} fill="#d9342b" />
    </g>
  )
}

const LEFT = 560
const RIGHT = 1040
// Sentences: 0 keep to starboard, 1 don't impede, 2 ferries, 3 cross at right angles, 4 hold back.
function sceneChannel(t: number, s: number) {
  const w = WC(t, s)
  const yachtY = s === 0 ? 800 - 420 * phase(w, 0.1, 0.9) : s === 1 ? 380 : s === 4 ? 740 : 380
  const yachtX = RIGHT - 70
  const ferryY = s === 1 ? 160 + 280 * phase(w, 0.1, 0.9) : s === 2 ? -120 + 400 * phase(w, 0.05, 0.6) : s === 4 ? 160 + 420 * phase(w, 0.05, 0.9) : null
  const crossX = s === 3 ? 260 + 1080 * phase(w, 0.1, 0.85) : null
  return (
    <Stage background="#1d5a7a">
      {/* shallows either side of the channel */}
      <rect x={0} y={0} width={LEFT} height={900} fill="#2c7393" />
      <rect x={RIGHT} y={0} width={1600 - RIGHT} height={900} fill="#2c7393" />
      {/* harbour walls at the top */}
      <rect x={0} y={0} width={LEFT - 20} height={120} fill="#8a8070" />
      <rect x={RIGHT + 20} y={0} width={1600 - RIGHT - 20} height={120} fill="#8a8070" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={LEFT - 14} y={190 + i * 180} width={28} height={36} rx={4} fill={ART.port} stroke="#1f2a36" strokeWidth={2} />
          <polygon points={`${RIGHT},${186 + i * 180} ${RIGHT - 18},${224 + i * 180} ${RIGHT + 18},${224 + i * 180}`} fill={ART.starboard} stroke="#1f2a36" strokeWidth={2} />
        </g>
      ))}
      <line x1={800} y1={130} x2={800} y2={900} stroke="#ffffff" strokeOpacity={0.25} strokeWidth={4} strokeDasharray="20 18" />
      {s !== 3 && <Yacht x={yachtX} y={yachtY} heading={0} scale={0.9} />}
      {s === 0 && <Arrow x1={1180} y1={720} x2={1180} y2={460} colour={ART.amber} width={8} />}
      {ferryY !== null && <Ferry x={s === 2 ? 700 : 660} y={ferryY} heading={180} scale={0.85} />}
      {crossX !== null && (
        <g>
          <line x1={240} y1={560} x2={1360} y2={560} stroke={ART.amber} strokeWidth={6} strokeDasharray="18 14" />
          <Yacht x={crossX} y={560} heading={90} scale={0.9} />
        </g>
      )}
      <SceneTitle t={t}>Channels and harbour entrances</SceneTitle>
      <g>
        <rect x={1100} y={170} width={480} height={150} rx={18} fill="rgba(11,25,41,0.88)" />
        <Word x={1340} y={235} size={40}>{['Keep to starboard', 'Don’t impede', 'Ferries: fast, on time', 'Cross at right angles', 'Hold back'][Math.min(s, 4)]}</Word>
        <Word x={1340} y={290} size={32} fill={ART.muted} weight={600}>{['as far over as is safe', 'ships confined to the channel', 'little warning at the breakwater', 'briskly, never across a bow', 'while a ferry comes or goes'][Math.min(s, 4)]}</Word>
      </g>
    </Stage>
  )
}

/* ------------------------------------------------------------------ */
/* Sounds and shapes                                                   */
/* ------------------------------------------------------------------ */

const WS = within(SCRIPT.scenes[9]!.narration)
const SOUND_ROWS: Array<{ id: SignalId; label: string; from: number; colour?: string }> = [
  { id: 'stbd', label: 'I am turning to starboard', from: 1 },
  { id: 'port', label: 'I am turning to port', from: 1 },
  { id: 'astern', label: 'My engines are going astern', from: 2 },
  { id: 'doubt', label: 'I doubt what you are doing!', from: 3, colour: '#d9342b' },
]

// Sentences: 0 horns, 1 one and two short, 2 three short, 3 five short, 4 anchor ball, 5 motor-sailing cone.
function sceneSounds(t: number, s: number, seconds: number) {
  const w = WS(t, s)
  if (s >= 4) {
    const shapes: DayShape[] = s === 4 ? ['ball'] : ['cone-down']
    return (
      <Stage background="#dcebf6">
        <rect y={700} width={1600} height={200} fill="#7fa6c2" />
        <DayVessel hull="yacht" shapes={shapes} x={560} y={710} scale={1.6} />
        <text x={800} y={110} textAnchor="middle" fontSize={58} fontWeight={800} fill="#1A1A2E">Day shapes</text>
        <g opacity={fade(w, 0.1, 0.25)}>
          <text x={960} y={330} fontSize={50} fontWeight={800} fill="#1A1A2E">{s === 4 ? 'Black ball' : 'Cone, point down'}</text>
          <text x={960} y={400} fontSize={38} fill="#0B5563" fontWeight={700}>{s === 4 ? 'at anchor' : 'sailing + engine'}</text>
          <text x={960} y={455} fontSize={38} fill="#0B5563" fontWeight={700}>{s === 4 ? 'hoist one when you anchor' : '= power-driven'}</text>
        </g>
      </Stage>
    )
  }
  return (
    <Stage>
      <SceneTitle t={t}>The signals you will hear</SceneTitle>
      <Ship x={220} y={480} heading={90} scale={1.4} />
      <SoundWaves x={380} y={480} facing={90} r={110} progress={(seconds % 1.5) / 1.5} />
      {s === 0 && <Word x={950} y={480} size={52} opacity={fade(w, 0.3, 0.45)}>Short blast: about a second</Word>}
      {SOUND_ROWS.map((r, i) => (
        <g key={r.id} opacity={s >= r.from ? (s === r.from ? 1 : 0.5) : 0}>
          <TimelineBars signal={signalById(r.id)} x={560} y={200 + i * 150} pxPerSec={80} height={44} colour={r.colour ?? '#2bb3c0'} />
          <text x={560} y={290 + i * 150} fontSize={38} fontWeight={700} fill={r.colour ? '#ff8a80' : '#fff'}>{r.label}</text>
        </g>
      ))}
    </Stage>
  )
}

const scene = (i: number, render: (t: number, s: number, seconds: number) => ReactNode): Scene => ({ ...SCRIPT.scenes[i]!, render })

const SCENES: Scene[] = [
  scene(0, sceneRules),
  scene(1, sceneRisk),
  scene(2, sceneHeadOn),
  scene(3, sceneCrossing),
  scene(4, sceneOvertaking),
  scene(5, sceneSailPower),
  scene(6, sceneLadder),
  scene(7, sceneAction),
  scene(8, sceneChannel),
  scene(9, sceneSounds),
]

export function Video() {
  return <LessonPlayer slug={SCRIPT.slug} title="Rules of the road for charter skippers" scenes={SCENES} speak={SCRIPT.speak} />
}

/* ------------------------------------------------------------------ */
/* Exercises                                                           */
/* ------------------------------------------------------------------ */

export const QUESTIONS: Question[] = [
  {
    id: 'crossing-power',
    kind: 'choice',
    prompt: 'You are motoring (a power-driven vessel), heading up the page. A motor cruiser is crossing from your starboard side; her bearing is steady and the range is closing. What should you do?',
    figure: <PlanFigure e={Q_CROSSING} names={{ a: 'You', b: 'Motor cruiser' }} label="Plan view: you heading up the page; a motor cruiser on your starboard bow, heading across your bow from right to left." />,
    options: [
      'Alter course early and boldly to starboard, and pass astern of her',
      'Hold your course and speed: she must keep clear of you',
      'Alter course to port and cross ahead of her',
      'Make a series of small alterations to starboard',
    ],
    answer: 0,
    explain: 'You are both power-driven and crossing, and she is on your starboard side, so you keep out of the way and avoid crossing ahead of her (Rule 15). Take early and substantial action (Rule 16), big enough for her to see (Rule 8): a bold turn to starboard, passing astern. A string of small alterations is exactly what Rule 8 tells you to avoid.',
  },
  {
    id: 'head-on',
    kind: 'choice',
    prompt: 'Two power-driven vessels, A and B, are meeting on reciprocal courses with a risk of collision. What should each do?',
    figure: <PlanFigure e={Q_HEAD_ON} names={{ a: 'A', b: 'B' }} label="Plan view: two power-driven vessels heading straight towards each other." />,
    options: [
      'Each alters course to starboard, so they pass port side to port side',
      'Each alters course to port, so they pass starboard side to starboard side',
      'The smaller vessel keeps out of the way of the larger',
      'The faster vessel gives way; the slower stands on',
    ],
    answer: 0,
    explain: 'This is the head-on situation (Rule 14): each alters course to starboard so that they pass port to port. Neither is the stand-on vessel. If in any doubt whether it is head-on, assume it is.',
  },
  {
    id: 'port-starboard',
    kind: 'choice',
    prompt: 'Two yachts under sail are on converging courses with a steady bearing. Which must keep out of the way?',
    figure: <PlanFigure e={Q_TACKS} names={{ a: 'A', b: 'B' }} label="Plan view with the wind from the top left. Yacht A has the wind on her port side, mainsail out to starboard. Yacht B has the wind on her starboard side, mainsail out to port." />,
    options: [
      'A: she has the wind on her port side (port tack)',
      'B: she has the wind on her starboard side (starboard tack)',
      'B: she is to windward',
      'Both alter course to starboard',
    ],
    answer: 0,
    explain: 'The wind is on different sides: A has it on her port side (her mainsail is out to starboard), so A is on port tack and keeps out of the way of B on starboard tack (Rule 12). The head-on rule — both turning to starboard — is only for two power-driven vessels.',
  },
  {
    id: 'sail-overtakes-power',
    kind: 'choice',
    prompt: 'You are sailing at 6 knots and catching up a motor boat doing 3 knots. You are coming up from her starboard quarter, about 45° abaft her beam. Who must keep out of the way?',
    options: [
      'You: you are the overtaking vessel',
      'She must: a power-driven vessel keeps out of the way of a sailing vessel',
      'She must: you are on her starboard side',
      'Neither of you: the rules don’t cover overtaking',
    ],
    answer: 0,
    explain: 'You are coming up from more than 22.5° abaft her beam, so you are overtaking her. Rule 13 applies “notwithstanding” the other steering rules, and Rule 18 begins “except where Rules 9, 10 and 13 otherwise require” — so even under sail, the overtaking vessel keeps out of the way.',
  },
  {
    id: 'motor-sailing',
    kind: 'choice',
    prompt: 'Your yacht has her mainsail up, but you also have the engine in gear, driving her along. A yacht under sail alone is crossing from your port side on a steady bearing. Who keeps out of the way?',
    options: [
      'You do: with the engine driving her, your yacht is a power-driven vessel',
      'She does: she has you on her starboard side',
      'She does: you both have sails up, and you are on starboard tack',
      'Neither: you each alter course to starboard',
    ],
    answer: 0,
    explain: 'A sailing vessel is one under sail with her engine, if fitted, not being used (Rule 3). With the engine driving her, your yacht is a power-driven vessel, so you keep out of the way of a sailing vessel (Rule 18) — whichever side she is on. By day the rules require you to show a cone, point down, to say so.',
  },
  {
    id: 'steady-bearings',
    kind: 'choice',
    prompt: 'You are holding a steady course. You take these bearings of a ship on your starboard bow with a hand-bearing compass: 1410, 076°M; 1413, 077°M; 1416, 076°M; 1419, 076°M. She is getting closer. What do they tell you?',
    options: [
      'Risk of collision exists: the bearing is not changing appreciably',
      'She will pass ahead: the bearing is drawing ahead',
      'She will pass astern: the bearing is drawing aft',
      'No risk: the bearing changed by a degree, so she is not on a collision course',
    ],
    answer: 0,
    explain: 'The readings wander by a degree — normal for a hand-bearing compass on a moving boat — but over nine minutes there is no trend. A compass bearing that does not appreciably change while the range closes means risk of collision exists (Rule 7). Decide now who keeps out of the way.',
  },
  {
    id: 'green-to-compass',
    kind: 'bearing',
    prompt: 'You are steering 030°M. The lookout reports a ship at Green 040. What should your hand-bearing compass read when you take her bearing?',
    answer: 70,
    tolerance: 2,
    suffix: 'M',
    explain: 'Green 040 is 040° relative, on the starboard side. Bearing = heading + relative bearing = 030 + 040 = 070°M, taking the hand-bearing compass as having no deviation. Now keep taking her bearing every few minutes: if it stays near 070°M as she closes, there is a risk of collision.',
  },
  {
    id: 'ferry-entrance',
    kind: 'choice',
    prompt: 'You are motoring out of a busy ferry port, such as Split. A large car ferry is coming in through the narrow entrance. What should you do?',
    options: [
      'Hold back, well to the starboard side and clear of the entrance, until she is in',
      'Go first: you are smaller and quicker to turn',
      'Carry on: as a yacht you have the right of way',
      'Cross ahead of her to get to the side of the channel you prefer',
    ],
    answer: 0,
    explain: 'In a narrow channel or harbour entrance keep to the starboard side, and a small vessel must not impede one that can only navigate inside the channel (Rule 9). A ferry cannot stop or turn quickly in the entrance. Wait clear until she is past, then go.',
  },
  {
    id: 'three-short',
    kind: 'choice',
    prompt: 'A ferry manoeuvring onto the quay gives three short blasts on her horn. What does it mean?',
    figure: <svg viewBox="0 0 400 60" className="mx-auto block w-full max-w-sm rounded bg-white" role="img" aria-label="Three short blasts"><TimelineBars signal={signalById('astern')} x={20} y={12} pxPerSec={70} height={36} /></svg>,
    options: [
      'I am operating astern propulsion: her engines are going astern',
      'I am altering my course to starboard',
      'I am altering my course to port',
      'I doubt what you are doing',
    ],
    answer: 0,
    explain: 'Three short blasts: “I am operating astern propulsion” (Rule 34). She may not be moving backwards yet, but she soon will be. Stay well clear of her stern and her wash.',
  },
  {
    id: 'five-short',
    kind: 'choice',
    prompt: 'You are motoring across a channel and a ship nearby gives five short, rapid blasts. What does she mean, and what should you do?',
    options: [
      'She doubts you are doing enough to avoid a collision: make a big, obvious alteration now',
      'She is going astern: carry on',
      'She is saying hello: wave back',
      'She is at anchor: give her a wide berth',
    ],
    answer: 0,
    explain: 'At least five short and rapid blasts mean “I don’t understand your intentions” or “I doubt you are taking enough action” (Rule 34). Check the situation at once and act in a way she cannot miss: usually a bold turn to pass astern of her, or slowing right down.',
  },
  {
    id: 'anchor-ball',
    kind: 'choice',
    prompt: 'You anchor for lunch in a busy bay. Which day shape should you hoist in the fore part of the boat?',
    options: ['One black ball', 'One black cone, point down', 'Two black cones, points together', 'No shape: yachts are exempt'],
    answer: 0,
    explain: 'A vessel at anchor shows one black ball forward by day (Rule 30). Only vessels under 7 metres, anchored away from channels, fairways, anchorages and where other vessels normally navigate, are excused. Many charter yachts carry a ball in a cockpit locker: ask at the briefing.',
  },
  {
    id: 'fishing-cones',
    kind: 'choice',
    prompt: 'Under sail, you see a fishing boat ahead showing this shape, moving slowly across your course on a steady bearing. Who keeps out of the way?',
    figure: <DayView signal="fishing" className="mx-auto block w-full max-w-sm rounded-xl" />,
    options: [
      'You do: two cones points together mean she is engaged in fishing',
      'She does: she is power-driven and you are under sail',
      'She does: you are on starboard tack',
      'You both turn to starboard',
    ],
    answer: 0,
    explain: 'Two cones with their points together mean engaged in fishing, with gear out that restricts her (Rules 26 and 18). A sailing vessel keeps out of her way. A fishing boat with no gear out, simply motoring, is just a power-driven vessel.',
  },
]

/* ------------------------------------------------------------------ */
/* Practice                                                            */
/* ------------------------------------------------------------------ */

type Maker = (rng: Rng, id: string) => Question

const PHRASE: Record<Kind, string> = {
  power: 'a power-driven vessel',
  sail: 'a yacht under sail',
  fishing: 'a vessel engaged in fishing (trawling)',
  ram: 'a vessel restricted in her ability to manoeuvre (a dredger at work)',
  nuc: 'a vessel not under command (her steering has failed)',
}

function redGreen(rel: number): string {
  const r = Math.round(((rel % 360) + 360) % 360)
  if (r === 0) return 'right ahead'
  if (r === 180) return 'right astern'
  return r < 180 ? `Green ${pad3(r)}` : `Red ${pad3(360 - r)}`
}

const tag = (e: Encounter, w: 'a' | 'b') => `${KIND_TAG[e[w].kind]} · ${e[w].speed} kn`

function figureFor(e: Encounter, voice: 'you' | 'ab') {
  const rel = relativeBearing(e.a, e.b)
  const names = voice === 'you' ? { a: 'You', b: 'Other vessel' } : { a: 'A', b: 'B' }
  const label = `Plan view${e.windFrom !== undefined ? ', with the wind shown' : ''}. ${voice === 'you' ? 'You are' : 'A is'} ${KIND_NAME[e.a.kind]} heading ${voice === 'you' ? 'up the page' : `${pad3(e.a.heading)}°`}; ${voice === 'you' ? 'the other vessel' : 'B'}, ${KIND_NAME[e.b.kind]}, is at ${redGreen(rel)} from ${voice === 'you' ? 'you' : 'A'}, heading ${pad3(e.b.heading)}°.`
  return <PlanFigure e={e} names={names} tags={{ a: tag(e, 'a'), b: tag(e, 'b') }} label={label} />
}

const POWER_SAIL: Array<[Kind, Kind]> = [['power', 'power'], ['sail', 'sail'], ['power', 'sail'], ['sail', 'power'], ['power', 'power'], ['sail', 'sail']]
const SHAPES: Shape[] = ['head-on', 'crossing', 'crossing', 'overtaking']

function encounter(rng: Rng, headUp: boolean, kindsPool = POWER_SAIL) {
  const kinds = pick(rng, kindsPool)
  const shape = pick(rng, SHAPES)
  return encounterFor(rng, kinds, shape, headUp)
}

const whyText = (e: Encounter, r: Ruling, voice: 'you' | 'ab') => (r.giveWay === 'both' ? explain(e, r, voice) : `${explain(e, r, voice)} ${actions(e, r, voice)}`)

const MAKERS: Maker[] = [
  // Who keeps out of the way? (you, head-up figure)
  (rng, id) => {
    const { e, r } = encounter(rng, true)
    const options = ['You keep out of her way', 'She keeps out of your way', 'You both alter course to starboard']
    return {
      id, kind: 'choice', options, answer: r.giveWay === 'both' ? 2 : r.giveWay === 'a' ? 0 : 1,
      prompt: `You are ${e.a.kind === 'sail' ? 'under sail' : 'power-driven'}, heading up the page. The other vessel’s bearing is steady and the range is closing. Who must keep out of the way?`,
      figure: figureFor(e, 'you'),
      explain: whyText(e, r, 'you'),
    }
  },
  // Which rule decides it? (A and B, any orientation, sometimes a Rule 18 pair)
  (rng, id) => {
    const pool: Array<[Kind, Kind]> = [...POWER_SAIL, ['sail', 'fishing'], ['power', 'ram'], ['fishing', 'nuc']]
    const kinds = pick(rng, pool)
    const special = kinds.some((k) => k !== 'power' && k !== 'sail')
    const { e, r } = encounterFor(rng, kinds, special ? 'crossing' : pick(rng, SHAPES), false)
    const all = Object.keys(RULE_NAME) as RuleId[]
    // Rule 18 has two names here; never offer the other one as a wrong answer.
    const distractors = all.filter((x) => x !== r.rule && !(r.rule === 'power-sail' && x === 'hierarchy') && !(r.rule === 'hierarchy' && x === 'power-sail'))
    const { options, answer } = choices(rng, RULE_NAME[r.rule], shuffle(rng, distractors).map((x) => RULE_NAME[x]))
    return {
      id, kind: 'choice', options, answer,
      prompt: `A is ${PHRASE[e.a.kind]} and B is ${PHRASE[e.b.kind]}. They are in sight of each other, in open water, on a steady bearing with the range closing. Which rule decides who keeps out of the way?`,
      figure: figureFor(e, 'ab'),
      explain: whyText(e, r, 'ab'),
    }
  },
  // What should you do?
  (rng, id) => {
    const { e, r } = encounter(rng, true)
    const options = [
      'Keep out of her way: act early and boldly',
      'Stand on: hold your course and speed, and keep watching her',
      'Alter course to starboard — and so should she',
      'Alter course to port and cross ahead of her',
    ]
    return {
      id, kind: 'choice', options, answer: r.giveWay === 'both' ? 2 : r.giveWay === 'a' ? 0 : 1,
      prompt: `You are ${e.a.kind === 'sail' ? 'under sail' : 'power-driven'}, heading up the page, and there is a risk of collision. What should you do?`,
      figure: figureFor(e, 'you'),
      explain: `${whyText(e, r, 'you')}${r.giveWay === 'both' ? ' Turning to port instead could take you across her bow just as she turns to starboard.' : r.giveWay === 'a' ? ' Don’t try to cross ahead of a vessel you are keeping out of the way of.' : ''}`,
    }
  },
  // Rule 18 in words
  (rng, id) => {
    const pairs: Array<[Kind, Kind]> = [['sail', 'fishing'], ['power', 'fishing'], ['power', 'ram'], ['sail', 'ram'], ['sail', 'nuc'], ['power', 'nuc'], ['power', 'sail'], ['sail', 'power'], ['fishing', 'nuc'], ['fishing', 'ram']]
    const kinds = pick(rng, pairs)
    const { e, r } = encounterFor(rng, kinds, 'crossing', true)
    const side = sideOf(relativeBearing(e.a, e.b))
    const you = kinds[0] === 'power' || kinds[0] === 'sail'
    const options = you
      ? ['You keep out of her way', 'She keeps out of your way', 'Whichever vessel has the other on her starboard side', 'You both alter course to starboard']
      : ['A keeps out of B’s way', 'B keeps out of A’s way', 'Whichever vessel has the other on her starboard side', 'Both alter course to starboard']
    return {
      id, kind: 'choice', options, answer: r.giveWay === 'a' ? 0 : 1,
      prompt: you
        ? `You are ${PHRASE[e.a.kind]}. ${PHRASE[e.b.kind].charAt(0).toUpperCase()}${PHRASE[e.b.kind].slice(1)} is crossing from your ${side} side, on a steady bearing, in open water. Who must keep out of the way?`
        : `A is ${PHRASE[e.a.kind]}. B is ${PHRASE[e.b.kind]}, crossing from A’s ${side} side on a steady bearing, in open water. Who must keep out of the way?`,
      explain: `${whyText(e, r, you ? 'you' : 'ab')} Which side she is on makes no difference: “the vessel with the other on her starboard side” is only for two power-driven vessels crossing.`,
    }
  },
  // Steady, drawing ahead or drawing aft?
  (rng, id) => {
    const trend = pick(rng, ['steady', 'steady', 'ahead', 'astern'] as Trend[])
    const w = makeWatch(rng, trend)
    const rs = [0, 1, 2, 3].map((i) => reading(w, i)) as [number, number, number, number]
    const time = (i: number) => clock(w.start + i * INTERVAL)
    const options = ['Risk of collision: the bearing is steady', 'She should pass ahead of you: the bearing is drawing ahead', 'She should pass astern of you: the bearing is drawing aft']
    const delta = ((rs[3] - rs[0] + 540) % 360) - 180
    const forward = w.side === 'starboard' ? 'gets smaller' : 'gets bigger'
    return {
      id, kind: 'choice', options, answer: trend === 'steady' ? 0 : trend === 'ahead' ? 1 : 2,
      prompt: `You are steering ${pad3(w.heading)}°M at ${w.speed} knots. A ship on your ${w.side} bow bears ${rs.map((b, i) => `${pad3(b)}°M at ${time(i)}`).join(', ')}, and she is getting closer. What do the bearings tell you?`,
      explain: trend === 'steady'
        ? `The readings wander by a degree or so but show no trend: a bearing that does not appreciably change while the range closes means risk of collision exists (Rule 7).`
        : `The bearing has gone from ${pad3(rs[0])}° to ${pad3(rs[3])}°M — ${delta > 0 ? 'increasing' : 'decreasing'} by ${Math.abs(delta)}°. On your ${w.side} bow, a bearing moving forward, towards your bow, ${forward}; so this one is drawing ${trend === 'ahead' ? 'ahead, and she should pass ahead of you' : 'aft, and she should pass astern of you'}. Keep watching until she is past and clear: at close range a changing bearing alone is no guarantee.`,
    }
  },
  // Is she overtaking?
  (rng, id) => {
    const overtaking = rng() < 0.5
    const off = overtaking ? randInt(rng, 25, 34) * 5 : randInt(rng, 16, 20) * 5
    const side: Side = rng() < 0.5 ? 'starboard' : 'port'
    const rel = side === 'starboard' ? off : 360 - off
    const options = [
      'Yes: she is more than 22.5° abaft your beam, so she is overtaking and keeps out of your way',
      'No: she is not more than 22.5° abaft your beam, so this is not an overtaking situation',
      'Only if she is a power-driven vessel',
    ]
    return {
      id, kind: 'choice', options, answer: overtaking ? 0 : 1,
      prompt: `A vessel is approaching you from ${redGreen(rel)} (${off}° from your bow, on your ${side} side), closing on a steady bearing. Is she an overtaking vessel under the rules?`,
      explain: overtaking
        ? `The overtaking sector starts 22.5° abaft the beam: 90 + 22.5 = 112.5° from the bow. ${off}° is more than that, so she is overtaking — and she keeps out of the way, whatever kind of vessel either of you is (Rule 13). At night she would see only your sternlight.`
        : `The overtaking sector starts 22.5° abaft the beam: 90 + 22.5 = 112.5° from the bow. ${off}° is less than that, so she is not overtaking: the crossing, sailing or Rule 18 rules decide instead. At night she would still see your ${side === 'starboard' ? 'green' : 'red'} sidelight. (Had she been close to the line, in doubt, she should assume she was overtaking.)`,
    }
  },
  // Which tack?
  (rng, id) => {
    const heading = randInt(rng, 0, 71) * 5
    const runningCase = rng() < 0.3
    const off = runningCase ? 180 : randInt(rng, 11, 32) * 5
    const windSide: Side = rng() < 0.5 ? 'starboard' : 'port'
    const windFrom = runningCase ? (heading + 180) % 360 : (heading + (windSide === 'starboard' ? off : 360 - off)) % 360
    const main: Side | undefined = runningCase ? (rng() < 0.5 ? 'port' : 'starboard') : undefined
    const v = { kind: 'sail' as const, heading, speed: 6, x: 0, y: 0, mainsail: main }
    const tack = tackOf(v, windFrom)!
    const mainSide = runningCase ? main! : windSide === 'starboard' ? 'port' : 'starboard'
    return {
      id, kind: 'choice', options: ['Port tack', 'Starboard tack'], answer: tack === 'port' ? 0 : 1, fixedOrder: true,
      prompt: runningCase ? 'This yacht is running dead before the wind. Which tack is she on?' : 'Which tack is this yacht on?',
      figure: <TackFigure heading={heading} windFrom={windFrom} main={mainSide} />,
      explain: runningCase
        ? `With the wind right astern, look at the mainsail. It is on her ${mainSide} side, and the windward side is deemed to be the side opposite the mainsail (Rule 12) — her ${tack} side — so she is on ${tack} tack.`
        : `The wind is coming over her ${windSide} side (her mainsail is out to ${mainSide}), so she is on ${tack} tack. The tack is named after the side the wind comes from — the side opposite the mainsail.`,
    }
  },
]

// What does that signal mean? (the charter subset of Rules 34 and 35)
MAKERS.push((rng, id) => {
  const sig = pick(rng, SIGNALS)
  const { options, answer } = optionSignals(rng, sig)
  const text = (o: SoundSignal) => (isMessage(o) ? `“${o.label}”` : o.label)
  return {
    id, kind: 'choice', options: options.map(text), answer,
    prompt: HEARD_PROMPT[sig.context],
    figure: (
      <svg viewBox={`0 0 ${Math.max(200, totalSeconds(sig) * 50 + 40)} 60`} className="mx-auto block w-full max-w-sm rounded bg-white" role="img" aria-label={`The signal: ${sig.words}`}>
        <TimelineBars signal={sig} x={20} y={12} pxPerSec={50} height={36} />
      </svg>
    ),
    explain: explainSignal(sig),
  }
})

/** A single yacht and the wind, for "which tack?" questions. */
function TackFigure({ heading, windFrom, main }: { heading: number; windFrom: number; main: Side }) {
  return (
    <svg viewBox="0 0 320 240" className="mx-auto block w-full max-w-[300px]" role="img" aria-label={`A yacht seen from above, heading ${pad3(heading)} degrees, with her mainsail out on her ${main} side. The wind badge shows where the wind blows from.`}>
      <rect width={320} height={240} rx={14} fill="#eef6fa" />
      <WindStreaks x={0} y={0} w={320} h={240} windFrom={windFrom} spacing={70} len={28} width={2} />
      <SailBoat x={140} y={124} heading={heading} scale={0.95} main={main} off={offWind(heading, windFrom)} />
      <WindBadge x={276} y={42} windFrom={windFrom} r={24} />
    </svg>
  )
}

export const PRACTICE: PracticeGenerator = {
  title: 'Who gives way?',
  description: 'Random encounters (power and sail, tacks and wind, overtaking, head-on and crossing), bearings to read, who keeps clear of whom, and the sound signals you will hear. Five fresh questions each round.',
  generate: (rng) => shuffle(rng, MAKERS.map((m, i) => ({ m, i }))).slice(0, 5).map(({ m, i }, n) => m(rng, `p${n}-${i}`)),
}

export function Exercises({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  return <ExerciseSet courseSlug={courseSlug} lessonSlug={lessonSlug} questions={QUESTIONS} practice={PRACTICE} />
}
