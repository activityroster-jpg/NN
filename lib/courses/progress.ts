// Course progress, kept in the learner's browser (no account needed).
// Every access is wrapped: storage can be blocked, full or cleared.

import { STORAGE_PREFIX } from './site-config'

export interface LessonProgress {
  completed: boolean
  /** Best score as a fraction 0–1. */
  best: number
  updatedAt: string
}

export type CourseProgress = Record<string, LessonProgress>

/** localStorage key holding one course's progress. */
export const progressKey = (courseSlug: string) => `${STORAGE_PREFIX}:course:${courseSlug}:v1`
const EVENT = `${STORAGE_PREFIX}:course-progress`

export function readProgress(courseSlug: string): CourseProgress {
  try {
    const raw = window.localStorage.getItem(progressKey(courseSlug))
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? (parsed as CourseProgress) : {}
  } catch {
    return {}
  }
}

export function recordResult(courseSlug: string, lessonSlug: string, score: number, completed: boolean): void {
  try {
    const all = readProgress(courseSlug)
    const prev = all[lessonSlug]
    all[lessonSlug] = {
      completed: completed || Boolean(prev?.completed),
      best: Math.max(score, prev?.best ?? 0),
      updatedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(progressKey(courseSlug), JSON.stringify(all))
    window.dispatchEvent(new Event(EVENT))
  } catch {
    // Progress is a convenience; the lesson works without it.
  }
}

export function resetProgress(courseSlug: string): void {
  try {
    window.localStorage.removeItem(progressKey(courseSlug))
    window.dispatchEvent(new Event(EVENT))
  } catch {
    // ignore
  }
}

export function subscribeProgress(callback: () => void): () => void {
  const onStorage = (e: StorageEvent) => { if (e.key?.startsWith(`${STORAGE_PREFIX}:course:`)) callback() }
  window.addEventListener(EVENT, callback)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener('storage', onStorage)
  }
}
