// Drawing pieces for the lights-at-night scenes and widgets, ported from the
// Boaty Jobs lessons on light characteristics and on night and poor
// visibility. Pure SVG, no hooks, so they render identically on the server
// and in the browser.

import type { ReactNode } from 'react'
import { rhumbBearing, rhumbDistance, type LatLon } from '@/lib/courses/geo'
import { r2 } from '@/lib/courses/navigation/chart-geometry'
import { lightOn, type LightCharacteristic } from '@/lib/courses/navigation/lights'
import { feature } from '@/lib/courses/navigation/practice-chart'
import { LIGHT_COLOURS, LightGlow } from '../../marks'
import { GATE_12, LEADING, NO3, NO4, colourAt, type Pattern } from './data'

const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"
export const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

/**
 * The recent past of a light as a strip, like a chart recorder: the
 * right-hand end is "now" and the pattern runs off to the left. Every strip
 * drawn with the same `span` shares one time scale, so rhythms compare.
 */
export function TimeStrip({ pattern, now, x, y, width, height, span = 10, ticks = true }: {
  pattern: Pattern; now: number; x: number; y: number; width: number; height: number; span?: number; ticks?: boolean
}) {
  const t0 = now - span
  const px = (t: number) => r2(x + ((t - t0) / span) * width)
  // Lit stretches in the window, joining neighbours of the same colour (a fixed light is one bar).
  const lit: Array<{ a: number; b: number; colour: Pattern['phases'][number]['colour'] }> = []
  const first = Math.floor(t0 / pattern.period)
  const last = Math.floor(now / pattern.period)
  for (let k = first; k <= last; k++) {
    let start = k * pattern.period
    for (const p of pattern.phases) {
      const a = Math.max(start, t0)
      const b = Math.min(start + p.seconds, now)
      if (p.on && b > a) {
        const prev = lit[lit.length - 1]
        if (prev && prev.colour === p.colour && Math.abs(prev.b - a) < 1e-6) prev.b = b
        else lit.push({ a, b, colour: p.colour })
      }
      start += p.seconds
    }
  }
  const els = lit.map((s, i) => <rect key={i} x={px(s.a)} y={y + 3} width={r2(px(s.b) - px(s.a))} height={height - 6} fill={LIGHT_COLOURS[s.colour]} />)
  const tickEls: ReactNode[] = []
  if (ticks) {
    for (let s = Math.ceil(t0); s <= now; s++) {
      tickEls.push(<line key={s} x1={px(s)} x2={px(s)} y1={y + height} y2={y + height + (s % 5 === 0 ? 9 : 5)} stroke="#64748b" strokeWidth={1.5} />)
    }
  }
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={3} fill="#0f172a" stroke="#475569" strokeWidth={1} />
      {els}
      {tickEls}
      <line x1={x + width} x2={x + width} y1={y - 5} y2={y + height + 5} stroke="#fff" strokeWidth={2.5} />
    </g>
  )
}

/** A light glowing in its pattern's colour at `now` (handles the alternating light). */
export function PatternGlow({ pattern, now, x, y, r = 16 }: { pattern: Pattern; now: number; x: number; y: number; r?: number }) {
  const c = colourAt(pattern, now)
  return <LightGlow x={x} y={y} r={r} on={c !== null} colour={c ?? pattern.phases[0]!.colour} />
}

/** Deterministic stars for night skies. */
const STARS = Array.from({ length: 46 }, (_, i) => ({
  x: (i * 337 + 61) % 1600,
  y: 20 + ((i * 151 + 17) % 470),
  r: i % 7 === 0 ? 2.2 : i % 3 === 0 ? 1.6 : 1.1,
}))

