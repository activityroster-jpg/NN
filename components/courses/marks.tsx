// Large drawings of IALA region A marks (as seen from a boat) and light
// helpers for Module 3. Pure SVG, no hooks: usable in lesson notes, widgets
// and lesson-player scenes. Each mark is drawn standing on the waterline at
// (x, y), about 240 units tall at scale 1.

import type { ReactNode } from 'react'
import { lightOn, type LightCharacteristic, type LightColour } from '@/lib/courses/navigation/lights'

export type MarkType =
  | 'port' | 'starboard' | 'preferred-channel-to-port' | 'preferred-channel-to-starboard'
  | 'north' | 'east' | 'south' | 'west'
  | 'isolated-danger' | 'safe-water' | 'special' | 'emergency-wreck'

const RED = '#d9342b'
const GREEN = '#1f9d55'
const YELLOW = '#f5c400'
const BLACK = '#1d2731'
const WHITE = '#f8fafc'
const BLUE = '#1f5fbf'

export const LIGHT_COLOURS: Record<LightColour, string> = { W: '#fff7d6', R: '#ff4d4d', G: '#3ee07a', Y: '#ffd400', Bu: '#5aa2ff' }

/** Plain description used in captions and alt text. */
export const MARK_INFO: Record<MarkType, { name: string; colours: string; shape: string; topmark: string; light: string }> = {
  port: { name: 'Port-hand lateral mark', colours: 'Red', shape: 'Can (flat-topped), pillar or spar', topmark: 'Single red can', light: 'Red, any rhythm except Fl(2+1)' },
  starboard: { name: 'Starboard-hand lateral mark', colours: 'Green', shape: 'Cone (pointed), pillar or spar', topmark: 'Single green cone, point up', light: 'Green, any rhythm except Fl(2+1)' },
  'preferred-channel-to-port': { name: 'Preferred channel to port', colours: 'Green with one broad red band', shape: 'Cone', topmark: 'Green cone', light: 'Green, Fl(2+1)' },
  'preferred-channel-to-starboard': { name: 'Preferred channel to starboard', colours: 'Red with one broad green band', shape: 'Can', topmark: 'Red can', light: 'Red, Fl(2+1)' },
  north: { name: 'North cardinal mark', colours: 'Black above yellow', shape: 'Pillar or spar', topmark: 'Two black cones, both pointing up', light: 'White, VQ or Q (continuous)' },
  east: { name: 'East cardinal mark', colours: 'Black with one broad yellow band', shape: 'Pillar or spar', topmark: 'Two black cones, base to base', light: 'White, VQ(3) 5s or Q(3) 10s' },
  south: { name: 'South cardinal mark', colours: 'Yellow above black', shape: 'Pillar or spar', topmark: 'Two black cones, both pointing down', light: 'White, VQ(6)+LFl 10s or Q(6)+LFl 15s' },
  west: { name: 'West cardinal mark', colours: 'Yellow with one broad black band', shape: 'Pillar or spar', topmark: 'Two black cones, point to point', light: 'White, VQ(9) 10s or Q(9) 15s' },
  'isolated-danger': { name: 'Isolated danger mark', colours: 'Black with one or more broad red bands', shape: 'Optional; pillar or spar preferred', topmark: 'Two black spheres', light: 'White, Fl(2)' },
  'safe-water': { name: 'Safe water mark', colours: 'Red and white vertical stripes', shape: 'Spherical, pillar or spar', topmark: 'Single red sphere', light: 'White: Iso, Oc, LFl 10s or Mo(A)' },
  special: { name: 'Special mark', colours: 'Yellow', shape: 'Optional, but must not conflict with navigational marks', topmark: 'Yellow X (if any)', light: 'Yellow, any rhythm not used by the white lights of cardinal, isolated danger or safe water marks' },
  'emergency-wreck': { name: 'Emergency wreck marking buoy', colours: 'Blue and yellow vertical stripes', shape: 'Pillar or spar', topmark: 'Upright yellow cross', light: 'Alternating blue and yellow flashes' },
}

