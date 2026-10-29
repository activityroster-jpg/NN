// Drawings for Lesson 10 (ported from the Boaty Jobs steering and sailing rules lesson): vessels seen from above (motor vessels, yachts
// with their sails set for the wind), wind arrows, and plan-view figures of
// encounters for the notes and the exercises. Pure components (no hooks),
// safe in server-rendered notes: every trig-derived coordinate is rounded
// with r2 so server and browser markup match.

import type { ReactNode } from 'react'
import { r2 } from '@/lib/courses/navigation/chart-geometry'
import { ART, Yacht } from '../../scene-art'
import { mainsailTrack, plan, simulate, type Pose } from './manoeuvre'
import {
  OVERTAKING_FROM, closestApproach, decide, dir, mainsailSide, offWind, type Encounter, type Kind, type Side, type Vessel,
} from './rules'

export const INK = '#1A1A2E'
export const MUTED = '#6B7280'
export const SEA = '#eef6fa'
export const RED_INK = '#b91c1c'
export const GREEN_INK = '#15803d'
export const TEAL_INK = '#0B5563'

/** Point `r` from (cx, cy) at `deg` clockwise from straight up. */
export function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180
  return { x: r2(cx + Math.sin(a) * r), y: r2(cy - Math.cos(a) * r) }
}

/** Filled sector from bearing a clockwise to b (degrees from up). */
export function sectorPath(cx: number, cy: number, r: number, a: number, b: number): string {
  const sweep = ((b - a) % 360 + 360) % 360
  const p = polar(cx, cy, r, a)
  const q = polar(cx, cy, r, a + sweep)
  return `M${cx} ${cy} L${p.x} ${p.y} A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${q.x} ${q.y} Z`
}

/** Arc (no fill) clockwise from a to b. */
export function arcPath(cx: number, cy: number, r: number, a: number, b: number): string {
  const sweep = ((b - a) % 360 + 360) % 360
  const p = polar(cx, cy, r, a)
  const q = polar(cx, cy, r, a + sweep)
  return `M${p.x} ${p.y} A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${q.x} ${q.y}`
}

/** Centre x for a middle-anchored label so that it stays between `min` and `max`. */
export function fitX(x: number, text: string, size: number, min: number, max: number): number {
  const half = (text.length * size * 0.56) / 2
  return r2(Math.max(min + half, Math.min(max - half, x)))
}

/* ------------------------------------------------------------------ */
/* Vessels from above (local length about 120, bow up, like Yacht)     */
/* ------------------------------------------------------------------ */

const MOTOR_HULL = 'M0 -62 C 16 -50 24 -26 24 0 L 24 50 Q 24 58 16 58 L -16 58 Q -24 58 -24 50 L -24 0 C -24 -26 -16 -50 0 -62 Z'

const KIND_COLOURS: Record<Exclude<Kind, 'sail'>, { hull: string; cabin: string }> = {
  power: { hull: '#e6ebf0', cabin: '#5b6b7b' },
  fishing: { hull: '#2f6fa3', cabin: '#f1f5f9' },
  ram: { hull: '#e9a23b', cabin: '#5b4630' },
  nuc: { hull: '#9aa5b1', cabin: '#3f4a56' },
}

