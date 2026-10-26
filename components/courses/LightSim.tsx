'use client'

// A light flashing its real rhythm at night, with the rhythm drawn as a
// bar and described in plain English. For Module 3 lessons on lights.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { describeLight, lightOn, parseLight } from '@/lib/courses/navigation/lights'
import { LightGlow, RhythmBar } from './marks'

export default function LightSim({ characteristic, label, showBar = true, autoPlay = true, hideText = false }: {
  characteristic: string
  label?: string
  showBar?: boolean
  autoPlay?: boolean
  /** Hide the characteristic and description (for "identify this light" quizzes). */
  hideText?: boolean
}) {
  const light = useMemo(() => parseLight(characteristic), [characteristic])
  const [seconds, setSeconds] = useState(0)
  const [playing, setPlaying] = useState(autoPlay)
  const last = useRef(0)

  useEffect(() => {
    if (!playing) return
    let raf = 0
    last.current = performance.now()
    const tick = (now: number) => {
      setSeconds((s) => s + (now - last.current) / 1000)
      last.current = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const on = lightOn(light, seconds)
  const inCycle = seconds % light.period
  return (
    <figure className="overflow-hidden rounded-card bg-[#0b1626] text-white">
      <svg viewBox="0 0 600 220" className="block h-auto w-full" role="img" aria-label={hideText ? 'A flashing light: watch and time it' : `Light ${characteristic}: ${describeLight(light)}`}>
        <rect width={600} height={220} fill="#0b1626" />
        {Array.from({ length: 24 }, (_, i) => (
          <circle key={i} cx={(i * 97) % 600} cy={(i * 53) % 110} r={1} fill="#94a3b8" opacity={0.5} />
        ))}
        <rect y={150} width={600} height={70} fill="#0e2237" />
        <LightGlow x={300} y={110} on={on} colour={light.colour} r={14} />
        {showBar && <RhythmBar light={light} x={60} y={176} width={480} height={22} at={inCycle} />}
        {!hideText && <text x={20} y={34} fontSize={22} fontWeight={700} fill="#fff" fontFamily="ui-monospace, monospace">{characteristic}</text>}
        {label && <text x={580} y={34} fontSize={18} fill="#cbd5e1" textAnchor="end">{label}</text>}
      </svg>
      <figcaption className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-white/40 bg-white/10 px-3 font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 sm:min-h-9"
          aria-pressed={playing}
        >
          {playing ? <Pause size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" /> : <Play size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" />}
          {playing ? 'Pause' : 'Play'}
        </button>
        {!hideText && <span className="text-navy-100">{describeLight(light)}</span>}
        {showBar && <span className="ml-auto text-xs tabular-nums text-navy-200">{inCycle.toFixed(1)} s of {light.period} s</span>}
      </figcaption>
    </figure>
  )
}
