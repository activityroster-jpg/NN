"use client";

// Interactive widgets for Lesson 11: a knots and Beaufort converter (ported
// from the Boaty Jobs lesson "Weather for navigators", with what each force
// means on a charter), the sea-breeze day, the local winds of our sailing
// areas (from the cruising guides), and a forecast decoder with go, stay
// or change-the-plan decisions.

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import type { Wind } from "@/lib/cruising/types";
import { BreezeCurve, WindRose } from "./art";
import {
  BEAUFORT, DECISION_TEXT, FORECASTS, SEA_BREEZE_DAY, breezeAdvice, breezeAt, degreesFor, forceFor, gustRange, knotsText, type Decision,
} from "./data";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300";
const SEG = `min-h-11 rounded-control border px-3 py-1.5 text-sm font-semibold transition-colors ${FOCUS}`;
const segClass = (on: boolean) => `${SEG} ${on ? "border-teal bg-teal-light text-teal-800" : "border-border bg-white text-text-primary hover:border-teal-300 hover:bg-teal-50"}`;

function Label({ children }: { children: ReactNode }) {
  return <p className="text-sm font-semibold text-text-primary">{children}</p>;
}

/* ------------------------------------------------------------------ */
/* 1. Knots and Beaufort                                                */
/* ------------------------------------------------------------------ */

const MAX_KN = 50;

