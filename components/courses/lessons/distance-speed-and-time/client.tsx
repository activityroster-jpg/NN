"use client";

// Lesson 3, "Distance, speed and time": the video scenes, the exercises
// and the practice generator. Scene art and many questions are ported from
// the Boaty Jobs lessons measuring-distance and speed-time-and-distance;
// the charter-day scenes and questions are new.

import type { ReactNode } from "react";
import { Clock, MapPin, Timer } from "lucide-react";
import { rhumbBearing, rhumbDestination, rhumbDistance, type LatLon } from "@/lib/courses/geo";
import { CHART_MARGIN, PLOT_WIDTH, lerpView, project, r2, viewAround, viewBoxString, type Pt, type ViewRect } from "@/lib/courses/navigation/chart-geometry";
import { CHART_BOUNDS, feature, km } from "@/lib/courses/navigation/practice-chart";
import { choices, pick, randInt, randStep, shuffle, type Rng } from "@/lib/courses/random";
import { ExerciseSet, type PracticeGenerator, type Question } from "../../Exercises";
import LessonPlayer, { SceneTitle, Stage, fade, phase, splitSentences, type Scene } from "../../LessonPlayer";
import PracticeChart, { CHART_COLOURS, ChartLine } from "../../PracticeChart";
import { ART, ChartBanner, Lines, SceneIcon, Yacht } from "../../scene-art";
import { DividersArt, HaloLabel, LabelBox, hingeFor, lerpPt, rotateAbout } from "./art";
import { DEMO, LON_MINUTE_NM, ROUTE, ROUTE_LEGS, ROUTE_TOTAL, WALK_LEG, midpoint, nm1 } from "./data";
import { clock, hm, num, round1 } from "./maths";
import { distanceSpeedAndTime as SCRIPT } from "./script";

/* ------------------------------------------------------------------ */
/* Scene helpers                                                       */
/* ------------------------------------------------------------------ */

const DEG = Math.PI / 180;
const X0 = CHART_MARGIN;
const X1 = CHART_MARGIN + PLOT_WIDTH;
const Y0 = CHART_MARGIN;
const ORANGE = CHART_COLOURS.plotAlt;
const GREEN = CHART_COLOURS.plot;
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** Pair a scripted scene with its visual. */
const scene = (i: number, render: Scene["render"]): Scene => ({ ...SCRIPT.scenes[i]!, render });

/** Show an element from narration sentence `from` onwards. */
const on = (sentence: number, from: number) => (sentence >= from ? 1 : 0);

/**
 * Progress through sentence k of scene i: 0 before it, 1 after it, and an
 * eased 0 → 1 over the fraction [a, b] of it while it is spoken.
 */
function beats(i: number) {
  const ss = splitSentences(SCRIPT.scenes[i]!.narration);
  const total = ss.reduce((n, s) => n + s.length, 0) || 1;
  let acc = 0;
  const spans = ss.map((s) => {
    const span: [number, number] = [acc / total, (acc + s.length) / total];
    acc += s.length;
    return span;
  });
  return (t: number, sentence: number, k: number, a = 0, b = 1) => {
    if (sentence < k) return 0;
    if (sentence > k) return 1;
    const [s0, s1] = spans[k] ?? [0, 1];
    return phase((t - s0) / (s1 - s0 || 1), a, b);
  };
}

/** The practice chart filling the player, with clipped overlays and an unclipped layer on top. */
function ChartStage({ view, highlight, children, over, banner }: {
  view: ViewRect; highlight?: string[]; children?: ReactNode; over?: ReactNode; banner?: ReactNode;
}) {
  return (
    <div className="absolute inset-0 bg-white">
      <PracticeChart fill view={view} highlight={highlight}>{children}</PracticeChart>
      {over && (
        <svg viewBox={viewBoxString(view)} preserveAspectRatio="xMidYMid meet" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <g fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif">{over}</g>
        </svg>
      )}
      {banner && <ChartBanner>{banner}</ChartBanner>}
    </div>
  );
}

const latY = (minPast49: number) => project({ lat: 49 + minPast49 / 60, lon: CHART_BOUNDS.west }).y;
const lonX = (minW: number) => project({ lat: CHART_BOUNDS.south, lon: -(4 + minW / 60) }).x;

/** Dividers carried rigidly: centre c, angle a (degrees), spread s. */
function spanAt(c: Pt, a: number, s: number): { p: Pt; q: Pt } {
  const ux = Math.cos(a * DEG);
  const uy = Math.sin(a * DEG);
  return { p: { x: c.x - (ux * s) / 2, y: c.y - (uy * s) / 2 }, q: { x: c.x + (ux * s) / 2, y: c.y + (uy * s) / 2 } };
}

/** Label offset to the right of a leg's direction of travel. */
function besideLeg(from: LatLon, to: LatLon, off: number, along = 0.5): Pt {
  const a = project(from);
  const b = project(to);
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: a.x + (b.x - a.x) * along - ((b.y - a.y) / len) * off, y: a.y + (b.y - a.y) * along + ((b.x - a.x) / len) * off };
}

/** An analogue clock face showing minutes after midnight. */
function ClockFace({ x, y, r, minutes }: { x: number; y: number; r: number; minutes: number }) {
  const hourA = ((((minutes / 60) % 12) * 30 - 90) * Math.PI) / 180;
  const minA = (((minutes % 60) * 6 - 90) * Math.PI) / 180;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#f8f4e8" stroke={ART.tealBright} strokeWidth={8} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return <line key={i} x1={x + Math.sin(a) * r * 0.82} y1={y - Math.cos(a) * r * 0.82} x2={x + Math.sin(a) * r * 0.94} y2={y - Math.cos(a) * r * 0.94} stroke={ART.navy} strokeWidth={i % 3 === 0 ? 8 : 4} />;
      })}
      <line x1={x} y1={y} x2={x + Math.cos(hourA) * r * 0.5} y2={y + Math.sin(hourA) * r * 0.5} stroke={ART.navy} strokeWidth={14} strokeLinecap="round" />
      <line x1={x} y1={y} x2={x + Math.cos(minA) * r * 0.78} y2={y + Math.sin(minA) * r * 0.78} stroke={ART.navy} strokeWidth={8} strokeLinecap="round" />
      <circle cx={x} cy={y} r={12} fill={ART.port} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Scene data                                                          */
/* ------------------------------------------------------------------ */

const B1 = beats(1);
const B2 = beats(2);
const B3 = beats(3);
const B4 = beats(4);
const B5 = beats(5);
const B6 = beats(6);
const B7 = beats(7);

// Measuring with dividers (scene 2): the Kerran Approach buoy to Mew Rock.
const DEMO_D = nm1(DEMO.distance);
const DEMO_MID = midpoint(DEMO.from.at, DEMO.to.at);
const DEMO_LOW_MIN = Math.round((DEMO_MID.lat - 49) * 60 - DEMO.distance / 2);
const PAIR_VIEW = viewAround({ lat: DEMO_MID.lat + 0.3 / 60, lon: DEMO_MID.lon }, 6.4, 16 / 9);
const SCALE_VIEW = viewAround(km(DEMO_LOW_MIN - 40 + DEMO.distance / 2 + 0.1, 20), 8, 16 / 9);
const CORNER_VIEW = viewAround(km(11.7, 2.6), 5, 16 / 9);

