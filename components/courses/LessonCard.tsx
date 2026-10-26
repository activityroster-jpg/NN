'use client'

// Navigation for Yachts syllabus row: done / in progress / to do, read from
// the learner's browser (no account needed). Unpublished lessons render as
// a plain row marked "Coming soon".

import Link from 'next/link'
import { Check, Play } from 'lucide-react'
import type { LessonLevel } from '@/lib/courses/types'
import { useLessonStatus } from './CourseProgress'
import LevelBadge from './LevelBadge'

export default function LessonCard({
  href,
  courseSlug,
  lessonSlug,
  number,
  title,
  summary,
  minutes,
  level,
  published = true,
}: {
  /** Lesson URL; ignored while the lesson is unpublished. */
  href: string
  courseSlug: string
  lessonSlug: string
  number: number
  title: string
  summary?: string
  minutes?: number
  level?: LessonLevel
  published?: boolean
}) {
  const tracked = useLessonStatus(courseSlug, lessonSlug)
  const status = published ? tracked : 'todo'
  const current = status === 'current'

  const inner = (
    <>
      <span
        className={`flex size-11 items-center justify-center rounded-full text-[15px] font-bold tabular-nums ${
          status === 'done' ? 'bg-success-bg text-success-text' : current ? 'bg-teal text-white' : 'bg-navy-50 text-navy-600'
        }`}
        aria-hidden="true"
      >
        {status === 'done' ? <Check size={20} strokeWidth={2} /> : current ? <Play size={18} fill="currentColor" strokeWidth={0} className="ml-0.5" /> : number}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className={`text-xs font-semibold tracking-[0.1em] uppercase ${current ? 'text-teal' : 'text-text-secondary'}`}>
          Lesson {number}
          {current && ' · In progress'}
          {!published && ' · Coming soon'}
          {/* Phones: the right-hand column folds into this line. */}
          {status === 'done' ? (
            <span className="text-success-text sm:hidden"> · Done</span>
          ) : (
            minutes !== undefined && <span className="tabular-nums sm:hidden"> · {minutes} min</span>
          )}
        </span>
        <span className={`text-base leading-snug font-semibold ${published ? 'text-navy' : 'text-text-secondary'}`}>{title}</span>
        {summary && <span className="text-sm leading-snug text-text-secondary">{summary}</span>}
      </span>
      <span className="hidden items-center gap-3 text-right sm:flex">
        {level && <LevelBadge level={level} />}
        {status === 'done' ? (
          <span className="text-[13px] font-semibold text-success-text">Done</span>
        ) : (
          minutes !== undefined && <span className="text-[13px] whitespace-nowrap tabular-nums text-text-secondary">{minutes} min</span>
        )}
      </span>
    </>
  )

  const base =
    'grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 rounded-card border bg-card px-4 py-4 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5'

  if (!published) {
    return <div className={`${base} border-border`}>{inner}</div>
  }

  return (
    <Link
      href={href}
      className={`${base} transition-colors hover:border-teal-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${
        current ? 'border-teal' : 'border-border'
      }`}
    >
      {inner}
    </Link>
  )
}
