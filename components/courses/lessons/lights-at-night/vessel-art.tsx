// Drawings for "Navigation lights and day shapes": a vessel's lights as you
// see them at night from any aspect, a plan view of her light arcs, day
// shapes, and small inline icons for tables. Pure components (no hooks),
// safe in server-rendered notes: every trig-derived coordinate is rounded
// with r2 so server and browser markup match.

import type { ReactNode } from 'react'
import { r2 } from '@/lib/courses/navigation/chart-geometry'
import { LIGHT_COLOURS } from '../../marks'
import { type Colour, type Vessel, altText, norm, screenX, seenLights, towardsYou } from './vessels'

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                     */
/* ------------------------------------------------------------------ */

/** Point at `deg` clockwise from straight up, `r` from (cx, cy). */
export function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180
  return { x: r2(cx + Math.sin(a) * r), y: r2(cy - Math.cos(a) * r) }
}

/** A filled ring sector (annulus slice) clockwise from a to b. */
export function sectorPath(cx: number, cy: number, r1: number, r2_: number, a: number, b: number): string {
  const sweep = ((b - a) % 360 + 360) % 360 || 360
  const large = sweep > 180 ? 1 : 0
  const end = a + (sweep === 360 ? 359.99 : sweep)
  const p1 = polar(cx, cy, r2_, a)
  const p2 = polar(cx, cy, r2_, end)
  const p3 = polar(cx, cy, r1, end)
  const p4 = polar(cx, cy, r1, a)
  if (r1 <= 0) return `M${r2(cx)} ${r2(cy)} L${p1.x} ${p1.y} A${r2_} ${r2_} 0 ${large} 1 ${p2.x} ${p2.y} Z`
  return `M${p1.x} ${p1.y} A${r2_} ${r2_} 0 ${large} 1 ${p2.x} ${p2.y} L${p3.x} ${p3.y} A${r1} ${r1} 0 ${large} 0 ${p4.x} ${p4.y} Z`
}

export const LIGHT = LIGHT_COLOURS as Record<Colour, string>

/* ------------------------------------------------------------------ */
/* A vessel's lights at night                                           */
/* ------------------------------------------------------------------ */

export interface Frame {
  /** Screen x of the vessel's middle. */
  cx: number
  /** Screen y of her waterline. */
  waterY: number
  /** Pixels per metre across and up. */
  kx: number
  kz: number
  /** Fore-and-aft position (m) drawn at cx: the middle of everything, tow included. */
  fc: number
}

/** Fixed scale for a vessel (the same from every aspect), filling `halfWidth` × `height`. */
export function fitFrame(v: Vessel, cx: number, waterY: number, halfWidth: number, height: number): Frame {
  const ends = [v.length / 2, -v.length / 2, ...v.lights.map((l) => l.f)]
  if (v.body.tow) ends.push(v.body.tow.f + v.body.tow.length / 2, v.body.tow.f - v.body.tow.length / 2)
  const fc = (Math.max(...ends) + Math.min(...ends)) / 2
  const pts = [
    ...v.lights.map((l) => ({ f: l.f, s: l.s })),
    { f: v.length / 2, s: 0 }, { f: -v.length / 2, s: v.beam / 2 }, { f: -v.length / 2, s: -v.beam / 2 },
    ...(v.body.tow ? [{ f: v.body.tow.f - v.body.tow.length / 2, s: v.body.tow.beam / 2 }] : []),
  ]
  const maxR = Math.max(...pts.map((p) => Math.hypot(p.f - fc, p.s)))
  const maxZ = Math.max(...v.lights.map((l) => l.z), ...v.body.masts.map((m) => m.z))
  let kx = halfWidth / maxR
  let kz = height / maxZ
  kx = Math.min(kx, kz * 1.6)
  kz = Math.min(kz, kx * 3)
  return { cx, waterY, kx, kz, fc }
}

export interface Placed {
  colours: Colour[]
  x: number
  y: number
  /** Metres towards you (for drawing order). */
  d: number
  kind: string
  tow: boolean
}

