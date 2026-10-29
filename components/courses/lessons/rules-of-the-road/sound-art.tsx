// Artwork for Lesson 10 (ported from the Boaty Jobs sound signals lesson): vessels seen from above, sound waves, fog and a
// ship's bell. Pure SVG (no hooks). Anything that uses trig rounds its
// coordinates with r2, so the fog widget renders identically on the server
// and in the browser.

import { r2 } from '@/lib/courses/navigation/chart-geometry'

const rad = (d: number) => (d * Math.PI) / 180

/** Point at `dist` from (x, y) in direction `bearing` (0 = up, clockwise). */
export function towards(x: number, y: number, bearing: number, dist: number) {
  return { x: r2(x + Math.sin(rad(bearing)) * dist), y: r2(y - Math.cos(rad(bearing)) * dist) }
}

/** A power-driven vessel seen from above, bow towards `heading`: a cargo ship or a fishing vessel. About 200 units long at scale 1. */
export function Ship({ x, y, heading = 0, scale = 1, kind = 'ship', opacity = 1 }: {
  x: number; y: number; heading?: number; scale?: number; kind?: 'ship' | 'fishing'; opacity?: number
}) {
  if (kind === 'fishing') {
    return (
      <g transform={`translate(${x} ${y}) rotate(${heading}) scale(${scale})`} opacity={opacity}>
        <path d="M0 -70 C 18 -52 24 -30 24 -5 L 24 52 Q 24 62 14 62 L -14 62 Q -24 62 -24 52 L -24 -5 C -24 -30 -18 -52 0 -70 Z" fill="#2f5d7c" stroke="#16324a" strokeWidth={2} />
        <path d="M0 -56 C 13 -42 17 -26 17 -8 L 17 52 L -17 52 L -17 -8 C -17 -26 -13 -42 0 -56 Z" fill="#c9d3dc" />
        <rect x={-14} y={-30} width={28} height={30} rx={3} fill="#f4f1ea" stroke="#5b6b7b" strokeWidth={1.5} />
        <line x1={-20} y1={44} x2={20} y2={44} stroke="#f5b301" strokeWidth={5} strokeLinecap="round" />
        <line x1={-20} y1={44} x2={-12} y2={20} stroke="#f5b301" strokeWidth={4} />
        <line x1={20} y1={44} x2={12} y2={20} stroke="#f5b301" strokeWidth={4} />
      </g>
    )
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${heading}) scale(${scale})`} opacity={opacity}>
      <path d="M0 -100 C 16 -80 22 -55 22 -30 L 22 90 Q 22 100 12 100 L -12 100 Q -22 100 -22 90 L -22 -30 C -22 -55 -16 -80 0 -100 Z" fill="#3d4b5c" stroke="#1f2a36" strokeWidth={2} />
      <path d="M0 -88 C 12 -70 16 -50 16 -30 L 16 88 L -16 88 L -16 -30 C -16 -50 -12 -70 0 -88 Z" fill="#7a8b9c" />
      <rect x={-13} y={-62} width={26} height={26} rx={2} fill="#9c4a2f" />
      <rect x={-13} y={-30} width={26} height={26} rx={2} fill="#2f6f8f" />
      <rect x={-13} y={2} width={26} height={26} rx={2} fill="#9c8a2f" />
      <rect x={-18} y={44} width={36} height={34} rx={3} fill="#eef2f6" stroke="#5b6b7b" strokeWidth={1.5} />
      <circle cx={0} cy={86} r={6} fill="#d9342b" stroke="#1f2a36" strokeWidth={1.5} />
    </g>
  )
}

/**
 * Sound spreading from (x, y) towards `facing` (degrees, 0 = up): `count`
 * arcs, the outermost at `r`. `progress` (0 → 1) moves them outwards.
 */
export function SoundWaves({ x, y, facing, r = 60, count = 3, progress = 1, colour = '#2bb3c0', width = 4, spread = 40 }: {
  x: number; y: number; facing: number; r?: number; count?: number; progress?: number; colour?: string; width?: number; spread?: number
}) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const rr = r2(((i + 1) / count) * r * (0.55 + 0.45 * progress))
        const a = towards(x, y, facing - spread, rr)
        const b = towards(x, y, facing + spread, rr)
        return <path key={i} d={`M${a.x} ${a.y} A${rr} ${rr} 0 0 1 ${b.x} ${b.y}`} fill="none" stroke={colour} strokeWidth={width} strokeLinecap="round" opacity={r2(1 - (i / count) * 0.55)} />
      })}
    </g>
  )
}

/** Drifting fog for the 1600×900 stage: soft pale bands. `density` 0 → 1. */
export function StageFog({ density = 1, drift = 0 }: { density?: number; drift?: number }) {
  const bands = [
    { y: 180, rx: 520, ry: 90, x: 300 },
    { y: 330, rx: 640, ry: 110, x: 1150 },
    { y: 500, rx: 600, ry: 120, x: 450 },
    { y: 640, rx: 700, ry: 110, x: 1250 },
    { y: 780, rx: 800, ry: 120, x: 700 },
  ]
  return (
    <g opacity={density}>
      <defs>
        <radialGradient id="l22-fog">
          <stop offset="0%" stopColor="#dfe7ef" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#dfe7ef" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1600} height={900} fill="#9fb3c8" opacity={0.18} />
      {bands.map((b, i) => (
        <ellipse key={i} cx={b.x + (i % 2 === 0 ? drift : -drift) * 120} cy={b.y} rx={b.rx} ry={b.ry} fill="url(#l22-fog)" />
      ))}
    </g>
  )
}

/** A ship’s bell, mouth down, swinging by `swing` degrees. About 120 units tall at scale 1. */
export function Bell({ x, y, scale = 1, swing = 0, colour = '#f5b301' }: { x: number; y: number; scale?: number; swing?: number; colour?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-34} y={-70} width={68} height={10} rx={4} fill="#8a7a5e" />
      <g transform={`rotate(${swing} 0 -60)`}>
        <rect x={-6} y={-64} width={12} height={14} rx={3} fill={colour} />
        <path d="M-12 -50 C -40 -46 -38 20 -50 36 L 50 36 C 38 20 40 -46 12 -50 Z" fill={colour} stroke="#7a5a0a" strokeWidth={3} />
        <rect x={-54} y={32} width={108} height={10} rx={5} fill="#d99a00" />
        <line x1={0} y1={-40} x2={0} y2={46} stroke="#5b4a2a" strokeWidth={4} />
        <circle cx={0} cy={50} r={8} fill="#5b4a2a" />
      </g>
    </g>
  )
}