function Bands({ x, top, width, height, colours, vertical }: { x: number; top: number; width: number; height: number; colours: string[]; vertical?: boolean }) {
  return (
    <g>
      {colours.map((fill, i) =>
        vertical ? (
          <rect key={i} x={x - width / 2 + (i * width) / colours.length} y={top} width={width / colours.length} height={height} fill={fill} />
        ) : (
          <rect key={i} x={x - width / 2} y={top + (i * height) / colours.length} width={width} height={height / colours.length} fill={fill} />
        ),
      )}
      <rect x={x - width / 2} y={top} width={width} height={height} fill="none" stroke={BLACK} strokeWidth={2} />
    </g>
  )
}

function Cone({ x, base, size, up, fill = BLACK }: { x: number; base: number; size: number; up: boolean; fill?: string }) {
  const apex = up ? base - size : base + size
  return <polygon points={`${x},${apex} ${x - size * 0.62},${base} ${x + size * 0.62},${base}`} fill={fill} stroke={BLACK} strokeWidth={1.5} />
}

function Topmark({ type, x, y }: { type: MarkType; x: number; y: number }) {
  // y is the top of the mast.
  const s = 22
  switch (type) {
    case 'port':
    case 'preferred-channel-to-starboard':
      return <rect x={x - 14} y={y - 30} width={28} height={30} fill={RED} stroke={BLACK} strokeWidth={1.5} />
    case 'starboard':
    case 'preferred-channel-to-port':
      return <Cone x={x} base={y} size={30} up fill={GREEN} />
    case 'north':
      return <g><Cone x={x} base={y - s - 6} size={s} up /><Cone x={x} base={y} size={s} up /></g>
    case 'south':
      return <g><Cone x={x} base={y - 2 * s - 6} size={s} up={false} /><Cone x={x} base={y - s} size={s} up={false} /></g>
    case 'east':
      return <g><Cone x={x} base={y - s - 3} size={s} up /><Cone x={x} base={y - s - 3} size={s} up={false} /></g>
    case 'west':
      return <g><Cone x={x} base={y - 2 * s - 3} size={s} up={false} /><Cone x={x} base={y} size={s} up /></g>
    case 'isolated-danger':
      return <g><circle cx={x} cy={y - 13} r={12} fill={BLACK} /><circle cx={x} cy={y - 41} r={12} fill={BLACK} /></g>
    case 'safe-water':
      return <circle cx={x} cy={y - 15} r={15} fill={RED} stroke={BLACK} strokeWidth={1.5} />
    case 'special':
      return <g stroke={YELLOW} strokeWidth={8} strokeLinecap="round"><line x1={x - 14} y1={y - 32} x2={x + 14} y2={y - 4} /><line x1={x + 14} y1={y - 32} x2={x - 14} y2={y - 4} /></g>
    case 'emergency-wreck':
      return <g stroke={YELLOW} strokeWidth={8} strokeLinecap="round"><line x1={x} y1={y - 36} x2={x} y2={y - 2} /><line x1={x - 15} y1={y - 22} x2={x + 15} y2={y - 22} /></g>
  }
}

/**
 * A buoy as seen from a boat. `lit` draws its light glowing (colour from the
 * mark's light, or `lightColour`).
 */
