// Blast timelines: a signal drawn to scale along a time axis — short blasts
// as short bars, prolonged blasts five times as long, bell ringing as a run
// of ticks and distinct bell strokes as tall marks. Pure SVG with plain
// arithmetic (no hooks, no trig), so the same markup renders on the server,
// in widgets and inside lesson-player scenes.

import { TIMELINE_SECONDS, segments, signalById, totalSeconds, type SignalId, type SoundSignal } from './signals'

export const BLAST = '#0B5563'
export const BLAST_LIVE = '#2bb3c0'
export const BELL = '#b45309'
export const BELL_LIVE = '#f5b301'

/** Interval between bell strokes drawn in a run of rapid ringing, seconds. */
const RING_TICK = 0.25

/**
 * The bars of one signal in any SVG, origin at its left end, bars `height`
 * tall. With `elapsed` (seconds into the signal) only what has sounded so
 * far is drawn and the element sounding now uses the live colour.
 */
export function TimelineBars({ signal, x = 0, y = 0, pxPerSec, height, elapsed, playhead, playheadColour = '#d9342b', colour = BLAST, liveColour = BLAST_LIVE, bellColour = BELL, bellLive = BELL_LIVE, track, trackWidth = 2 }: {
  signal: SoundSignal
  x?: number
  y?: number
  pxPerSec: number
  height: number
  /** Reveal mode: seconds into the signal; later elements are not drawn yet. */
  elapsed?: number
  /** Playhead mode: the whole signal, with a cursor at this many seconds. */
  playhead?: number
  playheadColour?: string
  colour?: string
  liveColour?: string
  bellColour?: string
  bellLive?: string
  /** Colour of a dashed baseline under the whole signal. */
  track?: string
  trackWidth?: number
}) {
  const shown = elapsed ?? Infinity
  const now = playhead ?? elapsed ?? -1
  const total = totalSeconds(signal)
  return (
    <g transform={`translate(${x} ${y})`}>
      {track && <line x1={0} x2={total * pxPerSec} y1={height / 2} y2={height / 2} stroke={track} strokeWidth={trackWidth} strokeDasharray={`${trackWidth * 2} ${trackWidth * 3}`} />}
      {segments(signal).map((s, i) => {
        if (s.start > shown) return null
        const sounding = now >= s.start && now < s.start + s.dur
        const w = Math.min(s.dur, shown - s.start) * pxPerSec
        const left = s.start * pxPerSec
        if (s.kind === 'ring') {
          const count = Math.floor(Math.min(s.dur, shown - s.start) / RING_TICK + 0.001) + 1
          return (
            <g key={i}>
              {Array.from({ length: count }, (_, k) => {
                const tall = k % 2 === 0
                const h = tall ? height : height * 0.6
                return <rect key={k} x={left + k * RING_TICK * pxPerSec} y={(height - h) / 2} width={Math.max(3, pxPerSec * 0.09)} height={h} rx={1} fill={sounding ? bellLive : bellColour} />
              })}
            </g>
          )
        }
        if (s.kind === 'stroke') {
          const sw = Math.max(4, pxPerSec * 0.16)
          return <rect key={i} x={left} y={-height * 0.25} width={sw} height={height * 1.5} rx={sw / 2} fill={sounding ? bellLive : bellColour} />
        }
        return <rect key={i} x={left} y={0} width={Math.max(0, w)} height={height} rx={Math.min(height / 2, 7)} fill={sounding ? liveColour : colour} />
      })}
      {playhead !== undefined && (
        <line x1={playhead * pxPerSec} x2={playhead * pxPerSec} y1={-height * 0.35} y2={height * 1.35} stroke={playheadColour} strokeWidth={Math.max(2, pxPerSec * 0.06)} strokeLinecap="round" />
      )}
    </g>
  )
}

/**
 * A light seconds ruler for timelines. `labelClass` can size the labels
 * responsively with CSS (CSS font sizes in SVG are in viewBox units).
 */