export function MotorBoat({ x, y, heading = 0, scale = 1, kind = 'power', sidelights = false, masthead = false, opacity = 1 }: {
  x: number; y: number; heading?: number; scale?: number; kind?: Exclude<Kind, 'sail'>; sidelights?: boolean; masthead?: boolean; opacity?: number
}) {
  const c = KIND_COLOURS[kind]
  return (
    <g transform={`translate(${x} ${y}) rotate(${r2(heading)}) scale(${scale})`} opacity={opacity}>
      {kind === 'fishing' && (
        <g stroke="#2f6fa3" strokeWidth={2} fill="none">
          <path d="M-10 58 L-22 128 M10 58 L22 128" />
          <path d="M-26 128 L26 128 L14 160 L-14 160 Z" fill="rgba(47,111,163,0.18)" strokeDasharray="4 3" />
        </g>
      )}
      <path d={MOTOR_HULL} fill={c.hull} stroke="#3f4a56" strokeWidth={2} />
      <rect x={-15} y={-14} width={30} height={36} rx={5} fill={c.cabin} />
      <path d="M-14 -7 Q0 -17 14 -7" fill="none" stroke="#cfe6f5" strokeWidth={3} />
      {sidelights && (
        <>
          <circle cx={-19} cy={-34} r={6} fill={ART.port} />
          <circle cx={19} cy={-34} r={6} fill={ART.starboard} />
        </>
      )}
      {masthead && <circle cx={0} cy={-2} r={6} fill="#ffffff" stroke="#3f4a56" strokeWidth={1} />}
    </g>
  )
}

/** Boom angle from the centreline for a yacht `off` degrees off the wind. */
function boomAngle(off: number): number {
  return Math.max(10, Math.min(85, 10 + ((off - 45) * 75) / 135))
}

/**
 * A yacht under sail: the scene-art Yacht with her mainsail and headsail
 * eased out on `main` side (the side away from the wind).
 */
export function SailBoat({ x, y, heading = 0, scale = 1, main, off, sidelights = false, opacity = 1, sailFill = 'rgba(255,255,255,0.95)' }: {
  x: number; y: number; heading?: number; scale?: number; main: Side; off: number; sidelights?: boolean; opacity?: number; sailFill?: string
}) {
  const s = main === 'starboard' ? 1 : -1
  const b = (boomAngle(off) * Math.PI) / 180
  const bj = ((boomAngle(off) * 0.8 + 4) * Math.PI) / 180
  const mast = { x: 0, y: -8 }
  const end = { x: r2(s * 46 * Math.sin(b)), y: r2(-8 + 46 * Math.cos(b)) }
  const belly = { x: r2((mast.x + end.x) / 2 + 9 * s * Math.cos(b)), y: r2((mast.y + end.y) / 2 - 9 * Math.sin(b)) }
  const tack = { x: 0, y: -56 }
  const clew = { x: r2(s * 40 * Math.sin(bj)), y: r2(-56 + 40 * Math.cos(bj)) }
  const jb = { x: r2(clew.x / 2 + 8 * s * Math.cos(bj)), y: r2((tack.y + clew.y) / 2 - 8 * Math.sin(bj)) }
  return (
    <g opacity={opacity}>
      <Yacht x={x} y={y} heading={r2(heading)} scale={scale} sidelights={sidelights} />
      <g transform={`translate(${x} ${y}) rotate(${r2(heading)}) scale(${scale})`}>
        <path d={`M${tack.x} ${tack.y} Q${jb.x} ${jb.y} ${clew.x} ${clew.y} Z`} fill={sailFill} stroke="#5d6b78" strokeWidth={1.5} />
        <path d={`M${mast.x} ${mast.y} Q${belly.x} ${belly.y} ${end.x} ${end.y} Z`} fill={sailFill} stroke="#5d6b78" strokeWidth={1.5} />
        <line x1={mast.x} y1={mast.y} x2={end.x} y2={end.y} stroke="#3d4a57" strokeWidth={3} strokeLinecap="round" />
        <circle cx={0} cy={-8} r={3.5} fill="#3d4a57" />
      </g>
    </g>
  )
}

/** Any vessel, drawn by kind. Sailing vessels need the wind (and, when running dead before it, a mainsail side). */
export function VesselIcon({ v, x, y, heading, scale, windFrom, main, sidelights = false, masthead = false, opacity = 1 }: {
  v: Pick<Vessel, 'kind' | 'mainsail'>; x: number; y: number; heading: number; scale: number; windFrom?: number; main?: Side
  sidelights?: boolean; masthead?: boolean; opacity?: number
}) {
  if (v.kind === 'sail' && windFrom !== undefined) {
    const side = main ?? mainsailSide(heading, windFrom, v.mainsail) ?? 'port'
    return <SailBoat x={x} y={y} heading={heading} scale={scale} main={side} off={offWind(heading, windFrom)} sidelights={sidelights} opacity={opacity} />
  }
  if (v.kind === 'sail') return <Yacht x={x} y={y} heading={r2(heading)} scale={scale} sidelights={sidelights} opacity={opacity} />
  return <MotorBoat x={x} y={y} heading={heading} scale={scale} kind={v.kind} sidelights={sidelights} masthead={masthead} opacity={opacity} />
}