// Walking the dividers (scene 3).
const WALK_STEPS = Math.floor(WALK_LEG.distance);
const WALK_GAP = nm1(WALK_LEG.distance - WALK_STEPS);
const WALK_TOTAL = nm1(WALK_LEG.distance);
const WALK_VIEW = viewAround(midpoint(WALK_LEG.from.at, WALK_LEG.to.at), 10.4, 16 / 9);
const walkMark = (s: number): Pt => project(s >= WALK_LEG.distance ? WALK_LEG.to.at : rhumbDestination(WALK_LEG.from.at, WALK_LEG.bearing, s));
const LEG_READ = ROUTE_LEGS.map((l) => nm1(l.distance));
const ROUTE_TOP = project(ROUTE[3]!.at);
const ROUTE_BOTTOM = project(ROUTE[0]!.at);
const ROUTE_H = (ROUTE_BOTTOM.y - ROUTE_TOP.y) / 0.8;
const ROUTE_VIEW: ViewRect = {
  x: (ROUTE_TOP.x + ROUTE_BOTTOM.x) / 2 - (ROUTE_H * 16) / 9 / 2,
  y: ROUTE_TOP.y - 0.06 * ROUTE_H,
  w: (ROUTE_H * 16) / 9,
  h: ROUTE_H,
};

// The 60D = ST triangle (scene 4).
const TRIANGLE = { apex: [420, 175], left: [140, 610], right: [700, 610], split: 400 } as const;
const triHalf = ((TRIANGLE.split - TRIANGLE.apex[1]) / (TRIANGLE.left[1] - TRIANGLE.apex[1])) * (TRIANGLE.right[0] - TRIANGLE.apex[0]);
const TRI_CELLS = {
  D: `${TRIANGLE.apex.join(",")} ${TRIANGLE.apex[0] - triHalf},${TRIANGLE.split} ${TRIANGLE.apex[0] + triHalf},${TRIANGLE.split}`,
  S: `${TRIANGLE.apex[0] - triHalf},${TRIANGLE.split} ${TRIANGLE.apex[0]},${TRIANGLE.split} ${TRIANGLE.apex[0]},${TRIANGLE.left[1]} ${TRIANGLE.left.join(",")}`,
  T: `${TRIANGLE.apex[0]},${TRIANGLE.split} ${TRIANGLE.apex[0] + triHalf},${TRIANGLE.split} ${TRIANGLE.right.join(",")} ${TRIANGLE.apex[0]},${TRIANGLE.right[1]}`,
};

// The arrival timeline (scene 7): 0800 to 2100.
const tx = (minutes: number) => 160 + ((minutes - 8 * 60) / 60) * 100;
const SAIL = Math.round((60 * 18) / 5); // 216 min
const LEAVE = 15 * 60 - SAIL - 60; // 1024
const LEAVE_BY = Math.floor(LEAVE / 10) * 10; // 1020

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

