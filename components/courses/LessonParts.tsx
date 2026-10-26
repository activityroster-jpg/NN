// Building blocks for lesson text. Server-safe (no hooks), so lesson
// bodies stay server-rendered and indexable; interactive widgets are
// client components dropped in between these.

import type { ReactNode } from 'react'
import { Bookmark, Compass, GraduationCap, Lightbulb, MousePointerClick, TriangleAlert, type LucideIcon } from 'lucide-react'

export function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id ? `${id}-h` : undefined}>
      <h2 id={id ? `${id}-h` : undefined}>{title}</h2>
      {children}
    </section>
  )
}

const CALLOUT_STYLES: Record<'tip' | 'remember' | 'warning' | 'example' | 'exam', { label: string; className: string; iconClass: string; icon: LucideIcon }> = {
  tip: { label: 'Tip', className: 'border-teal-200 border-l-teal bg-teal-50', iconClass: 'text-teal', icon: Lightbulb },
  remember: { label: 'Remember', className: 'border-navy-100 border-l-navy-500 bg-navy-50', iconClass: 'text-navy-600', icon: Bookmark },
  warning: { label: 'Safety', className: 'border-warning/40 border-l-warning bg-warning-bg', iconClass: 'text-warning-text', icon: TriangleAlert },
  example: { label: 'Example', className: 'border-border border-l-navy-300 bg-card', iconClass: 'text-navy-600', icon: Compass },
  exam: { label: 'Exam tip', className: 'border-border border-l-navy bg-card', iconClass: 'text-navy', icon: GraduationCap },
}

export function Callout({ kind = 'tip', title, children }: { kind?: keyof typeof CALLOUT_STYLES; title?: string; children: ReactNode }) {
  const s = CALLOUT_STYLES[kind]
  const Icon = s.icon
  return (
    <aside className={`not-lesson rounded-card border border-l-4 ${s.className} px-4 py-3.5 text-base leading-relaxed sm:px-5`}>
      <p className="mb-1.5 flex items-center gap-2 text-eyebrow text-navy">
        <Icon size={16} strokeWidth={1.5} className={`shrink-0 ${s.iconClass}`} aria-hidden="true" />
        {title ?? s.label}
      </p>
      <div className="space-y-2">{children}</div>
    </aside>
  )
}

export function Figure({ caption, children }: { caption?: ReactNode; children: ReactNode }) {
  return (
    <figure className="not-lesson my-6">
      {children}
      {caption && <figcaption className="mt-2 text-center text-sm leading-snug text-text-secondary">{caption}</figcaption>}
    </figure>
  )
}

export function KeyIdea({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-card bg-navy px-5 py-4 text-lg font-semibold leading-snug text-white">
      {children}
    </p>
  )
}

export function Formula({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-card px-5 py-4 text-center">
      <p className="text-2xl font-bold tracking-wide tabular-nums text-navy">{children}</p>
      {note && <p className="mt-1 text-sm text-text-secondary">{note}</p>}
    </div>
  )
}

/** A worked example with numbered steps. */
export function Worked({ title, children, steps, answer }: { title: string; children?: ReactNode; steps: ReactNode[]; answer?: ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-card p-4 sm:p-5">
      <p className="text-eyebrow text-navy-600">Worked example</p>
      <p className="mt-1.5 font-semibold text-navy">{title}</p>
      {children && <div className="mt-2">{children}</div>}
      <ol className="not-lesson mt-3 space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-navy-50 text-xs font-bold tabular-nums text-navy-700">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      {answer && <p className="mt-3 rounded-control bg-success-bg px-3 py-2 font-semibold text-text-primary">{answer}</p>}
    </div>
  )
}

/** Two-column comparison table. */
export function Table({ head, rows }: { head: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className="not-lesson overflow-x-auto rounded-card border border-border bg-card">
      <table className="w-full text-left text-[0.95rem]">
        <thead className="bg-navy-50 text-sm">
          <tr>{head.map((h, i) => <th key={i} className="px-4 py-2.5 font-semibold text-navy">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border align-top">
              {r.map((c, j) => <td key={j} className="px-4 py-2">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Frame for an interactive widget inside the lesson text. */
export function Interactive({ title, instructions, children }: { title: string; instructions?: ReactNode; children: ReactNode }) {
  return (
    <div className="not-lesson my-6 rounded-card border border-teal-200 bg-white p-3 sm:p-4">
      <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="inline-flex h-[22px] items-center gap-1 rounded-[6px] bg-teal-light px-2 text-[11px] font-bold uppercase tracking-[0.06em] text-teal-800">
          <MousePointerClick size={12} strokeWidth={1.5} aria-hidden="true" />
          Interactive
        </span>
        <span className="text-h4 text-navy">{title}</span>
      </p>
      {instructions && <p className="mt-1 text-sm leading-relaxed text-text-secondary">{instructions}</p>}
      <div className="mt-3">{children}</div>
    </div>
  )
}