/** A round badge with an arrow blowing downwind and the word "Wind". */
export function WindBadge({ x, y, windFrom, r = 30, dark = false, label = 'Wind' }: { x: number; y: number; windFrom: number; r?: number; dark?: boolean; label?: string }) {
  const ink = dark ? '#cfe6f5' : '#1e5a7a'
  const tail = polar(x, y, r * 0.78, windFrom)
  const head = polar(x, y, r * 0.78, windFrom + 180)
  const l = polar(head.x, head.y, r * 0.42, windFrom + 180 + 150)
  const rr = polar(head.x, head.y, r * 0.42, windFrom + 180 - 150)
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={dark ? 'rgba(255,255,255,0.08)' : '#ffffff'} stroke={ink} strokeWidth={dark ? 3 : 1.5} />
      <line x1={tail.x} y1={tail.y} x2={head.x} y2={head.y} stroke={ink} strokeWidth={r / 9} strokeLinecap="round" />
      <polygon points={`${head.x},${head.y} ${l.x},${l.y} ${rr.x},${rr.y}`} fill={ink} />
      <text x={x} y={r2(y + r + r * 0.62)} textAnchor="middle" fontSize={r * 0.55} fontWeight={700} fill={ink}>{label}</text>
    </g>
  )
}

/** Faint streaks across a box, all blowing downwind. */
export function WindStreaks({ x, y, w, h, windFrom, colour = 'rgba(30,90,122,0.18)', spacing = 90, len = 46, width = 2.5 }: {
  x: number; y: number; w: number; h: number; windFrom: number; colour?: string; spacing?: number; len?: number; width?: number
}) {
  const marks: ReactNode[] = []
  const to = dir(windFrom + 180)
  let i = 0
  for (let yy = y + spacing / 2; yy < y + h; yy += spacing) {
    for (let xx = x + spacing / 2 + ((i++ % 2) * spacing) / 2; xx < x + w; xx += spacing) {
      const a = { x: r2(xx - (to.x * len) / 2), y: r2(yy + (to.y * len) / 2) }
      const b = { x: r2(xx + (to.x * len) / 2), y: r2(yy - (to.y * len) / 2) }
      const h1 = polar(b.x, b.y, len * 0.25, windFrom + 180 + 150)
      const h2 = polar(b.x, b.y, len * 0.25, windFrom + 180 - 150)
      marks.push(
        <g key={`${xx}-${yy}`}>
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={colour} strokeWidth={width} strokeLinecap="round" />
          <polyline points={`${h1.x},${h1.y} ${b.x},${b.y} ${h2.x},${h2.y}`} fill="none" stroke={colour} strokeWidth={width} strokeLinecap="round" />
        </g>,
      )
    }
  }
  return <g>{marks}</g>
}

/* ------------------------------------------------------------------ */
/* Plan-view figure of an encounter (notes and exercises)              */
/* ------------------------------------------------------------------ */

export const KIND_TAG: Record<Kind, string> = {
  power: 'power-driven',
  sail: 'under sail',
  fishing: 'fishing (trawling)',
  ram: 'restricted (RAM)',
  nuc: 'not under command',
}

/** Where the two vessels would meet if neither acted. */
export function meetingPoint(e: Encounter): { x: number; y: number } {
  const { tcpa } = closestApproach(e)
  const d = dir(e.a.heading)
  return { x: e.a.x + d.x * e.a.speed * tcpa, y: e.a.y + d.y * e.a.speed * tcpa }
}

