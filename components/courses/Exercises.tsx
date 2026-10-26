'use client'

// Auto-checked exercises. Each question gives instant feedback, a second
// try, then the worked answer. A set records the learner's best score in
// the browser and marks the lesson complete at 70% or better.

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { checkBearing, checkClock, checkNumeric, checkPlot, checkPosition, formatClock, type PositionInput } from '@/lib/courses/answers'
import { formatPosition, rhumbDistance, type LatLon } from '@/lib/courses/geo'
import type { ViewRect } from '@/lib/courses/navigation/chart-geometry'
import { recordResult } from '@/lib/courses/progress'
import { mulberry32, shuffle } from '@/lib/courses/random'
import { Check, CircleCheck, CircleX, RotateCcw, Shuffle } from 'lucide-react'
import { buttonClasses } from '@/components/ui/Button'
import PracticeChart, { ChartPoint } from './PracticeChart'

// Disabled buttons keep AA contrast (the shared disabled grey is 3.9:1).
const DISABLED_FIX = 'disabled:bg-navy-50! disabled:text-navy-500! disabled:border-border!'

interface Base {
  id: string
  prompt: ReactNode
  /** Worked answer shown after a correct answer or on "Show answer". */
  explain: ReactNode
  /** Diagram or chart shown with the question. */
  figure?: ReactNode
}

export type Question =
  | (Base & { kind: 'choice'; options: ReactNode[]; answer: number; /** Keep the written order (e.g. options in a sequence). */ fixedOrder?: boolean })
  | (Base & { kind: 'numeric'; answer: number; tolerance: number; unit?: string })
  | (Base & { kind: 'bearing'; answer: number; tolerance: number; suffix?: 'T' | 'M' | 'C' })
  | (Base & { kind: 'position'; answer: LatLon; tolerance: number })
  | (Base & { kind: 'plot'; answer: LatLon; tolerance: number; view?: ViewRect })
  /** A 24-hour clock time: `answer` and `tolerance` in minutes (answer = minutes after midnight). */
  | (Base & { kind: 'time'; answer: number; tolerance: number; zone?: 'UT' | 'BST' })

export type Outcome = 'correct' | 'revealed' | 'pending'

const PASS_MARK = 0.7

function answerText(q: Question): ReactNode {
  switch (q.kind) {
    case 'choice': return q.options[q.answer]
    case 'numeric': return `${Number(q.answer.toFixed(2))}${q.unit ? ` ${q.unit}` : ''}`
    case 'bearing': return `${String(Math.round(q.answer) % 360).padStart(3, '0')}°${q.suffix ?? ''}`
    case 'time': return `${formatClock(q.answer)}${q.zone ? ` ${q.zone}` : ''}`
    case 'position':
    case 'plot': return formatPosition(q.answer)
  }
}

/**
 * Display order for a choice question's options: a shuffle seeded by the
 * question id, so the right answer isn't always where the author wrote it
 * but the order is the same on the server, in the browser and on revisits.
 */
export function optionOrder(id: string, count: number, fixed?: boolean): number[] {
  const order = Array.from({ length: count }, (_, i) => i)
  if (fixed) return order
  let h = 2166136261
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  return shuffle(mulberry32(h >>> 0), order)
}

const EMPTY_POSITION: PositionInput = { latDeg: '', latMin: '', latHemi: 'N', lonDeg: '', lonMin: '', lonHemi: 'W' }

