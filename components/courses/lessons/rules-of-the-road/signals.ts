// The sound signals of the collision regulations (COLREGs Rules 32–35) as
// data, ported from Boaty Jobs; Lesson 10 uses the charter-level subset.
// Pure TypeScript, safe on the server and in the browser.

import { shuffle, type Rng } from '@/lib/courses/random'

/**
 * One element of a signal: a short blast (about 1 s), a prolonged blast
 * (4–6 s), the bell rung rapidly (about 5 s) or one distinct bell stroke.
 */
export type Element = 'S' | 'P' | 'ring' | 'stroke'

/** Where the signal is heard: in sight (Rule 34), in a channel, at a bend, or in restricted visibility (Rule 35). */
export type Context = 'sight' | 'channel' | 'bend' | 'fog'

export type SignalId =
  | 'stbd' | 'port' | 'astern' | 'doubt'
  | 'overtake-stbd' | 'overtake-port' | 'agree' | 'bend'
  | 'pdv-way' | 'pdv-stopped' | 'restricted' | 'towed' | 'anchor' | 'anchor-warning' | 'aground' | 'pilot'

export interface SoundSignal {
  id: SignalId
  pattern: Element[]
  context: Context
  /** Gap between elements, seconds (default 1). */
  gap?: number
  /** Short name for buttons and chips. */
  name: string
  /** What it means (in sight) or who sounds it (in fog): the answer to “what is it?”. */
  label: string
  /** The pattern in words. */
  words: string
  /** A sentence or two for explanations. */
  detail: string
  /** Asking for this signal from its meaning. */
  ask: string
  /** Fog signals: the longest interval between repeats. */
  interval?: string
  rule: string
}

/* Representative timings. The rules fix a short blast at about 1 s, a prolonged blast at 4–6 s (drawn and played as
 * 5 s), the two prolonged blasts of a stopped vessel about 2 s apart, and the anchor bell at about 5 s. Other gaps are
 * not fixed by the rules: about 1 s is used here. */
export const SHORT = 1
export const PROLONGED = 5
export const GAP = 1
export const RING = 5
export const STROKE = 0.2
export const STROKE_GAP = 0.6
/** Width of every timeline, in seconds, so all signals are drawn to one scale. */
export const TIMELINE_SECONDS = 16

