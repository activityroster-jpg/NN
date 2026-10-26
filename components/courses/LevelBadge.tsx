import type { LessonLevel } from '@/lib/courses/types'

// Levels are told apart by label, with a quiet navy ramp from first steps to
// Yachtmaster (no category colours).
const LEVEL_STYLES: Record<LessonLevel, string> = {
  Foundations: 'bg-navy-50 text-navy-700',
  'Day Skipper': 'bg-navy-100 text-navy-800',
  'Coastal Skipper': 'bg-navy-200 text-navy-900',
  Yachtmaster: 'bg-navy text-mist',
}

export default function LevelBadge({ level }: { level: LessonLevel }) {
  return (
    <span className={`inline-flex h-[22px] shrink-0 items-center rounded-[6px] px-2 text-[11px] font-bold uppercase tracking-[0.06em] whitespace-nowrap ${LEVEL_STYLES[level]}`}>
      {level}
    </span>
  )
}
