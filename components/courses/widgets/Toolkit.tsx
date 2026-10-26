'use client'

// The navigator's toolkit: tap a tool to see what it does and where the
// course teaches it.

import { useState, type ReactNode } from 'react'

interface Tool {
  id: string
  name: string
  icon: ReactNode
  what: string
  lesson: string
}

const S = { stroke: '#0B5563', strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const TOOLS: Tool[] = [
  {
    id: 'chart', name: 'Nautical chart',
    icon: <g {...S}><path d="M6 12 l14 -5 l14 5 l14 -5 v30 l-14 5 l-14 -5 l-14 5 z" /><path d="M20 7 v30 M34 12 v30" /><path d="M10 26 q6 -6 12 0 t12 0" stroke="#2bb3c0" /></g>,
    what: 'A map of the sea showing depths, dangers, buoys, lights and landmarks. Everything you plot goes on the chart.',
    lesson: 'Lessons 4 and 8',
  },
  {
    id: 'dividers', name: 'Dividers',
    icon: <g {...S}><circle cx="27" cy="9" r="3.5" /><path d="M25 12 L12 44 M29 12 L40 44" /></g>,
    what: 'Two pointed legs on a hinge. Open them between two points on the chart, then read the distance off the latitude scale.',
    lesson: 'Lesson 5',
  },
  {
    id: 'plotter', name: 'Plotter',
    icon: <g {...S}><rect x="5" y="12" width="44" height="28" rx="3" /><circle cx="27" cy="26" r="9" /><path d="M27 17 v18 M18 26 h18" /></g>,
    what: 'A ruler with a rotating protractor (Portland or Breton style). It measures and draws courses and bearings.',
    lesson: 'Lesson 6',
  },
  {
    id: 'pencil', name: 'Pencil and eraser',
    icon: <g {...S}><path d="M10 42 l4 -12 l22 -22 l8 8 l-22 22 z" /><path d="M32 12 l8 8" /></g>,
    what: 'A soft 2B pencil and a good eraser. Plots are drawn lightly so the chart can be used again.',
    lesson: 'Every lesson',
  },
  {
    id: 'hbc', name: 'Hand-bearing compass',
    icon: <g {...S}><circle cx="27" cy="26" r="15" /><circle cx="27" cy="26" r="9" /><path d="M27 11 v6" stroke="#f5b301" /><path d="M27 20 l3 6 l-3 6 l-3 -6 z" fill="#d9342b" stroke="none" /></g>,
    what: 'A small compass you hold to your eye to take the bearing of a landmark — the start of a position fix.',
    lesson: 'Module 2',
  },
  {
    id: 'compass', name: 'Steering compass',
    icon: <g {...S}><path d="M8 34 a19 19 0 0 1 38 0 z" /><path d="M27 15 v19" stroke="#f5b301" /><path d="M14 34 h26" /></g>,
    what: 'The fixed compass the helmsman steers by. It is affected by the boat’s own magnetism (deviation).',
    lesson: 'Module 2',
  },
  {
    id: 'log', name: 'Log (speed and distance)',
    icon: <g {...S}><circle cx="27" cy="26" r="16" /><path d="M27 26 l9 -8" /><path d="M15 32 h24" /><text x="27" y="40" fontSize="8" textAnchor="middle" fill="#0B5563" stroke="none">kn</text></g>,
    what: 'Measures the boat’s speed through the water and the distance run. Logbook readings feed your dead reckoning.',
    lesson: 'Lesson 7',
  },
  {
    id: 'depth', name: 'Depth sounder',
    icon: <g {...S}><rect x="8" y="10" width="38" height="30" rx="4" /><text x="27" y="31" fontSize="13" fontWeight="700" textAnchor="middle" fill="#0B5563" stroke="none">7.4</text></g>,
    what: 'Shows the depth of water under the boat. Comparing it with the charted depth is a quick check on your position.',
    lesson: 'Lesson 8 and Module 4',
  },
  {
    id: 'gps', name: 'GPS and chart plotter',
    icon: <g {...S}><rect x="8" y="8" width="38" height="34" rx="4" /><path d="M14 34 q8 -16 26 -18" stroke="#2bb3c0" /><circle cx="26" cy="25" r="2.5" fill="#d9342b" stroke="none" /></g>,
    what: 'Satellite positioning shown on an electronic chart. Brilliant — but always cross-check it with traditional methods.',
    lesson: 'Module 5',
  },
  {
    id: 'almanac', name: 'Almanac and tide tables',
    icon: <g {...S}><path d="M10 10 h16 q2 0 2 2 v30 q0 -2 -2 -2 h-16 z" /><path d="M44 10 h-16 q-2 0 -2 2 v30 q0 -2 2 -2 h16 z" /></g>,
    what: 'The navigator’s reference book: tide tables, tidal streams, lights, harbour information and more.',
    lesson: 'Module 4',
  },
  {
    id: 'binoculars', name: 'Binoculars',
    icon: <g {...S}><circle cx="16" cy="32" r="9" /><circle cx="38" cy="32" r="9" /><path d="M12 24 l4 -12 h4 l2 12 M42 24 l-4 -12 h-4 l-2 12 M24 28 h6" /></g>,
    what: 'For identifying buoys, lights and landmarks — and for keeping a proper lookout.',
    lesson: 'Module 3',
  },
  {
    id: 'watch', name: 'Watch',
    icon: <g {...S}><circle cx="27" cy="26" r="15" /><path d="M27 18 v8 l6 4" /></g>,
    what: 'Time is part of every navigation calculation: speed, tides and when you will arrive.',
    lesson: 'Lesson 7',
  },
]

export default function Toolkit() {
  const [open, setOpen] = useState<string | null>('dividers')
  const tool = TOOLS.find((t) => t.id === open)
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setOpen(t.id)}
            aria-pressed={open === t.id}
            className={`flex flex-col items-center gap-1 rounded-card border p-2 text-center text-xs font-medium leading-tight text-text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${open === t.id ? 'border-teal bg-teal-light' : 'border-border bg-white hover:border-teal-300 hover:bg-teal-50'}`}
          >
            <svg viewBox="0 0 54 50" className="h-10 w-10" aria-hidden="true">{t.icon}</svg>
            {t.name}
          </button>
        ))}
      </div>
      {tool && (
        <div className="mt-3 rounded-control border border-border bg-bg px-4 py-3" aria-live="polite">
          <p className="font-semibold text-navy">{tool.name}</p>
          <p className="text-sm leading-relaxed text-text-secondary">{tool.what}</p>
          <p className="mt-1 text-xs font-semibold text-navy-600">Covered in: {tool.lesson}</p>
        </div>
      )}
    </div>
  )
}