export function QuestionCard({ question: q, number, onOutcome }: { question: Question; number?: number; onOutcome?: (id: string, o: Outcome, firstTry: boolean) => void }) {
  const [text, setText] = useState('')
  const [choice, setChoice] = useState<number | null>(null)
  const [pos, setPos] = useState<PositionInput>(EMPTY_POSITION)
  const [plotted, setPlotted] = useState<LatLon | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [status, setStatus] = useState<'idle' | 'wrong' | 'correct' | 'revealed'>('idle')

  const finished = status === 'correct' || status === 'revealed'
  const canCheck =
    !finished &&
    (q.kind === 'choice' ? choice !== null : q.kind === 'position' ? pos.latDeg !== '' && pos.lonDeg !== '' : q.kind === 'plot' ? plotted !== null : text.trim() !== '')

  function check() {
    let ok = false
    switch (q.kind) {
      case 'choice': ok = choice === q.answer; break
      case 'numeric': ok = checkNumeric(text, q.answer, q.tolerance); break
      case 'bearing': ok = checkBearing(text, q.answer, q.tolerance); break
      case 'time': ok = checkClock(text, q.answer, q.tolerance); break
      case 'position': ok = checkPosition(pos, q.answer, q.tolerance); break
      case 'plot': ok = plotted !== null && checkPlot(plotted, q.answer, q.tolerance); break
    }
    setAttempts((a) => a + 1)
    if (ok) {
      setStatus('correct')
      onOutcome?.(q.id, 'correct', attempts === 0)
    } else {
      setStatus('wrong')
    }
  }

  function reveal() {
    setStatus('revealed')
    onOutcome?.(q.id, 'revealed', false)
  }

  const inputClass =
    'h-11 rounded-control border border-border bg-white px-3 text-base tabular-nums text-text-primary placeholder:text-text-secondary focus-visible:border-teal focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-teal-300 disabled:bg-bg disabled:text-text-primary sm:text-sm'

  return (
    <div
      className={[
        'rounded-card border bg-card p-4 transition-colors sm:p-5',
        status === 'correct' ? 'border-success' : status === 'revealed' ? 'border-warning' : 'border-border',
      ].join(' ')}
    >
      <div className="flex gap-3">
        {number !== undefined && (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-50 text-sm font-bold tabular-nums text-navy-700">{number}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-base leading-relaxed text-text-primary">{q.prompt}</div>
          {q.figure && <div className="mt-3">{q.figure}</div>}

          <form
            className="mt-3"
            onSubmit={(ev) => {
              ev.preventDefault()
              if (canCheck) check()
            }}
          >
            {q.kind === 'choice' && (
              <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
                {optionOrder(q.id, q.options.length, q.fixedOrder).map((i) => {
                  const opt = q.options[i]
                  const chosen = choice === i
                  const showRight = finished && i === q.answer
                  const showWrong = status === 'wrong' && chosen
                  return (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={chosen}
                      disabled={finished}
                      onClick={() => { setChoice(i); if (status === 'wrong') setStatus('idle') }}
                      className={[
                        'flex min-h-11 items-center gap-2 rounded-control border px-3 py-2 text-left text-[15px] text-text-primary transition-colors',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 disabled:cursor-default',
                        showRight ? 'border-success bg-success-bg font-semibold' : showWrong ? 'border-error bg-error-bg' : chosen ? 'border-teal bg-teal-light' : finished ? 'border-border' : 'border-border hover:border-teal-300 hover:bg-teal-50',
                      ].join(' ')}
                    >
                      <span className="min-w-0 flex-1">{opt}</span>
                      {showRight && <CircleCheck size={18} strokeWidth={1.75} className="shrink-0 text-success-text" aria-label="Correct answer" />}
                      {showWrong && <CircleX size={18} strokeWidth={1.75} className="shrink-0 text-error-text" aria-label="Your answer" />}
                    </button>
                  )
                })}
              </div>
            )}

            {(q.kind === 'numeric' || q.kind === 'bearing' || q.kind === 'time') && (
              <div className="flex items-center gap-2">
                <input
                  value={text}
                  onChange={(ev) => { setText(ev.target.value); if (status === 'wrong') setStatus('idle') }}
                  inputMode={q.kind === 'time' ? 'numeric' : 'decimal'}
                  disabled={finished}
                  aria-label="Your answer"
                  placeholder={q.kind === 'bearing' ? 'e.g. 045' : q.kind === 'time' ? 'e.g. 1430' : 'Your answer'}
                  className={`${inputClass} w-36`}
                />
                <span className="text-sm tabular-nums text-text-secondary">{q.kind === 'bearing' ? `°${q.suffix ?? ''}` : q.kind === 'time' ? q.zone : q.unit}</span>
              </div>
            )}

            {q.kind === 'position' && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <fieldset className="flex items-center gap-1">
                  <legend className="sr-only">Latitude</legend>
                  <input value={pos.latDeg} onChange={(ev) => setPos({ ...pos, latDeg: ev.target.value })} inputMode="numeric" aria-label="Latitude degrees" placeholder="49" disabled={finished} className={`${inputClass} w-14 px-2`} />
                  <span>°</span>
                  <input value={pos.latMin} onChange={(ev) => setPos({ ...pos, latMin: ev.target.value })} inputMode="decimal" aria-label="Latitude minutes" placeholder="45.0" disabled={finished} className={`${inputClass} w-20 px-2`} />
                  <span>&apos;</span>
                  <select value={pos.latHemi} onChange={(ev) => setPos({ ...pos, latHemi: ev.target.value as 'N' | 'S' })} aria-label="North or south" disabled={finished} className={`${inputClass} px-1`}>
                    <option>N</option><option>S</option>
                  </select>
                </fieldset>
                <fieldset className="flex items-center gap-1">
                  <legend className="sr-only">Longitude</legend>
                  <input value={pos.lonDeg} onChange={(ev) => setPos({ ...pos, lonDeg: ev.target.value })} inputMode="numeric" aria-label="Longitude degrees" placeholder="004" disabled={finished} className={`${inputClass} w-16 px-2`} />
                  <span>°</span>
                  <input value={pos.lonMin} onChange={(ev) => setPos({ ...pos, lonMin: ev.target.value })} inputMode="decimal" aria-label="Longitude minutes" placeholder="10.0" disabled={finished} className={`${inputClass} w-20 px-2`} />
                  <span>&apos;</span>
                  <select value={pos.lonHemi} onChange={(ev) => setPos({ ...pos, lonHemi: ev.target.value as 'E' | 'W' })} aria-label="East or west" disabled={finished} className={`${inputClass} px-1`}>
                    <option>W</option><option>E</option>
                  </select>
                </fieldset>
              </div>
            )}

            {q.kind === 'plot' && (
              <PracticeChart
                mode={finished ? 'view' : 'pick'}
                zoomable
                view={q.view}
                marker={plotted}
                onPick={(p) => { setPlotted(p); if (status === 'wrong') setStatus('idle') }}
                title="Practice chart: tap to plot your answer"
              >
                {finished && <ChartPoint at={q.answer} colour="#15803d" label="Answer" />}
              </PracticeChart>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              {!finished && (
                <button type="submit" disabled={!canCheck} className={buttonClasses('primary', 'md', DISABLED_FIX)}>
                  Check answer
                </button>
              )}
              {status === 'wrong' && attempts >= 1 && (
                <button type="button" onClick={reveal} className={buttonClasses('secondary', 'md')}>
                  Show answer
                </button>
              )}
              {status === 'wrong' && (
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-error-text" role="status">
                  <CircleX size={16} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
                  <span>Not quite{q.kind === 'plot' && plotted ? ` — your plot is ${rhumbDistance(plotted, q.answer).toFixed(1)} M away` : ''}. Have another go.</span>
                </p>
              )}
              {status === 'correct' && (
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-success-text" role="status">
                  <CircleCheck size={16} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
                  Correct{attempts > 1 ? ' (second try)' : ''}
                </p>
              )}
              {status === 'revealed' && <p className="text-sm font-semibold tabular-nums text-warning-text" role="status">Answer: {answerText(q)}</p>}
            </div>
          </form>

          {finished && (
            <div className="mt-4 rounded-control border border-border bg-bg px-4 py-3 text-[15px] leading-relaxed text-text-primary">
              {status === 'correct' && q.kind !== 'choice' && <p className="mb-1 font-semibold tabular-nums">Answer: {answerText(q)}</p>}
              {q.explain}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export interface PracticeGenerator {
  title: string
  description?: string
  /** Build a fresh set of questions from a random seed. */
  generate: (rng: () => number) => Question[]
}

export function ExerciseSet({ courseSlug, lessonSlug, questions, practice }: {
  courseSlug: string
  lessonSlug: string
  questions: Question[]
  practice?: PracticeGenerator
}) {
  const [outcomes, setOutcomes] = useState<Record<string, { o: Outcome; first: boolean }>>({})
  const [round, setRound] = useState(0)

  const answered = questions.filter((q) => outcomes[q.id] !== undefined && outcomes[q.id]!.o !== 'pending').length
  const correct = questions.filter((q) => outcomes[q.id]?.o === 'correct').length
  const score = questions.length ? correct / questions.length : 0
  const allDone = answered === questions.length
  const passed = allDone && score >= PASS_MARK

  useEffect(() => {
    if (answered === 0) return
    recordResult(courseSlug, lessonSlug, allDone ? score : 0, passed)
  }, [answered, allDone, score, passed, courseSlug, lessonSlug])

  return (
    <div className="space-y-4">
      <div key={round} className="space-y-4">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            number={i + 1}
            question={q}
            onOutcome={(id, o, first) => setOutcomes((prev) => (prev[id] ? prev : { ...prev, [id]: { o, first } }))}
          />
        ))}
      </div>

      <div
        className={[
          'rounded-card border p-4 sm:p-5',
          passed ? 'border-success bg-success-bg' : allDone ? 'border-warning bg-warning-bg' : 'border-border bg-card',
        ].join(' ')}
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-semibold tabular-nums text-text-primary">
            {allDone ? `You scored ${correct} out of ${questions.length}.` : `${answered} of ${questions.length} answered · ${correct} correct`}
          </p>
          {passed && (
            <span className="inline-flex h-[26px] items-center gap-1.5 rounded-[6px] border border-success bg-white px-2.5 text-xs font-bold uppercase tracking-[0.06em] text-success-text">
              <Check size={13} strokeWidth={2} aria-hidden="true" />
              Lesson complete
            </span>
          )}
          {allDone && !passed && <span className="text-sm text-text-primary">Score 70% or more to complete the lesson.</span>}
          {answered > 0 && (
            <button
              type="button"
              onClick={() => { setOutcomes({}); setRound((r) => r + 1) }}
              className={buttonClasses('secondary', 'md', 'ml-auto')}
            >
              <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" />
              Reset exercises
            </button>
          )}
        </div>
      </div>

      {practice && <PracticeMore practice={practice} />}
    </div>
  )
}

function PracticeMore({ practice }: { practice: PracticeGenerator }) {
  const [seed, setSeed] = useState<number | null>(null)
  const questions = useMemo(() => (seed === null ? [] : practice.generate(mulberry32(seed))), [seed, practice])
  const [results, setResults] = useState<Record<string, Outcome>>({})
  const correct = Object.values(results).filter((o) => o === 'correct').length

  return (
    <section className="rounded-card border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-navy-50 text-navy-700" aria-hidden="true">
          <Shuffle size={22} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-h4 text-navy">{practice.title}</h3>
          <p className="text-sm text-text-secondary">{practice.description ?? 'Unlimited fresh questions — keep going until it feels easy.'}</p>
        </div>
        <button
          type="button"
          onClick={() => { setSeed(Math.floor(Math.random() * 2 ** 31)); setResults({}) }}
          className={buttonClasses('secondary', 'md')}
        >
          {seed === null ? 'Start practising' : 'New questions'}
        </button>
      </div>
      {questions.length > 0 && (
        <div className="mt-4 space-y-3" key={seed ?? 0}>
          {questions.map((q, i) => (
            <QuestionCard key={`${seed}-${q.id}`} number={i + 1} question={q} onOutcome={(id, o) => setResults((r) => (r[id] ? r : { ...r, [id]: o }))} />
          ))}
          <p className="text-sm font-medium tabular-nums text-text-secondary">{correct} of {questions.length} correct in this round.</p>
        </div>
      )}
    </section>
  )
}
