// Drawing pieces for Lesson 6, shared by the notes, widgets, scenes and
// exercise figures (ported from the Boaty Jobs cardinal-marks and
// other-marks lessons, plus Mediterranean special-mark figures). Pure
// components (no hooks), so they render identically on the server and in the
// browser; computed coordinates are rounded with r2.

import type { ReactNode } from 'react'
import { norm360, rhumbDestination, type LatLon } from '@/lib/courses/geo'
import { bankRing, islandRing } from '@/lib/courses/navigation/practice-chart'
import { polyPoints, project, r2, type ViewRect } from '@/lib/courses/navigation/chart-geometry'
import { IalaMark, LIGHT_COLOURS, MARK_INFO, RhythmBar, type MarkType } from '../../marks'
import { BANK_SHALLOW, CARD, CARDINALS, ROCK_RADIUS, SAFE_WATER_RHYTHMS, dayDescription, type Cardinal, type ChartCardinal, type LightPattern } from './data'

const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"
export const SAFE_GREEN = '#16a34a'
export const DANGER_RED = '#b42318'
const YELLOW = '#f5c400'

/* ------------------------------------------------------------------ */
/* A mark as seen from the boat                                        */
/* ------------------------------------------------------------------ */

/** A mark by day, seen from a boat: sky, sea and the buoy. */
export function MarkPicture({ type, title, className }: { type: MarkType; title?: string; className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className ?? 'block h-auto w-full rounded-lg'} role="img" aria-label={title ?? `${dayDescription(type)}.`}>
      <rect width={400} height={212} fill="#cfe8f6" />
      <path d="M0 212 L0 200 Q 60 192 120 198 T 230 196 L 230 212 Z" fill="#8fa8b8" opacity={0.6} />
      <rect y={212} width={400} height={88} fill="#2f6f99" />
      <path d="M0 238 q 20 -5 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0" stroke="#ffffff" strokeOpacity={0.25} strokeWidth={2} fill="none" />
      <path d="M0 270 q 25 -6 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0" stroke="#ffffff" strokeOpacity={0.2} strokeWidth={2} fill="none" />
      <IalaMark type={type} x={200} y={262} scale={0.95} />
    </svg>
  )
}

/** A small drawing of a mark, for lists. */
export function MarkIcon({ type, className = 'h-14 w-9' }: { type: MarkType; className?: string }) {
  return (
    <svg viewBox="-80 -252 160 268" className={className} aria-hidden="true">
      <IalaMark type={type} x={0} y={0} />
    </svg>
  )
}