/**
 * Two vessels on converging courses, north up, with dashed lines showing
 * where each is heading. Labels sit astern of each vessel, clear of its
 * course; the wind badge has its own strip along the top.
 */
export function PlanFigure({ e, names, tags, width = 380, height = 320, label, tracks }: {
  e: Encounter
  names: { a: string; b: string }
  /** Short descriptions under the names; defaults to the kind. */
  tags?: { a?: string; b?: string }
  width?: number
  height?: number
  label?: string
  /** Optional tracks to draw instead of straight course lines (from `simulate`). */
  tracks?: { a: Pose[]; b: Pose[] }
}) {
  const strip = e.windFrom !== undefined ? 46 : 0
  const c = meetingPoint(e)
  const pts = [e.a, e.b, c, ...(tracks ? [...tracks.a, ...tracks.b] : [])]
  const minX = Math.min(...pts.map((p) => p.x))
  const maxX = Math.max(...pts.map((p) => p.x))
  const minY = Math.min(...pts.map((p) => p.y))
  const maxY = Math.max(...pts.map((p) => p.y))
  const pad = 58
  const plotH = height - strip
  const k = Math.min((width - 2 * pad) / Math.max(maxX - minX, 0.01), (plotH - 2 * pad) / Math.max(maxY - minY, 0.01))
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const sx = (x: number) => r2(width / 2 + (x - cx) * k)
  const sy = (y: number) => r2(strip + plotH / 2 - (y - cy) * k)
  const scale = 0.4
  const vessels = [
    { id: 'a' as const, v: e.a, name: names.a, tag: tags?.a ?? KIND_TAG[e.a.kind] },
    { id: 'b' as const, v: e.b, name: names.b, tag: tags?.b ?? KIND_TAG[e.b.kind] },
  ]
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto block w-full max-w-sm" role="img" aria-label={label ?? 'Plan view of two vessels on converging courses'}>
      <rect width={width} height={height} rx={14} fill={SEA} />
      {e.windFrom !== undefined && (
        <>
          <WindStreaks x={0} y={strip} w={width} h={plotH} windFrom={e.windFrom} spacing={78} len={30} width={2} />
          <line x1={0} y1={strip} x2={width} y2={strip} stroke="#d5e5ee" strokeWidth={1.5} />
          <WindBadge x={width - 28} y={23} windFrom={e.windFrom} r={17} label="" />
          <text x={width - 54} y={29} textAnchor="end" fontSize={15} fontWeight={700} fill="#1e5a7a">Wind</text>
        </>
      )}
      {vessels.map(({ id, v }) => {
        if (tracks) {
          const t = tracks[id]
          return <polyline key={`t${id}`} points={t.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')} fill="none" stroke={id === 'a' ? TEAL_INK : '#c2410c'} strokeWidth={2} strokeDasharray="6 5" />
        }
        const end = { x: c.x + (c.x - v.x) * 0.25, y: c.y + (c.y - v.y) * 0.25 }
        return <line key={`l${id}`} x1={sx(v.x)} y1={sy(v.y)} x2={sx(end.x)} y2={sy(end.y)} stroke={id === 'a' ? TEAL_INK : '#c2410c'} strokeWidth={2} strokeDasharray="6 5" />
      })}
      {vessels.map(({ id, v }) => (
        <VesselIcon key={`v${id}`} v={v} x={sx(v.x)} y={sy(v.y)} heading={v.heading} scale={scale} windFrom={e.windFrom} />
      ))}
      {vessels.map(({ id, v, name, tag }) => {
        const back = dir(v.heading + 180)
        const raw = { x: sx(v.x) + back.x * 54, y: sy(v.y) - back.y * 54 }
        const lx = fitX(raw.x, tag.length > name.length * 1.4 ? tag : name, tag.length > name.length * 1.4 ? 12 : 17, 6, width - 6)
        const ly = r2(Math.max(strip + 20, Math.min(height - 24, raw.y)))
        return (
          <g key={`n${id}`} textAnchor="middle" fontWeight={700} stroke={SEA} strokeWidth={4} paintOrder="stroke" strokeLinejoin="round">
            <text x={lx} y={ly} fontSize={17} fill={id === 'a' ? TEAL_INK : '#9a3412'}>{name}</text>
            <text x={lx} y={ly + 16} fontSize={12} fontWeight={600} fill={MUTED}>{tag}</text>
          </g>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Figures for the notes                                               */
/* ------------------------------------------------------------------ */

/** The overtaking sector: more than 22.5° abaft the beam — where only the sternlight can be seen. */
export function OvertakingFigure() {
  const cx = 260
  const cy = 175
  const R = 190
  const edgeS = polar(cx, cy, R, OVERTAKING_FROM)
  const edgeP = polar(cx, cy, R, 360 - OVERTAKING_FROM)
  const beamL = polar(cx, cy, R, 270)
  const beamR = polar(cx, cy, R, 90)
  const yacht = polar(cx, cy, 150, 160)
  const arcA = polar(cx, cy, 70, 101)
  return (
    <svg viewBox="0 0 520 400" className="mx-auto block w-full max-w-lg" role="img" aria-label="A vessel seen from above. The sector more than 22.5 degrees abaft her beam on either side, 135 degrees in all, is shaded: a vessel coming up from inside it is overtaking. A yacht is shown inside the sector.">
      <rect width={520} height={400} rx={16} fill={SEA} />
      <path d={sectorPath(cx, cy, R, 0, OVERTAKING_FROM)} fill={ART.starboard} fillOpacity={0.1} />
      <path d={sectorPath(cx, cy, R, 360 - OVERTAKING_FROM, 360)} fill={ART.port} fillOpacity={0.09} />
      <path d={sectorPath(cx, cy, R, OVERTAKING_FROM, 360 - OVERTAKING_FROM)} fill="#94a3b8" fillOpacity={0.32} />
      <line x1={beamL.x} y1={beamL.y} x2={beamR.x} y2={beamR.y} stroke={MUTED} strokeWidth={1.5} strokeDasharray="5 5" />
      <line x1={cx} y1={cy} x2={edgeS.x} y2={edgeS.y} stroke={INK} strokeWidth={2} />
      <line x1={cx} y1={cy} x2={edgeP.x} y2={edgeP.y} stroke={INK} strokeWidth={2} />
      <path d={arcPath(cx, cy, 70, 90, OVERTAKING_FROM)} fill="none" stroke={INK} strokeWidth={2} />
      <text x={arcA.x + 8} y={arcA.y + 4} fontSize={14} fontWeight={700} fill={INK}>22.5°</text>
      <text x={beamR.x - 6} y={beamR.y - 8} textAnchor="end" fontSize={13} fill={MUTED}>beam</text>
      <text x={beamL.x + 6} y={beamL.y - 8} fontSize={13} fill={MUTED}>beam</text>
      <MotorBoat x={cx} y={cy} scale={0.8} sidelights />
      <circle cx={cx} cy={r2(cy + 56 * 0.8)} r={4} fill="#ffffff" stroke={INK} strokeWidth={1} />
      <SailBoat x={yacht.x} y={yacht.y} heading={350} scale={0.5} main="port" off={100} />
      <path d={`M${yacht.x + 2} ${yacht.y - 40} L${yacht.x - 6} ${yacht.y - 78}`} stroke="#c2410c" strokeWidth={3} markerEnd="url(#ot-arrow)" />
      <defs>
        <marker id="ot-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="#c2410c" />
        </marker>
      </defs>
      <text x={cx} y={372} textAnchor="middle" fontSize={16} fontWeight={700} fill={INK}>Overtaking sector · 135°</text>
      <text x={cx} y={392} textAnchor="middle" fontSize={13} fill={MUTED}>at night: her sternlight only, no sidelights</text>
      <text x={24} y={34} fontSize={14} fontWeight={700} fill={RED_INK}>port side</text>
      <text x={496} y={34} textAnchor="end" fontSize={14} fontWeight={700} fill={GREEN_INK}>starboard side</text>
    </svg>
  )
}

/** Two sailing encounters used by the notes (and tested against the rules engine). */
export function sailingCase(kind: 'tacks' | 'same'): Encounter {
  const at = (heading: number, T = 0.25, speed = 6): Vessel => {
    const d = dir(heading)
    return { kind: 'sail', heading, speed, x: -d.x * speed * T, y: -d.y * speed * T }
  }
  // Wind from the north in both. "tacks": a on port tack (heading 060), b on starboard tack (300).
  // "same": both on starboard tack — a close-hauled (300) to leeward, b broad-reaching (240) to windward.
  return kind === 'tacks' ? { a: at(60), b: at(300), windFrom: 0 } : { a: at(300), b: at(240), windFrom: 0 }
}

function SailingPanel({ e, title, give, stand, aria }: { e: Encounter; title: string; give: string; stand: string; aria: string }) {
  const r = decide(e)!
  const m = plan(e, r)
  const tr = simulate(e, m, 120)
  const W = 320
  const H = 300
  const k = 58
  const sx = (x: number) => r2(W / 2 + x * k)
  const sy = (y: number) => r2(H / 2 + 26 - y * k)
  const gk = r.giveWay === 'a' ? 'a' : 'b'
  const sk = gk === 'a' ? 'b' : 'a'
  // Show the give-way yacht just after her turn: her new course leads astern of the other.
  const order = (gk === 'a' ? m.a : m.b)!
  const target = e[gk].heading + order.alter
  let at = tr[gk].findIndex((p) => Math.abs(((p.heading - target + 540) % 360) - 180) < 1)
  at = at < 0 ? 40 : at + 6
  const mains = { a: mainsailTrack(e.a, tr.a, e.windFrom!), b: mainsailTrack(e.b, tr.b, e.windFrom!) }
  const pg = tr[gk][at]!
  const ps = tr[sk][at]!
  const lab = (p: Pose, other: Pose, text: string, colour: string) => {
    const below = sy(other.y) < sy(p.y)
    return (
      <text x={fitX(sx(p.x), text, 14, 6, W - 6)} y={sy(p.y) + (below ? 44 : -32)} textAnchor="middle" fontSize={14} fontWeight={700} fill={colour} stroke={SEA} strokeWidth={4} paintOrder="stroke">{text}</text>
    )
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={aria}>
      <rect width={W} height={H} rx={14} fill={SEA} />
      <WindStreaks x={0} y={46} w={W} h={H - 46} windFrom={e.windFrom!} spacing={70} len={28} width={2} />
      <line x1={0} y1={46} x2={W} y2={46} stroke="#d5e5ee" strokeWidth={1.5} />
      <text x={16} y={29} fontSize={16} fontWeight={800} fill={INK}>{title}</text>
      <WindBadge x={W - 26} y={23} windFrom={e.windFrom!} r={17} label="" />
      <text x={W - 52} y={29} textAnchor="end" fontSize={14} fontWeight={700} fill="#1e5a7a">Wind</text>
      <polyline points={tr[sk].slice(0, 104).map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')} fill="none" stroke={GREEN_INK} strokeWidth={2} strokeDasharray="6 5" />
      <polyline points={tr[gk].slice(0, 104).map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')} fill="none" stroke="#c2410c" strokeWidth={2.5} strokeDasharray="6 5" />
      <VesselIcon v={e[gk]} x={sx(pg.x)} y={sy(pg.y)} heading={pg.heading} scale={0.4} windFrom={e.windFrom} main={mains[gk][at]} />
      <VesselIcon v={e[sk]} x={sx(ps.x)} y={sy(ps.y)} heading={ps.heading} scale={0.4} windFrom={e.windFrom} main={mains[sk][at]} />
      {lab(pg, ps, give, '#9a3412')}
      {lab(ps, pg, stand, GREEN_INK)}
    </svg>
  )
}

/** Rule 12 in two pictures: different tacks, and same tack. */
export function SailingFigures() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <SailingPanel
        e={sailingCase('tacks')}
        title="Different tacks"
        give="Port tack: gives way"
        stand="Starboard tack"
        aria="Wind from the top of the picture. A yacht on port tack, with the wind on her port side, bears away to pass astern of a yacht on starboard tack."
      />
      <SailingPanel
        e={sailingCase('same')}
        title="Same tack"
        give="Windward: gives way"
        stand="Leeward"
        aria="Wind from the top of the picture. Two yachts on starboard tack: the one further upwind, to windward, keeps out of the way of the one to leeward."
      />
    </div>
  )
}

/** Head-on and crossing encounters between two power-driven vessels, played out. */
export function powerCase(kind: 'head-on' | 'crossing'): Encounter {
  const at = (heading: number, speed: number, T = 0.25): Vessel => {
    const d = dir(heading)
    return { kind: 'power', heading, speed, x: -d.x * speed * T, y: -d.y * speed * T }
  }
  return kind === 'head-on' ? { a: at(0, 8), b: at(180, 8) } : { a: at(0, 8), b: at(270, 8) }
}

function PowerPanel({ kind }: { kind: 'head-on' | 'crossing' }) {
  const e = powerCase(kind)
  const r = decide(e)!
  const m = plan(e, r)
  const tr = simulate(e, m, 120)
  const W = 320
  const H = 300
  const k = 58
  const sx = (x: number) => r2(W / 2 + x * k)
  const sy = (y: number) => r2(H / 2 + 22 - y * k)
  const at = kind === 'head-on' ? 60 : 62
  const pa = tr.a[at]!
  const pb = tr.b[at]!
  const tag = (p: Pose, text: string, colour: string, dx: number, dy: number) => (
    <text x={fitX(sx(p.x) + dx, text, 14, 6, W - 6)} y={sy(p.y) + dy} textAnchor="middle" fontSize={14} fontWeight={700} fill={colour} stroke={SEA} strokeWidth={4} paintOrder="stroke">{text}</text>
  )
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={kind === 'head-on'
      ? 'Two power-driven vessels meeting head-on each alter course to starboard and pass port side to port side.'
      : 'Two power-driven vessels crossing. The one with the other on her starboard side alters course to starboard and passes astern; the other holds her course and speed.'}>
      <rect width={W} height={H} rx={14} fill={SEA} />
      <line x1={0} y1={46} x2={W} y2={46} stroke="#d5e5ee" strokeWidth={1.5} />
      <text x={16} y={29} fontSize={16} fontWeight={800} fill={INK}>{kind === 'head-on' ? 'Head-on' : 'Crossing'}</text>
      <polyline points={tr.a.slice(0, 104).map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')} fill="none" stroke={TEAL_INK} strokeWidth={2.5} strokeDasharray="6 5" />
      <polyline points={tr.b.slice(0, 104).map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')} fill="none" stroke="#c2410c" strokeWidth={2.5} strokeDasharray="6 5" />
      <MotorBoat x={sx(pa.x)} y={sy(pa.y)} heading={pa.heading} scale={0.4} sidelights />
      <MotorBoat x={sx(pb.x)} y={sy(pb.y)} heading={pb.heading} scale={0.4} sidelights />
      {kind === 'head-on' ? (
        <>
          {tag(pa, 'turns to starboard', TEAL_INK, 0, 44)}
          {tag(pb, 'turns to starboard', '#9a3412', 0, -34)}
        </>
      ) : (
        <>
          {tag(pa, 'Give-way', TEAL_INK, 0, 44)}
          {tag(pb, 'Stand-on', GREEN_INK, 0, -22)}
        </>
      )}
    </svg>
  )
}

export function PowerFigures() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <PowerPanel kind="head-on" />
      <PowerPanel kind="crossing" />
    </div>
  )
}
