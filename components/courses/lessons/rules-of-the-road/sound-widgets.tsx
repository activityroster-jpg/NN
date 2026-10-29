'use client'

// The sound-signal player and trainer for Lesson 10 (ported from the Boaty
// Jobs lesson on sound signals): a Web Audio horn and bell with a timeline
// of the blasts. Nothing makes a sound until a button is pressed, and
// without Web Audio everything still works from the timelines.

import { Play, Square } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { mulberry32, pick } from '@/lib/courses/random'
import { audioSupported, createAudio, scheduleSignal } from './audio'
import {
  CONTEXT_TEXT, GROUPS, HEARD_PROMPT, SIGNALS, capitalise, explainSignal, isMessage, meaningText, notation, optionSignals, segments,
  signalById, totalSeconds, type SignalId, type SoundSignal,
} from './signals'
import { EmptyTimeline, SignalTimeline } from './timeline'

const btn = 'rounded-lg border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/50 disabled:cursor-not-allowed disabled:opacity-40'
const btnPlain = `${btn} border-border bg-white text-text-primary hover:bg-teal-light`
const btnTeal = `${btn} border-teal bg-teal text-white hover:bg-teal/90`

const noopSubscribe = () => () => {}

/** How a signal’s meaning reads as an answer option. */
const optionText = (s: SoundSignal) => (isMessage(s) ? `“${s.label}”` : s.label)

/* ------------------------------------------------------------------ */
/* Playback: Web Audio when available, a timer otherwise                */
/* ------------------------------------------------------------------ */

interface Playback {
  id: SignalId
  /** Seconds into the signal at real-signal timing (so timelines keep their scale in faster mode). */
  elapsed: number
  playing: boolean
}

function useSignalPlayer() {
  const supported = useSyncExternalStore(noopSubscribe, audioSupported, () => true)
  const audio = useRef<{ ctx: AudioContext; out: AudioNode } | null>(null)
  const bus = useRef<GainNode | null>(null)
  const raf = useRef(0)
  const [state, setState] = useState<Playback | null>(null)
  const [failed, setFailed] = useState(false)

  const silence = useCallback(() => {
    cancelAnimationFrame(raf.current)
    const b = bus.current
    const a = audio.current
    bus.current = null
    if (b && a) {
      const now = a.ctx.currentTime
      b.gain.cancelScheduledValues(now)
      b.gain.setValueAtTime(b.gain.value, now)
      b.gain.linearRampToValueAtTime(0, now + 0.05)
      window.setTimeout(() => b.disconnect(), 150)
    }
  }, [])

  const stop = useCallback(() => {
    silence()
    setState((s) => (s ? { ...s, playing: false } : s))
  }, [silence])

  const reset = useCallback(() => {
    silence()
    setState(null)
  }, [silence])

  const play = useCallback((id: SignalId, opts: { sound: boolean; fast: boolean }) => {
    silence()
    const sig = signalById(id)
    const speed = opts.fast ? 2 : 1
    const total = totalSeconds(sig)
    const started = performance.now()
    const wall = () => ((performance.now() - started) / 1000) * speed
    let clock = wall
    let audioCtx: AudioContext | null = null
    if (opts.sound && supported) {
      if (!audio.current) audio.current = createAudio()
      const a = audio.current
      if (!a) {
        setFailed(true)
      } else {
        try {
          if (a.ctx.state === 'suspended') a.ctx.resume().catch(() => setFailed(true))
          const g = a.ctx.createGain()
          g.connect(a.out)
          bus.current = g
          const t0 = a.ctx.currentTime + 0.08
          scheduleSignal(a.ctx, g, segments(sig), t0, 1 / speed)
          audioCtx = a.ctx
          // Follow the audio clock while it runs; if the browser never starts it, the wall clock keeps the timeline going.
          clock = () => (a.ctx.state === 'running' ? (a.ctx.currentTime - t0) * speed : wall())
        } catch {
          setFailed(true)
        }
      }
    }
    let warned = false
    const tick = () => {
      if (audioCtx && !warned && audioCtx.state !== 'running' && performance.now() - started > 1000) {
        warned = true
        setFailed(true)
      }
      const e = Math.max(0, clock())
      if (e >= total) {
        setState({ id, elapsed: total, playing: false })
        return
      }
      setState({ id, elapsed: e, playing: true })
      raf.current = requestAnimationFrame(tick)
    }
    tick()
  }, [silence, supported])

  useEffect(() => {
    const frame = raf
    const sound = audio
    return () => {
      cancelAnimationFrame(frame.current)
      void sound.current?.ctx.close().catch(() => {})
    }
  }, [])

  return { supported, failed, state, play, stop, reset }
}

type Player = ReturnType<typeof useSignalPlayer>