/** The four cardinal marks side by side, each with its description. */
export function MarkCards() {
  return (
    <div className="not-lesson my-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      {CARDINALS.map((c) => (
        <figure key={c} className="overflow-hidden rounded-card border border-border bg-card">
          <svg viewBox="-100 -268 200 290" className="block h-auto w-full bg-[#dff1fb]" role="img" aria-label={`${CARD[c].name}: ${CARD[c].colours}; topmark ${CARD[c].topmark.toLowerCase()}`}>
            <rect x={-100} y={-6} width={200} height={28} fill="#2f6f99" />
            <IalaMark type={c} x={0} y={4} scale={1} />
          </svg>
          <figcaption className="space-y-1 px-3 py-2 text-[0.82rem] leading-snug">
            <p className="text-sm font-bold text-text-primary">{CARD[c].short}</p>
            <p><span className="font-semibold">Colours:</span> {CARD[c].colours}</p>
            <p><span className="font-semibold">Topmark:</span> {CARD[c].topmark}</p>
            <p><span className="font-semibold">Light:</span> {CARD[c].lightText}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

const FOUR: Array<{ type: MarkType; note: string }> = [
  { type: 'isolated-danger', note: 'A small danger, navigable water all round' },
  { type: 'safe-water', note: 'Navigable water all round' },
  { type: 'special', note: 'A special area: swimming, fish farm, cable' },
  { type: 'emergency-wreck', note: 'A new wreck, not yet charted' },
]

/** The other four marks side by side. */
export function FourMarks() {
  return (
    <div className="not-lesson grid grid-cols-2 gap-3 sm:grid-cols-4">
      {FOUR.map(({ type, note }) => (
        <div key={type} className="rounded-card border border-border bg-teal-light/50 px-2 pb-3 pt-2 text-center">
          <svg viewBox="-90 -255 180 275" className="mx-auto block h-36 w-auto" role="img" aria-label={`${MARK_INFO[type].name}: ${dayDescription(type).replace(/^A mark /, '')}`}>
            <IalaMark type={type} x={0} y={0} />
          </svg>
          <p className="mt-1 text-sm font-semibold leading-snug text-text-primary">{MARK_INFO[type].name}</p>
          <p className="mt-0.5 text-xs leading-snug text-text-secondary">{note}</p>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Light bars                                                           */
/* ------------------------------------------------------------------ */

/** One cycle of a light as a bar, lit parts in their colours, with an optional marker. Draws alternating lights itself. */
export function PatternBar({ pattern, x, y, width, height = 26, at }: { pattern: LightPattern; x: number; y: number; width: number; height?: number; at?: number }) {
  if (pattern.light) return <RhythmBar light={pattern.light} x={x} y={y} width={width} height={height} at={at} />
  const scale = width / pattern.period
  const starts = pattern.phases.map((_, i) => pattern.phases.slice(0, i).reduce((n, p) => n + p.seconds, 0))
  const mx = at === undefined ? null : r2(x + (((at % pattern.period) + pattern.period) % pattern.period) * scale)
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="#0f172a" stroke="#64748b" strokeWidth={1} rx={3} />
      {pattern.phases.map((p, i) =>
        p.colour ? <rect key={i} x={r2(x + starts[i]! * scale)} y={y + 2} width={r2(Math.max(1, p.seconds * scale))} height={height - 4} fill={LIGHT_COLOURS[p.colour]} /> : null,
      )}
      {mx !== null && <line x1={mx} x2={mx} y1={y - 6} y2={y + height + 6} stroke="#fff" strokeWidth={3} />}
    </g>
  )
}

/** `seconds` of a light drawn to scale (repeating cycles), for comparing rhythms. */
export function TimelineBar({ pattern, seconds, x, y, width, height = 24 }: { pattern: LightPattern; seconds: number; x: number; y: number; width: number; height?: number }) {
  const scale = width / seconds
  const segments: Array<{ x: number; w: number; fill: string }> = []
  let t = 0
  for (let guard = 0; t < seconds && guard < 400; guard++) {
    for (const p of pattern.phases) {
      if (t >= seconds) break
      const len = Math.min(p.seconds, seconds - t)
      if (p.colour) segments.push({ x: x + t * scale, w: Math.max(1, len * scale), fill: LIGHT_COLOURS[p.colour] })
      t += p.seconds
    }
  }
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="#0f172a" stroke="#64748b" strokeWidth={1} rx={3} />
      {segments.map((s, i) => <rect key={i} x={r2(s.x)} y={y + 2} width={r2(s.w)} height={height - 4} fill={s.fill} />)}
    </g>
  )
}

/** Ten seconds of each safe-water rhythm, on the same time scale. */
export function SafeWaterRhythms() {
  return (
    <div className="not-lesson overflow-hidden rounded-card bg-[#0b1626] p-3 text-white">
      <div className="space-y-2">
        {SAFE_WATER_RHYTHMS.map((r) => (
          <div key={r.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3">
            <div>
              <p className="font-mono text-sm font-bold">{r.label}</p>
              <p className="text-[11px] leading-tight text-white/70">{r.name}</p>
            </div>
            <div>
              <svg viewBox="0 0 300 22" className="block h-auto w-full" role="img" aria-label={`${r.name}: ${r.note}`}>
                <TimelineBar pattern={r.p} seconds={10} x={0} y={0} width={300} height={22} />
              </svg>
              <p className="mt-0.5 text-[11px] leading-tight text-white/70">{r.note}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 text-[11px] text-white/60">
        <span />
        <span className="flex justify-between"><span>0 s</span><span>5 s</span><span>10 s</span></span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* The quadrants, drawn in plan (from above)                           */
/* ------------------------------------------------------------------ */

/** A rock awash seen from above: dotted danger line and a cross. */
export function PlanRock({ x, y, r = 34, colour = DANGER_RED, dark }: { x: number; y: number; r?: number; colour?: string; dark?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={dark ? 'rgba(217,52,43,0.2)' : 'rgba(180,35,24,0.1)'} stroke={colour} strokeWidth={3} strokeDasharray="5 6" />
      <line x1={x - r * 0.45} x2={x + r * 0.45} y1={y} y2={y} stroke={colour} strokeWidth={4} />
      <line x1={x} x2={x} y1={y - r * 0.45} y2={y + r * 0.45} stroke={colour} strokeWidth={4} />
    </g>
  )
}

/** Arrow from (x1, y1) to (x2, y2). */
export function Arrow({ x1, y1, x2, y2, colour, width = 6, opacity = 1 }: { x1: number; y1: number; x2: number; y2: number; colour: string; width?: number; opacity?: number }) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const hl = 14 + width * 2
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={r2(x2 - Math.cos(a) * hl * 0.6)} y2={r2(y2 - Math.sin(a) * hl * 0.6)} stroke={colour} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${r2(x2 - hl * Math.cos(a - 0.45))},${r2(y2 - hl * Math.sin(a - 0.45))} ${r2(x2 - hl * Math.cos(a + 0.45))},${r2(y2 - hl * Math.sin(a + 0.45))}`} fill={colour} />
    </g>
  )
}

/** Unit vector (screen axes, y down) for a true direction 0/90/180/270. */
export const AXIS: Record<Cardinal, [number, number]> = { north: [0, -1], east: [1, 0], south: [0, 1], west: [-1, 0] }

/** The four quadrants round a danger at (cx, cy), in plan: boundary lines, optional names and tints. */
export function PlanQuadrants({ cx, cy, r, lines = 1, labels = 1, tint, tintOpacity = 1, bearings = 0, dark = false, labelSize = 30, labelAt = 0.86 }: {
  cx: number; cy: number; r: number; lines?: number; labels?: number; tint?: Cardinal[]; tintOpacity?: number; bearings?: number; dark?: boolean; labelSize?: number; labelAt?: number
}) {
  const ink = dark ? '#e2edf7' : '#1d2731'
  const lineColour = dark ? '#9fb3c8' : '#5f88ad'
  const ends = [45, 135, 225, 315].map((b) => {
    const rad = (b * Math.PI) / 180
    return { b, x: r2(cx + Math.sin(rad) * r * lines), y: r2(cy - Math.cos(rad) * r * lines), lx: r2(cx + Math.sin(rad) * r), ly: r2(cy - Math.cos(rad) * r) }
  })
  const wedge = (c: Cardinal) => {
    const [a] = CARD[c].quadrant
    const p = (deg: number) => `${r2(cx + Math.sin((deg * Math.PI) / 180) * r)},${r2(cy - Math.cos((deg * Math.PI) / 180) * r)}`
    return `${cx},${cy} ${Array.from({ length: 13 }, (_, i) => p(a + i * 7.5)).join(' ')}`
  }
  return (
    <g fontFamily={FONT}>
      {tint?.map((c) => {
        const alt = tint.length > 1 && (c === 'east' || c === 'west')
        const fill = alt ? 'rgba(43,179,192,0.2)' : dark ? 'rgba(43,179,192,0.16)' : 'rgba(245,196,0,0.22)'
        return <polygon key={c} points={wedge(c)} fill={fill} opacity={tintOpacity} />
      })}
      {lines > 0 && ends.map((e) => <line key={e.b} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke={lineColour} strokeWidth={3} strokeDasharray="12 9" />)}
      {bearings > 0 && ends.map((e) => {
        const right = e.b < 180
        const south = e.b > 90 && e.b < 270
        return (
          <text key={`t${e.b}`} x={r2(e.lx + (right ? 10 : -10))} y={r2(e.ly + (south ? -12 : labelSize * 0.95))} fontSize={labelSize * 0.9} fontWeight={700} fill={lineColour} textAnchor={right ? 'start' : 'end'} opacity={bearings}>
            {String(e.b).padStart(3, '0')}°
          </text>
        )
      })}
      {labels > 0 && CARDINALS.map((c) => {
        const [ux, uy] = AXIS[c]
        return (
          <text key={c} x={r2(cx + ux * r * labelAt)} y={r2(cy + uy * r * labelAt + labelSize * 0.36)} fontSize={labelSize} fontWeight={800} fill={ink} textAnchor="middle" opacity={labels}>
            {CARD[c].letter}
          </text>
        )
      })}
    </g>
  )
}

const DIAGRAM: Record<Cardinal, { x: number; foot: number; arrow: [number, number, number, number] }> = {
  north: { x: 400, foot: 296, arrow: [462, 268, 462, 182] },
  east: { x: 562, foot: 466, arrow: [608, 424, 682, 424] },
  south: { x: 400, foot: 648, arrow: [462, 630, 462, 706] },
  west: { x: 238, foot: 466, arrow: [192, 424, 118, 424] },
}

/** The notes figure: the four quadrants round a danger, each with its mark and an arrow to the side you pass. */
export function QuadrantDiagram() {
  const cx = 400
  const cy = 400
  return (
    <svg viewBox="0 0 800 800" className="mx-auto block h-auto w-full max-w-xl rounded-card" role="img"
      aria-label="A danger with its four quadrants: north between north-west and north-east, east between north-east and south-east, south between south-east and south-west, west between south-west and north-west. Each cardinal mark stands in its own quadrant and you pass on its named side.">
      <rect width={800} height={800} fill="#eaf4fb" />
      <PlanQuadrants cx={cx} cy={cy} r={330} bearings={1} labelSize={34} labelAt={0.93} />
      <PlanRock x={cx} y={cy} r={38} />
      <text x={cx} y={cy + 72} textAnchor="middle" fontSize={26} fontWeight={700} fill={DANGER_RED} fontFamily={FONT}>Danger</text>
      {CARDINALS.map((c) => {
        const d = DIAGRAM[c]
        return (
          <g key={c}>
            <IalaMark type={c} x={d.x} y={d.foot} scale={0.55} />
            <Arrow x1={d.arrow[0]} y1={d.arrow[1]} x2={d.arrow[2]} y2={d.arrow[3]} colour={SAFE_GREEN} width={6} />
          </g>
        )
      })}
      <text x={400} y={780} textAnchor="middle" fontSize={24} fill="#3e5468" fontFamily={FONT}>Bearings are true, measured from the danger</text>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Chart overlays (chart pixel space)                                  */
/* ------------------------------------------------------------------ */

/** Distance in chart pixels for `nm` miles east-west at a position. */
export function nmPx(at: LatLon, nm: number): number {
  const a = project(at)
  const b = project(rhumbDestination(at, 90, nm))
  return r2(Math.abs(b.x - a.x))
}

/** Quadrant boundaries round a danger on the chart, with N/E/S/W labels at the edges of `view`. */
export function ChartQuadrants({ danger, radiusNm, view, size, colour = '#1d4f7a', insetBottom = 0 }: {
  danger: LatLon; radiusNm: number; view: ViewRect; size: number; colour?: string; insetBottom?: number
}) {
  const c = project(danger)
  const at = (b: number, nm: number) => project(rhumbDestination(danger, b, nm))
  const pad = size * 0.9
  const inX = (x: number) => r2(Math.min(view.x + view.w - pad, Math.max(view.x + pad, x)))
  const bottom = view.y + view.h - insetBottom - pad * 0.6
  const inY = (y: number) => r2(Math.min(bottom, Math.max(view.y + pad * 1.3, y)))
  const label: Record<Cardinal, { x: number; y: number }> = {
    north: { x: inX(c.x + size * 1.1), y: r2(view.y + pad * 1.3) },
    east: { x: r2(view.x + view.w - pad), y: inY(c.y + size * 0.36) },
    south: { x: inX(c.x - size * 1.1), y: r2(bottom) },
    west: { x: r2(view.x + pad), y: inY(c.y + size * 0.36) },
  }
  return (
    <g>
      {[45, 135, 225, 315].map((b) => {
        const e = at(norm360(b), radiusNm)
        return <line key={b} x1={c.x} y1={c.y} x2={e.x} y2={e.y} stroke={colour} strokeWidth={r2(size * 0.12)} strokeDasharray={`${r2(size * 0.5)} ${r2(size * 0.35)}`} strokeOpacity={0.75} />
      })}
      {CARDINALS.map((q) => (
        <text key={q} x={label[q].x} y={label[q].y} fontSize={size} fontWeight={800} fill={colour} textAnchor="middle" stroke="#fff" strokeWidth={r2(size * 0.18)} paintOrder="stroke" fontFamily={FONT}>
          {CARD[q].letter}
        </text>
      ))}
    </g>
  )
}

/** Shade the named side of a mark (the part of the view beyond it), off the land. */
export function ChartSafeSide({ id, mark, side, view, opacity = 1 }: { id: string; mark: LatLon; side: Cardinal; view: ViewRect; opacity?: number }) {
  const m = project(mark)
  const x0 = r2(view.x)
  const y0 = r2(view.y)
  const x1 = r2(view.x + view.w)
  const y1 = r2(view.y + view.h)
  const rect = side === 'north' ? [x0, y0, x1, m.y] : side === 'south' ? [x0, m.y, x1, y1] : side === 'east' ? [m.x, y0, x1, y1] : [x0, y0, m.x, y1]
  const edge = side === 'north' || side === 'south' ? { x1: x0, y1: m.y, x2: x1, y2: m.y } : { x1: m.x, y1: y0, x2: m.x, y2: y1 }
  const mask = `${id}-sea`
  return (
    <g opacity={opacity}>
      <defs>
        <mask id={mask} maskUnits="userSpaceOnUse" x={0} y={0} width={4000} height={4000}>
          <rect x={0} y={0} width={4000} height={4000} fill="#fff" />
          <polygon points={polyPoints(islandRing(1.06))} fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${mask})`}>
        <rect x={rect[0]} y={rect[1]} width={r2(Math.max(0, rect[2]! - rect[0]!))} height={r2(Math.max(0, rect[3]! - rect[1]!))} fill={SAFE_GREEN} fillOpacity={0.17} />
        <line {...edge} stroke={SAFE_GREEN} strokeWidth={1.4} strokeDasharray="4 3" />
      </g>
    </g>
  )
}

/** The danger a chart cardinal guards, hatched red. */
export function ChartDanger({ id, c }: { id: string; c: ChartCardinal }) {
  const hatch = `${id}-hatch`
  const p = project(c.danger)
  return (
    <g>
      <defs>
        <pattern id={hatch} patternUnits="userSpaceOnUse" width={5} height={5} patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={5} stroke={DANGER_RED} strokeWidth={1.3} strokeOpacity={0.6} />
        </pattern>
      </defs>
      {c.kind === 'rocks' ? (
        <circle cx={p.x} cy={p.y} r={nmPx(c.danger, ROCK_RADIUS)} fill={`url(#${hatch})`} stroke={DANGER_RED} strokeWidth={1} strokeOpacity={0.7} />
      ) : (
        <polygon points={polyPoints(bankRing(BANK_SHALLOW))} fill={`url(#${hatch})`} stroke={DANGER_RED} strokeWidth={1} strokeOpacity={0.7} />
      )}
    </g>
  )
}

/** A small yacht in chart pixels, bow towards `heading` (°T). */
export function BoatGlyph({ at, heading = 0, size = 12, colour = '#c2410c' }: { at: LatLon; heading?: number; size?: number; colour?: string }) {
  const p = project(at)
  const s = r2(size / 24)
  return (
    <g transform={`translate(${p.x} ${p.y}) rotate(${r2(heading)}) scale(${s})`}>
      <path d="M0 -13 C 6 -7 6 4 5 11 L -5 11 C -6 4 -6 -7 0 -13 Z" fill="#fff" stroke={colour} strokeWidth={2.4} strokeLinejoin="round" />
      <circle cx={0} cy={-1} r={1.8} fill={colour} />
    </g>
  )
}

/** A short arrow on the chart from a mark towards its named side. */
export function ChartSideArrow({ from, side, lengthNm, colour = SAFE_GREEN, width = 2 }: { from: LatLon; side: Cardinal; lengthNm: number; colour?: string; width?: number }) {
  const dir = CARD[side].dir
  const a = project(rhumbDestination(from, dir, lengthNm * 0.25))
  const b = project(rhumbDestination(from, dir, lengthNm))
  const ang = Math.atan2(b.y - a.y, b.x - a.x)
  const head = 4 + width * 2.2
  return (
    <g stroke={colour} fill={colour} strokeWidth={width} strokeLinecap="round">
      <line x1={a.x} y1={a.y} x2={r2(b.x - Math.cos(ang) * head * 0.6)} y2={r2(b.y - Math.sin(ang) * head * 0.6)} />
      <polygon stroke="none" points={`${b.x},${b.y} ${r2(b.x - head * Math.cos(ang - 0.45))},${r2(b.y - head * Math.sin(ang - 0.45))} ${r2(b.x - head * Math.cos(ang + 0.45))},${r2(b.y - head * Math.sin(ang + 0.45))}`} />
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* Special marks in the Mediterranean (plan views)                      */
/* ------------------------------------------------------------------ */

/** A small yellow special buoy seen from above (optionally with its X topmark). */
function PlanYellow({ x, y, r = 7, x2 = false }: { x: number; y: number; r?: number; x2?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={YELLOW} stroke="#7a5d00" strokeWidth={1.5} />
      {x2 && <g stroke="#7a5d00" strokeWidth={1.6}><line x1={x - r * 0.55} y1={y - r * 0.55} x2={x + r * 0.55} y2={y + r * 0.55} /><line x1={x + r * 0.55} y1={y - r * 0.55} x2={x - r * 0.55} y2={y + r * 0.55} /></g>}
    </g>
  )
}

/** A beach with its swimming area marked by a line of yellow buoys, and a lane for boats. */
export function SwimmingAreaFigure({ box }: { box?: { x: number; y: number; width: number; height: number } }) {
  const buoys = Array.from({ length: 13 }, (_, i) => 40 + i * 50)
  return (
    <svg viewBox="0 0 680 360" {...box} className={box ? undefined : "block h-auto w-full rounded-card"} role="img"
      aria-label="Plan of a beach. A line of small yellow buoys runs parallel to the beach some way offshore, marking the swimming area. A narrow lane of buoys runs from the line to the beach for boats and tenders at slow speed. A yacht is anchored outside the line.">
      <rect width={680} height={360} fill="#d7ecf7" />
      <rect y={250} width={680} height={110} fill="#bfe0f2" />
      <path d="M0 300 Q 170 288 340 296 T 680 292 V360 H0 Z" fill="#efe2bd" />
      <text x={340} y={340} textAnchor="middle" fontSize={16} fontWeight={700} fill="#5b4f30" fontFamily={FONT}>Beach</text>
      {buoys.filter((x) => x < 400 || x > 495).map((x) => <PlanYellow key={x} x={x} y={150} />)}
      {[175, 210, 245, 280].map((y) => (
        <g key={y}>
          <PlanYellow x={420} y={y} r={5} />
          <PlanYellow x={470} y={y} r={5} />
        </g>
      ))}
      <PlanYellow x={420} y={150} />
      <PlanYellow x={470} y={150} />
      <text x={485} y={92} fontSize={13} fontWeight={700} fill="#1d2731" fontFamily={FONT}>Boat lane, if there is one:</text>
      <text x={485} y={109} fontSize={12} fill="#3e5468" fontFamily={FONT}>tender in at walking pace</text>
      <line x1={445} y1={60} x2={445} y2={290} stroke="#0f766e" strokeWidth={2} strokeDasharray="6 5" />
      <text x={200} y={215} textAnchor="middle" fontSize={16} fontWeight={700} fill="#1d4f7a" fontFamily={FONT}>Swimming area: no boats</text>
      <text x={200} y={130} textAnchor="middle" fontSize={13} fill="#3e5468" fontFamily={FONT}>Yellow buoys mark the outer edge</text>
      <g transform="translate(120 70) rotate(200) scale(1.2)">
        <path d="M0 -13 C 6 -7 6 4 5 11 L -5 11 C -6 4 -6 -7 0 -13 Z" fill="#fff" stroke="#c2410c" strokeWidth={2.4} strokeLinejoin="round" />
      </g>
      <text x={150} y={58} fontSize={13} fill="#1d2731" fontFamily={FONT}>Anchor outside the line</text>
    </svg>
  )
}

/** A fish farm: pens in a sheltered bay, yellow special marks with X topmarks round the edge. */
export function FishFarmFigure({ box }: { box?: { x: number; y: number; width: number; height: number } }) {
  const pens: Array<[number, number]> = [[250, 150], [330, 150], [410, 150], [250, 220], [330, 220], [410, 220]]
  return (
    <svg viewBox="0 0 680 340" {...box} className={box ? undefined : "block h-auto w-full rounded-card"} role="img"
      aria-label="Plan of a fish farm in a bay: six round floating pens in two rows, with yellow special marks at the corners of the farm and mooring lines spreading beyond them.">
      <rect width={680} height={340} fill="#d7ecf7" />
      <path d="M0 0 H680 V40 Q 560 70 520 40 Q 470 10 400 30 Q 330 50 260 25 Q 180 0 120 40 Q 60 70 0 50 Z" fill="#efe2bd" stroke="#8a7a52" strokeWidth={1.2} />
      <rect x={190} y={95} width={280} height={180} fill="none" stroke="#7a5d00" strokeWidth={1.4} strokeDasharray="5 5" />
      {[[190, 95], [470, 95], [190, 275], [470, 275]].map(([x, y]) => (
        <line key={`${x}${y}`} x1={x} y1={y} x2={x! + (x! < 300 ? -45 : 45)} y2={y! + (y! < 200 ? -25 : 30)} stroke="#64748b" strokeWidth={1.4} />
      ))}
      {pens.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={30} fill="rgba(255,255,255,0.5)" stroke="#334155" strokeWidth={3} />
          <circle cx={x} cy={y} r={22} fill="none" stroke="#94a3b8" strokeWidth={1.5} />
        </g>
      ))}
      {[[190, 95], [470, 95], [190, 275], [470, 275]].map(([x, y]) => <PlanYellow key={`m${x}${y}`} x={x!} y={y!} r={9} x2 />)}
      <text x={330} y={330} textAnchor="middle" fontSize={14} fontWeight={700} fill="#1d2731" fontFamily={FONT}>Yellow special marks at the corners, often flashing yellow at night</text>
      <text x={570} y={170} textAnchor="middle" fontSize={13} fill="#3e5468" fontFamily={FONT}>Mooring lines and</text>
      <text x={570} y={186} textAnchor="middle" fontSize={13} fill="#3e5468" fontFamily={FONT}>anchors spread wide:</text>
      <text x={570} y={202} textAnchor="middle" fontSize={13} fontWeight={700} fill={DANGER_RED} fontFamily={FONT}>keep well off</text>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Scene helpers (1600×900 stage space)                                */
/* ------------------------------------------------------------------ */

/** A transparent 1600×900 layer over a chart scene, for big readable labels. */
export function Overlay({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <g fontFamily={FONT}>{children}</g>
    </svg>
  )
}

/** A label on a dark pill; y is the text baseline. */
export function Tag({ x, y, text, size = 48, fill = '#fff', bg = 'rgba(11,25,41,0.9)', anchor = 'start', opacity = 1 }: {
  x: number; y: number; text: string; size?: number; fill?: string; bg?: string; anchor?: 'start' | 'middle' | 'end'; opacity?: number
}) {
  const w = text.length * size * 0.56 + size * 0.9
  const h = size * 1.5
  const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - size * 1.08} width={w} height={h} rx={16} fill={bg} />
      <text x={x0 + w / 2} y={y} textAnchor="middle" fontSize={size} fontWeight={700} fill={fill}>{text}</text>
    </g>
  )
}
