// Small seeded RNG for generated practice questions: the same seed gives
// the same questions, so a learner can redo a set.

export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

/** Random number rounded to `step` (e.g. 0.1). */
export function randStep(rng: Rng, min: number, max: number, step: number): number {
  const n = Math.round((max - min) / step)
  return Math.round((min + randInt(rng, 0, n) * step) / step) * step
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

/**
 * Multiple-choice options: the correct answer plus distractors, shuffled,
 * with duplicates removed. Returns the options and the answer's index.
 */
export function choices<T>(rng: Rng, correct: T, distractors: readonly T[], count = 4): { options: T[]; answer: number } {
  const unique = distractors.filter((d, i) => d !== correct && distractors.indexOf(d) === i).slice(0, count - 1)
  const options = shuffle(rng, [correct, ...unique])
  return { options, answer: options.indexOf(correct) }
}
