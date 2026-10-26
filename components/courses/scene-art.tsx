// Reusable SVG artwork for lesson-player scenes and diagrams: a yacht seen
// from above, navigation instruments and simple cards. Pure components
// (no hooks) in a 1600×900 Stage or any other SVG.

import { Children, isValidElement, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { lerpView, type ViewRect } from '@/lib/courses/navigation/chart-geometry'
import PracticeChart from './PracticeChart'

export const ART = {
  navy: '#0B1929',
  stage: '#0e2237',
  teal: '#0B5563',
  tealBright: '#2bb3c0',
  tealLight: '#E0F2F7',
  white: '#ffffff',
  muted: '#9fb3c8',
  port: '#d9342b',
  starboard: '#1f9d55',
  amber: '#f5b301',
  hull: '#f4f1ea',
  deck: '#d9c7a3',
}

/** A yacht seen from above, bow pointing to `heading` (degrees, 0 = up). */
export function Yacht({ x, y, heading = 0, scale = 1, sidelights = false, opacity = 1 }: {
  x: number; y: number; heading?: number; scale?: number; sidelights?: boolean; opacity?: number
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${heading}) scale(${scale})`} opacity={opacity}>
      <path d="M0 -60 C 22 -38 26 -5 24 30 C 23 45 18 55 14 58 L -14 58 C -18 55 -23 45 -24 30 C -26 -5 -22 -38 0 -60 Z" fill={ART.hull} stroke="#5b5348" strokeWidth={2} />
      <path d="M0 -44 C 14 -28 17 -4 16 20 L -16 20 C -17 -4 -14 -28 0 -44 Z" fill={ART.deck} />
      <rect x={-10} y={22} width={20} height={26} rx={4} fill="#c9b58e" stroke="#8a7a5e" strokeWidth={1} />
      <circle cx={0} cy={-8} r={3.5} fill="#5b5348" />
      <line x1={0} y1={-8} x2={0} y2={34} stroke="#5b5348" strokeWidth={2} />
      {sidelights && (
        <>
          <circle cx={-15} cy={-30} r={5} fill={ART.port} />
          <circle cx={15} cy={-30} r={5} fill={ART.starboard} />
        </>
      )}
    </g>
  )
}

/** Dividers: two legs from a hinge, points `spread` px apart. */
export function Dividers({ x, y, spread = 120, angle = 0, length = 200 }: { x: number; y: number; spread?: number; angle?: number; length?: number }) {
  const half = Math.asin(Math.min(1, spread / 2 / length))
  const lx = Math.sin(half) * length
  const ly = Math.cos(half) * length
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <line x1={0} y1={-ly} x2={-lx} y2={0} stroke="#cfd8e3" strokeWidth={7} strokeLinecap="round" />
      <line x1={0} y1={-ly} x2={lx} y2={0} stroke="#e8eef5" strokeWidth={7} strokeLinecap="round" />
      <circle cx={0} cy={-ly} r={11} fill="#8899aa" stroke="#e8eef5" strokeWidth={3} />
      <circle cx={-lx} cy={0} r={3} fill="#fff" />
      <circle cx={lx} cy={0} r={3} fill="#fff" />
    </g>
  )
}

/** A square protractor plotter (Portland/Breton style). */
export function Plotter({ x, y, w = 360, h = 200, rotate = 0, dial = 0 }: { x: number; y: number; w?: number; h?: number; rotate?: number; dial?: number }) {
  const r = h * 0.38
  const ticks: ReactNode[] = []
  for (let d = 0; d < 360; d += 10) {
    const a = ((d + dial) * Math.PI) / 180
    ticks.push(<line key={d} x1={Math.sin(a) * r} y1={-Math.cos(a) * r} x2={Math.sin(a) * (r - (d % 90 === 0 ? 14 : 7))} y2={-Math.cos(a) * (r - (d % 90 === 0 ? 14 : 7))} stroke={ART.navy} strokeWidth={d % 90 === 0 ? 2 : 1} />)
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill="rgba(224,242,247,0.72)" stroke={ART.tealBright} strokeWidth={2} />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={-w / 2 + 12} x2={w / 2 - 12} y1={-h / 2 + 20 + i * ((h - 40) / 8)} y2={-h / 2 + 20 + i * ((h - 40) / 8)} stroke={ART.teal} strokeOpacity={0.25} strokeWidth={1} />
      ))}
      <circle r={r} fill="rgba(255,255,255,0.65)" stroke={ART.navy} strokeWidth={1.5} />
      {ticks}
      {/* The dial's grid turns with the dial. */}
      <g transform={`rotate(${dial})`}>
        <line x1={0} y1={-r} x2={0} y2={r} stroke={ART.port} strokeWidth={1.5} />
        <line x1={-r} y1={0} x2={r} y2={0} stroke={ART.port} strokeWidth={1.5} />
      </g>
      <polygon points={`${-w / 2 + 30},${-h / 2 + 14} ${-w / 2 + 70},${-h / 2 + 14} ${-w / 2 + 50},${-h / 2 + 4}`} fill={ART.navy} transform="translate(0 0)" />
    </g>
  )
}

/** A hand-bearing compass (puck style) with a card turned to `reading`. */
export function HandCompass({ x, y, size = 110, reading = 0 }: { x: number; y: number; size?: number; reading?: number }) {
  const ticks: ReactNode[] = []
  for (let d = 0; d < 360; d += 15) {
    const a = ((d - reading) * Math.PI) / 180
    const r = size * 0.62
    ticks.push(<line key={d} x1={Math.sin(a) * r} y1={-Math.cos(a) * r} x2={Math.sin(a) * (r - (d % 90 === 0 ? 14 : 7))} y2={-Math.cos(a) * (r - (d % 90 === 0 ? 14 : 7))} stroke="#fff" strokeWidth={d % 90 === 0 ? 3 : 1.5} />)
  }
  const n = ((0 - reading) * Math.PI) / 180
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={size} fill="#1b2d40" stroke="#f6a313" strokeWidth={10} />
      <circle r={size * 0.75} fill="#0f1c2a" />
      {ticks}
      <text x={Math.sin(n) * size * 0.4} y={-Math.cos(n) * size * 0.4 + 9} fontSize={26} fontWeight={800} fill={ART.port} textAnchor="middle">N</text>
      <line x1={0} y1={-size * 0.95} x2={0} y2={-size * 0.7} stroke={ART.amber} strokeWidth={4} />
    </g>
  )
}

/**
 * A lucide icon drawn inside an SVG scene, centred on (x, y). Icons follow
 * the brand: monoline, 1.75 stroke, no emoji.
 */
export function SceneIcon({ icon: Icon, x, y, size = 48, colour = ART.white, opacity = 1 }: {
  icon: LucideIcon; x: number; y: number; size?: number; colour?: string; opacity?: number
}) {
  return <Icon x={x - size / 2} y={y - size / 2} size={size} color={colour} strokeWidth={1.75} opacity={opacity} aria-hidden="true" />
}

/** A rounded label card. `icon` is a lucide icon (or, for symbols such as △, a short string). */
export function Card({ x, y, w, h, title, body, opacity = 1, accent = ART.tealBright, icon, iconColour, titleSize = 34, bodySize = 24 }: {
  x: number; y: number; w: number; h: number; title: string; body?: string; opacity?: number; accent?: string; icon?: string | LucideIcon
  /** Icon colour; defaults to the accent. */
  iconColour?: string
  titleSize?: number; bodySize?: number
}) {
  const textX = icon ? 40 + titleSize * 1.5 : 28
  const iconSize = titleSize * 1.15
  return (
    <g opacity={opacity} transform={`translate(${x} ${y + (1 - opacity) * 20})`}>
      <rect width={w} height={h} rx={18} fill="rgba(255,255,255,0.07)" stroke={accent} strokeWidth={2.5} />
      {typeof icon === 'string' && <text x={26} y={h / 2 + titleSize * 0.42} fontSize={titleSize * 1.2} fill={iconColour ?? accent}>{icon}</text>}
      {icon && typeof icon !== 'string' && <SceneIcon icon={icon} x={26 + iconSize / 2} y={h / 2} size={iconSize} colour={iconColour ?? accent} />}
      <text x={textX} y={body ? h / 2 - bodySize * 0.25 : h / 2 + titleSize * 0.35} fontSize={titleSize} fontWeight={700} fill={ART.white}>{title}</text>
      {body && <text x={textX} y={h / 2 + bodySize * 1.35} fontSize={bodySize} fill={ART.muted}>{body}</text>}
    </g>
  )
}

/** Wrapped text: splits on "\n" only (keep lines short by hand). */
export function Lines({ x, y, lines, size = 34, fill = ART.white, anchor = 'start', weight = 400, gap = 1.35, opacity = 1 }: {
  x: number; y: number; lines: string[]; size?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; weight?: number; gap?: number; opacity?: number
}) {
  return (
    <text x={x} y={y} fontSize={size} fill={fill} textAnchor={anchor} fontWeight={weight} opacity={opacity}>
      {lines.map((l, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : size * gap}>{l}</tspan>)}
    </text>
  )
}

/**
 * Practice chart filling the player, moving from one view to another.
 * Children are chart overlays (SVG); ChartBanner children are HTML, so
 * they are lifted out of the SVG and laid over the top.
 */
export function ChartScene({ from, to, t = 1, children, highlight, soundings = true, labels = true }: {
  from: ViewRect; to?: ViewRect; t?: number; children?: ReactNode; highlight?: string[]
  /** Turn off for very close zooms, where chart text gets huge. */
  soundings?: boolean
  labels?: boolean
}) {
  const view = to ? lerpView(from, to, t) : from
  const items = Children.toArray(children)
  const isBanner = (c: ReactNode) => isValidElement(c) && c.type === ChartBanner
  return (
    <div className="absolute inset-0 bg-white">
      <PracticeChart fill view={view} highlight={highlight} soundings={soundings} labels={labels}>{items.filter((c) => !isBanner(c))}</PracticeChart>
      {items.filter(isBanner)}
    </div>
  )
}

/** Caption banner across the top of a chart scene. */
export function ChartBanner({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute left-3 top-3 max-w-[70%] rounded-lg bg-navy/85 px-3 py-1.5 text-xs font-semibold text-white sm:text-base">
      {children}
    </div>
  )
}
