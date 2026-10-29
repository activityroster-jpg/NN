"use client";

// Interactive widgets for Lesson 12:
//  - PlotterZoom: one route at four zoom levels, to show what a zoomed-out
//    plotter leaves off and what overzoom looks like.
//  - HeadingCog: heading and speed through the water against course and
//    speed over the ground, with a current and leeway.
//  - WaypointQuiz (ported from Boaty Jobs): good or bad waypoint on the
//    practice chart.
//  - AisCpa (ported from Boaty Jobs): closest point of approach from two
//    straight-line tracks.
//  - WeekPlanner: one of our cruising guides' weeks, with rest and weather
//    days, average speed and the Friday return.

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";
import { formatBearing, formatPosition, type LatLon } from "@/lib/courses/geo";
import { project, r2, viewAround, type ViewRect } from "@/lib/courses/navigation/chart-geometry";
import PracticeChart, { ChartText } from "../../PracticeChart";
import {
  AIS_FERRY, AIS_OWN, CANDIDATES, DAYS, LONG_DAY_NM, bearingAfter, clock, closestApproach, hm, one, overGround, planWeek,
  type AisTarget, type Motion, type Week,
} from "./data";

export const ROUTE_COLOUR = "#7c3aed";

const btn = "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/50 disabled:cursor-not-allowed disabled:opacity-40";
const btnOn = `${btn} border-teal bg-teal text-white hover:bg-teal/90`;
const btnOff = `${btn} border-border bg-white text-text-primary hover:bg-teal-light`;