export const SCENES: Scene[] = [
  // Sentences: 0 the three questions, 1 dividers and one rule, 2 a day that works.
  scene(0, (t, n) => {
    const lp = n === 0 ? Math.min(1, t * 3) : 1;
    const qs = [
      { icon: MapPin, text: "How far?" },
      { icon: Timer, text: "How long?" },
      { icon: Clock, text: "When?" },
    ];
    return (
      <Stage>
        <path d="M0 760 Q 400 730 800 760 T 1600 760 V900 H0 Z" fill="#123a5a" />
        <path d="M0 815 Q 400 790 800 815 T 1600 815 V900 H0 Z" fill="#0f3049" />
        <Yacht x={160 + t * 1280} y={770} heading={90} scale={1.1} />
        <text x={800} y={140} textAnchor="middle" fontSize={80} fontWeight={800} fill="#fff" opacity={fade(t, 0, 0.06)}>Distance, speed and time</text>
        <text x={800} y={210} textAnchor="middle" fontSize={42} fill={ART.tealBright} opacity={fade(t, 0.03, 0.1)}>Lesson 3 · Navigation for charter skippers</text>
        {qs.map((q, i) => (
          <g key={q.text} opacity={n > 0 ? 1 : phase(lp, 0.15 + i * 0.25, 0.25 + i * 0.25)}>
            <circle cx={400 + i * 400} cy={380} r={90} fill="rgba(43,179,192,0.15)" stroke={ART.tealBright} strokeWidth={4} />
            <SceneIcon icon={q.icon} x={400 + i * 400} y={380} size={80} />
            <text x={400 + i * 400} y={530} textAnchor="middle" fontSize={48} fontWeight={700} fill="#fff">{q.text}</text>
          </g>
        ))}
        <text x={800} y={620} textAnchor="middle" fontSize={44} fill={ART.amber} opacity={on(n, 1)}>{n === 1 ? "Dividers, and one simple rule" : "In with time for a swim, before the afternoon wind"}</text>
      </Stage>
    );
  }),

  // Sentences: 0 nautical miles, 1 one minute of latitude, 2 knots, 3 six knots for an hour.
  scene(1, (t, n) => {
    if (n <= 1) {
      const cx = 470;
      const cy = 480;
      const R = 250;
      const pt = (deg: number, r = R) => ({ x: cx + r * Math.cos(deg * DEG), y: cy - r * Math.sin(deg * DEG) });
      const a = pt(32);
      const b = pt(46);
      const w = B1(t, n, 1, 0.05, 0.35);
      const one = pt(39, 150);
      const mile = pt(39, R + 34);
      return (
        <Stage>
          <SceneTitle t={t}>The nautical mile</SceneTitle>
          <circle cx={cx} cy={cy} r={R} fill="#123a5a" stroke={ART.tealBright} strokeWidth={4} />
          <line x1={cx - R} x2={cx + R} y1={cy} y2={cy} stroke={ART.muted} strokeWidth={3} strokeDasharray="14 10" />
          <text x={cx - R + 26} y={cy - 16} fontSize={36} fill={ART.muted}>Equator</text>
          <circle cx={cx} cy={cy} r={8} fill="#fff" />
          <g opacity={w}>
            <path d={`M${cx} ${cy} L${a.x} ${a.y} A${R} ${R} 0 0 0 ${b.x} ${b.y} Z`} fill="rgba(245,179,1,0.22)" stroke={ART.amber} strokeWidth={3} />
            <path d={`M${a.x} ${a.y} A${R} ${R} 0 0 0 ${b.x} ${b.y}`} stroke={ART.amber} strokeWidth={14} fill="none" strokeLinecap="round" />
            <text x={one.x} y={one.y + 14} fontSize={44} fontWeight={800} fill={ART.amber} textAnchor="middle">1′</text>
            <text x={mile.x} y={mile.y} fontSize={52} fontWeight={800} fill={ART.amber}>1 M</text>
          </g>
          <text x={1170} y={300} textAnchor="middle" fontSize={56} fontWeight={800} fill="#fff">Nautical mile (M)</text>
          <g opacity={on(n, 1)}>
            <text x={1170} y={400} textAnchor="middle" fontSize={44} fill={ART.muted}>1′ of latitude</text>
            <text x={1170} y={500} textAnchor="middle" fontSize={64} fontWeight={800} fill={ART.amber}>= 1,852 m</text>
            <text x={1170} y={580} textAnchor="middle" fontSize={40} fill={ART.muted}>a land mile is 1,609 m</text>
          </g>
        </Stage>
      );
    }
    const run = B1(t, n, 3, 0.1, 0.6);
    const x = 200 + 1200 * run;
    return (
      <Stage>
        <SceneTitle t={t}>The knot</SceneTitle>
        <text x={800} y={230} textAnchor="middle" fontSize={60} fontWeight={800} fill={ART.tealBright}>1 knot = 1 nautical mile an hour</text>
        <line x1={200} x2={1400} y1={450} y2={450} stroke={ART.muted} strokeWidth={4} />
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i}>
            <line x1={200 + i * 200} x2={200 + i * 200} y1={430} y2={470} stroke={ART.muted} strokeWidth={4} />
            <text x={200 + i * 200} y={520} textAnchor="middle" fontSize={40} fill="#fff">{i}</text>
          </g>
        ))}
        <text x={1450} y={464} fontSize={36} fill={ART.muted}>M</text>
        <line x1={200} x2={x} y1={450} y2={450} stroke={ART.tealBright} strokeWidth={8} />
        <Yacht x={Math.max(200, x - 54)} y={385} heading={90} scale={0.9} />
        <text x={Math.max(200, x - 54)} y={318} textAnchor="middle" fontSize={44} fontWeight={700} fill={ART.amber}>6 kn</text>
        {n === 3 && <text x={800} y={610} textAnchor="middle" fontSize={48} fill="#fff">{`after ${Math.round(run * 60)} minutes: ${num(run * 6, 1)} M`}</text>}
        {n === 3 && run >= 1 && <text x={800} y={690} textAnchor="middle" fontSize={44} fontWeight={700} fill="#ff8a7a">not “knots per hour”</text>}
      </Stage>
    );
  }),

  // Sentences: 0 open the dividers, 1 carry to the latitude scale, 2 read it, 3 not the longitude scale.
  scene(2, (t, n) => {
    if (n === 3) {
      const v = CORNER_VIEW;
      const fs = r2(v.w / 38);
      const yTop = latY(51);
      const yBot = latY(50);
      const xL = lonX(2);
      const xR = lonX(1);
      const latPx = yBot - yTop;
      const lonPx = xR - xL;
      const bx = X1 - fs * 15;
      const latEnd = { x: bx + latPx / 2, y: Y0 + fs * 3.2 };
      const lonEnd = { x: bx + lonPx / 2, y: Y0 + fs * 5.4 };
      return (
        <ChartStage
          view={v}
          banner="Distance: the latitude scale only"
          over={
            <g>
              <rect x={X1} y={yTop} width={12} height={r2(latPx)} fill={ART.amber} fillOpacity={0.45} stroke={ART.amber} strokeWidth={1.5} />
              <rect x={xL} y={Y0 - 12} width={r2(lonPx)} height={12} fill="#14b8a6" fillOpacity={0.45} stroke={GREEN} strokeWidth={1.5} />
              <rect x={r2(latEnd.x - latPx / 2)} y={r2(latEnd.y - 3)} width={r2(latPx)} height={6} fill={ART.amber} opacity={B2(t, n, 3, 0.2, 0.35)} />
              <rect x={r2(lonEnd.x - lonPx / 2)} y={r2(lonEnd.y - 3)} width={r2(lonPx)} height={6} fill="#14b8a6" opacity={B2(t, n, 3, 0.4, 0.55)} />
              <g opacity={B2(t, n, 3, 0.55, 0.7)}>
                <LabelBox x={bx + latPx + fs * 0.6} y={latEnd.y + fs * 0.35} size={fs} lines={[{ text: "1′ latitude: 1 M", colour: "#b45309" }]} />
                <LabelBox x={bx + latPx + fs * 0.6} y={lonEnd.y + fs * 0.35} size={fs} lines={[{ text: `1′ longitude: ${LON_MINUTE_NM.toFixed(2)} M`, colour: GREEN }]} />
              </g>
            </g>
          }
        />
      );
    }
    const pA = project(DEMO.from.at);
    const pB = project(DEMO.to.at);
    const s = Math.hypot(pB.x - pA.x, pB.y - pA.y);
    const a0 = (Math.atan2(pB.y - pA.y, pB.x - pA.x) * 180) / Math.PI;
    const c0 = lerpPt(pA, pB, 0.5);
    const c1 = { x: X0 - 4, y: project(DEMO_MID).y };
    const c2 = { x: X0 - 4, y: latY(DEMO_LOW_MIN) - s / 2 };
    const carry = B2(t, n, 1, 0.1, 0.85);
    const slide = B2(t, n, 2, 0, 0.35);
    const view = n === 0 ? PAIR_VIEW : lerpView(PAIR_VIEW, SCALE_VIEW, carry);
    let pts: { p: Pt; q: Pt };
    if (n === 0) {
      pts = { p: pA, q: lerpPt(pA, pB, Math.max(0.03, B2(t, n, 0, 0.45, 0.85))) };
    } else {
      const c = slide > 0 ? lerpPt(c1, c2, slide) : lerpPt(c0, c1, carry);
      pts = spanAt(c, a0 + (-90 - a0) * carry, s);
    }
    const fs = r2(view.w / 34);
    const reading = n >= 2 && slide >= 1;
    return (
      <ChartStage
        view={view}
        highlight={n === 0 ? [DEMO.from.id, DEMO.to.id] : undefined}
        banner={n === 0 ? "Open the dividers" : n === 1 ? "Carry them to the latitude scale" : "Minutes of latitude = miles"}
        over={
          <g>
            {reading && <rect x={X0 - 12} y={r2(latY(DEMO_LOW_MIN) - s)} width={12} height={r2(s)} fill={ART.amber} fillOpacity={0.5} />}
            <DividersArt p={pts.p} q={pts.q} leg={(s / 2) * 1.25} side={-1} width={r2(view.w / 190)} />
            {reading && (
              <LabelBox
                x={hingeFor(pts.p, pts.q, (s / 2) * 1.25, -1).x + fs * 0.7}
                y={latY(DEMO_LOW_MIN) - s / 2 - fs * 0.25}
                size={fs}
                lines={[{ text: `${DEMO_D}′ of latitude`, colour: ORANGE }, { text: `= ${DEMO_D} M`, colour: GREEN }]}
              />
            )}
          </g>
        }
      />
    );
  }),

  // Sentences: 0 set to a mile and walk, 1 the gap, 2 several legs, 3 the plotter's route tool.
  scene(3, (t, n) => {
    if (n >= 2) {
      const v = ROUTE_VIEW;
      const fs = r2(v.w / 40);
      const w = r2(v.w / 300);
      const draw = B3(t, n, 2, 0.05, 0.6);
      const wp = project(ROUTE[2]!.at);
      return (
        <ChartStage view={v} banner={n === 2 ? "Measure each leg, then add them up" : `${LEG_READ.join(" + ")} = ${nm1(ROUTE_TOTAL)} M`}>
          {ROUTE_LEGS.map((l, i) => (
            <ChartLine key={i} from={l.from.at} to={l.to.at} colour={GREEN} width={w * 1.4} arrow progress={Math.min(1, Math.max(0, draw * 3 - i))} />
          ))}
          <circle cx={wp.x} cy={wp.y} r={w * 2.5} fill={GREEN} stroke="#fff" strokeWidth={w * 0.8} />
          <HaloLabel x={wp.x + fs * 0.5} y={wp.y - fs * 0.5} size={fs} colour={GREEN} bold>WP1</HaloLabel>
          {ROUTE_LEGS.map((l, i) => {
            const p = besideLeg(l.from.at, l.to.at, fs * 1.4 * (i === 2 ? -1 : 1), i === 0 ? 0.7 : 0.5);
            return (
              <HaloLabel key={i} x={p.x} y={p.y + fs * 0.35} size={fs} colour={GREEN} bold anchor="middle" opacity={n > 2 ? 1 : B3(t, n, 2, 0.3 + i * 0.2, 0.4 + i * 0.2)}>
                {`${LEG_READ[i]!} M`}
              </HaloLabel>
            );
          })}
          {n >= 3 && (
            <LabelBox x={project(km(8.2, 20.4)).x} y={project(km(8.2, 20.4)).y} size={r2(fs * 1.15)} anchor="middle" lines={[{ text: `Total ${nm1(ROUTE_TOTAL)} M`, colour: GREEN }]} />
          )}
        </ChartStage>
      );
    }
    const v = WALK_VIEW;
    const fs = r2(v.w / 40);
    const w = r2(v.w / 260);
    const leg = 58 * 0.62;
    const steps = n === 0 ? 1 + (WALK_STEPS - 1) * B3(t, n, 0, 0.3, 0.95) : WALK_STEPS;
    let dv: { p: Pt; q: Pt; side: 1 | -1 };
    if (n === 0) {
      const i = Math.min(Math.floor(steps - 1), WALK_STEPS - 2);
      const f = steps - 1 - i;
      const side: 1 | -1 = i % 2 === 0 ? -1 : 1;
      const pivot = walkMark(i + 1);
      dv = { p: pivot, q: f >= 1 ? walkMark(i + 2) : rotateAbout(walkMark(i), pivot, 180 * f * side), side };
    } else {
      const close = B3(t, n, 1, 0.05, 0.5);
      const pivot = walkMark(WALK_STEPS);
      const end = project(WALK_LEG.to.at);
      const side: 1 | -1 = (WALK_STEPS - 1) % 2 === 0 ? 1 : -1;
      if (close >= 1) {
        dv = { p: pivot, q: end, side };
      } else {
        const r = rotateAbout(walkMark(WALK_STEPS - 1), pivot, 180 * close * side);
        const k = 1 + (Number(WALK_GAP) - 1) * close;
        dv = { p: pivot, q: { x: pivot.x + (r.x - pivot.x) * k, y: pivot.y + (r.y - pivot.y) * k }, side };
      }
    }
    const marks = n === 0 ? Math.floor(steps + 1e-6) : WALK_STEPS;
    const a = project(WALK_LEG.from.at);
    const b = project(WALK_LEG.to.at);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const nx = -(b.y - a.y) / len;
    const ny = (b.x - a.x) / len;
    const gapMid = lerpPt(walkMark(WALK_STEPS), b, 0.5);
    const total = besideLeg(WALK_LEG.from.at, WALK_LEG.to.at, fs * 2.6);
    const done = n === 1 && B3(t, n, 1, 0.6, 0.7) >= 1;
    return (
      <ChartStage view={v} banner={n === 0 ? "Dividers set to 1 M: step and count" : done ? `${WALK_STEPS} × 1 M + ${WALK_GAP} M = ${WALK_TOTAL} M` : "Measure the gap"}>
        <ChartLine from={WALK_LEG.from.at} to={WALK_LEG.to.at} colour={ORANGE} width={w * 1.2} dash={`${r2(w * 5)} ${r2(w * 4)}`} />
        {Array.from({ length: marks }, (_, i) => {
          const p = walkMark(i + 1);
          return (
            <g key={i}>
              <line x1={r2(p.x - nx * fs * 0.5)} y1={r2(p.y - ny * fs * 0.5)} x2={r2(p.x + nx * fs * 0.5)} y2={r2(p.y + ny * fs * 0.5)} stroke={CHART_COLOURS.ink} strokeWidth={w * 1.3} />
              <HaloLabel x={p.x - nx * fs * 1.3} y={p.y - ny * fs * 1.3 + fs * 0.35} size={fs} colour={CHART_COLOURS.ink} bold anchor="middle">{`${i + 1}`}</HaloLabel>
            </g>
          );
        })}
        {n >= 1 && <line x1={walkMark(WALK_STEPS).x} y1={walkMark(WALK_STEPS).y} x2={b.x} y2={b.y} stroke={ART.amber} strokeWidth={w * 4} strokeOpacity={0.55} strokeLinecap="round" />}
        <DividersArt p={dv.p} q={dv.q} leg={leg} side={dv.side} width={w} />
        {n >= 1 && <LabelBox x={gapMid.x + nx * fs * 1.8} y={gapMid.y + ny * fs * 1.8 + fs * 0.35} size={fs} anchor="middle" lines={[{ text: `${WALK_GAP} M`, colour: ORANGE }]} />}
        {done && <LabelBox x={total.x} y={total.y} size={r2(fs * 1.25)} anchor="middle" lines={[{ text: `${WALK_TOTAL} M`, colour: GREEN }]} />}
      </ChartStage>
    );
  }),

  // Sentences: 0 one rule, 1 60D = ST, 2 the units, 3 the triangle, 4 six knots, 5 the six-minute rule.
  scene(4, (t, n) => {
    if (n >= 4) {
      const lots = 1;
      return (
        <Stage>
          <SceneTitle t={t}>{n === 4 ? "At six knots" : "The six-minute rule"}</SceneTitle>
          {n === 4 && (
            <g>
              <text x={800} y={380} textAnchor="middle" fontSize={120} fontWeight={800} fill={ART.amber}>1 mile = 10 min</text>
              <text x={800} y={490} textAnchor="middle" fontSize={48} fontFamily={MONO} fill="#fff">60 × 1 ÷ 6 = 10</text>
              <text x={800} y={600} textAnchor="middle" fontSize={44} fill={ART.muted}>so 12 miles is two hours</text>
            </g>
          )}
          {n === 5 && (
            <g>
              {Array.from({ length: 10 }, (_, i) => (
                <rect key={i} x={200 + i * 120} y={220} width={114} height={80} rx={8} fill={i < lots ? ART.amber : "rgba(255,255,255,0.12)"} />
              ))}
              <text x={200} y={355} fontSize={40} fill={ART.amber}>6 min</text>
              <text x={1400} y={355} textAnchor="end" fontSize={40} fill={ART.muted}>60 min = 1 hour</text>
              <text x={800} y={480} textAnchor="middle" fontSize={76} fontWeight={800} fill="#fff">6 min = one tenth of an hour</text>
              <text x={800} y={600} textAnchor="middle" fontSize={60} fontWeight={700} fontFamily={MONO} fill={ART.tealBright} opacity={B4(t, n, 5, 0.5, 0.65)}>6 kn → 0.6 M in 6 min</text>
            </g>
          )}
        </Stage>
      );
    }
    const cover = n === 3 ? (["D", "T", "S"] as const)[Math.min(2, Math.floor(B4(t, n, 3, 0.3, 1) * 3))] : null;
    return (
      <Stage>
        <SceneTitle t={t}>The navigator’s rule</SceneTitle>
        {n === 0 &&
          [
            { k: "D", name: "Distance", x: 380 },
            { k: "S", name: "Speed", x: 800 },
            { k: "T", name: "Time", x: 1220 },
          ].map((c) => (
            <g key={c.k}>
              <circle cx={c.x} cy={380} r={95} fill="rgba(43,179,192,0.15)" stroke={ART.tealBright} strokeWidth={5} />
              <text x={c.x} y={414} textAnchor="middle" fontSize={96} fontWeight={800} fill={ART.tealBright}>{c.k}</text>
              <text x={c.x} y={540} textAnchor="middle" fontSize={48} fontWeight={700} fill="#fff">{c.name}</text>
            </g>
          ))}
        {(n === 1 || n === 2) && (
          <>
            <text x={800} y={390} textAnchor="middle" fontSize={180} fontWeight={800} fill={ART.amber}>60D = ST</text>
            {[
              { k: "D", u: "miles", x: 360 },
              { k: "S", u: "knots", x: 800 },
              { k: "T", u: "minutes", x: 1240 },
            ].map((c) => (
              <text key={c.k} x={c.x} y={560} textAnchor="middle" fontSize={56} fill="#fff" opacity={on(n, 2)}>
                <tspan fontWeight={800} fill={ART.tealBright}>{c.k}</tspan> = {c.u}
              </text>
            ))}
          </>
        )}
        {n === 3 && (
          <>
            {(["D", "S", "T"] as const).map((k) => (
              <polygon key={k} points={TRI_CELLS[k]} fill={cover === k ? ART.amber : "rgba(43,179,192,0.12)"} stroke={ART.tealBright} strokeWidth={6} strokeLinejoin="round" />
            ))}
            <text x={420} y={370} textAnchor="middle" fontSize={80} fontWeight={800} fill={cover === "D" ? ART.navy : "#fff"}>{cover === "D" ? "?" : "60D"}</text>
            <text x={310} y={545} textAnchor="middle" fontSize={96} fontWeight={800} fill={cover === "S" ? ART.navy : "#fff"}>{cover === "S" ? "?" : "S"}</text>
            <text x={530} y={545} textAnchor="middle" fontSize={96} fontWeight={800} fill={cover === "T" ? ART.navy : "#fff"}>{cover === "T" ? "?" : "T"}</text>
            {[
              { k: "D", text: "D = ST ÷ 60" },
              { k: "T", text: "T = 60D ÷ S" },
              { k: "S", text: "S = 60D ÷ T" },
            ].map((f, i) => (
              <text key={f.k} x={860} y={300 + i * 130} fontSize={76} fontWeight={800} fontFamily={MONO} fill={cover === f.k ? ART.amber : "#fff"} opacity={cover === f.k ? 1 : 0.45}>
                {f.text}
              </text>
            ))}
          </>
        )}
      </Stage>
    );
  }),

  // Sentences: 0 the leg, 1 the sum, 2 leave at ten, arrive at one, 3 the decimal trap.
  scene(5, (t, n) => {
    const sweep = n === 2 ? B5(t, n, 2, 0.15, 0.75) : n > 2 ? 1 : 0;
    if (n === 3) {
      return (
        <Stage>
          <SceneTitle t={t}>Watch the calculator</SceneTitle>
          <rect x={130} y={230} width={520} height={330} rx={30} fill="#1d2a38" stroke="#5d6f82" strokeWidth={6} />
          <rect x={170} y={270} width={440} height={170} rx={10} fill="#b8c9a3" />
          <text x={580} y={395} textAnchor="end" fontSize={120} fontFamily={MONO} fontWeight={700} fill="#1d2731">3.5</text>
          <text x={390} y={520} textAnchor="middle" fontSize={44} fill={ART.muted}>hours</text>
          <text x={760} y={360} fontSize={80} fontWeight={800} fill="#5fd38d" opacity={B5(t, n, 3, 0.3, 0.4)}>3 h 30 min</text>
          <g opacity={B5(t, n, 3, 0.6, 0.7)}>
            <text x={760} y={500} fontSize={80} fontWeight={800} fill="#ff6b6b">3 h 50 min</text>
            <line x1={750} y1={475} x2={1220} y2={475} stroke="#ff6b6b" strokeWidth={10} strokeLinecap="round" />
          </g>
          <text x={800} y={680} textAnchor="middle" fontSize={48} fill="#fff" opacity={B5(t, n, 3, 0.7, 0.8)}>the decimal × 60 = minutes</text>
        </Stage>
      );
    }
    return (
      <Stage>
        <SceneTitle t={t}>A day in the Ionian</SceneTitle>
        <ClockFace x={340} y={440} r={200} minutes={10 * 60 + 180 * sweep} />
        <text x={720} y={260} fontSize={56} fontWeight={800} fill="#fff">Lefkas → Vathi, Meganisi</text>
        <text x={720} y={340} fontSize={52} fill={ART.tealBright}>about 15 M at 5 kn</text>
        <g opacity={on(n, 1)}>
          <text x={720} y={440} fontSize={52} fontFamily={MONO} fill="#fff">60 × 15 ÷ 5 = 180 min</text>
          <text x={720} y={515} fontSize={56} fontWeight={700} fill={ART.amber}>= 3 hours</text>
        </g>
        <g opacity={on(n, 2)}>
          <text x={720} y={630} fontSize={64} fontWeight={800} fill="#fff">
            Leave <tspan fontFamily={MONO}>1000</tspan> · in <tspan fontFamily={MONO} fill={sweep >= 1 ? "#5fd38d" : "#fff"}>1300</tspan>
          </text>
        </g>
      </Stage>
    );
  }),

  // Sentences: 0 fifteen to twenty miles, 1 three to four hours, 2 plan on five knots, 3 upwind, 4 thirty miles.
  scene(6, (t, n) => {
    const mx = (m: number) => 200 + m * 40; // 0–30 miles across 200–1400
    if (n === 3) {
      const A = { x: 300, y: 720 };
      const Bp = { x: 300, y: 220 };
      const zig = [A, { x: 560, y: 595 }, { x: 140, y: 470 }, { x: 560, y: 345 }, { x: 300, y: 220 }];
      const k = B6(t, n, 3, 0.1, 0.6);
      const segs = zig.length - 1;
      const shownSegs = k * segs;
      return (
        <Stage>
          <SceneTitle t={t}>Upwind takes longer</SceneTitle>
          <text x={300} y={170} textAnchor="middle" fontSize={40} fill={ART.amber}>Wind ↓</text>
          <line x1={A.x} y1={A.y} x2={Bp.x} y2={Bp.y} stroke="#fff" strokeWidth={5} strokeDasharray="16 12" />
          <circle cx={A.x} cy={A.y} r={12} fill="#fff" />
          <circle cx={Bp.x} cy={Bp.y} r={12} fill={ART.amber} />
          {zig.slice(1).map((p, i) => {
            const prev = zig[i]!;
            const f = Math.max(0, Math.min(1, shownSegs - i));
            return f > 0 ? <line key={i} x1={prev.x} y1={prev.y} x2={prev.x + (p.x - prev.x) * f} y2={prev.y + (p.y - prev.y) * f} stroke={ART.tealBright} strokeWidth={8} strokeLinecap="round" /> : null;
          })}
          <Lines x={760} y={360} lines={["On the chart: 10 M", "Sailed upwind: about 15 M"]} size={58} weight={800} />
          <text x={760} y={560} fontSize={44} fill={ART.muted} opacity={B6(t, n, 3, 0.6, 0.7)}>allow more time, or motor</text>
        </Stage>
      );
    }
    return (
      <Stage>
        <SceneTitle t={t}>Sizing a charter day</SceneTitle>
        <line x1={mx(0)} x2={mx(30)} y1={420} y2={420} stroke={ART.muted} strokeWidth={4} />
        {[0, 5, 10, 15, 20, 25, 30].map((m) => (
          <g key={m}>
            <line x1={mx(m)} x2={mx(m)} y1={400} y2={440} stroke={ART.muted} strokeWidth={4} />
            <text x={mx(m)} y={490} textAnchor="middle" fontSize={38} fill="#fff">{m}</text>
          </g>
        ))}
        <text x={mx(30) + 30} y={432} fontSize={36} fill={ART.muted}>M</text>
        <rect x={mx(15)} y={380} width={mx(20) - mx(15)} height={80} rx={10} fill="rgba(95,211,141,0.35)" stroke="#5fd38d" strokeWidth={4} opacity={fade(t, 0.05, 0.15)} />
        <text x={(mx(15) + mx(20)) / 2} y={350} textAnchor="middle" fontSize={44} fontWeight={800} fill="#5fd38d" opacity={fade(t, 0.05, 0.15)}>a good day</text>
        {n >= 4 && (
          <g>
            <rect x={mx(28)} y={380} width={mx(30) - mx(28) + 4} height={80} rx={10} fill="rgba(255,107,107,0.35)" stroke="#ff6b6b" strokeWidth={4} />
            <text x={mx(29)} y={350} textAnchor="middle" fontSize={40} fontWeight={800} fill="#ff8a7a">long day</text>
          </g>
        )}
        {n >= 1 && n <= 2 && (
          <g>
            <text x={800} y={580} textAnchor="middle" fontSize={56} fontWeight={800} fill="#fff">3 to 4 hours of sailing</text>
            <text x={800} y={645} textAnchor="middle" fontSize={44} fill={ART.muted}>plus a swim stop and lunch</text>
          </g>
        )}
        {n === 2 && <text x={800} y={730} textAnchor="middle" fontSize={56} fontWeight={800} fill={ART.amber}>Plan on 5 knots</text>}
        {n === 4 && <text x={800} y={620} textAnchor="middle" fontSize={52} fontWeight={800} fill="#fff">30 M: only in a settled forecast</text>}
      </Stage>
    );
  }),

  // Sentences: 0 work backwards, 1 afternoon breeze, 2 harbours fill, 3 sunset, 4 the tropics, 5 worked example, 6 next lesson.
  scene(7, (t, n) => {
    if (n === 6) {
      return (
        <Stage>
          <text x={800} y={380} textAnchor="middle" fontSize={64} fontWeight={800} fill="#fff">Next: bearings and the compass</text>
          <text x={800} y={470} textAnchor="middle" fontSize={40} fill={ART.muted}>checking where you are with your own eyes</text>
        </Stage>
      );
    }
    const y = 470;
    const sail1 = { a: LEAVE, b: LEAVE + 108 };
    const lunch = { a: sail1.b, b: sail1.b + 60 };
    const sail2 = { a: lunch.b, b: 15 * 60 };
    const grow = n === 5 ? B7(t, n, 5, 0.3, 0.9) : 0;
    return (
      <Stage>
        <SceneTitle t={t}>Work back from the arrival</SceneTitle>
        {n >= 1 && (
          <g>
            <rect x={tx(13 * 60)} y={y - 120} width={tx(18 * 60) - tx(13 * 60)} height={150} fill="rgba(245,179,1,0.18)" />
            <text x={(tx(13 * 60) + tx(18 * 60)) / 2} y={y - 140} textAnchor="middle" fontSize={36} fontWeight={700} fill={ART.amber}>afternoon breeze</text>
          </g>
        )}
        {n >= 3 && (
          <g>
            <rect x={tx(20 * 60 + 30)} y={y - 120} width={tx(21 * 60) - tx(20 * 60 + 30) + 40} height={150} fill="rgba(11,25,41,0.85)" />
            <line x1={tx(20 * 60 + 30)} x2={tx(20 * 60 + 30)} y1={y - 120} y2={y + 30} stroke="#ff8a7a" strokeWidth={5} />
            <Lines x={tx(20 * 60 + 30) - 10} y={y + 100} lines={["sunset,", "Med summer"]} size={34} fill="#ff8a7a" weight={700} anchor="end" />
          </g>
        )}
        {n >= 4 && (
          <g>
            <line x1={tx(18 * 60 + 30)} x2={tx(18 * 60 + 30)} y1={y - 120} y2={y + 30} stroke="#c4b5fd" strokeWidth={5} strokeDasharray="12 8" />
            <text x={tx(18 * 60 + 30) + 10} y={y - 140} fontSize={34} fontWeight={700} fill="#c4b5fd">dark, Seychelles</text>
          </g>
        )}
        <line x1={tx(8 * 60)} x2={tx(21 * 60)} y1={y} y2={y} stroke={ART.muted} strokeWidth={4} />
        {Array.from({ length: 14 }, (_, i) => (
          <g key={i}>
            <line x1={tx((8 + i) * 60)} x2={tx((8 + i) * 60)} y1={y - 14} y2={y + 14} stroke={ART.muted} strokeWidth={3} />
            {i % 2 === 0 && <text x={tx((8 + i) * 60)} y={y + 60} textAnchor="middle" fontSize={32} fontFamily={MONO} fill="#fff">{clock((8 + i) * 60)}</text>}
          </g>
        ))}
        {n >= 2 && (
          <g>
            <circle cx={tx(15 * 60)} cy={y} r={20} fill="#5fd38d" />
            <text x={tx(15 * 60)} y={y - 40} textAnchor="middle" fontSize={40} fontWeight={800} fill="#5fd38d">in by 1500</text>
          </g>
        )}
        {n === 0 && (
          <g opacity={phase(t * 4, 0.2, 0.6)}>
            <circle cx={tx(15 * 60)} cy={y} r={20} fill="#fff" />
            <path d={`M${tx(15 * 60) - 40} ${y - 70} H${tx(10 * 60)}`} stroke={ART.amber} strokeWidth={8} markerEnd="" />
            <polygon points={`${tx(10 * 60)},${y - 70} ${tx(10 * 60) + 30},${y - 86} ${tx(10 * 60) + 30},${y - 54}`} fill={ART.amber} />
            <text x={tx(12 * 60 + 30)} y={y - 100} textAnchor="middle" fontSize={40} fontWeight={700} fill={ART.amber}>work backwards</text>
          </g>
        )}
        {n === 5 && (
          <g>
            {[{ ...sail1, c: ART.tealBright }, { ...lunch, c: ART.amber }, { ...sail2, c: ART.tealBright }].map((b, i) => {
              const right = sail2.b - (sail2.b - b.a) * grow;
              const left = Math.max(b.a, right);
              const w = Math.max(0, tx(b.b) - tx(left));
              return <rect key={i} x={tx(left)} y={y + 110} width={w} height={60} rx={8} fill={b.c} opacity={0.9} />;
            })}
            <text x={tx(LEAVE)} y={y + 230} textAnchor="middle" fontSize={40} fontWeight={800} fill="#fff" opacity={grow >= 1 ? 1 : 0}>leave by {clock(LEAVE_BY)}</text>
            <text x={(tx(lunch.a) + tx(lunch.b)) / 2} y={y + 230} textAnchor="middle" fontSize={34} fill={ART.amber} opacity={grow >= 1 ? 1 : 0}>lunch</text>
            <text x={800} y={230} textAnchor="middle" fontSize={40} fontFamily={MONO} fill="#fff">18 M at 5 kn = {hm(SAIL)} + 1 h lunch</text>
          </g>
        )}
      </Stage>
    );
  }),
];

