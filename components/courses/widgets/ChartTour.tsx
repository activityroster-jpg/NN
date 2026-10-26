'use client'

// Pick a feature from the list: the chart zooms to it, pulses it and
// explains what it is.

import { useState } from 'react'
import { formatPosition } from '@/lib/courses/geo'
import { FULL_VIEW, viewAround } from '@/lib/courses/navigation/chart-geometry'
import { feature } from '@/lib/courses/navigation/practice-chart'
import PracticeChart from '../PracticeChart'

const OPTION =
  'min-h-11 rounded-control border px-3 py-1.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 md:min-h-9'

export default function ChartTour({ ids, widthNm = 4.5 }: { ids: string[]; widthNm?: number }) {
  const [current, setCurrent] = useState<string | null>(null)
  const f = current ? feature(current) : null
  return (
    <div className="grid gap-3 md:grid-cols-[13rem_minmax(0,1fr)]">
      <div className="flex flex-wrap gap-1.5 md:flex-col" role="listbox" aria-label="Chart features">
        <button
          type="button"
          role="option"
          aria-selected={current === null}
          onClick={() => setCurrent(null)}
          className={`${OPTION} ${current === null ? 'border-teal bg-teal font-semibold text-white' : 'border-border bg-white text-text-primary hover:border-teal-300 hover:bg-teal-50'}`}
        >
          Whole chart
        </button>
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected={current === id}
            onClick={() => setCurrent(id)}
            className={`${OPTION} ${current === id ? 'border-teal bg-teal font-semibold text-white' : 'border-border bg-white text-text-primary hover:border-teal-300 hover:bg-teal-50'}`}
          >
            {feature(id).name}
          </button>
        ))}
      </div>
      <div className="min-w-0">
        <PracticeChart view={f ? viewAround(f.at, widthNm) : FULL_VIEW} highlight={f ? [f.id] : undefined} zoomable />
        <div className="mt-2 min-h-[4.5rem] rounded-control border border-border bg-bg px-3 py-2 text-sm leading-relaxed" aria-live="polite">
          {f ? (
            <>
              <p className="font-semibold text-navy">{f.name}{f.light ? <span className="ml-2 text-xs font-medium tabular-nums text-text-secondary">{f.light}</span> : null}</p>
              <p className="text-text-secondary">{f.note}</p>
              <p className="mt-1 text-xs tabular-nums text-text-secondary">{formatPosition(f.at)}</p>
            </>
          ) : (
            <p className="text-text-secondary">Choose a feature to zoom in on it. Use + / − to zoom yourself, and drag to move around.</p>
          )}
        </div>
      </div>
    </div>
  )
}
