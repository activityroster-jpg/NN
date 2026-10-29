// Synthesised sound signals with the Web Audio API: a horn for whistle
// blasts and a small bell for anchor and aground signals. Nothing here runs
// until a learner presses a button (browsers only allow audio after a tap
// or click anyway), and every function copes with browsers that have no
// Web Audio at all.

import type { Segment } from './signals'

type AudioContextClass = typeof AudioContext

function audioClass(): AudioContextClass | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { AudioContext?: AudioContextClass; webkitAudioContext?: AudioContextClass }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

/** Whether this browser can synthesise sound. */
export function audioSupported(): boolean {
  return audioClass() !== null
}

/** A new audio context with a gentle limiter on its output, or null. */
export function createAudio(): { ctx: AudioContext; out: AudioNode } | null {
  const AC = audioClass()
  if (!AC) return null
  try {
    const ctx = new AC()
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -12
    limiter.ratio.value = 8
    limiter.connect(ctx.destination)
    return { ctx, out: limiter }
  } catch {
    return null
  }
}

/** A horn blast: a low, slightly detuned reed-like chord through a low-pass filter. */
function horn(ctx: AudioContext, out: AudioNode, start: number, dur: number) {
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, start)
  env.gain.linearRampToValueAtTime(0.32, start + 0.06)
  env.gain.setValueAtTime(0.32, Math.max(start + 0.06, start + dur - 0.1))
  env.gain.linearRampToValueAtTime(0, start + dur)
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1100
  filter.Q.value = 0.9
  filter.connect(env)
  env.connect(out)
  const voices: [number, OscillatorType, number][] = [
    [185, 'sawtooth', 0.5],
    [186.6, 'sawtooth', 0.35],
    [277.5, 'square', 0.12],
  ]
  for (const [freq, type, level] of voices) {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.value = level
    osc.connect(g)
    g.connect(filter)
    osc.start(start)
    osc.stop(start + dur + 0.05)
  }
}

/** One strike of a small brass bell: a few inharmonic partials dying away. */
function bellStroke(ctx: AudioContext, out: AudioNode, start: number, level: number, length = 1.2) {
  const partials: [number, number, number][] = [
    [1, 0.5, 1],
    [2.32, 0.25, 0.55],
    [4.25, 0.14, 0.3],
    [6.63, 0.08, 0.18],
  ]
  const base = 1046
  for (const [ratio, amp, decay] of partials) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = base * ratio
    const g = ctx.createGain()
    const end = start + length * decay
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(amp * level * 0.5, start + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, end)
    osc.connect(g)
    g.connect(out)
    osc.start(start)
    osc.stop(end + 0.05)
  }
}

/** The bell rung rapidly: strokes about every 0.15 s, the clapper striking alternate sides. */
function ring(ctx: AudioContext, out: AudioNode, start: number, dur: number) {
  const step = 0.15
  for (let k = 0; k * step < dur; k++) bellStroke(ctx, out, start + k * step, k % 2 === 0 ? 1 : 0.75, 0.6)
}

/**
 * Schedule a signal's segments from `t0` (audio-context time). `stretch`
 * scales every time (0.5 plays it twice as fast).
 */
export function scheduleSignal(ctx: AudioContext, out: AudioNode, segs: Segment[], t0: number, stretch: number) {
  for (const s of segs) {
    const start = t0 + s.start * stretch
    if (s.kind === 'S' || s.kind === 'P') horn(ctx, out, start, s.dur * stretch)
    else if (s.kind === 'ring') ring(ctx, out, start, s.dur * stretch)
    else bellStroke(ctx, out, start, 1.15)
  }
}