function Settings({ player, sound, setSound, fast, setFast }: {
  player: Player; sound: boolean; setSound: (v: boolean) => void; fast: boolean; setFast: (v: boolean) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-text-primary">
        <label className="inline-flex min-h-9 cursor-pointer items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-teal" checked={sound && player.supported} disabled={!player.supported} onChange={(e) => { player.stop(); setSound(e.target.checked) }} />
          Sound
        </label>
        <label className="inline-flex min-h-9 cursor-pointer items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-teal" checked={fast} onChange={(e) => { player.stop(); setFast(e.target.checked) }} />
          <span>Faster <span className="text-text-secondary">(half-length blasts — real signals are slower)</span></span>
        </label>
      </div>
      {!player.supported ? (
        <p className="text-xs text-text-secondary">This browser can’t play sound here, so follow the timeline: each blast is drawn as it would sound.</p>
      ) : player.failed ? (
        <p className="text-xs text-warning-text">Sound couldn’t start on this device — follow the timeline instead.</p>
      ) : sound ? (
        <p className="text-xs text-text-secondary">Check your volume first. On an iPhone the silent switch also mutes it.</p>
      ) : null}
    </div>
  )
}

function PlayButton({ playing, onPlay, onStop, label, again }: { playing: boolean; onPlay: () => void; onStop: () => void; label: string; again?: boolean }) {
  return playing ? (
    <button type="button" className={btnPlain} onClick={onStop} aria-label={`Stop: ${label}`}><Square size={14} fill="currentColor" strokeWidth={0} className="mr-1.5 inline-block align-[-2px]" aria-hidden="true" />Stop</button>
  ) : (
    <button type="button" className={btnTeal} onClick={onPlay} aria-label={`Play: ${label}`}><Play size={14} fill="currentColor" strokeWidth={0} className="mr-1.5 inline-block align-[-2px]" aria-hidden="true" />{again ? 'Play again' : 'Play'}</button>
  )
}

/* ------------------------------------------------------------------ */
/* 1. Sound-signal player and trainer                                   */
/* ------------------------------------------------------------------ */

interface Quiz {
  id: SignalId
  options: SignalId[]
  answer: number
  chosen: number | null
  played: boolean
}

export function SignalTrainer() {
  const player = useSignalPlayer()
  const [mode, setMode] = useState<'listen' | 'test'>('listen')
  const [selected, setSelected] = useState<SignalId>('stbd')
  const [sound, setSound] = useState(true)
  const [fast, setFast] = useState(false)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [score, setScore] = useState({ right: 0, asked: 0 })

  function switchMode(m: 'listen' | 'test') {
    player.reset()
    setMode(m)
  }

  function nextQuiz() {
    // Event handler: a fresh random signal each time.
    const rng = mulberry32(Math.floor(Math.random() * 2 ** 31))
    let sig = pick(rng, SIGNALS)
    if (quiz && sig.id === quiz.id) sig = pick(rng, SIGNALS.filter((s) => s.id !== quiz.id))
    const { options, answer } = optionSignals(rng, sig)
    player.reset()
    setQuiz({ id: sig.id, options: options.map((o) => o.id), answer, chosen: null, played: false })
  }

  function choose(i: number) {
    if (!quiz || quiz.chosen !== null) return
    setQuiz({ ...quiz, chosen: i })
    setScore((s) => ({ right: s.right + (i === quiz.answer ? 1 : 0), asked: s.asked + 1 }))
  }

  const settings = <Settings player={player} sound={sound} setSound={setSound} fast={fast} setFast={setFast} />

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-border bg-bg p-0.5" role="group" aria-label="Mode">
          {(['listen', 'test'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => switchMode(m)}
              className={`min-h-9 rounded-md px-3 py-1.5 text-sm font-semibold ${mode === m ? 'bg-teal text-white' : 'text-text-primary hover:bg-teal-light'}`}
            >
              {m === 'listen' ? 'Listen and learn' : 'Test yourself'}
            </button>
          ))}
        </div>
        {mode === 'test' && score.asked > 0 && <p className="text-sm font-semibold text-text-primary" aria-live="polite">Score: {score.right} of {score.asked}</p>}
      </div>
      {settings}
      {mode === 'listen' ? (
        <ListenPanel player={player} selected={selected} onSelect={(id) => { player.reset(); setSelected(id) }} sound={sound} fast={fast} />
      ) : (
        <TestPanel player={player} quiz={quiz} onNext={nextQuiz} onChoose={choose} onPlayed={() => quiz && setQuiz({ ...quiz, played: true })} sound={sound} fast={fast} />
      )}
    </div>
  )
}