const ALL_SIGNALS: SoundSignal[] = [
  {
    id: 'stbd', pattern: ['S'], context: 'sight', name: 'Altering to starboard',
    label: 'I am altering my course to starboard',
    words: 'one short blast',
    detail: 'Given by a power-driven vessel in sight of another as she alters course to starboard (Rule 34).',
    ask: 'A power-driven vessel you can see is altering course to starboard. Which signal does she sound?',
    rule: 'Rule 34',
  },
  {
    id: 'port', pattern: ['S', 'S'], context: 'sight', name: 'Altering to port',
    label: 'I am altering my course to port',
    words: 'two short blasts',
    detail: 'Given by a power-driven vessel in sight of another as she alters course to port (Rule 34).',
    ask: 'A power-driven vessel you can see is altering course to port. Which signal does she sound?',
    rule: 'Rule 34',
  },
  {
    id: 'astern', pattern: ['S', 'S', 'S'], context: 'sight', name: 'Going astern',
    label: 'I am operating astern propulsion',
    words: 'three short blasts',
    detail: 'Given by a power-driven vessel in sight of another when she puts her engines astern (Rule 34). She may not yet be moving backwards.',
    ask: 'A power-driven vessel you can see puts her engine astern. Which signal does she sound?',
    rule: 'Rule 34',
  },
  {
    id: 'doubt', pattern: ['S', 'S', 'S', 'S', 'S'], context: 'sight', gap: 0.5, name: 'Doubt (wake-up)',
    label: 'I don’t understand your intentions, or doubt you are doing enough to avoid a collision',
    words: 'at least five short and rapid blasts',
    detail: 'Any vessel approaching another in sight must sound it at once if she doesn’t understand what the other is doing, or doubts the other is doing enough to avoid a collision (Rule 34).',
    ask: 'A vessel you can see is approaching, and you doubt she is doing enough to avoid a collision. Which signal must you sound?',
    rule: 'Rule 34',
  },
  {
    id: 'overtake-stbd', pattern: ['P', 'P', 'S'], context: 'channel', name: 'Overtake on starboard side',
    label: 'I intend to overtake you on your starboard side',
    words: 'two prolonged blasts followed by one short blast',
    detail: 'In a narrow channel, where the vessel ahead must move over to let her pass, the overtaking vessel asks first (Rules 9 and 34).',
    ask: 'In a narrow channel you need the vessel ahead to move over so that you can overtake her on her starboard side. Which signal do you sound?',
    rule: 'Rule 34',
  },
  {
    id: 'overtake-port', pattern: ['P', 'P', 'S', 'S'], context: 'channel', name: 'Overtake on port side',
    label: 'I intend to overtake you on your port side',
    words: 'two prolonged blasts followed by two short blasts',
    detail: 'In a narrow channel, where the vessel ahead must move over to let her pass, the overtaking vessel asks first (Rules 9 and 34).',
    ask: 'In a narrow channel you need the vessel ahead to move over so that you can overtake her on her port side. Which signal do you sound?',
    rule: 'Rule 34',
  },
  {
    id: 'agree', pattern: ['P', 'S', 'P', 'S'], context: 'channel', name: 'Agreement',
    label: 'I agree to be overtaken',
    words: 'one prolonged, one short, one prolonged and one short blast, in that order',
    detail: 'The vessel about to be overtaken in a narrow channel answers this way if she agrees, then moves over to let the other pass safely (Rules 9 and 34).',
    ask: 'In a narrow channel, a vessel astern signals that she intends to overtake you. You agree. Which signal do you sound?',
    rule: 'Rule 34',
  },
  {
    id: 'bend', pattern: ['P'], context: 'bend', name: 'Nearing a bend',
    label: 'A vessel nearing a bend, warning any vessel hidden beyond it',
    words: 'one prolonged blast',
    detail: 'A vessel nearing a bend, or any part of a channel where others may be hidden by an obstruction, sounds it; any vessel that hears it from round the bend answers with one prolonged blast (Rule 34).',
    ask: 'You are nearing a bend in a channel, where vessels coming the other way could be hidden. Which signal do you sound?',
    rule: 'Rule 34',
  },
  {
    id: 'pdv-way', pattern: ['P'], context: 'fog', name: 'Power-driven, making way',
    label: 'A power-driven vessel making way through the water',
    words: 'one prolonged blast',
    detail: 'In or near restricted visibility, a power-driven vessel moving through the water sounds it at intervals of not more than 2 minutes (Rule 35). A yacht under engine is power-driven, even with her sails up.',
    ask: 'In fog, you are motoring at 5 knots. Which signal do you sound, at intervals of not more than 2 minutes?',
    interval: '2 min',
    rule: 'Rule 35',
  },
  {
    id: 'pdv-stopped', pattern: ['P', 'P'], context: 'fog', gap: 2, name: 'Power-driven, stopped',
    label: 'A power-driven vessel underway but stopped, making no way',
    words: 'two prolonged blasts, about 2 seconds apart',
    detail: 'In or near restricted visibility, a power-driven vessel that is underway (not anchored, made fast or aground) but stopped in the water sounds it at intervals of not more than 2 minutes (Rule 35).',
    ask: 'In fog, a motor cruiser has stopped and lies in the water making no way; she is not at anchor. Which signal does she sound?',
    interval: '2 min',
    rule: 'Rule 35',
  },
  {
    id: 'restricted', pattern: ['P', 'S', 'S'], context: 'fog', name: 'Sailing, fishing, towing…',
    label: 'A sailing vessel, fishing vessel, vessel towing or pushing, or one NUC, RAM or CBD',
    words: 'one prolonged blast followed by two short blasts',
    detail: 'In or near restricted visibility it is sounded, at intervals of not more than 2 minutes, by sailing vessels, vessels engaged in fishing, vessels towing or pushing, and vessels not under command (NUC), restricted in their ability to manoeuvre (RAM) or constrained by their draught (CBD) (Rule 35).',
    ask: 'Your yacht is under sail alone in fog. Which signal do you sound, at intervals of not more than 2 minutes?',
    interval: '2 min',
    rule: 'Rule 35',
  },
  {
    id: 'towed', pattern: ['P', 'S', 'S', 'S'], context: 'fog', name: 'Being towed',
    label: 'A vessel being towed (the last of the tow, if manned)',
    words: 'one prolonged blast followed by three short blasts',
    detail: 'In or near restricted visibility the last vessel of a tow, if manned, sounds it at intervals of not more than 2 minutes, when practicable straight after the towing vessel’s signal (Rule 35).',
    ask: 'In fog, which signal does the last vessel of a tow sound, if she is manned?',
    interval: '2 min',
    rule: 'Rule 35',
  },
  {
    id: 'anchor', pattern: ['ring'], context: 'fog', name: 'At anchor',
    label: 'A vessel at anchor',
    words: 'the bell rung rapidly for about 5 seconds',
    detail: 'In or near restricted visibility a vessel at anchor rings her bell rapidly for about 5 seconds at intervals of not more than 1 minute (Rule 35). A vessel of 100 metres or more rings it forward, then sounds a gong aft for about 5 seconds.',
    ask: 'Which fog signal does a 40-metre vessel at anchor give, at intervals of not more than 1 minute?',
    interval: '1 min',
    rule: 'Rule 35',
  },
  {
    id: 'anchor-warning', pattern: ['S', 'P', 'S'], context: 'fog', name: 'At anchor: warning',
    label: 'A vessel at anchor, warning an approaching vessel',
    words: 'one short, one prolonged and one short blast',
    detail: 'A vessel at anchor may sound it as well as her anchor signal, to warn an approaching vessel of her position and of the possibility of collision (Rule 35).',
    ask: 'You are at anchor in fog and hear a vessel approaching. Which whistle signal may you sound to warn her of your position?',
    rule: 'Rule 35',
  },
  {
    id: 'aground', pattern: ['stroke', 'stroke', 'stroke', 'ring', 'stroke', 'stroke', 'stroke'], context: 'fog', name: 'Aground',
    label: 'A vessel aground',
    words: 'three separate and distinct strokes on the bell, the bell rung rapidly for about 5 seconds, then three more distinct strokes',
    detail: 'In or near restricted visibility a vessel aground gives the anchor bell signal with three separate and distinct strokes on the bell immediately before and after the rapid ringing, at intervals of not more than 1 minute (Rule 35).',
    ask: 'Which fog signal does a 40-metre vessel aground give?',
    interval: '1 min',
    rule: 'Rule 35',
  },
  {
    id: 'pilot', pattern: ['S', 'S', 'S', 'S'], context: 'fog', name: 'Pilot vessel',
    label: 'A pilot vessel on duty (her identity signal)',
    words: 'four short blasts',
    detail: 'A pilot vessel on pilotage duty may sound this identity signal as well as her normal fog signal (Rule 35).',
    ask: 'In fog, a pilot vessel on duty may add an identity signal to her normal fog signal. What is it?',
    rule: 'Rule 35',
  },
]