export function BeaufortConverter() {
  const [kn, setKn] = useState(14);
  const f = forceFor(kn);
  const b = BEAUFORT[f]!;
  const [g1, g2] = gustRange(kn);
  const shown = BEAUFORT.filter((x) => x.min <= MAX_KN);
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-text-primary" htmlFor="wx-knots">
        Mean wind speed: <span className="tabular-nums">{kn} kn</span>
      </label>
      <input
        id="wx-knots"
        type="range"
        min={0}
        max={MAX_KN}
        step={1}
        value={kn}
        onChange={(e) => setKn(Number(e.target.value))}
        className={`h-11 w-full accent-teal ${FOCUS}`}
        aria-valuetext={`${kn} knots, force ${f}`}
      />
      <div className="flex h-7 overflow-hidden rounded-control border border-navy-300" aria-hidden="true">
        {shown.map((x) => {
          const hi = x.max === null ? MAX_KN : x.max + 1;
          const w = ((Math.min(hi, MAX_KN + 1) - x.min) / (MAX_KN + 1)) * 100;
          return (
            <div key={x.force} className={`flex items-center justify-center border-r border-navy-200 text-[11px] font-semibold tabular-nums last:border-r-0 ${x.force === f ? "bg-navy text-white" : "bg-white text-navy-700"}`} style={{ width: `${w.toFixed(2)}%` }}>
              {w > 3.5 ? x.force : ""}
            </div>
          );
        })}
      </div>
      <div className="rounded-card border border-border bg-bg p-3" aria-live="polite">
        <p className="text-lg font-semibold text-navy">Force {f} · {b.name}</p>
        <p className="text-sm tabular-nums text-text-primary">Mean wind {knotsText(f)}{kn > 3 ? ` · gusts perhaps ${g1} to ${g2} kn, more off high land` : ""}</p>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">Open sea: {b.sea}.</p>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-text-primary">On a charter: {b.charter}</p>
      </div>
      <div role="group" aria-label="Jump to a force" className="flex flex-wrap gap-1.5">
        {shown.map((x) => (
          <button key={x.force} type="button" className={`${segClass(x.force === f)} min-w-11 px-2 tabular-nums`} aria-pressed={x.force === f} onClick={() => setKn(x.force === 0 ? 0 : Math.round((x.min + (x.max ?? x.min)) / 2))} aria-label={`Force ${x.force}`}>
            {x.force}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. The sea-breeze day                                                */
/* ------------------------------------------------------------------ */

export function SeaBreezeDay() {
  const [hour, setHour] = useState(9);
  const kn = Math.round(breezeAt(hour));
  const label = `${String(Math.floor(hour)).padStart(2, "0")}:${hour % 1 ? "30" : "00"}`;
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-text-primary" htmlFor="wx-hour">
        Time of day: <span className="tabular-nums">{label}</span>
      </label>
      <input id="wx-hour" type="range" min={6} max={22} step={0.5} value={hour} onChange={(e) => setHour(Number(e.target.value))} className={`h-11 w-full accent-teal ${FOCUS}`} aria-valuetext={`${label}, about ${kn} knots`} />
      <svg viewBox="0 0 640 230" className="w-full rounded-card border border-border bg-white" role="img" aria-label="A typical sea-breeze day: calm morning, breeze building to about sixteen knots mid-afternoon, dying at sunset">
        <BreezeCurve x={64} y={36} w={540} h={150} hour={hour} points={SEA_BREEZE_DAY} fontSize={18} />
      </svg>
      <div className="rounded-card border border-border bg-bg p-3" aria-live="polite">
        <p className="font-semibold text-navy tabular-nums">About {kn} knots, force {forceFor(kn)}</p>
        <p className="mt-1 text-sm leading-relaxed text-text-primary">{breezeAdvice(hour)}</p>
      </div>
      <p className="text-xs text-text-secondary">A typical settled summer day on a Mediterranean coast, for illustration. The real breeze depends on the coast, the heat and the forecast wind.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Local winds of our sailing areas                                  */
/* ------------------------------------------------------------------ */

export interface WindArea {
  id: string;
  name: string;
  country: string;
  summary: string;
  winds: Wind[];
  forecasts: string[];
}

const ROSE_COLOURS = ["#0f766e", "#b91c1c", "#c2410c", "#1d4ed8", "#7e22ce"];

export function LocalWinds({ areas, initial = "croatia-split" }: { areas: WindArea[]; initial?: string }) {
  const [id, setId] = useState(initial);
  const area = areas.find((a) => a.id === id) ?? areas[0]!;
  const winds = area.winds.map((w, i) => ({ w, from: degreesFor(w.from), colour: ROSE_COLOURS[i % ROSE_COLOURS.length]! }));
  return (
    <div className="space-y-4">
      <div role="group" aria-label="Sailing area" className="flex flex-wrap gap-1.5">
        {areas.map((a) => (
          <button key={a.id} type="button" className={segClass(a.id === area.id)} aria-pressed={a.id === area.id} onClick={() => setId(a.id)}>
            {a.name}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-[15rem_minmax(0,1fr)]">
        <svg viewBox="-150 -150 300 300" className="mx-auto w-full max-w-60" role="img" aria-label={`Winds of ${area.name}: ${area.winds.map((w) => `${w.name} from the ${w.from}`).join(", ")}`}>
          <WindRose x={0} y={0} r={120} winds={winds.filter((x) => x.from !== null).map((x) => ({ from: x.from!, colour: x.colour }))} />
        </svg>
        <div className="space-y-3">
          <p className="text-[15px] leading-relaxed text-text-primary">{area.summary}</p>
          <ul className="not-lesson space-y-2">
            {winds.map(({ w, colour }) => (
              <li key={w.name} className="rounded-card border border-border bg-white px-3 py-2 text-sm leading-relaxed">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: colour }} aria-hidden="true" />
                <strong className="capitalize text-navy">{w.name}</strong>, from the {w.from}. <span className="text-text-secondary">{w.note}</span>
              </li>
            ))}
          </ul>
          <div>
            <Label>Where to get the forecast</Label>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-text-secondary">
              {area.forecasts.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>
          <Link href={`/en/cruising/${area.id}`} className="inline-block text-sm font-semibold text-teal underline underline-offset-2">The full {area.name} cruising guide</Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Forecast decoder                                                  */
/* ------------------------------------------------------------------ */

export function ForecastDecoder() {
  const [index, setIndex] = useState(0);
  const [phrase, setPhrase] = useState<string | null>(null);
  const [choice, setChoice] = useState<Decision | null>(null);
  const f = FORECASTS[index]!;

  const note = (() => {
    if (!phrase) return null;
    const [li, pi] = phrase.split("-").map(Number);
    return f.lines[li ?? -1]?.parts[pi ?? -1] ?? null;
  })();

  function pickForecast(i: number) {
    setIndex(i);
    setPhrase(null);
    setChoice(null);
  }

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Choose a forecast" className="flex flex-wrap gap-2">
        {FORECASTS.map((x, i) => (
          <button key={x.id} type="button" className={segClass(i === index)} aria-pressed={i === index} onClick={() => pickForecast(i)}>
            Forecast {x.id}
          </button>
        ))}
      </div>

      <div className="rounded-card border border-navy-200 bg-white">
        <div className="rounded-t-card bg-navy px-4 py-2.5 text-sm text-white">
          <p className="font-semibold">{f.area}</p>
          <p className="text-navy-200 tabular-nums">Issued {f.issued} · next 24 hours</p>
        </div>
        <dl className="divide-y divide-border px-4">
          {f.lines.map((line, li) => (
            <div key={line.label} className="grid gap-1 py-2.5 sm:grid-cols-[6rem_minmax(0,1fr)]">
              <dt className="text-sm font-semibold text-navy">{line.label}</dt>
              <dd className="text-[15px] leading-relaxed text-text-primary">
                {line.parts.map((p, pi) => {
                  const key = `${li}-${pi}`;
                  if (!p.note) return <span key={key}>{p.text} </span>;
                  const active = phrase === key;
                  return (
                    <span key={key}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => setPhrase(active ? null : key)}
                        className={`rounded-[4px] px-0.5 py-1 text-left font-semibold underline decoration-dotted underline-offset-4 ${active ? "bg-teal-light text-teal-800" : "text-teal hover:bg-teal-50"} ${FOCUS}`}
                      >
                        {p.text}
                      </button>{" "}
                    </span>
                  );
                })}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="min-h-14 rounded-card border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-relaxed text-text-primary" aria-live="polite">
        {note ? (
          <p><strong className="text-navy">“{note.text.replace(/[,.]$/, "")}”</strong>: {note.note}</p>
        ) : (
          <p className="text-navy-600">Tap an underlined phrase to decode it.</p>
        )}
      </div>

      <div>
        <Label>Your plan</Label>
        <p className="mt-1 text-[15px] leading-relaxed text-text-primary">{f.plan}</p>
        <p className="mt-3 text-sm font-semibold text-text-primary">What do you do?</p>
        <div role="group" aria-label="Your decision" className="mt-2 flex flex-wrap gap-2">
          {(["go", "wait", "change"] as Decision[]).map((d) => (
            <button key={d} type="button" className={segClass(choice === d)} aria-pressed={choice === d} onClick={() => setChoice(d)}>
              {DECISION_TEXT[d]}
            </button>
          ))}
        </div>
        {choice && (
          <div
            role="status"
            className={`mt-3 flex gap-2 rounded-card border px-4 py-3 text-sm leading-relaxed text-text-primary ${choice === f.best ? "border-success bg-success-bg" : "border-warning bg-warning-bg"}`}
          >
            {choice === f.best
              ? <CircleCheck size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-success-text" aria-hidden="true" />
              : <CircleX size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-warning-text" aria-hidden="true" />}
            <p>
              <strong>{choice === f.best ? "Good call. " : `The better call: ${DECISION_TEXT[f.best].toLowerCase()}. `}</strong>
              {f.feedback[choice]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
