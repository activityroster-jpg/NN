// Shapes for code-authored courses (src/lib/courses/*). Lessons are
// React modules rather than database rows because each one embeds
// interactive widgets, an animated lesson player and auto-checked
// exercises.

import type { ComponentType } from 'react'

export type LessonLevel = 'Foundations' | 'Day Skipper' | 'Coastal Skipper' | 'Yachtmaster'

export interface LessonMeta {
  slug: string
  title: string
  /** One or two sentences: shown in the outline and as the meta description. */
  summary: string
  level: LessonLevel
  minutes: number
  /** Unpublished lessons appear in the outline as "Coming soon" with no page. */
  published: boolean
}

export interface ModuleMeta {
  slug: string
  title: string
  description: string
  lessons: LessonMeta[]
}

export interface CourseMeta {
  slug: string
  title: string
  tagline: string
  description: string
  modules: ModuleMeta[]
}

export interface KeyTerm {
  term: string
  definition: string
}

/** Everything a published lesson page renders, besides its outline entry. */
export interface LessonContent {
  objectives: string[]
  keyTerms: KeyTerm[]
  /** Server-rendered body (may embed client widgets). */
  Body: ComponentType
  /** Animated, narrated lesson player ("the video"). Client component. */
  Video: ComponentType
  /** Exercises at the foot of the lesson. Client component. */
  Exercises: ComponentType<{ courseSlug: string; lessonSlug: string }>
}