function ListenPanel({ player, selected, onSelect, sound, fast }: {
  player: Player; selected: SignalId; onSelect: (id: SignalId) => void; sound: boolean; fast: boolean
}) {
  const sig = signalById(selected)
  const st = player.state?.id === selected ? player.state : null
  const playing = !!st?.playing
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-bg p-3 sm:p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-teal">{CONTEXT_TEXT[sig.context]}</p>
        <p className="mt-0.5 text-lg font-semibold leading-snug text-text-primary">{optionText(sig)}</p>
        <p className="text-sm text-text-secondary">
          {capitalise(sig.words)}
          {sig.interval ? ` · repeated at intervals of not more than ${sig.interval}` : ''}
        </p>
        <div className="mt-3 rounded-lg bg-white px-2 py-2">
          <SignalTimeline id={sig.id} axis playhead={st ? st.elapsed : undefined} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <PlayButton playing={playing} onPlay={() => player.play(sig.id, { sound, fast })} onStop={player.stop} label={`${sig.words} — ${sig.label}`} />
          <span className="font-mono text-xs tabular-nums text-text-secondary" aria-hidden="true">
            {st ? `${st.elapsed.toFixed(1)} s` : '0.0 s'} of {totalSeconds(sig)} s{fast ? ' (playing at double speed)' : ''}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-text-primary">{sig.detail}</p>
      </div>

      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-text-secondary">{g.title}</p>
          <div className="flex flex-wrap gap-1.5">
            {g.ids.map((id) => {
              const s = signalById(id)
              const on = id === selected
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onSelect(id)}
                  className={`flex min-h-10 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm ${on ? 'border-teal bg-teal-light font-semibold' : 'border-border bg-white hover:border-teal/60 hover:bg-teal-light/50'}`}
                >
                  <span className={`whitespace-nowrap font-extrabold tracking-wider text-teal ${s.pattern.some((e) => e === 'ring') ? 'text-xs' : 'text-base leading-none'}`} aria-hidden="true">{notation(s)}</span>
                  <span>{s.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function TestPanel({ player, quiz, onNext, onChoose, onPlayed, sound, fast }: {
  player: Player; quiz: Quiz | null; onNext: () => void; onChoose: (i: number) => void; onPlayed: () => void; sound: boolean; fast: boolean
}) {
  if (!quiz) {
    return (
      <div className="rounded-xl border border-border bg-bg p-4">
        <p className="text-sm leading-relaxed text-text-primary">
          You’ll hear a signal — and watch it build up on the timeline as it sounds. Then say what it means. Signals come from
          every group, so read the situation first: the same sound can mean different things in sight and in fog.
        </p>
        <button type="button" className={`${btnTeal} mt-3`} onClick={onNext}>Start the test</button>
      </div>
    )
  }
  const sig = signalById(quiz.id)
  const st = player.state?.id === quiz.id ? player.state : null
  const answered = quiz.chosen !== null
  const right = quiz.chosen === quiz.answer
  return (
    <div className="rounded-xl border border-border bg-bg p-3 sm:p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-teal">{CONTEXT_TEXT[sig.context]}</p>
      <p className="mt-0.5 font-semibold text-text-primary">{HEARD_PROMPT[sig.context]}</p>
      <div className="mt-3 rounded-lg bg-white px-2 py-2">
        {answered ? (
          <SignalTimeline id={sig.id} axis playhead={st?.playing ? st.elapsed : undefined} />
        ) : st ? (
          <SignalTimeline id={sig.id} axis elapsed={st.elapsed} />
        ) : (
          <EmptyTimeline axis note="Press Play to hear the signal" />
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <PlayButton
          playing={!!st?.playing}
          again={quiz.played}
          onPlay={() => { player.play(sig.id, { sound, fast }); onPlayed() }}
          onStop={player.stop}
          label="the mystery signal"
        />
        {!quiz.played && <span className="text-xs text-text-secondary">Play it first, then choose.</span>}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="What does it mean?">
        {quiz.options.map((oid, i) => {
          const o = signalById(oid)
          const chosen = quiz.chosen === i
          const showRight = answered && i === quiz.answer
          const showWrong = answered && chosen && !right
          return (
            <button
              key={oid}
              type="button"
              role="radio"
              aria-checked={chosen}
              disabled={!quiz.played || answered}
              onClick={() => onChoose(i)}
              className={[
                'rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed',
                showRight ? 'border-success bg-success/10 font-semibold' : showWrong ? 'border-danger bg-danger/10' : 'border-border bg-white hover:border-teal/60 hover:bg-teal-light/50',
                !quiz.played ? 'opacity-50' : '',
              ].join(' ')}
            >
              {optionText(o)}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`mt-3 rounded-lg border p-3 ${right ? 'border-success/50 bg-success/10' : 'border-danger/40 bg-danger/5'}`} role="status">
          <p className="font-semibold text-text-primary">{right ? '✓ Right.' : `✗ Not this time: it was ${meaningText(sig)}.`}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{explainSignal(sig)}</p>
        </div>
      )}
      {answered && <button type="button" className={`${btnTeal} mt-3`} onClick={onNext}>Next signal →</button>}
    </div>
  )
}