export function Video() {
  return <LessonPlayer slug={SCRIPT.slug} title="Distance, speed and time" scenes={SCENES} speak={SCRIPT.speak} />;
}

/* ------------------------------------------------------------------ */
/* Exercises                                                           */
/* ------------------------------------------------------------------ */

/** Where to put a divider point on each kind of symbol. */
function pointOn(id: string): string {
  const f = feature(id);
  switch (f.kind) {
    case "lighthouse": return `the centre of ${f.name}’s star`;
    case "starboard-mark":
    case "port-mark":
    case "cardinal-east":
    case "safe-water": return `the small circle at the foot of the ${f.name} symbol`;
    case "isolated-danger": return "Mew Rock itself (the cross just west of its beacon)";
    case "rock-awash": return "the cross at the centre of The Teeth";
    case "wreck": return "the centre of the dotted wreck outline";
    case "anchorage": return "the anchor symbol";
    default: return `the small circle (or dot) at the foot of the ${f.name.toLowerCase()} symbol`;
  }
}

/** A measure-mode chart framed on the features, with the dividers starting beside (not on) them. */
function measureFigure(ids: string[]): ReactNode {
  const pts = ids.map((id) => feature(id).at);
  const lats = pts.map((p) => p.lat);
  const lons = pts.map((p) => p.lon);
  const centre = { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lon: (Math.min(...lons) + Math.max(...lons)) / 2 };
  const span = Math.max(rhumbDistance({ lat: Math.min(...lats), lon: Math.min(...lons) }, { lat: Math.max(...lats), lon: Math.max(...lons) }), 1);
  const dLatMin = (Math.max(...lats) - Math.min(...lats)) * 60;
  const brg = rhumbBearing(pts[0]!, pts[pts.length - 1]!);
  const start: [LatLon, LatLon] = [rhumbDestination(centre, brg + 90, 0.35), rhumbDestination(centre, brg - 90, 0.35)];
  return (
    <PracticeChart
      mode="measure"
      zoomable
      view={viewAround(centre, Math.max(3.6, span + 2, (dLatMin + 1.6) * (4 / 3)), 4 / 3)}
      dividers={start}
      highlight={ids}
      title={`Practice chart with dividers: ${ids.map((id) => feature(id).name).join(", ")}`}
    />
  );
}