/** The signals a charter skipper is likely to hear, or need: the rest of Rules 34 and 35 are left out. */
const CHARTER: SignalId[] = ['stbd', 'port', 'astern', 'doubt', 'bend', 'pdv-way', 'restricted', 'anchor']
export const SIGNALS: SoundSignal[] = ALL_SIGNALS.filter((s) => CHARTER.includes(s.id))

const BY_ID = new Map(SIGNALS.map((s) => [s.id, s]))

export function signalById(id: SignalId): SoundSignal {
  return BY_ID.get(id)!
}

/* ------------------------------------------------------------------ */
/* Timing                                                              */
/* ------------------------------------------------------------------ */

export interface Segment {
  kind: Element
  /** Seconds from the start of the signal. */
  start: number
  dur: number
}

function duration(e: Element): number {
  return e === 'S' ? SHORT : e === 'P' ? PROLONGED : e === 'ring' ? RING : STROKE
}

function gapAfter(sig: SoundSignal, e: Element, next: Element): number {
  if (e === 'stroke' && next === 'stroke') return STROKE_GAP
  return sig.gap ?? GAP
}

/** The signal as timed segments (seconds), at real speed. */
export function segments(sig: SoundSignal): Segment[] {
  const out: Segment[] = []
  let t = 0
  sig.pattern.forEach((e, i) => {
    const dur = duration(e)
    out.push({ kind: e, start: Math.round(t * 100) / 100, dur })
    const next = sig.pattern[i + 1]
    if (next) t += dur + gapAfter(sig, e, next)
  })
  return out
}