export function IalaMark({ type, x, y, scale = 1, lit = false, lightColour }: {
  type: MarkType; x: number; y: number; scale?: number; lit?: boolean; lightColour?: LightColour
}) {
  const bodyTop = -120
  let body: ReactNode
  const lateral = type === 'port' || type === 'starboard' || type === 'preferred-channel-to-port' || type === 'preferred-channel-to-starboard'
  if (type === 'port' || type === 'preferred-channel-to-starboard') {
    const colours = type === 'port' ? [RED] : [RED, GREEN, RED]
    body = <Bands x={0} top={bodyTop} width={64} height={120} colours={colours} />
  } else if (type === 'starboard' || type === 'preferred-channel-to-port') {
    const colours = type === 'starboard' ? [GREEN] : [GREEN, RED, GREEN]
    body = (
      <g>
        <clipPath id={`cone-${type}`}><polygon points={`0,${bodyTop - 30} -40,0 40,0`} /></clipPath>
        <g clipPath={`url(#cone-${type})`}><Bands x={0} top={bodyTop - 30} width={80} height={150} colours={colours} /></g>
        <polygon points={`0,${bodyTop - 30} -40,0 40,0`} fill="none" stroke={BLACK} strokeWidth={2} />
      </g>
    )
  } else {
    const colours: Record<string, string[]> = {
      north: [BLACK, YELLOW], south: [YELLOW, BLACK], east: [BLACK, YELLOW, BLACK], west: [YELLOW, BLACK, YELLOW],
      'isolated-danger': [BLACK, RED, BLACK], special: [YELLOW],
    }
    if (type === 'safe-water') body = <Bands x={0} top={bodyTop} width={56} height={120} colours={[RED, WHITE, RED, WHITE, RED]} vertical />
    else if (type === 'emergency-wreck') body = <Bands x={0} top={bodyTop} width={56} height={120} colours={[BLUE, YELLOW, BLUE, YELLOW, BLUE, YELLOW]} vertical />
    else body = <Bands x={0} top={bodyTop} width={52} height={120} colours={colours[type]!} />
  }
  const mastTop = lateral ? -175 : -185
  const glow = lightColour ?? (type === 'port' || type === 'preferred-channel-to-starboard' ? 'R'
    : type === 'starboard' || type === 'preferred-channel-to-port' ? 'G'
      : type === 'special' ? 'Y' : 'W')
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={0} cy={4} rx={70} ry={10} fill="rgba(0,0,0,0.25)" />
      <rect x={-34} y={-12} width={68} height={14} rx={4} fill="#3b4652" />
      {body}
      <line x1={0} y1={bodyTop} x2={0} y2={mastTop + 4} stroke="#4b5563" strokeWidth={6} />
      <rect x={-7} y={mastTop + 18} width={14} height={16} rx={3} fill={lit ? LIGHT_COLOURS[glow] : '#cbd5e1'} stroke={BLACK} strokeWidth={1.5} />
      {lit && <circle cx={0} cy={mastTop + 26} r={34} fill={LIGHT_COLOURS[glow]} opacity={0.35} />}
      <Topmark type={type} x={0} y={mastTop} />
    </g>
  )
}

/** A glowing light at (x, y): on/off, in its colour. */
export function LightGlow({ x, y, on, colour = 'W', r = 16 }: { x: number; y: number; on: boolean; colour?: LightColour; r?: number }) {
  const c = LIGHT_COLOURS[colour]
  return (
    <g>
      {on && <circle cx={x} cy={y} r={r * 3.2} fill={c} opacity={0.18} />}
      {on && <circle cx={x} cy={y} r={r * 1.8} fill={c} opacity={0.35} />}
      <circle cx={x} cy={y} r={r} fill={on ? c : '#334155'} stroke={on ? '#ffffff' : '#475569'} strokeWidth={on ? 2 : 1} />
    </g>
  )
}

/**
 * One period of a light's rhythm as a bar: lit parts in the light's colour.
 * `at` (seconds into the cycle) draws a moving marker.
 */
export function RhythmBar({ light, x, y, width, height = 26, at }: { light: LightCharacteristic; x: number; y: number; width: number; height?: number; at?: number }) {
  const scale = width / light.period
  // Start time of each phase within the cycle.
  const starts = light.phases.map((_, i) => light.phases.slice(0, i).reduce((n, p) => n + p.seconds, 0))
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="#0f172a" stroke="#64748b" strokeWidth={1} rx={3} />
      {light.phases.map((p, i) =>
        p.on ? <rect key={i} x={x + starts[i]! * scale} y={y + 2} width={Math.max(1, p.seconds * scale)} height={height - 4} fill={LIGHT_COLOURS[light.colour]} /> : null,
      )}
      {at !== undefined && <line x1={x + (((at % light.period) + light.period) % light.period) * scale} x2={x + (((at % light.period) + light.period) % light.period) * scale} y1={y - 6} y2={y + height + 6} stroke="#fff" strokeWidth={3} />}
    </g>
  )
}

/** Convenience: is the light on at `seconds`, for scenes that know elapsed time. */
export { lightOn }