function measureQuestion(id: string, aId: string, bId: string, aText: string, bText: string, tolerance = 0.15): Question {
  const d = rhumbDistance(feature(aId).at, feature(bId).at);
  return {
    id,
    kind: "numeric",
    prompt: `Use the dividers (drag A and B) to measure the distance from ${aText} to ${bText}, to one decimal place.`,
    answer: d,
    tolerance,
    unit: "M",
    figure: measureFigure([aId, bId]),
    explain: `Put one point on ${pointOn(aId)} and the other on ${pointOn(bId)}, then carry the dividers to the latitude scale level with them: they span ${nm1(d)}′, so the distance is ${nm1(d)} M.`,
  };
}

export const QUESTIONS: Question[] = [
  {
    id: "nautical-mile",
    kind: "choice",
    prompt: "What is a nautical mile?",
    options: ["One minute of latitude: 1,852 m", "One minute of longitude: 1,852 m", "The same as a land mile: 1,609 m", "One kilometre"],
    answer: 0,
    explain: `A nautical mile is the length of one minute of latitude, fixed at exactly 1,852 m. A minute of longitude is shorter everywhere except the equator.`,
  },
  {
    id: "knots",
    kind: "choice",
    prompt: "The log shows 6 kn. Which statement is right?",
    options: ["The boat is moving at 6 nautical miles an hour", "The boat is moving at 6 knots per hour", "The boat has travelled 6 nautical miles", "The boat is moving at 6 km an hour"],
    answer: 0,
    explain: "A knot is one nautical mile an hour, so 6 kn means 6 miles every hour. The “per hour” is already in the knot, and a knot is a speed, never a distance.",
  },
  measureQuestion("measure-head-mew", "kerran-head-lt", "mew-rock", "Kerran Head light", "Mew Rock", 0.1),
  {
    id: "which-scale",
    kind: "choice",
    prompt: "Which scale do you use to measure distance on a chart?",
    options: ["The latitude scale at the side, level with what you are measuring", "The longitude scale along the top", "Either: both are in minutes", "The compass rose"],
    answer: 0,
    explain: `Only a minute of latitude is a nautical mile. At the Isle of Kerran a minute of longitude is just ${LON_MINUTE_NM.toFixed(2)} M, so using the top scale would make every distance about half as long again as it really is.`,
  },
  {
    id: "lefkas-vathi",
    kind: "numeric",
    prompt: "Lefkas to Vathi on Meganisi is about 15 M. At 5 kn, how many minutes will it take?",
    answer: 180,
    tolerance: 1,
    unit: "min",
    explain: "You want time, so T = 60 × D ÷ S = 60 × 15 ÷ 5 = 900 ÷ 5 = 180 minutes: exactly three hours.",
  },
  {
    id: "distance-40-min",
    kind: "numeric",
    prompt: "You motor at 6 kn for 40 minutes. How far do you go?",
    answer: 4,
    tolerance: 0.1,
    unit: "M",
    explain: "D = S × T ÷ 60 = 6 × 40 ÷ 60 = 4.0 M. Quick check: at six knots a mile takes ten minutes, so 40 minutes is 4 miles.",
  },
  {
    id: "speed-two-positions",
    kind: "numeric",
    prompt: "You note your position at 1120 and again at 1150. The two positions are 3.1 M apart. What was your average speed?",
    answer: 6.2,
    tolerance: 0.1,
    unit: "kn",
    explain: "The time between them is 30 minutes. S = 60 × D ÷ T = 60 × 3.1 ÷ 30 = 6.2 kn. (Half an hour, so the speed is twice the distance.)",
  },
  {
    id: "decimal-trap",
    kind: "choice",
    prompt: "Your calculator says a passage will take 2.3 hours. How long is that?",
    options: ["2 h 30 min", "2 h 18 min", "2 h 3 min", "2 h 13 min"],
    answer: 1,
    explain: "The 0.3 is three tenths of an hour, not 30 minutes. Multiply it by 60: 0.3 × 60 = 18 minutes, so 2.3 h = 2 h 18 min.",
  },
  {
    id: "eta-solta",
    kind: "time",
    prompt: "You leave Marina Kaštela at 0945 for Maslinica on Šolta, about 13 M, and expect to average 5 kn. What is your ETA, on the 24-hour clock?",
    answer: 9 * 60 + 45 + 156,
    tolerance: 3,
    explain: "T = 60 × 13 ÷ 5 = 780 ÷ 5 = 156 minutes = 2 h 36 min. 0945 + 2 h = 1145, plus 36 minutes = 1221.",
  },
  {
    id: "leave-by-vis",
    kind: "time",
    prompt: "Maslinica to Vis town is about 20 M. You want to be in by 1500, you plan on 5 kn, and you want an hour for a swim and lunch on the way. What time must you leave?",
    answer: 10 * 60,
    tolerance: 5,
    explain: "Sailing time: 60 × 20 ÷ 5 = 240 minutes = 4 hours. Add the hour of stops: 5 hours. 1500 − 5 h = 1000. Leave by ten.",
  },
  {
    id: "first-day",
    kind: "choice",
    prompt: "Your crew are new to sailing and the forecast is a moderate afternoon breeze. Which first day is most sensible?",
    options: [
      "About 15 M, leaving at ten, with a swim stop, in by three",
      "About 35 M, leaving at eight, to get as far as possible",
      "About 25 M upwind, leaving after lunch",
      "About 10 M, leaving at five in the afternoon",
    ],
    answer: 0,
    explain: "Fifteen to twenty miles is a good charter day: three to four hours at five knots, with time to stop. Leaving after lunch or late in the day puts you in the strongest breeze, the fullest harbours and, at worst, the dark.",
  },
  {
    id: "upwind",
    kind: "choice",
    prompt: "Your next anchorage is 12 M away, straight into the wind. Roughly how far will you actually sail to get there?",
    options: ["About 12 M", "About 17 to 18 M", "About 24 M", "About 6 M"],
    answer: 1,
    explain: "A yacht can't sail straight into the wind; she tacks at roughly 45° either side of it, which adds around half as far again. Plan on 17 or 18 miles, or start the engine.",
  },
];