/** Screen positions of the lights you can see, far ones first. */
export function placeLights(v: Vessel, aspect: number, fr: Frame): Placed[] {
  return seenLights(v, aspect)
    .map((s) => {
      const p = { f: s.light.f - fr.fc, s: s.light.s }
      return {
        colours: s.colours,
        x: r2(fr.cx + fr.kx * screenX(p, aspect)),
        y: r2(fr.waterY - fr.kz * s.light.z),
        d: towardsYou(p, aspect),
        kind: s.light.kind,
        tow: !!s.light.tow,
      }
    })
    .sort((a, b) => a.d - b.d)
}

/** One light with its glow. Two colours (a tricolour seen head-on) split left/right. */
export function Glow({ x, y, colours, r }: { x: number; y: number; colours: Colour[]; r: number }) {
  const c0 = LIGHT[colours[0]!]
  const c1 = LIGHT[colours[colours.length - 1]!]
  return (
    <g>
      <circle cx={x} cy={y} r={r2(r * 2.7)} fill={c0} opacity={0.13} />
      <circle cx={x} cy={y} r={r2(r * 1.7)} fill={c0} opacity={0.3} />
      {colours.length === 2 && <circle cx={x} cy={y} r={r2(r * 1.7)} fill={c1} opacity={0.3} />}
      {colours.length === 2 ? (
        <>
          <path d={`M${x} ${r2(y - r)} A${r} ${r} 0 0 0 ${x} ${r2(y + r)} Z`} fill={c0} />
          <path d={`M${x} ${r2(y - r)} A${r} ${r} 0 0 1 ${x} ${r2(y + r)} Z`} fill={c1} />
          <circle cx={x} cy={y} r={r} fill="none" stroke="#fff" strokeWidth={r2(r * 0.18)} />
        </>
      ) : (
        <circle cx={x} cy={y} r={r} fill={c0} stroke="#fff" strokeWidth={r2(r * 0.18)} />
      )}
    </g>
  )
}

const OUTLINE = '#22344a'
const OUTLINE_EDGE = '#3b5170'

/** A hull seen from `aspect`: the span of its plan outline, from the waterline to the deck. */
function HullShape({ f0, length, beam, freeboard, aspect, fr, opacity }: { f0: number; length: number; beam: number; freeboard: number; aspect: number; fr: Frame; opacity: number }) {
  const plan = [
    { f: f0 + length / 2, s: 0 },
    { f: f0 + length * 0.25, s: beam / 2 }, { f: f0 + length * 0.25, s: -beam / 2 },
    { f: f0 - length / 2, s: beam * 0.45 }, { f: f0 - length / 2, s: -beam * 0.45 },
  ]
  const xs = plan.map((p) => fr.cx + fr.kx * screenX({ f: p.f - fr.fc, s: p.s }, aspect))
  const lo = r2(Math.min(...xs))
  const hi = r2(Math.max(...xs))
  const top = r2(fr.waterY - freeboard * fr.kz)
  const flare = r2(Math.min(14, (hi - lo) * 0.04 + 2))
  return <polygon points={`${lo},${fr.waterY} ${hi},${fr.waterY} ${r2(hi + flare)},${top} ${r2(lo - flare)},${top}`} fill={OUTLINE} stroke={OUTLINE_EDGE} strokeWidth={1.5} opacity={opacity} />
}