function Slider({ id, label, value, min, max, step, text, onChange }: {
  id: string; label: string; value: number; min: number; max: number; step: number; text: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-xs font-semibold text-text-secondary">
        <span>{label}</span>
        <span className="font-mono text-sm text-text-primary">{text}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-8 w-full accent-teal" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chart overlays                                                      */
/* ------------------------------------------------------------------ */

/** A waypoint: a small square with a dot, as most plotters draw them. */
export function WaypointMark({ at, label, colour = ROUTE_COLOUR, size = 7, labelSize = 11, labelDx = 10, labelDy = -9, anchor = "start", strike }: {
  at: LatLon; label?: string; colour?: string; size?: number; labelSize?: number; labelDx?: number; labelDy?: number;
  anchor?: "start" | "middle" | "end";
  /** Draw a cross through it (a bad waypoint). */
  strike?: boolean;
}) {
  const p = project(at);
  return (
    <g>
      <rect x={r2(p.x - size)} y={r2(p.y - size)} width={size * 2} height={size * 2} fill="rgba(255,255,255,0.55)" stroke={colour} strokeWidth={2} />
      <circle cx={r2(p.x)} cy={r2(p.y)} r={1.8} fill={colour} />
      {strike && (
        <g stroke="#b91c1c" strokeWidth={3} strokeLinecap="round">
          <line x1={r2(p.x - size * 1.6)} y1={r2(p.y - size * 1.6)} x2={r2(p.x + size * 1.6)} y2={r2(p.y + size * 1.6)} />
          <line x1={r2(p.x - size * 1.6)} y1={r2(p.y + size * 1.6)} x2={r2(p.x + size * 1.6)} y2={r2(p.y - size * 1.6)} />
        </g>
      )}
      {label && <ChartText at={at} dx={labelDx} dy={labelDy} size={labelSize} colour={colour} anchor={anchor} bold>{label}</ChartText>}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* 1. What the zoom level hides                                         */
/* ------------------------------------------------------------------ */

const ROCK = { x: 405, y: 252 };
const SOUNDINGS: Array<[number, number, string]> = [
  [300, 330, "18"], [470, 190, "14"], [360, 210, "9"], [450, 300, "11"], [520, 250, "16"], [330, 270, "7"], [430, 225, "4"], [390, 290, "6"],
  [560, 160, "21"], [250, 380, "24"], [600, 330, "27"], [480, 360, "19"],
];
const ZOOMS = [
  { label: "Whole area", scale: 1, detail: false, note: "Zoomed right out. The route looks clear: no soundings, no rocks." },
  { label: "Day view", scale: 1.7, detail: false, note: "Still zoomed out. Many plotters only draw soundings and small dangers once you zoom in." },
  { label: "Leg view", scale: 3.2, detail: true, note: "Zoomed in along the leg: soundings appear, and the line runs straight over a rock." },
  { label: "Overzoomed", scale: 7, detail: true, note: "Zoomed beyond the scale of the survey: the chart gets bigger, not better. Coastlines go blocky and nothing new appears." },
] as const;

/** The plotter screen drawing at one zoom level, in a 760 × 470 box (shared with the video). */
export function ZoomArt({ level }: { level: number }) {
  const z = ZOOMS[Math.max(0, Math.min(3, level))]!;
  const s = z.scale;
  const over = level === 3;
  return (
    <g>
      <rect width={760} height={470} fill="#d6ecf8" />
      <g transform={`translate(${ROCK.x} ${ROCK.y}) scale(${s}) translate(${-ROCK.x} ${-ROCK.y})`}>
        {over ? (
          <path d="M0 0 H330 V40 H300 V80 H260 V120 H220 V150 H170 V180 H110 V200 H50 V215 H0 Z" fill="#f1deb0" stroke="#3b3a36" strokeWidth={2 / s} />
        ) : (
          <path d="M0 0 H330 C 300 70 230 110 170 150 C 110 190 50 205 0 215 Z" fill="#f1deb0" stroke="#3b3a36" strokeWidth={2 / s} />
        )}
        <path d="M600 470 C 640 420 700 400 760 395 V470 Z" fill="#f1deb0" stroke="#3b3a36" strokeWidth={2 / s} />
        <path d="M120 470 L 700 40" stroke="#c026d3" strokeWidth={6 / s} />
        {z.detail && (
          <g>
            {SOUNDINGS.map(([x, y, d]) => (
              <text key={`${x}-${y}`} x={x} y={y} fontSize={11 / Math.sqrt(s)} textAnchor="middle" fill="#334155" fontStyle="italic">{d}</text>
            ))}
            <circle cx={ROCK.x} cy={ROCK.y} r={9} fill="#7dd3fc" fillOpacity={0.6} stroke="#1d2731" strokeWidth={1.4 / s} strokeDasharray={`${3 / s} ${2 / s}`} />
            <path d={`M${ROCK.x - 5} ${ROCK.y} h10 M${ROCK.x} ${ROCK.y - 5} v10`} stroke="#1d2731" strokeWidth={1.6 / s} />
          </g>
        )}
      </g>
      <rect x={640} y={14} width={106} height={34} rx={6} fill="#0b1929" fillOpacity={0.8} />
      <text x={693} y={37} textAnchor="middle" fontSize={16} fontWeight={700} fill="#fff">{["x1", "x2", "x4", "x8"][level]}</text>
    </g>
  );
}

export function PlotterZoom() {
  const [level, setLevel] = useState(0);
  const z = ZOOMS[level]!;
  const over = level === 3;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Zoom level">
        {ZOOMS.map((k, i) => (
          <button key={k.label} type="button" aria-pressed={i === level} onClick={() => setLevel(i)} className={i === level ? btnOn : btnOff}>{k.label}</button>
        ))}
      </div>
      <div className="rounded-2xl bg-[#1d2a38] p-3">
        <svg viewBox="0 0 760 470" className="block h-auto w-full rounded-lg" role="img" aria-label={`Plotter screen, ${z.label}. ${z.note}`}>
          <ZoomArt level={level} />
          {level === 2 && <text x={20} y={450} fontSize={22} fontWeight={700} fill="#b91c1c">Rock on the route line</text>}
          {over && <text x={20} y={450} fontSize={22} fontWeight={700} fill="#b45309">Overzoom: bigger, not better</text>}
        </svg>
      </div>
      <p className="text-sm text-text-primary" aria-live="polite">{z.note}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Heading against course over the ground                            */
/* ------------------------------------------------------------------ */

const HC = 200;
const HC_PX = 24;

function arrowHead(x: number, y: number, bearing: number, size = 12) {
  const a = (bearing * Math.PI) / 180;
  const l = a + Math.PI - 0.45;
  const r = a + Math.PI + 0.45;
  return `M${r2(x + Math.sin(l) * size)} ${r2(y - Math.cos(l) * size)} L${r2(x)} ${r2(y)} L${r2(x + Math.sin(r) * size)} ${r2(y - Math.cos(r) * size)}`;
}

export function HeadingCog() {
  const [heading, setHeading] = useState(90);
  const [speed, setSpeed] = useState(6);
  const [set, setSet] = useState(180);
  const [rate, setRate] = useState(1.5);
  const [leeway, setLeeway] = useState(0);
  const g = overGround(heading, speed, { set, rate }, leeway);
  const tip = (b: number, len: number) => ({ x: r2(HC + Math.sin((b * Math.PI) / 180) * len * HC_PX), y: r2(HC - Math.cos((b * Math.PI) / 180) * len * HC_PX) });
  const h = tip(heading, Math.max(speed, 1));
  const c = tip(g.cog, g.sog);
  const diff = ((g.cog - heading + 540) % 360) - 180;
  const curEnd = { x: r2(60 + Math.sin((set * Math.PI) / 180) * Math.max(rate, 0.3) * 18), y: r2(340 - Math.cos((set * Math.PI) / 180) * Math.max(rate, 0.3) * 18) };

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
      <div className="self-start rounded-xl bg-navy p-2">
        <svg viewBox="0 0 400 400" className="block h-auto w-full" role="img" aria-label={`Heading ${formatBearing(heading, "T")}, course over the ground ${formatBearing(g.cog, "T")} at ${one(g.sog)} knots.`}>
          <rect width={400} height={400} fill="#0e2a44" rx={12} />
          <text x={HC} y={22} textAnchor="middle" fontSize={14} fontWeight={700} fill="#cfe1f2">N</text>
          <line x1={HC} y1={30} x2={HC} y2={370} stroke="#2f4f6e" strokeWidth={1} />
          <line x1={30} y1={HC} x2={370} y2={HC} stroke="#2f4f6e" strokeWidth={1} />
          <line x1={HC} y1={HC} x2={h.x} y2={h.y} stroke="#e5e7eb" strokeWidth={3} strokeDasharray="7 5" />
          {g.sog > 0.05 && (
            <g stroke="#fbbf24" strokeWidth={4} fill="none" strokeLinecap="round">
              <line x1={HC} y1={HC} x2={c.x} y2={c.y} />
              <path d={arrowHead(c.x, c.y, g.cog)} />
            </g>
          )}
          <g transform={`translate(${HC} ${HC}) rotate(${heading}) scale(0.5)`}>
            <path d="M0 -60 C 22 -38 26 -5 24 30 C 23 45 18 55 14 58 L -14 58 C -18 55 -23 45 -24 30 C -26 -5 -22 -38 0 -60 Z" fill="#f4f1ea" stroke="#5b5348" strokeWidth={3} />
          </g>
          {rate > 0 && (
            <g stroke="#60a5fa" strokeWidth={3} fill="none" strokeLinecap="round">
              <line x1={60} y1={340} x2={curEnd.x} y2={curEnd.y} />
              <path d={arrowHead(curEnd.x, curEnd.y, set, 9)} />
            </g>
          )}
          <text x={60} y={385} textAnchor="middle" fontSize={12} fill="#93c5fd">Current</text>
          <text x={392} y={366} textAnchor="end" fontSize={12} fill="#e5e7eb">Dashed: heading</text>
          <text x={392} y={384} textAnchor="end" fontSize={12} fill="#fbbf24">Arrow: course over the ground</text>
        </svg>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-navy p-3 text-white">
          {[
            ["Heading", formatBearing(heading, "T"), "compass"],
            ["Speed through water", `${one(speed)} kn`, "log"],
            ["Course over ground", g.sog > 0.05 ? formatBearing(g.cog, "T") : "---", "satellites"],
            ["Speed over ground", `${one(g.sog)} kn`, "satellites"],
          ].map(([label, value, hint]) => (
            <div key={label} className="rounded-md bg-white/5 px-2.5 py-1.5">
              <p className="text-[11px] font-semibold tracking-wide text-white/70 uppercase">{label}</p>
              <p className="font-mono text-lg leading-tight font-bold">{value}</p>
              <p className="text-[11px] text-white/60">{hint}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-text-primary" aria-live="polite">
          {Math.abs(diff) < 1
            ? "Bow and track agree: no current or leeway across your course."
            : <>You are moving <strong>{Math.abs(Math.round(diff))}° to {diff > 0 ? "starboard" : "port"}</strong> of where the bow points. The plotter&apos;s course line shows the real track.</>}
        </p>
        <Slider id="hc-heading" label="Heading" value={heading} min={0} max={355} step={5} text={formatBearing(heading, "T")} onChange={setHeading} />
        <Slider id="hc-speed" label="Speed through the water" value={speed} min={1} max={8} step={0.5} text={`${one(speed)} kn`} onChange={setSpeed} />
        <Slider id="hc-set" label="Current flows towards" value={set} min={0} max={355} step={5} text={formatBearing(set, "T")} onChange={setSet} />
        <Slider id="hc-rate" label="Current strength" value={rate} min={0} max={3} step={0.5} text={`${one(rate)} kn`} onChange={setRate} />
        <Slider id="hc-leeway" label="Leeway (wind pushing you sideways)" value={leeway} min={-10} max={10} step={1} text={leeway === 0 ? "none" : `${Math.abs(leeway)}° to ${leeway > 0 ? "starboard" : "port"}`} onChange={setLeeway} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Good or bad waypoint? (ported)                                    */
/* ------------------------------------------------------------------ */

export function WaypointQuiz() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const c = CANDIDATES[index]!;
  const chosen = answers[c.id];
  const answered = chosen !== undefined;
  const right = answered && chosen === c.good;
  const score = CANDIDATES.filter((k) => answers[k.id] !== undefined && answers[k.id] === k.good).length;
  const done = Object.keys(answers).length;
  const view = useMemo<ViewRect>(() => viewAround(c.at, 7, 4 / 3), [c.at]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose a waypoint to judge">
        {CANDIDATES.map((k, i) => {
          const a = answers[k.id];
          const mark = a === undefined ? "" : a === k.good ? " ✓" : " ✗";
          return (
            <button
              key={k.id}
              type="button"
              aria-pressed={i === index}
              aria-label={`Waypoint ${i + 1}${a === undefined ? "" : a === k.good ? ", answered correctly" : ", answered wrongly"}`}
              onClick={() => setIndex(i)}
              className={`${i === index ? btnOn : btnOff} min-w-11 px-2.5 py-1.5`}
            >
              {i + 1}{mark}
            </button>
          );
        })}
      </div>

      <PracticeChart view={view} zoomable title={`Practice chart showing proposed waypoint ${index + 1}`}>
        <WaypointMark at={c.at} label={`WP ${index + 1}`} size={9} labelSize={13} strike={answered && !c.good} colour={answered ? (c.good ? "#15803d" : "#b91c1c") : ROUTE_COLOUR} />
      </PracticeChart>

      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-sm text-text-secondary">Proposed waypoint {index + 1} of {CANDIDATES.length}</p>
        <p className="font-semibold text-text-primary">{c.label}</p>
        <p className="font-mono text-xs text-text-secondary">{formatPosition(c.at, 2)}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" disabled={answered} onClick={() => setAnswers((a) => ({ ...a, [c.id]: true }))} className={btnOff}>
            <ThumbsUp size={16} strokeWidth={1.5} className="mr-1.5 inline-block align-[-3px]" aria-hidden="true" />Good waypoint
          </button>
          <button type="button" disabled={answered} onClick={() => setAnswers((a) => ({ ...a, [c.id]: false }))} className={btnOff}>
            <ThumbsDown size={16} strokeWidth={1.5} className="mr-1.5 inline-block align-[-3px]" aria-hidden="true" />Bad waypoint
          </button>
        </div>
        <div aria-live="polite">
          {answered && (
            <div className={`mt-2 rounded-md px-3 py-2 text-sm ${right ? "bg-success-bg" : "bg-danger/10"}`}>
              <p className="font-semibold">{right ? "✓ Right" : "✗ Not quite"}: {c.good ? "a good waypoint." : "a bad waypoint."}</p>
              <p>{c.why}</p>
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {index < CANDIDATES.length - 1 && <button type="button" onClick={() => setIndex(index + 1)} className={btnOn}>Next waypoint →</button>}
          <span className="text-sm text-text-secondary">{score} right out of {done} judged</span>
          {done > 0 && <button type="button" onClick={() => { setAnswers({}); setIndex(0); }} className="text-sm font-medium text-teal underline">Start again</button>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. AIS target: CPA and TCPA (ported)                                 */
/* ------------------------------------------------------------------ */

const PRESETS: Array<{ label: string; own: Motion; target: AisTarget }> = [
  { label: "Crossing ferry", own: AIS_OWN, target: AIS_FERRY },
  { label: "Head-on", own: AIS_OWN, target: { bearing: 0, range: 6, course: 180, speed: 12 } },
  { label: "Overtaking you", own: AIS_OWN, target: { bearing: 185, range: 3, course: 0, speed: 15 } },
  { label: "Passing ahead", own: AIS_OWN, target: { bearing: 50, range: 5, course: 265, speed: 15 } },
];

const PLOT = 400;
const MID = PLOT / 2;
const MAX_RANGE = 8;
const PX = (MID - 22) / MAX_RANGE;

function plotXY(e: number, n: number) {
  return { x: r2(MID + e * PX), y: r2(MID - n * PX) };
}

/** An AIS-style target: a triangle pointing along its course. */
function TargetSymbol({ x, y, course, colour, hollow }: { x: number; y: number; course: number; colour: string; hollow?: boolean }) {
  return <polygon points="0,-13 8,9 -8,9" transform={`translate(${x} ${y}) rotate(${r2(course)})`} fill={hollow ? "none" : colour} stroke={colour} strokeWidth={2} strokeDasharray={hollow ? "3 2" : undefined} />;
}

const pad3 = (v: number) => String(v).padStart(3, "0");

export function AisCpa() {
  const [own, setOwn] = useState<Motion>(AIS_OWN);
  const [tgt, setTgt] = useState<AisTarget>(AIS_FERRY);
  const res = closestApproach(own, tgt);
  const later = bearingAfter(own, tgt, 6);
  const closing = later.range < tgt.range;
  const db = ((later.bearing - tgt.bearing + 540) % 360) - 180;
  const tcpa = res.tcpa;
  const future = tcpa !== null && tcpa > 0 ? Math.min(tcpa, 90) / 60 : 0;
  const ownV = { e: own.speed * Math.sin((own.course * Math.PI) / 180), n: own.speed * Math.cos((own.course * Math.PI) / 180) };
  const tgtV = { e: tgt.speed * Math.sin((tgt.course * Math.PI) / 180), n: tgt.speed * Math.cos((tgt.course * Math.PI) / 180) };
  const o0 = plotXY(0, 0);
  const t0 = plotXY(res.rel.e, res.rel.n);
  const o1 = plotXY(ownV.e * future, ownV.n * future);
  const t1 = plotXY(res.rel.e + tgtV.e * future, res.rel.n + tgtV.n * future);
  const danger = tcpa !== null && tcpa > 0 && res.cpa < 1;
  const steady = closing && Math.abs(db) < 2;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Example situations">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" onClick={() => { setOwn(p.own); setTgt(p.target); }} className={`${btnOff} px-2.5 py-1.5`}>{p.label}</button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <div className="self-start rounded-xl bg-navy p-2">
          <svg viewBox={`0 0 ${PLOT} ${PLOT}`} className="block h-auto w-full" role="img" aria-label={`North-up plot: target bearing ${formatBearing(tgt.bearing, "T")}, ${tgt.range.toFixed(1)} miles. Closest approach ${res.cpa.toFixed(1)} miles${tcpa !== null && tcpa > 0 ? ` in ${Math.round(tcpa)} minutes` : ""}.`}>
            <defs>
              <clipPath id="ais-clip-l12"><circle cx={MID} cy={MID} r={MID - 4} /></clipPath>
            </defs>
            <circle cx={MID} cy={MID} r={MID - 4} fill="#0e2a44" />
            {[2, 4, 6, 8].map((r) => (
              <g key={r}>
                <circle cx={MID} cy={MID} r={r * PX} fill="none" stroke="#2f4f6e" strokeWidth={1} />
                <text x={MID + 4} y={r2(MID + r * PX - 4)} fontSize={11} fill="#7f9bb8">{r} M</text>
              </g>
            ))}
            <text x={MID} y={16} textAnchor="middle" fontSize={12} fontWeight={700} fill="#cfe1f2">N</text>
            <g clipPath="url(#ais-clip-l12)">
              {future > 0 && (
                <>
                  <line x1={o0.x} y1={o0.y} x2={o1.x} y2={o1.y} stroke="#5eead4" strokeWidth={2} strokeDasharray="5 4" />
                  <line x1={t0.x} y1={t0.y} x2={t1.x} y2={t1.y} stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 4" />
                  <line x1={o1.x} y1={o1.y} x2={t1.x} y2={t1.y} stroke={danger ? "#f87171" : "#e5e7eb"} strokeWidth={2.5} />
                  <TargetSymbol x={t1.x} y={t1.y} course={tgt.course} colour="#fbbf24" hollow />
                  <circle cx={o1.x} cy={o1.y} r={7} fill="none" stroke="#5eead4" strokeWidth={2} strokeDasharray="3 2" />
                </>
              )}
              <TargetSymbol x={t0.x} y={t0.y} course={tgt.course} colour="#fbbf24" />
            </g>
            <circle cx={o0.x} cy={o0.y} r={7} fill="#5eead4" />
            <text x={o0.x + 10} y={o0.y + 18} fontSize={12} fontWeight={700} fill="#5eead4">You</text>
            <text x={r2(t0.x + 12)} y={r2(t0.y - 10)} fontSize={12} fontWeight={700} fill="#fbbf24">Target</text>
          </svg>
          <p className="px-1 pt-1 text-[11px] leading-snug text-white/70">North-up, you at the centre, rings every 2 miles. Dashed lines: both tracks until the closest approach; the solid line joins the two boats at that moment.</p>
        </div>

        <div className="space-y-2">
          <div className={`rounded-xl p-3 ${danger ? "bg-danger/10 ring-1 ring-danger/40" : "bg-card ring-1 ring-border"}`} aria-live="polite">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <p><span className="text-xs font-semibold text-text-secondary uppercase">Closest approach (CPA)</span><br /><span className="font-mono text-2xl font-bold">{res.cpa.toFixed(1)} M</span></p>
              <p>
                <span className="text-xs font-semibold text-text-secondary uppercase">Time to it (TCPA)</span><br />
                <span className="font-mono text-2xl font-bold">{tcpa === null ? "—" : tcpa > 0 ? `${Math.round(tcpa)} min` : "passed"}</span>
              </p>
            </div>
            <p className="mt-1 text-sm">
              Bearing {formatBearing(tgt.bearing, "T")} now, {formatBearing(later.bearing, "T")} in 6 min; range {tgt.range.toFixed(1)} → {later.range.toFixed(1)} M.{" "}
              {tcpa === null
                ? "No relative motion: she stays the same distance away."
                : !closing
                  ? "Range opening: she is moving away."
                  : steady
                    ? <strong>Steady bearing, closing range: risk of collision.</strong>
                    : `Bearing changing ${Math.abs(db).toFixed(0)}° in 6 min.`}
            </p>
            {danger && <p className="mt-1 text-sm font-semibold text-danger">Under a mile: check it by eye and with a compass bearing, and act early and obviously under the rules of the road.</p>}
          </div>
          <fieldset className="grid gap-x-4 sm:grid-cols-2">
            <legend className="mb-1 text-sm font-semibold text-text-primary">You</legend>
            <Slider id="ais-own-cog" label="Your course" value={own.course} min={0} max={355} step={5} text={`${pad3(own.course)}°T`} onChange={(v) => setOwn({ ...own, course: v })} />
            <Slider id="ais-own-sog" label="Your speed" value={own.speed} min={0} max={10} step={0.5} text={`${own.speed.toFixed(1)} kn`} onChange={(v) => setOwn({ ...own, speed: v })} />
          </fieldset>
          <fieldset className="grid gap-x-4 sm:grid-cols-2">
            <legend className="mb-1 text-sm font-semibold text-text-primary">The other ship (from AIS)</legend>
            <Slider id="ais-brg" label="Bearing from you" value={tgt.bearing} min={0} max={355} step={5} text={`${pad3(tgt.bearing)}°T`} onChange={(v) => setTgt({ ...tgt, bearing: v })} />
            <Slider id="ais-range" label="Range" value={tgt.range} min={0.5} max={MAX_RANGE} step={0.5} text={`${tgt.range.toFixed(1)} M`} onChange={(v) => setTgt({ ...tgt, range: v })} />
            <Slider id="ais-cog" label="Her course" value={tgt.course} min={0} max={355} step={5} text={`${pad3(tgt.course)}°T`} onChange={(v) => setTgt({ ...tgt, course: v })} />
            <Slider id="ais-sog" label="Her speed" value={tgt.speed} min={0} max={30} step={1} text={`${tgt.speed} kn`} onChange={(v) => setTgt({ ...tgt, speed: v })} />
          </fieldset>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. The week planner                                                  */
/* ------------------------------------------------------------------ */

const DEPARTS = [9 * 60, 10 * 60, 11 * 60];

export function WeekPlanner({ weeks }: { weeks: Week[] }) {
  const [id, setId] = useState(weeks[0]?.id ?? "");
  const [stay, setStay] = useState<boolean[]>(DAYS.map(() => false));
  const [speed, setSpeed] = useState(5);
  const [depart, setDepart] = useState(10 * 60);
  const week = weeks.find((w) => w.id === id) ?? weeks[0];
  if (!week) return null;
  const plan = planWeek(week, stay);
  const sailingDays = plan.filter((d) => !d.stay).length;
  const longest = Math.max(...plan.map((d) => d.nm));
  const thursday = plan[4]!;
  const thursdayLeg = week.legs.find((l) => l.to === thursday.at);
  const thursdayFromBase = thursday.at === week.base ? 0 : (thursdayLeg?.fromBase ?? 0);
  const far = week.legs.slice(0, -1).reduce((a, l, i) => (l.fromBase > a.d ? { d: l.fromBase, i } : a), { d: -1, i: 0 });
  const warnings: string[] = [];
  if (sailingDays === 0) warnings.push("Every day in port: you would not leave the base. Pick fewer days.");
  for (const d of plan) {
    if (d.nm > LONG_DAY_NM) warnings.push(`${d.day}: up to ${d.nm} miles, about ${hm((d.nm / speed) * 60)} at sea. Too long for a holiday crew: change the route, not just the timetable.`);
  }
  if (stay[5]) warnings.push("Friday in port means getting back to the base on Thursday. Tell the base, and plan the last two legs as one.");
  const sat = (minutes: number) => clock(depart + minutes);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 max-w-full text-sm font-semibold text-text-primary">
          Cruising area
          <select value={week.id} onChange={(e) => { setId(e.target.value); setStay(DAYS.map(() => false)); }} className="mt-1 block w-full max-w-full rounded-md border border-border bg-white px-2 py-2 text-sm text-text-primary focus:border-teal focus:ring-2 focus:ring-teal/30 focus:outline-none">
            {weeks.map((w) => <option key={w.id} value={w.id}>{w.name}, {w.country} (from {w.base})</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-text-primary">
          Leave at
          <select value={depart} onChange={(e) => setDepart(Number(e.target.value))} className="mt-1 block rounded-md border border-border bg-white px-2 py-2 text-sm text-text-primary focus:border-teal focus:ring-2 focus:ring-teal/30 focus:outline-none">
            {DEPARTS.map((d) => <option key={d} value={d}>{clock(d)}</option>)}
          </select>
        </label>
        <div className="min-w-48 flex-1">
          <Slider id="wk-speed" label="Average speed, stops excluded" value={speed} min={4} max={7} step={0.5} text={`${one(speed)} kn`} onChange={setSpeed} />
        </div>
      </div>

      <fieldset className="flex flex-wrap items-center gap-1.5">
        <legend className="mb-1 text-sm font-semibold text-text-primary">Days in port (rest or weather): tap to toggle</legend>
        {DAYS.map((d, i) => (
          <button key={d} type="button" aria-pressed={stay[i]} onClick={() => setStay((s) => s.map((v, k) => (k === i ? !v : v)))} className={`${stay[i] ? btnOn : btnOff} min-w-14 px-2.5 py-1.5`}>
            {d.slice(0, 3)}
          </button>
        ))}
      </fieldset>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg text-xs text-text-secondary">
            <tr>
              <th className="px-2 py-1.5">Day</th>
              <th className="px-2 py-1.5">Plan</th>
              <th className="px-2 py-1.5 text-right">Miles</th>
              <th className="px-2 py-1.5 text-right">At sea</th>
              <th className="px-2 py-1.5 text-right">Arrive</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border text-text-secondary">
              <td className="px-2 py-1.5">Saturday</td>
              <td className="px-2 py-1.5" colSpan={4}>Check in at {week.baseMarina}: briefing, shopping, first night in the marina</td>
            </tr>
            {plan.map((d) => (
              <tr key={d.day} className={`border-t border-border ${d.nm > LONG_DAY_NM ? "bg-warning-bg" : ""}`}>
                <td className="px-2 py-1.5 font-semibold">{d.day}</td>
                <td className="px-2 py-1.5">
                  {d.legs.length === 0
                    ? <span className="text-text-secondary">In port at {d.at}</span>
                    : <>{week.legs[d.legs[0]!]!.from} → {d.legs.length > 1 && <span className="text-text-secondary">({d.legs.slice(0, -1).map((k) => week.legs[k]!.to.split(",")[0]).join(", ")}) → </span>}{d.at}</>}
                </td>
                <td className="px-2 py-1.5 text-right font-mono">{d.nm || "–"}</td>
                <td className="px-2 py-1.5 text-right font-mono">{d.nm ? hm((d.nm / speed) * 60) : "–"}</td>
                <td className="px-2 py-1.5 text-right font-mono">{d.nm ? sat((d.nm / speed) * 60) : "–"}</td>
              </tr>
            ))}
            <tr className="border-t border-border text-text-secondary">
              <td className="px-2 py-1.5">Saturday</td>
              <td className="px-2 py-1.5" colSpan={4}>Check out, usually by nine in the morning</td>
            </tr>
            <tr className="border-t border-border bg-bg font-semibold">
              <td className="px-2 py-1.5">Week</td>
              <td className="px-2 py-1.5">{sailingDays} sailing days</td>
              <td className="px-2 py-1.5 text-right font-mono">{week.total}</td>
              <td className="px-2 py-1.5 text-right font-mono">{hm((week.total / speed) * 60)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      <div aria-live="polite" className="space-y-2 text-sm">
        <p>
          Furthest night from the base: <strong>{week.legs[far.i]!.to}</strong>, about {far.d} miles in a straight line, on {week.legs[far.i]!.day}.
          {" "}Thursday night: <strong>{thursday.at}</strong>, {thursdayFromBase ? `about ${thursdayFromBase} miles from the base` : "already at the base"}. Longest day: {longest} miles.
        </p>
        {warnings.length > 0 ? (
          <ul className="list-disc space-y-0.5 rounded-lg bg-warning-bg py-2 pr-3 pl-8">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        ) : (
          <p className="rounded-lg bg-success-bg px-3 py-2">No day over {LONG_DAY_NM} miles, and you are back at {week.base} on Friday. Leave a little slack anyway: the forecast will change.</p>
        )}
      </div>
      <p className="text-xs text-text-secondary">
        Distances are the approximate planning figures from our cruising guides. When legs are combined the miles shown are the most it could be:
        going direct and skipping a stop is often shorter. Miles from the base are straight lines, not sailing distances.
      </p>
    </div>
  );
}