/* ------------------------------------------------------------------ */
/* Practice generator                                                  */
/* ------------------------------------------------------------------ */

const POOL: Array<{ id: string; text: string }> = [
  { id: "gull-point-lt", text: "Gull Point lighthouse" },
  { id: "kerran-head-lt", text: "Kerran Head light" },
  { id: "east-teeth", text: "the East Teeth buoy" },
  { id: "mew-rock", text: "Mew Rock" },
  { id: "kerran-approach", text: "the Kerran Approach buoy" },
  { id: "wreck", text: "the wreck" },
  { id: "church", text: "the church spire" },
  { id: "mast", text: "the radio mast" },
  { id: "tower", text: "the old tower" },
  { id: "anchorage", text: "the Kerran Roads anchorage" },
];

const POOL_PAIRS = POOL.flatMap((a, i) =>
  POOL.slice(i + 1)
    .filter((b) => {
      const d = rhumbDistance(feature(a.id).at, feature(b.id).at);
      return d >= 1 && d <= 8;
    })
    .map((b) => [a, b] as const),
);

function distanceQuestion(rng: Rng): Question {
  const speed = randStep(rng, 4, 7, 0.5);
  const minutes = pick(rng, [12, 15, 18, 20, 24, 30, 36, 40, 45, 48, 50, 75, 90, 105, 120, 150]);
  const d = (speed * minutes) / 60;
  const long = minutes >= 60;
  return {
    id: "p-distance",
    kind: "numeric",
    prompt: `You make ${num(speed)} kn for ${long ? hm(minutes) : `${minutes} minutes`}. How far do you go?`,
    answer: d,
    tolerance: 0.1,
    unit: "M",
    explain: `${long ? `First put the time in minutes: ${hm(minutes)} = ${minutes} min. ` : ""}D = S × T ÷ 60 = ${num(speed)} × ${minutes} ÷ 60 = ${num(speed * minutes)} ÷ 60 = ${num(d, 2)} M.`,
  };
}