/** A night sky and sea filling the 1600×900 stage, horizon at `horizon`. */
export function NightSea({ horizon = 600, id }: { horizon?: number; id: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor="#040a14" />
          <stop offset={1} stopColor="#13304f" />
        </linearGradient>
      </defs>
      <rect width={1600} height={horizon} fill={`url(#${id}-sky)`} />
      {STARS.filter((s) => s.y < horizon - 40).map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#cbd5e1" opacity={0.55} />)}
      <rect y={horizon} width={1600} height={900 - horizon} fill="#061322" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${(i * 410) % 1500} ${horizon + 40 + i * 48} q 40 -6 80 0`} stroke="#1c3a5c" strokeWidth={3} fill="none" opacity={0.7} />
      ))}
    </g>
  )
}

/** A small night view (600×220) for widgets: sky, faint stars, a dark sea from y = 165. */
export function NightSkyStrip() {
  return (
    <g>
      <defs>
        <linearGradient id="lal-strip-sky" x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor="#03070f" />
          <stop offset={1} stopColor="#112a45" />
        </linearGradient>
      </defs>
      <rect width={600} height={165} fill="url(#lal-strip-sky)" />
      {STARS.slice(0, 22).map((s, i) => <circle key={i} cx={(s.x * 3) % 600} cy={10 + (s.y % 120)} r={s.r * 0.7} fill="#cbd5e1" opacity={0.45} />)}
      <rect y={165} width={600} height={55} fill="#050f1c" />
      <line x1={0} x2={600} y1={165} y2={165} stroke="#1e3a5c" strokeWidth={1} />
    </g>
  )
}

/** A long low island on the horizon with a small lighthouse. */
export function IslandSilhouette({ horizon = 600, lightX = 760 }: { horizon?: number; lightX?: number }) {
  const top = horizon - 46
  return (
    <g>
      <path d={`M${lightX - 130} ${horizon} Q ${lightX - 60} ${top + 12} ${lightX} ${top} L ${lightX + 140} ${top - 12} Q ${lightX + 300} ${top - 60} ${lightX + 450} ${top - 30} Q ${lightX + 620} ${top - 10} ${lightX + 760} ${horizon} Z`} fill="#02060d" />
      <polygon points={`${lightX - 9},${top + 2} ${lightX + 9},${top + 2} ${lightX + 6},${top - 40} ${lightX - 6},${top - 40}`} fill="#0b1522" />
      <rect x={lightX - 8} y={top - 52} width={16} height={12} rx={2} fill="#0b1522" />
    </g>
  )
}

/** A reflection of a light on the water below it. */
export function Reflection({ x, horizon, on, colour = 'W', length = 200 }: { x: number; horizon: number; on: boolean; colour?: keyof typeof LIGHT_COLOURS; length?: number }) {
  if (!on) return null
  return (
    <g opacity={0.5}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={x - 18 + (i % 2) * 8} y={horizon + 8 + i * (length / 6)} width={28 - i * 3} height={4} rx={2} fill={LIGHT_COLOURS[colour]} opacity={1 - i * 0.14} />
      ))}
    </g>
  )
}

/** A transparent 1600×900 layer over a chart scene, for big readable labels. */
export function Overlay({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <g fontFamily={FONT}>{children}</g>
    </svg>
  )
}

/** A label on a dark pill; y is the text baseline. */
export function Tag({ x, y, text, size = 48, fill = '#fff', bg = 'rgba(11,25,41,0.9)', anchor = 'start', mono }: {
  x: number; y: number; text: string; size?: number; fill?: string; bg?: string; anchor?: 'start' | 'middle' | 'end'; mono?: boolean
}) {
  const w = text.length * size * (mono ? 0.62 : 0.56) + size * 0.9
  const h = size * 1.5
  const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2
  return (
    <g>
      <rect x={x0} y={y - size * 1.08} width={w} height={h} rx={16} fill={bg} />
      <text x={x0 + w / 2} y={y} textAnchor="middle" fontSize={size} fontWeight={700} fill={fill} fontFamily={mono ? MONO : undefined}>{text}</text>
    </g>
  )
}

/** A rounded panel on the stage. */
export function Panel({ x, y, w, h, title, highlight }: { x: number; y: number; w: number; h: number; title?: string; highlight?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={18} fill="rgba(255,255,255,0.045)" stroke={highlight ? '#2bb3c0' : 'rgba(255,255,255,0.14)'} strokeWidth={highlight ? 4 : 2} />
      {title && <text x={x + w / 2} y={y + 48} textAnchor="middle" fontSize={36} fontWeight={700} fill="#9fb3c8">{title}</text>}
    </g>
  )
}

/** A digital stopwatch readout. */
export function StopwatchFace({ x, y, seconds, running, label = 'Stopwatch' }: { x: number; y: number; seconds: number | null; running: boolean; label?: string }) {
  const text = seconds === null ? '-.-' : seconds.toFixed(1)
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-230} y={-90} width={460} height={170} rx={30} fill="#0b1929" stroke={running ? '#f5b301' : '#5d6f82'} strokeWidth={5} />
      <rect x={-30} y={-112} width={60} height={24} rx={6} fill="#5d6f82" />
      <text x={0} y={22} textAnchor="middle" fontSize={96} fontWeight={800} fill={running ? '#f5b301' : '#e2e8f0'} fontFamily={MONO}>{text}</text>
      <text x={0} y={64} textAnchor="middle" fontSize={30} fill="#9fb3c8">{label} · seconds</text>
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* The view ahead: Port Kerran at night among the town lights          */
/* (ported from the Boaty Jobs night and poor visibility lesson)       */
/* ------------------------------------------------------------------ */

const DEG = Math.PI / 180

// Integer hash rather than Math.sin, so server and browser agree exactly.
export function seeded(i: number): number {
  let t = (i * 0x9e3779b1) >>> 0
  t = Math.imul(t ^ (t >>> 16), 0x85ebca6b) >>> 0
  t = Math.imul(t ^ (t >>> 13), 0xc2b2ae35) >>> 0
  return ((t ^ (t >>> 16)) >>> 0) / 4294967296
}

/** Panorama frame: 800 × 380, looking north (000°T) from between No 1 and No 2. */
export const PANO = { w: 800, h: 380, shore: 236, pxPerDeg: 400 / 28 }
/** Vertical exaggeration for lights on land: pixels per degree of elevation. */
const ELEVATION_PX_PER_DEG = 370

export type PanoKind = 'leading' | 'buoy' | 'town' | 'mast'

export interface PanoLight {
  id: string
  kind: PanoKind
  x: number
  y: number
  /** Flashing lights: their characteristic. Steady lights: a colour. */
  light?: LightCharacteristic
  colour: string
  r: number
  /** What a screen reader hears: what the light does, not its name. */
  says: string
}

function bearingX(p: LatLon): number {
  let b = rhumbBearing(GATE_12, p)
  if (b > 180) b -= 360
  return r2(PANO.w / 2 + b * PANO.pxPerDeg)
}
function elevationY(p: LatLon, heightM: number): number {
  const d = rhumbDistance(GATE_12, p) * 1852
  return r2(PANO.shore - (Math.atan(heightM / d) / DEG) * ELEVATION_PX_PER_DEG)
}
function waterY(p: LatLon): number {
  return r2(PANO.shore + 62 / rhumbDistance(GATE_12, p))
}

const TOWN_COLOURS = ['#ffc56b', '#ffd88f', '#fff0c9', '#ffb54d']
export const TOWN_COUNT = 13
export const PANO_TOWN = Array.from({ length: TOWN_COUNT }, (_, i) => `town-${i}`)

export const PANO_LIGHTS: PanoLight[] = (() => {
  const front = feature('ldg-front')
  const rear = feature('ldg-rear')
  const lights: PanoLight[] = [
    { id: 'front', kind: 'leading', x: bearingX(front.at), y: elevationY(front.at, 6), light: LEADING.light, colour: '#fff7d6', r: 5, says: 'white, mostly on, blinking out once every 4 seconds' },
    { id: 'rear', kind: 'leading', x: bearingX(rear.at), y: elevationY(rear.at, 14), light: LEADING.light, colour: '#fff7d6', r: 5, says: 'white, mostly on, blinking out once every 4 seconds' },
    { id: 'no3', kind: 'buoy', x: bearingX(NO3.at), y: waterY(NO3.at), light: NO3.light, colour: '#3ee07a', r: 4.5, says: 'green, low on the water, flashing in pairs every 5 seconds' },
    { id: 'no4', kind: 'buoy', x: bearingX(NO4.at), y: waterY(NO4.at), light: NO4.light, colour: '#ff4d4d', r: 4.5, says: 'red, low on the water, flashing in pairs every 5 seconds' },
  ]
  const mx = bearingX(feature('mast').at)
  lights.push({ id: 'mast-top', kind: 'mast', x: mx, y: PANO.shore - 150, colour: '#ff4d4d', r: 3.5, says: 'red, steady, high above the land' })
  lights.push({ id: 'mast-low', kind: 'mast', x: mx, y: PANO.shore - 112, colour: '#ff4d4d', r: 3.5, says: 'red, steady, high above the land' })
  // Town lights round the harbour: steady, warm, scattered, kept clear of the leading lights.
  let n = 0
  for (let i = 0; n < TOWN_COUNT && i < 400; i++) {
    const x = r2(PANO.w / 2 + (seeded(i + 7) * 2 - 1) * 230)
    const y = r2(PANO.shore - 6 - seeded(i + 77) * 66)
    if (Math.abs(x - PANO.w / 2) < 30) continue
    if (lights.some((l) => Math.hypot(l.x - x, l.y - y) < 32)) continue
    lights.push({ id: `town-${n}`, kind: 'town', x, y, colour: TOWN_COLOURS[i % TOWN_COLOURS.length]!, r: r2(3 + seeded(i + 300) * 1.5), says: 'yellowish, steady, never blinks out' })
    n++
  }
  return lights
})()

/** Is a panorama light showing at `seconds`? Steady lights always are. */
export function panoOn(l: PanoLight, seconds: number, index: number): boolean {
  if (!l.light) return true
  // The buoys are not synchronised with each other; the leading lights share a rhythm.
  const offset = l.kind === 'leading' ? 0.4 : index * 1.7
  return lightOn(l.light, seconds + offset)
}

/** The land, sky and sea behind the panorama lights. */
export function PanoBackdrop({ id }: { id: string }) {
  const hills = `M0 ${PANO.shore} L0 196 Q 90 168 180 182 T 360 170 Q 430 150 520 168 T 700 176 Q 760 168 800 186 L800 ${PANO.shore} Z`
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor="#02060d" />
          <stop offset={1} stopColor="#0d2238" />
        </linearGradient>
      </defs>
      <rect width={PANO.w} height={PANO.shore} fill={`url(#${id}-sky)`} />
      {Array.from({ length: 30 }, (_, i) => (
        <circle key={i} cx={r2(seeded(i + 900) * PANO.w)} cy={r2(seeded(i + 950) * 140)} r={0.9} fill="#cbd5e1" opacity={0.5} />
      ))}
      <path d={hills} fill="#050c16" />
      <rect y={PANO.shore} width={PANO.w} height={PANO.h - PANO.shore} fill="#04101d" />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${(i * 230 + 40) % 760} ${PANO.shore + 40 + i * 30} q 30 -5 60 0`} stroke="#123050" strokeWidth={2} fill="none" />
      ))}
    </g>
  )
}

/** All the panorama lights at a moment. `ring` circles the given ids; `dim` fades them. */
export function PanoLights({ seconds, ring = [], dim = [] }: { seconds: number; ring?: string[]; dim?: string[] }) {
  return (
    <g>
      {PANO_LIGHTS.map((l, i) => {
        const on = panoOn(l, seconds, i)
        return (
          <g key={l.id} opacity={dim.includes(l.id) ? 0.3 : 1}>
            {l.light ? (
              on ? <LightGlow x={l.x} y={l.y} on colour={l.light.colour} r={l.r} /> : null
            ) : (
              <g>
                <circle cx={l.x} cy={l.y} r={r2(l.r * 2.4)} fill={l.colour} opacity={0.18} />
                <circle cx={l.x} cy={l.y} r={l.r} fill={l.colour} />
              </g>
            )}
            {ring.includes(l.id) && <circle cx={l.x} cy={l.y} r={l.r + 11} fill="none" stroke="#2bb3c0" strokeWidth={2.5} />}
          </g>
        )
      })}
    </g>
  )
}