export function TimeAxis({ x = 0, y = 0, pxPerSec, seconds, size = 11, colour = '#6B7280', every = 1, labelEvery = 5, labelClass }: {
  x?: number; y?: number; pxPerSec: number; seconds: number; size?: number; colour?: string; every?: number; labelEvery?: number; labelClass?: string
}) {
  const ticks = Array.from({ length: Math.floor(seconds / every) + 1 }, (_, i) => i * every)
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1={0} x2={seconds * pxPerSec} y1={0} y2={0} stroke={colour} strokeOpacity={0.4} strokeWidth={1} />
      {ticks.map((s) => (
        <g key={s}>
          <line x1={s * pxPerSec} x2={s * pxPerSec} y1={0} y2={s % labelEvery === 0 ? 6 : 3} stroke={colour} strokeOpacity={0.7} strokeWidth={1} />
          {s % labelEvery === 0 && (
            <text x={s * pxPerSec} y={9} fontSize={size} dominantBaseline="hanging" className={labelClass} fill={colour} textAnchor={s === 0 ? 'start' : 'middle'}>
              {s} s
            </text>
          )}
        </g>
      ))}
    </g>
  )
}

const PX = 40
const PAD_X = 8
/** Axis labels: large on phones (where the timeline is drawn small), normal from the sm breakpoint. */
const AXIS_LABEL = 'text-[26px] sm:text-[13px]'
const AXIS_H = 40

/**
 * A signal's timeline as a responsive figure for notes, questions and
 * widgets. All timelines share one scale, so lengths can be compared.
 */
export function SignalTimeline({ id, elapsed, playhead, axis = false, compact = false, className = '' }: {
  id: SignalId
  /** Seconds into the signal: draws only what has sounded so far. */
  elapsed?: number
  /** Seconds into the signal: draws all of it, with a cursor here. */
  playhead?: number
  axis?: boolean
  compact?: boolean
  className?: string
}) {
  const sig = signalById(id)
  const barH = compact ? 34 : 30
  const top = sig.pattern.includes('stroke') || !compact || playhead !== undefined ? 10 : 6
  const height = top * 2 + barH + (axis ? AXIS_H : 0)
  const width = TIMELINE_SECONDS * PX + PAD_X * 2
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`block h-auto w-full ${className}`}
      role="img"
      aria-label={`Timeline: ${sig.words}`}
    >
      <TimelineBars signal={sig} x={PAD_X} y={top} pxPerSec={PX} height={barH} elapsed={elapsed} playhead={playhead} track={elapsed === undefined ? undefined : '#cbd5e1'} />
      {axis && <TimeAxis x={PAD_X} y={top * 2 + barH} pxPerSec={PX} seconds={TIMELINE_SECONDS - 1} size={13} labelClass={AXIS_LABEL} />}
    </svg>
  )
}

/** An empty timeline track, before a signal has been played. */
export function EmptyTimeline({ axis = false, note }: { axis?: boolean; note?: string }) {
  const barH = 44
  const height = 20 + barH + (axis ? AXIS_H : 0)
  const width = TIMELINE_SECONDS * PX + PAD_X * 2
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" role="img" aria-label={note ?? 'Empty timeline'}>
      <rect x={PAD_X} y={10} width={(TIMELINE_SECONDS - 1) * PX} height={barH} rx={8} fill="#f1f5f9" stroke="#cbd5e1" strokeDasharray="4 5" />
      {note && <text x={PAD_X + ((TIMELINE_SECONDS - 1) * PX) / 2} y={10 + barH / 2} fontSize={18} dominantBaseline="central" className="text-[32px] sm:text-[18px]" textAnchor="middle" fill="#6B7280">{note}</text>}
      {axis && <TimeAxis x={PAD_X} y={20 + barH} pxPerSec={PX} seconds={TIMELINE_SECONDS - 1} size={13} labelClass={AXIS_LABEL} />}
    </svg>
  )
}