function timeQuestion(rng: Rng): Question {
  const speed = pick(rng, [4, 4.5, 5, 5.5, 6, 6.5, 7]);
  const dist = randStep(rng, 5, 25, 1);
  const minutes = (60 * dist) / speed;
  return {
    id: "p-time",
    kind: "numeric",
    prompt: `How long will it take to sail ${num(dist)} M at ${num(speed)} kn? Give your answer in minutes.`,
    answer: minutes,
    tolerance: 1,
    unit: "min",
    explain: `T = 60 × D ÷ S = 60 × ${num(dist)} ÷ ${num(speed)} = ${num(60 * dist)} ÷ ${num(speed)} = ${num(minutes, 1)} min${minutes >= 59.5 ? ` (${hm(minutes)})` : ""}.`,
  };
}

function speedQuestion(rng: Rng): Question {
  const speed = randStep(rng, 4, 7, 0.5);
  const minutes = 12 * randInt(rng, 1, 10);
  const dist = round1((speed * minutes) / 60);
  const first = 5 * randInt(rng, 9 * 12, 15 * 12);
  const s = (60 * dist) / minutes;
  return {
    id: "p-speed",
    kind: "numeric",
    prompt: `You note your position at ${clock(first)} and again at ${clock(first + minutes)}. The two positions are ${num(dist)} M apart. What was your average speed?`,
    answer: s,
    tolerance: 0.1,
    unit: "kn",
    explain: `Time between the two: ${minutes} min. S = 60 × D ÷ T = 60 × ${num(dist)} ÷ ${minutes} = ${num(s, 2)} kn.`,
  };
}