/** The vessel's lights (and, optionally, her dim outline) as seen from `aspect`. */
export function VesselNight({ v, aspect, fr, r = 7, outline = false, outlineOpacity = 1 }: { v: Vessel; aspect: number; fr: Frame; r?: number; outline?: boolean; outlineOpacity?: number }) {
  const lights = placeLights(v, aspect, fr)
  const b = v.body
  const house = b.house
  const houseXs = house
    ? [house[0], house[1]].flatMap((f) => [-1, 1].map((k) => fr.cx + fr.kx * screenX({ f: f - fr.fc, s: (k * v.beam) / 3 }, aspect)))
    : []
  return (
    <g>
      {outline && (
        <g opacity={outlineOpacity}>
          {b.tow && <line x1={r2(fr.cx + fr.kx * screenX({ f: -v.length / 2 - fr.fc, s: 0 }, aspect))} y1={r2(fr.waterY - 1.2 * fr.kz)} x2={r2(fr.cx + fr.kx * screenX({ f: b.tow.f + b.tow.length / 2 - fr.fc, s: 0 }, aspect))} y2={r2(fr.waterY - 0.8 * fr.kz)} stroke={OUTLINE_EDGE} strokeWidth={2} strokeDasharray="6 5" />}
          {b.tow && <HullShape f0={b.tow.f} length={b.tow.length} beam={b.tow.beam} freeboard={b.tow.freeboard} aspect={aspect} fr={fr} opacity={1} />}
          <HullShape f0={0} length={v.length} beam={v.beam} freeboard={b.freeboard} aspect={aspect} fr={fr} opacity={1} />
          {house && (
            <rect x={r2(Math.min(...houseXs))} y={r2(fr.waterY - house[2] * fr.kz)} width={r2(Math.max(...houseXs) - Math.min(...houseXs))} height={r2((house[2] - b.freeboard) * fr.kz)} fill={OUTLINE} stroke={OUTLINE_EDGE} strokeWidth={1.5} />
          )}
          {b.masts.map((m, i) => {
            const x = r2(fr.cx + fr.kx * screenX({ f: m.f - fr.fc, s: 0 }, aspect))
            return <line key={i} x1={x} y1={r2(fr.waterY - b.freeboard * fr.kz)} x2={x} y2={r2(fr.waterY - m.z * fr.kz - 2)} stroke={OUTLINE_EDGE} strokeWidth={3} />
          })}
        </g>
      )}
      {lights.map((l, i) => <Glow key={i} x={l.x} y={l.y} colours={l.colours} r={r} />)}
    </g>
  )
}

/** Deterministic faint stars for night skies. */
const STARS: Array<[number, number]> = [
  [34, 22], [88, 60], [140, 18], [205, 44], [262, 14], [318, 52], [377, 26], [430, 66], [486, 20], [540, 48], [600, 30],
  [62, 110], [170, 96], [248, 128], [352, 104], [462, 118], [575, 98], [118, 150], [520, 160], [610, 140],
]

export function NightSky({ w, h, horizon }: { w: number; h: number; horizon: number }) {
  return (
    <g>
      <rect width={w} height={h} fill="#07111e" />
      <rect y={horizon} width={w} height={h - horizon} fill="#040b15" />
      <line x1={0} y1={horizon} x2={w} y2={horizon} stroke="#14263b" strokeWidth={2} />
      {STARS.map(([x, y], i) => (
        <circle key={i} cx={r2((x / 640) * w)} cy={r2((y / 360) * horizon * 0.9)} r={i % 3 === 0 ? 1.4 : 1} fill="#9fb3c8" opacity={0.5} />
      ))}
    </g>
  )
}

