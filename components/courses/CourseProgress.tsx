'use client'

// Progress indicators for code-authored courses, read from the browser.

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { buttonClasses } from '@/components/ui/Button'
import { useMemo, useSyncExternalStore } from 'react'
import { progressKey, resetProgress, subscribeProgress, type CourseProgress } from '@/lib/courses/progress'
import { lessonPath } from '@/lib/courses/navigation/seo'

function snapshot(courseSlug: string): string {
  try {
    return window.localStorage.getItem(progressKey(courseSlug)) ?? ''
  } catch {
    return ''
  }
}

export function useCourseProgress(courseSlug: string): CourseProgress {
  const raw = useSyncExternalStore(subscribeProgress, () => snapshot(courseSlug), () => '')
  return useMemo(() => {
    try {
      return raw ? (JSON.parse(raw) as CourseProgress) : {}
    } catch {
      return {}
    }
  }, [raw])
}

export interface LessonLink {
  slug: string
  title: string
  number: number
  minutes: number
  published: boolean
}

/** Tick shown next to a completed lesson. */
export function LessonTick({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  const progress = useCourseProgress(courseSlug)
  const p = progress[lessonSlug]
  if (!p) return null
  return p.completed ? (
    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success-bg text-success-text" title={`Completed · best score ${Math.round(p.best * 100)}%`} aria-label="Completed">
      <Check size={12} strokeWidth={2.5} aria-hidden="true" />
    </span>
  ) : (
    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-warning" title="Started" aria-label="Started" />
  )
}

/** Where a lesson stands for this learner: done, in progress or to do. */
export function useLessonStatus(courseSlug: string, lessonSlug: string): 'done' | 'current' | 'todo' {
  const p = useCourseProgress(courseSlug)[lessonSlug]
  return p?.completed ? 'done' : p ? 'current' : 'todo'
}

/** "3 of 8 complete" plus a Start/Continue button. */
export function CourseResume({ courseSlug, lessons }: { courseSlug: string; lessons: LessonLink[] }) {
  const progress = useCourseProgress(courseSlug)
  const published = lessons.filter((l) => l.published)
  const done = published.filter((l) => progress[l.slug]?.completed).length
  const next = published.find((l) => !progress[l.slug]?.completed) ?? published[0]
  const started = Object.keys(progress).length > 0
  if (!next) return null
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Link href={lessonPath(next.slug)} className={buttonClasses('primary', 'lg')}>
        {started ? `Continue: lesson ${next.number}` : 'Start lesson 1'}
        <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
      </Link>
      {started && (
        <>
          <span className="text-sm tabular-nums text-navy-200">{done} of {published.length} published lessons complete</span>
          <button
            type="button"
            onClick={() => { if (window.confirm('Clear your progress for this course on this device?')) resetProgress(courseSlug) }}
            className="inline-flex min-h-11 items-center rounded-control text-sm text-navy-300 underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
          >
            Reset progress
          </button>
        </>
      )}
    </div>
  )
}