/** Length of the whole signal, seconds. */
export function totalSeconds(sig: SoundSignal): number {
  const segs = segments(sig)
  const last = segs[segs.length - 1]!
  return Math.round((last.start + last.dur) * 100) / 100
}

/** The pattern written with dots and dashes: “— • •”. Bells are written out. */
export function notation(sig: SoundSignal): string {
  if (sig.id === 'anchor') return 'bell 5 s'
  if (sig.id === 'aground') return '3 strokes · bell · 3 strokes'
  return sig.pattern.map((e) => (e === 'S' ? '•' : '—')).join(' ')
}

/** A string that identifies the pattern (two signals with the same key sound the same). */
export const patternKey = (sig: SoundSignal) => sig.pattern.join('')

export const CONTEXT_TEXT: Record<Context, string> = {
  sight: 'Vessels in sight · Rule 34',
  channel: 'Narrow channel · Rule 34',
  bend: 'Blind bend · Rule 34',
  fog: 'Restricted visibility · Rule 35',
}

/** The question “what is it?”, for a signal heard in its context. */
export const HEARD_PROMPT: Record<Context, string> = {
  sight: 'A vessel you can see sounds this on her whistle. What does it mean?',
  channel: 'In a narrow channel, a vessel you can see sounds this. What does it mean?',
  bend: 'Nearing a blind bend in a narrow channel, you hear this from beyond the bend. What does it mean?',
  fog: 'In fog, you hear this from a vessel you can’t see. What is she?',
}

/** The groups shown in the signal player. */
export const GROUPS: { title: string; ids: SignalId[] }[] = [
  { title: 'In sight of one another', ids: ['stbd', 'port', 'astern', 'doubt'] },
  { title: 'Blind bends', ids: ['bend'] },
  { title: 'In fog', ids: ['pdv-way', 'restricted', 'anchor'] },
]

/* ------------------------------------------------------------------ */
/* Multiple-choice options                                             */
/* ------------------------------------------------------------------ */

/**
 * Pairs that must not appear together as right answer and distractor,
 * because one could be argued to fit the other’s question: a vessel at
 * anchor may also sound the warning signal, a vessel fishing at anchor
 * sounds — • • instead of the bell, and a vessel aground may add “an
 * appropriate whistle signal”.
 */
const CONFUSABLE: [SignalId, SignalId][] = [
  ['anchor', 'anchor-warning'],
  ['anchor', 'restricted'],
  ['aground', 'anchor-warning'],
]

function confusable(a: SignalId, b: SignalId): boolean {
  return CONFUSABLE.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
}

const family = (s: SoundSignal) => (s.context === 'fog' ? 'fog' : 'sight')

/** Signals that could stand as wrong answers beside `sig`: a different pattern, not confusable. */
export function distractorsFor(sig: SoundSignal): SoundSignal[] {
  return SIGNALS.filter((s) => s.id !== sig.id && patternKey(s) !== patternKey(sig) && !confusable(s.id, sig.id))
}

/**
 * Four signals for a question about `sig` (shuffled; `answer` is the index
 * of `sig`). Distractors come from the same family (in sight or fog)
 * where possible, so the wrong answers are plausible.
 */
export function optionSignals(rng: Rng, sig: SoundSignal, count = 4): { options: SoundSignal[]; answer: number } {
  const pool = distractorsFor(sig)
  const same = shuffle(rng, pool.filter((s) => family(s) === family(sig)))
  const other = shuffle(rng, pool.filter((s) => family(s) !== family(sig)))
  const options = shuffle(rng, [sig, ...[...same, ...other].slice(0, count - 1)])
  return { options, answer: options.indexOf(sig) }
}

/** A sentence describing a signal fully, for explanations. */
export function explainSignal(sig: SoundSignal): string {
  return `${capitalise(sig.words)}: ${meaningText(sig)}. ${sig.detail}`
}

/** The label as it reads mid-sentence: a quoted message for in-sight signals, a description otherwise. */
export function meaningText(sig: SoundSignal): string {
  return isMessage(sig) ? `“${sig.label}”` : sig.label.charAt(0).toLowerCase() + sig.label.slice(1)
}

/** In-sight and channel signals are messages (“I am…”); fog and bend signals describe the vessel. */
export const isMessage = (sig: SoundSignal) => sig.context === 'sight' || sig.context === 'channel'

export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