/** A night view of a vessel from `aspect`: just her lights, as a lookout sees them. */
export function NightView({ v, aspect, outline = false, className = 'mx-auto block w-full max-w-lg rounded-xl', label, r = 8 }: {
  v: Vessel; aspect: number; outline?: boolean; className?: string; label?: string; r?: number
}) {
  const fr = fitFrame(v, 320, 300, 270, 250)
  return (
    <svg viewBox="0 0 640 360" className={className} role="img" aria-label={label ?? altText(v, norm(aspect))}>
      <NightSky w={640} h={360} horizon={215} />
      <VesselNight v={v} aspect={aspect} fr={fr} outline={outline} r={r} />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Plan view: her light arcs and where you are                          */
/* ------------------------------------------------------------------ */

const ARC_FILL = { W: 0.42, R: 0.55, G: 0.5, Y: 0.6 }

/** Top-down hull pointing up, `len` px long. */
export function PlanHull({ cx, cy, len, ratio, fill = '#e8edf3' }: { cx: number; cy: number; len: number; ratio: number; fill?: string }) {
  const h = len / 2
  const w = (len * ratio) / 2
  const d = `M${r2(cx)} ${r2(cy - h)} C ${r2(cx + w)} ${r2(cy - h * 0.55)} ${r2(cx + w)} ${r2(cy - h * 0.1)} ${r2(cx + w)} ${r2(cy + h * 0.3)} L ${r2(cx + w * 0.85)} ${r2(cy + h)} L ${r2(cx - w * 0.85)} ${r2(cy + h)} L ${r2(cx - w)} ${r2(cy + h * 0.3)} C ${r2(cx - w)} ${r2(cy - h * 0.1)} ${r2(cx - w)} ${r2(cy - h * 0.55)} ${r2(cx)} ${r2(cy - h)} Z`
  return <path d={d} fill={fill} stroke="#5b6b7c" strokeWidth={1.5} />
}

/**
 * Plan view, bow up: the arcs of the vessel's lights (outer ring: masthead
 * forward and towing light aft; middle ring: sidelights and sternlight;
 * inner circles: all-round lights), and you at `aspect`.
 */
export function PlanView({ v, aspect, cx, cy, R, you = true, heading = true, youLabel = 'You', fontSize = 16 }: {
  v: Vessel; aspect?: number; cx: number; cy: number; R: number; you?: boolean; heading?: boolean; youLabel?: string; fontSize?: number
}) {
  const own = v.lights.filter((l) => !l.tow)
  const has = (k: string) => own.some((l) => l.kind === k)
  const tri = has('tricolour')
  const allRound = [...new Set(own.filter((l) => l.kind === 'allround').map((l) => l.colour))]
  const outer: [number, number] = [R * 0.83, R]
  const mid: [number, number] = [R * 0.6, R * 0.8]
  const hullLen = v.body.tow ? R * 0.42 : R * 0.9
  const ratio = Math.max(0.2, Math.min(0.36, v.beam / v.length))
  const hullCy = v.body.tow ? cy - R * 0.08 : cy
  const youAt = aspect === undefined ? null : polar(cx, cy, R + fontSize * 0.75, aspect)
  const labelAt = aspect === undefined ? null : polar(cx, cy, R + fontSize * 2.1, aspect)
  return (
    <g>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#3b5170" strokeWidth={1} strokeDasharray="4 6" />
      {has('masthead') && <path d={sectorPath(cx, cy, outer[0], outer[1], 247.5, 112.5)} fill={LIGHT.W} fillOpacity={ARC_FILL.W} />}
      {has('towing') && <path d={sectorPath(cx, cy, outer[0], outer[1], 112.5, 247.5)} fill={LIGHT.Y} fillOpacity={ARC_FILL.Y} />}
      {(has('port') || tri) && <path d={sectorPath(cx, cy, mid[0], mid[1], 247.5, 360)} fill={LIGHT.R} fillOpacity={ARC_FILL.R} />}
      {(has('starboard') || tri) && <path d={sectorPath(cx, cy, mid[0], mid[1], 0, 112.5)} fill={LIGHT.G} fillOpacity={ARC_FILL.G} />}
      {(has('stern') || tri) && <path d={sectorPath(cx, cy, mid[0], mid[1], 112.5, 247.5)} fill={LIGHT.W} fillOpacity={ARC_FILL.W} />}
      {allRound.map((c, i) => (
        <circle key={c} cx={cx} cy={cy} r={r2(R * (0.54 - i * 0.045))} fill="none" stroke={LIGHT[c]} strokeOpacity={0.85} strokeWidth={r2(Math.max(2, R * 0.03))} />
      ))}
      {v.body.tow && (
        <>
          <line x1={cx} y1={r2(hullCy + hullLen / 2)} x2={cx} y2={r2(cy + R * 0.3)} stroke="#9fb3c8" strokeWidth={1.5} strokeDasharray="4 3" />
          <rect x={r2(cx - R * 0.09)} y={r2(cy + R * 0.3)} width={r2(R * 0.18)} height={r2(R * 0.3)} rx={3} fill="#c9d3dd" stroke="#5b6b7c" />
        </>
      )}
      <PlanHull cx={cx} cy={hullCy} len={hullLen} ratio={ratio} />
      {heading && v.directional && (
        <g>
          <line x1={cx} y1={r2(hullCy - hullLen / 2 - 4)} x2={cx} y2={r2(cy - R * 0.56)} stroke="#2bb3c0" strokeWidth={3} />
          <polygon points={`${cx},${r2(cy - R * 0.6)} ${r2(cx - 7)},${r2(cy - R * 0.6 + 13)} ${r2(cx + 7)},${r2(cy - R * 0.6 + 13)}`} fill="#2bb3c0" />
        </g>
      )}
      {you && youAt && labelAt && (
        <g>
          <line x1={cx} y1={cy} x2={youAt.x} y2={youAt.y} stroke="#f5b301" strokeWidth={2} strokeDasharray="6 5" />
          <circle cx={youAt.x} cy={youAt.y} r={r2(fontSize * 0.6)} fill="#f5b301" stroke="#0e2237" strokeWidth={2} />
          <text
            x={labelAt.x}
            y={r2(labelAt.y + fontSize * 0.35)}
            textAnchor="middle"
            fontSize={fontSize}
            fontWeight={800}
            fill="#f5b301"
          >
            {youLabel}
          </text>
        </g>
      )}
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* Figures for the notes                                                */
/* ------------------------------------------------------------------ */

/** The arcs of the masthead light, sidelights, sternlight and towing light, from above. */
export function ArcsFigure() {
  const cx = 270
  const cy = 250
  const R = 190
  const outer: [number, number] = [R * 0.8, R]
  const mid: [number, number] = [R * 0.5, R * 0.76]
  const beamL = polar(cx, cy, R + 8, 270)
  const beamR = polar(cx, cy, R + 8, 90)
  const lab = (deg: number, r: number) => polar(cx, cy, r, deg)
  const t = (x: number, y: number, s: string, fill = '#fff', anchor: 'start' | 'middle' | 'end' = 'middle', size = 19, weight = 700) => (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={weight} fill={fill}>{s}</text>
  )
  const m = lab(0, R * 0.9)
  const g = lab(50, R * 0.6)
  const rd = lab(310, R * 0.6)
  const st = lab(180, R * 0.63)
  const tw = lab(180, R * 0.9)
  return (
    <svg viewBox="0 0 540 520" className="mx-auto block w-full max-w-lg" role="img" aria-label="Plan view of a vessel's light arcs. White masthead light over 225 degrees forward, from right ahead to 22.5 degrees abaft the beam on each side. Green sidelight to starboard and red sidelight to port, 112.5 degrees each. White sternlight over 135 degrees astern. A yellow towing light has the same arc as the sternlight.">
      <rect width={540} height={520} rx={16} fill="#0e2237" />
      <path d={sectorPath(cx, cy, outer[0], outer[1], 247.5, 112.5)} fill={LIGHT.W} fillOpacity={0.5} />
      <path d={sectorPath(cx, cy, outer[0], outer[1], 112.5, 247.5)} fill={LIGHT.Y} fillOpacity={0.55} />
      <path d={sectorPath(cx, cy, mid[0], mid[1], 0, 112.5)} fill={LIGHT.G} fillOpacity={0.55} />
      <path d={sectorPath(cx, cy, mid[0], mid[1], 247.5, 360)} fill={LIGHT.R} fillOpacity={0.6} />
      <path d={sectorPath(cx, cy, mid[0], mid[1], 112.5, 247.5)} fill={LIGHT.W} fillOpacity={0.4} />
      {[0, 112.5, 247.5].map((a) => {
        const p = polar(cx, cy, R + 6, a)
        return <line key={a} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#fff" strokeOpacity={0.55} strokeWidth={1.5} />
      })}
      <line x1={beamL.x} y1={beamL.y} x2={beamR.x} y2={beamR.y} stroke="#fff" strokeOpacity={0.35} strokeDasharray="4 6" />
      <PlanHull cx={cx} cy={cy} len={R * 0.72} ratio={0.24} />
      <circle cx={cx} cy={r2(cy - R * 0.1)} r={5} fill={LIGHT.W} stroke="#5b6b7c" />
      {t(m.x, r2(m.y + 7), 'Masthead 225°', '#0e2237', 'middle', 18, 800)}
      {t(g.x, g.y, 'Green', '#fff', 'middle', 18, 800)}
      {t(g.x, r2(g.y + 20), '112.5°', '#fff', 'middle', 16, 700)}
      {t(rd.x, rd.y, 'Red', '#fff', 'middle', 18, 800)}
      {t(rd.x, r2(rd.y + 20), '112.5°', '#fff', 'middle', 16, 700)}
      {t(st.x, r2(st.y + 6), 'Sternlight 135°', '#0e2237', 'middle', 17, 800)}
      {t(tw.x, r2(tw.y + 6), 'Towing light (yellow)', '#0e2237', 'middle', 15, 800)}
      {t(beamR.x - 4, r2(beamR.y - 10), 'beam', '#9fb3c8', 'end', 14, 600)}
      {t(beamL.x + 4, r2(beamL.y - 10), 'beam', '#9fb3c8', 'start', 14, 600)}
      {t(cx + R * 0.55, r2(cy + R * 0.38), '22.5°', '#f5b301', 'start', 17, 800)}
      <path d={`M${polar(cx, cy, R * 0.42, 90).x} ${polar(cx, cy, R * 0.42, 90).y} A${R * 0.42} ${R * 0.42} 0 0 1 ${polar(cx, cy, R * 0.42, 112.5).x} ${polar(cx, cy, R * 0.42, 112.5).y}`} fill="none" stroke="#f5b301" strokeWidth={3} />
      {t(cx, 28, 'right ahead', '#9fb3c8', 'middle', 15, 600)}
      {t(cx, 500, 'right astern', '#9fb3c8', 'middle', 15, 600)}
    </svg>
  )
}

/** Four night views of one vessel: head-on, starboard side, port side, astern. */
export function AspectGrid({ v }: { v: Vessel }) {
  const views: { aspect: number; caption: ReactNode }[] = [
    { aspect: 0, caption: <><strong>Both sidelights</strong>, masthead lights in line: heading straight for you.</> },
    { aspect: 50, caption: <><strong>Green</strong>: you see her starboard side, so she is heading to your right.</> },
    { aspect: 310, caption: <><strong>Red</strong>: you see her port side, so she is heading to your left.</> },
    { aspect: 180, caption: <><strong>Sternlight only</strong>: you are astern of her and she is heading away.</> },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {views.map((w) => (
        <div key={w.aspect}>
          <NightView v={v} aspect={w.aspect} r={12} className="block w-full rounded-lg" />
          <p className="mt-1 text-xs leading-snug text-text-secondary sm:text-sm">{w.caption}</p>
        </div>
      ))}
    </div>
  )
}

/** Tiny inline stack of all-round lights for tables: colours listed top to bottom. */
export function LightStack({ colours, label }: { colours: Colour[]; label?: string }) {
  const h = colours.length * 13 + 5
  return (
    <svg viewBox={`0 0 18 ${h}`} width={18} height={h} className="inline-block align-middle" role="img" aria-label={label ?? colours.map((c) => ({ W: 'white', R: 'red', G: 'green', Y: 'yellow' })[c]).join(' over ')}>
      <rect width={18} height={h} rx={4} fill="#0e2237" />
      {colours.map((c, i) => <circle key={i} cx={9} cy={9 + i * 13} r={4.5} fill={LIGHT[c]} />)}
    </svg>
  )
}

