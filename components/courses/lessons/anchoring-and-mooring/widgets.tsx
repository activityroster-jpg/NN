"use client";

// Interactive widgets for Lesson 9: a scope calculator (how much chain for
// the depth, the bow height, the tide and the forecast) and the practice
// cove, where you drop the anchor and see your swinging circle against the
// seabed, the swimming area and the boats already there.

import { useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";
import { AnchoredBoat, CoveMap, ScopeSide, WindArrow, COVE_COLOURS } from "./art";
import {
  BOAT, COVE_H, COVE_W, GOOD_SPOT, POINTS, POINT_DEG, POINT_WORD, SCOPE_RULES, SEABED_TEXT, checkSpot, chainFor, r1, scopeDepth,
  swingRadius, type Conditions, type P, type Point8,
} from "./data";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300";
const SEG = `min-h-11 rounded-control border px-3 py-1.5 text-sm font-semibold transition-colors ${FOCUS}`;
const segClass = (on: boolean) => `${SEG} ${on ? "border-teal bg-teal-light text-teal-800" : "border-border bg-white text-text-primary hover:border-teal-300 hover:bg-teal-50"}`;

function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="block text-sm font-semibold text-text-primary">{children}</label>;
}

function Slider({ id, label, value, min, max, step, unit, onChange }: {
  id: string; label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}: <span className="tabular-nums">{value} {unit}</span></Label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={`h-11 w-full accent-teal ${FOCUS}`} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Scope calculator                                                  */
/* ------------------------------------------------------------------ */

const CHAIN_CARRIED = [40, 50, 60, 80];

export function ScopeCalculator() {
  const [depth, setDepth] = useState(8);
  const [bow, setBow] = useState(BOAT.bow);
  const [tide, setTide] = useState(0);
  const [conditions, setConditions] = useState<Conditions>("breezy");
  const [carried, setCarried] = useState(50);
  const rule = SCOPE_RULES[conditions];
  const vertical = scopeDepth(depth, bow, tide);
  const chain = chainFor(depth, rule.ratio, bow, tide);
  const short = chain > carried;
  return (
    <div className="space-y-4">
      <div className="grid gap-x-6 gap-y-2 sm:grid-cols-3">
        <Slider id="sc-depth" label="Depth on the sounder" value={depth} min={2} max={20} step={0.5} unit="m" onChange={setDepth} />
        <Slider id="sc-bow" label="Height of the bow roller" value={bow} min={0.5} max={2} step={0.5} unit="m" onChange={setBow} />
        <Slider id="sc-tide" label="Tide still to rise" value={tide} min={0} max={3} step={0.5} unit="m" onChange={setTide} />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">The forecast for tonight</p>
        <div role="group" aria-label="Conditions" className="mt-1.5 flex flex-wrap gap-2">
          {(Object.keys(SCOPE_RULES) as Conditions[]).map((c) => (
            <button key={c} type="button" className={segClass(c === conditions)} aria-pressed={c === conditions} onClick={() => setConditions(c)}>
              {SCOPE_RULES[c].label} · {SCOPE_RULES[c].ratio}×
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">Chain on board</p>
        <div role="group" aria-label="Chain on board" className="mt-1.5 flex flex-wrap gap-2">
          {CHAIN_CARRIED.map((c) => (
            <button key={c} type="button" className={`${segClass(c === carried)} tabular-nums`} aria-pressed={c === carried} onClick={() => setCarried(c)}>
              {c} m
            </button>
          ))}
        </div>
      </div>
      <svg viewBox="0 0 800 300" className="w-full rounded-card border border-border bg-white" role="img" aria-label={`Side view: ${chain} metres of chain in ${depth} metres of water`}>
        <ScopeSide w={800} h={300} depth={depth} bow={bow} tide={tide} chain={Math.min(chain, carried)} colour={short ? "#b91c1c" : COVE_COLOURS.you} />
      </svg>
      <div className={`rounded-card border p-3 ${short ? "border-warning bg-warning-bg" : "border-border bg-bg"}`} aria-live="polite">
        <p className="text-sm leading-relaxed text-text-primary tabular-nums">
          {depth} m depth + {bow} m bow{tide ? ` + ${tide} m tide to come` : ""} = <strong>{r1(vertical)} m</strong>. {rule.ratio} × {r1(vertical)} = {r1(vertical * rule.ratio)} m, so let out{" "}
          <strong>{chain} m</strong> (rounded up to the next mark).
        </p>
        <p className="mt-1 text-sm text-text-secondary tabular-nums">
          Swinging circle: about {swingRadius(chain)} m radius ({chain} m of chain + {BOAT.length} m of boat). {rule.note}
        </p>
        {short && (
          <p className="mt-2 flex gap-2 text-sm font-semibold text-warning-text">
            <TriangleAlert size={18} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden="true" />
            You only carry {carried} m: that is {r1(carried / vertical)} times the depth. Find shallower water.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Swinging room in the practice cove                                */
/* ------------------------------------------------------------------ */

const RATIOS = [3, 4, 5, 7];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function SwingingRoom() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [anchor, setAnchor] = useState<P | null>(null);
  const [ratio, setRatio] = useState(5);
  const [wind, setWind] = useState<Point8>("N");
  const windFrom = POINT_DEG[wind];
  const check = anchor ? checkSpot(anchor, ratio, wind) : null;

  function drop(e: MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    setAnchor({ x: Math.round(clamp(pt.x, 0, COVE_W)), y: Math.round(clamp(pt.y, 0, COVE_H)) });
  }

  function onKey(e: KeyboardEvent<SVGSVGElement>) {
    const step = e.shiftKey ? 20 : 5;
    const moves: Record<string, [number, number]> = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] };
    const mv = moves[e.key];
    if (!mv) return;
    e.preventDefault();
    const from = anchor ?? GOOD_SPOT;
    setAnchor({ x: clamp(from.x + mv[0], 0, COVE_W), y: clamp(from.y + mv[1], 0, COVE_H) });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">Scope</p>
          <div role="group" aria-label="Scope" className="mt-1.5 flex flex-wrap gap-1.5">
            {RATIOS.map((r) => (
              <button key={r} type="button" className={`${segClass(r === ratio)} min-w-11 tabular-nums`} aria-pressed={r === ratio} onClick={() => setRatio(r)}>
                {r}×
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">Wind from</p>
          <div role="group" aria-label="Wind direction" className="mt-1.5 flex flex-wrap gap-1.5">
            {POINTS.map((p) => (
              <button key={p} type="button" className={`${segClass(p === wind)} min-w-11 px-2`} aria-pressed={p === wind} aria-label={`Wind from the ${POINT_WORD[p]}`} onClick={() => setWind(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${COVE_W} ${COVE_H}`}
        className={`w-full cursor-crosshair touch-manipulation rounded-card border border-border ${FOCUS}`}
        role="application"
        aria-label="The practice cove. Tap to drop your anchor, or use the arrow keys to move it."
        tabIndex={0}
        onClick={drop}
        onKeyDown={onKey}
      >
        <CoveMap windFrom={windFrom}>
          {anchor && check && (
            <AnchoredBoat anchor={anchor} chain={check.chain} windFrom={windFrom} colour={check.problems.length ? "#b91c1c" : COVE_COLOURS.you} />
          )}
          <g transform="translate(345 30)">
            <circle r={24} fill="rgba(255,255,255,0.8)" />
            <WindArrow at={{ x: 0, y: 0 }} from={windFrom} length={34} width={3} head={10} />
            <text y={36} fontSize={9} fontWeight={700} textAnchor="middle" fill={COVE_COLOURS.ink}>Wind</text>
          </g>
        </CoveMap>
      </svg>
      <div className="rounded-card border border-border bg-bg p-3 text-sm leading-relaxed" aria-live="polite">
        {!anchor || !check ? (
          <p className="text-text-secondary">Tap the cove where you would drop the anchor. You are a {BOAT.length}-metre yacht drawing {BOAT.draft} metres.</p>
        ) : (
          <>
            <p className="font-semibold text-navy tabular-nums">
              {r1(check.depth)} m deep · {SEABED_TEXT[check.seabed]} · {check.chain} m of chain at {ratio}× · circle {check.radius} m radius
            </p>
            <ul className="not-lesson mt-2 space-y-1.5">
              {check.problems.map((p) => (
                <li key={p} className="flex gap-2 text-text-primary"><CircleX size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-warning-text" aria-hidden="true" />{p}</li>
              ))}
              {check.warnings.map((p) => (
                <li key={p} className="flex gap-2 text-text-primary"><TriangleAlert size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-warning-text" aria-hidden="true" />{p}</li>
              ))}
              {!check.problems.length && (
                <li className="flex gap-2 font-semibold text-success-text"><CircleCheck size={18} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden="true" />A good spot. Now dig the anchor in and check a transit.</li>
              )}
            </ul>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={segClass(false)} onClick={() => { setAnchor(GOOD_SPOT); setRatio(4); setWind("N"); }}>Show me a good spot</button>
        {anchor && <button type="button" className={segClass(false)} onClick={() => setAnchor(null)}>Lift the anchor</button>}
      </div>
    </div>
  );
}