function etaQuestion(rng: Rng): Question {
  const speed = pick(rng, [4.5, 5, 5.5, 6]);
  const minutes = 12 * randInt(rng, 5, 20);
  const dist = round1((speed * minutes) / 60);
  const depart = 5 * randInt(rng, 8 * 12, 11 * 12);
  return {
    id: "p-eta",
    kind: "time",
    prompt: `You leave at ${clock(depart)} to sail ${num(dist)} M at ${num(speed)} kn. What is your ETA?`,
    answer: depart + minutes,
    tolerance: 2,
    explain: `T = 60 × ${num(dist)} ÷ ${num(speed)} = ${minutes} min = ${hm(minutes)}. ${clock(depart)} + ${hm(minutes)} = ${clock(depart + minutes)}.`,
  };
}

function leaveByQuestion(rng: Rng): Question {
  const speed = pick(rng, [5, 5.5, 6]);
  const dist = randInt(rng, 10, 24);
  const stops = pick(rng, [0, 30, 60, 90]);
  const arrive = pick(rng, [14 * 60, 14 * 60 + 30, 15 * 60, 15 * 60 + 30, 16 * 60]);
  const sailing = Math.round((60 * dist) / speed);
  const leave = arrive - sailing - stops;
  return {
    id: "p-leave",
    kind: "time",
    prompt: `Your next stop is ${dist} M away. You plan on ${num(speed)} kn, want ${stops === 0 ? "no stops" : `${hm(stops)} of stops`} on the way, and want to be in by ${clock(arrive)}. What time must you leave?`,
    answer: leave,
    tolerance: 3,
    explain: `Sailing time: 60 × ${dist} ÷ ${num(speed)} = ${num((60 * dist) / speed, 1)} min, about ${hm(sailing)}.${stops ? ` Add ${hm(stops)} of stops: ${hm(sailing + stops)}.` : ""} ${clock(arrive)} − ${hm(sailing + stops)} = ${clock(leave)}.`,
  };
}

function decimalQuestion(rng: Rng): Question {
  const whole = randInt(rng, 1, 4);
  const frac = pick(rng, [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.75]);
  const total = Math.round((whole + frac) * 60);
  const correct = hm(total);
  const trap = `${whole} h ${Math.round(frac * 100)} min`;
  const { options, answer } = choices(rng, correct, [trap, hm(total + 6), hm(total - 6)]);
  return {
    id: "p-decimal",
    kind: "choice",
    prompt: `Your calculator says a passage will take ${num(whole + frac)} hours. How long is that in hours and minutes?`,
    options,
    answer,
    explain: `Multiply the decimal part by 60: ${num(frac)} × 60 = ${num(frac * 60)} min. So ${num(whole + frac)} h = ${correct}, not ${trap}.`,
  };
}

export const PRACTICE: PracticeGenerator = {
  title: "Distance, speed and time drill",
  description: "Five fresh questions each round: a measurement on the chart, then a mix of distance, time, speed, ETA and leave-by sums. Use a calculator if you like, but check the answer in your head.",
  generate: (rng) => {
    const [a, b] = pick(rng, POOL_PAIRS);
    const [from, to] = rng() < 0.5 ? [a, b] : [b, a];
    const sums = shuffle(rng, [distanceQuestion, timeQuestion, speedQuestion, etaQuestion, decimalQuestion]).slice(0, 3).map((f) => f(rng));
    return [measureQuestion(`p-measure-${from.id}-${to.id}`, from.id, to.id, from.text, to.text), ...sums, leaveByQuestion(rng)];
  },
};

export function Exercises({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  return <ExerciseSet courseSlug={courseSlug} lessonSlug={lessonSlug} questions={QUESTIONS} practice={PRACTICE} />;
}
