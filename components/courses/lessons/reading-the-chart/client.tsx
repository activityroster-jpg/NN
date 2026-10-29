"use client";

// Lesson 2, "Reading the chart": the video scenes, the exercises and the
// practice generator. Scene art and question ideas are ported from the
// Boaty Jobs lessons reading-a-chart, chart-symbols-and-depths and
// latitude-and-longitude, cut down and re-aimed at charter skippers.

import type { ReactNode } from "react";
import { formatLat, formatLon, formatPosition, type LatLon } from "@/lib/courses/geo";
import { FULL_VIEW, lerpView, polyPoints, project, viewAround, viewBoxString, type ViewRect } from "@/lib/courses/navigation/chart-geometry";
import { FEATURES, SOUNDINGS, bankRing, CONTOUR_DEPTHS, feature, islandContourK, islandRing, km } from "@/lib/courses/navigation/practice-chart";
import { choices, pick, shuffle, type Rng } from "@/lib/courses/random";
import { ExerciseSet, type PracticeGenerator, type Question } from "../../Exercises";
import LessonPlayer, { SceneTitle, Stage, fade, phase, splitSentences, type Scene } from "../../LessonPlayer";
import PracticeChart, { CHART_COLOURS, ChartLine, ChartPoint } from "../../PracticeChart";
import { ART, ChartScene, Lines } from "../../scene-art";
import { BAND_INFO, BAND_ORDER, bandAtMin, depthAtPoint, roundDepth, soundingText, toMinutes, type Band, type MinPt } from "./bands";
import {
  BANK_AT, BANK_LEAST, BAY_STOPS, DRYING, POINTS, POINT_NAMES, SEABED, m1, pointBearing, shelterAt, type Shelter,
} from "./data";
import { BORDER, COLOUR_STRETCHES, ROSE, ROSE_INNER, ROSE_OUTER, VARIATION, X1, Y0, Y1, frame, polar } from "./geometry";
import { GlobeDisc, GlobeGrid, globePoint, meridianPath, parallelPath, type GlobeView } from "./globe";
import { PLOT_TARGETS, READABLE_FEATURES, latReading, lonReading, nearestScales, randomSeaPosition, regionView } from "./position";
import { DRYING_GREEN, Fig, FigHtml, MID, SHALLOW, SYMBOLS, SymbolGlyph, SymbolImage, symbolInfo, type SymbolId } from "./symbols";
import { readingTheChart as SCRIPT } from "./script";

/* ------------------------------------------------------------------ */
/* Scene helpers                                                       */
/* ------------------------------------------------------------------ */

const SW = 1600;
const SH = 900;
const ORANGE = "#f97316";
const TEAL = ART.tealBright;
const AMBER = ART.amber;
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** Pair a scripted scene with its visual. */
const scene = (i: number, render: Scene["render"]): Scene => ({ ...SCRIPT.scenes[i]!, render });

/** Sentence timing for a scene, split exactly as the player splits it. */
function timing(i: number) {
  const parts = splitSentences(SCRIPT.scenes[i]!.narration);
  const total = parts.reduce((n, s) => n + s.length, 0) || 1;
  const starts: number[] = [];
  let acc = 0;
  for (const p of parts) {
    starts.push(acc / total);
    acc += p.length;
  }
  return {
    /** Progress 0 → 1 through sentence n. */
    local(t: number, n: number) {
      const a = starts[n] ?? 0;
      const b = starts[n + 1] ?? 1;
      return Math.min(1, Math.max(0, (t - a) / (b - a || 1)));
    },
    /** Where a phrase starts within sentence n, 0 → 1. */
    cue(n: number, phrase: string) {
      const s = parts[n] ?? "";
      const k = s.indexOf(phrase);
      if (k < 0) throw new Error(`narration cue not found: ${phrase}`);
      return k / s.length;
    },
  };
}

/** Visible from sentence k onwards, fading in as sentence k starts. */
function shown(n: number, k: number, lp: number): number {
  return n > k ? 1 : n === k ? Math.min(1, lp / 0.12) : 0;
}

/** Chart pixels → stage pixels for a view drawn with "meet" into the 16:9 player. */
function mapView(v: ViewRect) {
  const s = Math.min(SW / v.w, SH / v.h);
  const ox = (SW - v.w * s) / 2;
  const oy = (SH - v.h * s) / 2;
  const pt = (x: number, y: number) => ({ x: ox + (x - v.x) * s, y: oy + (y - v.y) * s });
  return { s, pt, ll: (p: LatLon) => { const q = project(p); return pt(q.x, q.y); } };
}

function Pill({ x, y, text, size = 44, anchor = "middle", bg = "rgba(11,25,41,0.9)", fg = "#fff", opacity = 1 }: {
  x: number; y: number; text: string; size?: number; anchor?: "start" | "middle" | "end"; bg?: string; fg?: string; opacity?: number;
}) {
  if (opacity <= 0) return null;
  const w = text.length * size * 0.56 + size * 0.9;
  const h = size * 1.5;
  const left = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
  return (
    <g opacity={opacity}>
      <rect x={left} y={y - h / 2} width={w} height={h} rx={h * 0.28} fill={bg} />
      <text x={left + w / 2} y={y + size * 0.36} fontSize={size} fontWeight={700} fill={fg} textAnchor="middle">{text}</text>
    </g>
  );
}

/** A dark rounded label: first line bold, the rest smaller. */
function Label({ x, y, lines, size = 50, anchor = "start", opacity = 1, accent = TEAL }: {
  x: number; y: number; lines: string[]; size?: number; anchor?: "start" | "middle" | "end"; opacity?: number; accent?: string;
}) {
  const pad = size * 0.5;
  const sub = Math.max(36, size * 0.78);
  const w = Math.max(...lines.map((l, i) => l.length * (i === 0 ? size : sub) * 0.57)) + pad * 2;
  const h = size * 1.15 + (lines.length - 1) * sub * 1.3 + pad * 0.9;
  const left = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  return (
    <g opacity={opacity}>
      <rect x={left} y={y} width={w} height={h} rx={18} fill="rgba(11,25,41,0.9)" stroke={accent} strokeWidth={3} />
      {lines.map((l, i) => (
        <text key={i} x={left + pad} y={y + pad * 0.45 + size + i * sub * 1.3} fontSize={i === 0 ? size : sub} fontWeight={i === 0 ? 800 : 500} fill={i === 0 ? "#fff" : ART.tealLight}>
          {l}
        </text>
      ))}
    </g>
  );
}

/** A big charted figure with its meaning, e.g. "2₁ = 2.1 m". */
function FigPanel({ x, y, depth, lines, opacity = 1 }: { x: number; y: number; depth: number; lines: string[]; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={560} height={150 + lines.length * 58} rx={20} fill="rgba(11,25,41,0.92)" stroke={TEAL} strokeWidth={3} />
      <rect x={x + 30} y={y + 22} width={190} height={120} rx={12} fill="#fff" />
      <Fig x={x + 125} y={y + 108} depth={depth} size={88} />
      <text x={x + 245} y={y + 102} fontSize={56} fontWeight={800} fill="#fff">= {m1(Math.abs(depth))} m</text>
      {lines.map((l, i) => (
        <text key={i} x={x + 32} y={y + 196 + i * 58} fontSize={40} fill={ART.tealLight}>{l}</text>
      ))}
    </g>
  );
}

/** A thin pulsing ring in chart pixels. */
function Ring({ at, r = 9, dx = 0, dy = 0, colour = CHART_COLOURS.plotAlt }: { at: LatLon; r?: number; dx?: number; dy?: number; colour?: string }) {
  const p = project(at);
  return (
    <circle cx={p.x + dx} cy={p.y + dy} r={r} fill="none" stroke={colour} strokeWidth={1.6}>
      <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
    </circle>
  );
}

/** The practice chart at a view, with chart-space overlays (`under`) and a stage-space layer on top. */
function ChartShot({ view, under, children, highlight, over }: { view: ViewRect; under?: ReactNode; children?: ReactNode; highlight?: string[]; over?: ReactNode }) {
  return (
    <>
      <ChartScene from={view} highlight={highlight}>{under}</ChartScene>
      {over && (
        <svg viewBox={viewBoxString(view)} preserveAspectRatio="xMidYMid meet" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          {over}
        </svg>
      )}
      <Stage background="none">{children}</Stage>
    </>
  );
}

/** A wind badge in stage pixels: an arrow showing where the wind blows to, with a caption. */
function WindBadge({ x, y, from, text, colour = AMBER }: { x: number; y: number; from: number; text: string; colour?: string }) {
  const to = ((from + 180) * Math.PI) / 180;
  const r = 70;
  const tip = { x: x + Math.sin(to) * r, y: y - Math.cos(to) * r };
  const tail = { x: x - Math.sin(to) * r, y: y + Math.cos(to) * r };
  const a = Math.atan2(tip.y - tail.y, tip.x - tail.x);
  const head = 34;
  return (
    <g>
      <circle cx={x} cy={y} r={105} fill="rgba(11,25,41,0.9)" stroke={colour} strokeWidth={4} />
      <line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} stroke={colour} strokeWidth={14} strokeLinecap="round" />
      <polygon
        points={`${tip.x},${tip.y} ${tip.x - head * Math.cos(a - 0.45)},${tip.y - head * Math.sin(a - 0.45)} ${tip.x - head * Math.cos(a + 0.45)},${tip.y - head * Math.sin(a + 0.45)}`}
        fill={colour}
      />
      <text x={x} y={y + 150} textAnchor="middle" fontSize={40} fontWeight={800} fill="#fff" stroke="#0B1929" strokeWidth={8} paintOrder="stroke">{text}</text>
    </g>
  );
}

/** A 16:9 view `w` chart pixels wide around a chart point. */
const wide = (cx: number, cy: number, w: number) => frame(cx, cy, w, 16 / 9);

/* ------------------------------------------------------------------ */
/* Views and figures the scenes use                                    */
/* ------------------------------------------------------------------ */

const ISLAND_VIEW = viewAround(km(7.4, 11.6), 13, 16 / 9);
const CONTOUR_VIEW = wide(690, 480, 420);
const BANK_VIEW = viewAround(BANK_AT, 2.2, 16 / 9);
const DRY_VIEW = viewAround(DRYING.at, 3, 16 / 9);
const TEETH_VIEW = viewAround(km(7.1, 5.6), 4, 16 / 9);
const ROSE_VIEW: ViewRect = (() => { const h = 240; const w = (h * 16) / 9; return { x: 0, y: ROSE.y - h / 2, w, h }; })();
const VAR_VIEW = wide(ROSE.x, ROSE.y + 18, 160);
const ROADS = BAY_STOPS.find((s) => s.id === "roads")!;
const SOUTH = BAY_STOPS.find((s) => s.id === "south")!;
const NORTH_VIEW = viewAround(km(10.1, 12.2), 6.5, 16 / 9);
const SOUTH_VIEW = viewAround(km(4.4, 12.6), 6.5, 16 / 9);

const bankPx = project(BANK_AT);
/** Where to label each contour: the point of the island's ring facing Brennan Bank. */
const CONTOUR_LABELS = CONTOUR_DEPTHS.map((d) => {
  const ring = islandRing(islandContourK(d)).map(project);
  return ring.reduce((best, p) => (Math.hypot(p.x - bankPx.x, p.y - bankPx.y) < Math.hypot(best.x - bankPx.x, best.y - bankPx.y) ? p : best));
});
// Soundings to circle: in the view, clear of symbols and printed names (which hide soundings).
const NAME_SPOTS = [km(3.25, 5.6), km(4.85, 9.4)].map(project);
const SHOWN_SOUNDINGS = SOUNDINGS.filter((s) => {
  const p = project(s.at);
  const v = CONTOUR_VIEW;
  if (p.x < v.x + 40 || p.x > v.x + v.w - 40 || p.y < v.y + 30 || p.y > v.y + v.h - 50) return false;
  if (FEATURES.some((f) => { const q = project(f.at); return Math.hypot(q.x - p.x, q.y - p.y) < 30; })) return false;
  return NAME_SPOTS.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 50);
}).slice(0, 7);

const ROCK_CARDS: Array<{ id: SymbolId; title: string; sub: string }> = [
  { id: "rock-nc", title: "Always above water", sub: "a tiny island" },
  { id: "rock-cu", title: "Covers and uncovers", sub: "an asterisk" },
  { id: "rock-awash", title: "Awash at low tide", sub: "a cross with four dots" },
  { id: "rock-uw", title: "Always underwater", sub: "a plain cross" },
];

const APPROACH = feature("kerran-approach");
const APPROACH_SIDE = nearestScales(APPROACH.at);
const LEFKAS: LatLon = { lat: 38.826, lon: 20.722 };
const ROAD_TOWN: LatLon = { lat: 18.422, lon: -64.611 };
const VAR_WORD = VARIATION.dir === "W" ? "west" : "east";

/** An anchor drawn from the crown up, in stage pixels. */
function Anchor({ x, y, scale = 1, rotate = 0, colour = "#e2e8f0" }: { x: number; y: number; scale?: number; rotate?: number; colour?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} stroke={colour} strokeWidth={9} fill="none" strokeLinecap="round">
      <line x1={0} y1={0} x2={0} y2={-120} />
      <circle cx={0} cy={-132} r={12} />
      <line x1={-34} y1={-92} x2={34} y2={-92} />
      <path d="M -52 -30 Q -40 4 0 4 Q 40 4 52 -30" />
    </g>
  );
}

/** One seabed panel for the seabed scene. */
function SeabedPanel({ x, kind, opacity, caption, sub, good }: { x: number; kind: "sand" | "weed" | "rock" | "coral"; opacity: number; caption: string; sub: string; good: boolean }) {
  const y = 330;
  const w = 460;
  const bed = y + 330;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={420} rx={20} fill="#1f5f8b" stroke={good ? "#5fd38d" : "#ff8a7a"} strokeWidth={5} />
      {kind === "sand" && <path d={`M${x} ${bed} Q ${x + w / 2} ${bed - 18} ${x + w} ${bed} V${y + 420} H${x} Z`} fill="#e9d8a6" />}
      {kind === "weed" && (
        <g>
          <path d={`M${x} ${bed + 10} H${x + w} V${y + 420} H${x} Z`} fill="#bfae86" />
          {Array.from({ length: 18 }, (_, i) => (
            <path key={i} d={`M${x + 18 + i * 24} ${bed + 10} q 10 -40 -4 -82`} stroke="#3f8f4a" strokeWidth={8} fill="none" strokeLinecap="round" />
          ))}
        </g>
      )}
      {kind === "rock" && <path d={`M${x} ${bed} l 60 -30 l 70 20 l 60 -40 l 90 30 l 70 -20 l 110 30 V${y + 420} H${x} Z`} fill="#6b7280" />}
      {kind === "coral" && (
        <g>
          <path d={`M${x} ${bed + 10} H${x + w} V${y + 420} H${x} Z`} fill="#e9d8a6" />
          {[70, 170, 270, 370].map((cx) => (
            <path key={cx} d={`M${x + cx} ${bed + 10} v -50 m 0 20 l -26 -30 m 26 10 l 26 -34`} stroke="#f472b6" strokeWidth={10} fill="none" strokeLinecap="round" />
          ))}
        </g>
      )}
      {kind === "sand" && <Anchor x={x + w / 2} y={bed + 26} rotate={-62} scale={0.9} />}
      {kind === "weed" && <Anchor x={x + w / 2} y={bed - 70} rotate={-80} scale={0.9} />}
      {kind === "rock" && <Anchor x={x + w / 2} y={bed - 30} rotate={-80} scale={0.9} />}
      <text x={x + w / 2} y={y + 64} textAnchor="middle" fontSize={50} fontWeight={800} fill="#fff">{caption}</text>
      <text x={x + w / 2} y={y + 118} textAnchor="middle" fontSize={36} fontWeight={700} fill={good ? "#5fd38d" : "#ffb3a8"}>{sub}</text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

const T0 = timing(0);
const T1 = timing(1);
const T2 = timing(2);
const T3 = timing(3);
const T4 = timing(4);
const T5 = timing(5);
const T6 = timing(6);
const T7 = timing(7);
const T8 = timing(8);
const CONTOUR_WORDS = ["two", "five", "ten", "twenty"];

export const SCENES: Scene[] = [
  // Sentences: 0 intro, 1 depth, rocks and seabed, 2 rose and position, 3 reading a bay.
  scene(0, (t, n) => {
    const m = mapView(FULL_VIEW);
    const lp = T0.local(t, n);
    const rose = m.pt(ROSE.x, ROSE.y);
    const right = m.pt(X1, Y0);
    const rightBottom = m.pt(X1, Y1);
    const island = m.ll(km(7.4, 12.0));
    const roads = m.ll(ROADS.at);
    return (
      <ChartShot view={FULL_VIEW}>
        {n === 0 && (
          <g opacity={fade(t, 0, 0.06)}>
            <rect x={300} y={300} width={1000} height={260} rx={24} fill="rgba(11,25,41,0.92)" />
            <text x={800} y={410} textAnchor="middle" fontSize={84} fontWeight={800} fill="#fff">Reading the chart</text>
            <text x={800} y={490} textAnchor="middle" fontSize={44} fill={TEAL}>Lesson 2 · Navigation for charter skippers</text>
          </g>
        )}
        <g opacity={shown(n, 1, lp)}>
          <ellipse cx={island.x} cy={island.y + 30} rx={330} ry={250} fill="none" stroke={ORANGE} strokeWidth={6} strokeDasharray="18 12" />
          <Pill x={island.x} y={island.y + 10} text="Depths, rocks, seabed" />
        </g>
        <g opacity={shown(n, 2, lp)}>
          <circle cx={rose.x} cy={rose.y} r={ROSE_OUTER * m.s + 8} fill="none" stroke={ORANGE} strokeWidth={6} />
          <Pill x={rose.x + ROSE_OUTER * m.s + 24} y={rose.y - 150} anchor="start" text="Compass rose" />
          <rect x={right.x - 2} y={right.y - 2} width={BORDER * m.s + 4} height={rightBottom.y - right.y + 4} fill={ORANGE} fillOpacity={0.25} stroke={ORANGE} strokeWidth={5} />
          <Pill x={right.x - 30} y={SH / 2 + 110} anchor="end" text="Latitude scale" />
        </g>
        <g opacity={shown(n, 3, lp)}>
          <circle cx={roads.x} cy={roads.y} r={40} fill="none" stroke={AMBER} strokeWidth={6} />
          <Pill x={roads.x + 60} y={roads.y - 60} anchor="start" text="A good place to stop?" bg="rgba(194,65,12,0.95)" />
        </g>
      </ChartShot>
    );
  }),

  // Sentences: 0 soundings, 1 chart datum, 2 at least that much, 3 tenths (Brennan Bank), 4 the Mediterranean.
  scene(1, (t, n) => {
    const lp = T1.local(t, n);
    const view = n === 0 ? lerpView(ISLAND_VIEW, CONTOUR_VIEW, phase(lp, 0, 0.4)) : n === 3 ? lerpView(CONTOUR_VIEW, BANK_VIEW, phase(lp, 0, 0.3)) : n === 4 ? BANK_VIEW : CONTOUR_VIEW;
    const s = mapView(view).s;
    return (
      <ChartShot
        view={view}
        under={
          <g fill="none">
            {n <= 2 && SHOWN_SOUNDINGS.map((snd, i) => {
              const q = project(snd.at);
              return <circle key={i} cx={q.x} cy={q.y + 1} r={12} stroke={ORANGE} strokeWidth={5 / s} opacity={n > 0 ? 1 : phase(lp, 0.35 + i * 0.07, 0.45 + i * 0.07)} />;
            })}
            {n >= 3 && <Ring at={BANK_AT} r={10} dy={1} />}
          </g>
        }
      >
        {n === 0 && <Pill x={SW / 2} y={110} text="Soundings" size={56} opacity={phase(lp, 0.4, 0.55)} />}
        {n === 1 && <Label x={SW / 2} y={50} anchor="middle" lines={["Depth in metres", "below chart datum, about the lowest tide"]} size={52} />}
        {n === 2 && <Label x={SW / 2} y={50} anchor="middle" lines={["At least this much water", "usually a little more"]} size={52} />}
        {n === 3 && <FigPanel x={980} y={40} depth={BANK_LEAST} lines={["Brennan Bank: the shallowest"]} opacity={phase(lp, 0.3, 0.42)} />}
        {n === 4 && <Label x={40} y={40} lines={["Mediterranean", "very little tide:", "chart depth ≈ real depth"]} size={54} accent={AMBER} />}
      </ChartShot>
    );
  }),

  // Sentences: 0 what a contour is, 1 the depths drawn (cued word by word), 2 the tints, 3 steep where close.
  scene(2, (t, n) => {
    const lp = T2.local(t, n);
    const m = mapView(CONTOUR_VIEW);
    const cues = CONTOUR_WORDS.map((w) => T2.cue(1, ` ${w}`));
    const active = n === 0 ? CONTOUR_DEPTHS.indexOf(10) : n === 1 ? cues.reduce((a, c, i) => (lp >= c - 0.02 ? i : a), -1) : -1;
    const s = m.s;
    const lab = active >= 0 ? CONTOUR_LABELS[active] : undefined;
    const label = lab ? m.pt(lab.x, lab.y) : null;
    return (
      <ChartShot
        view={CONTOUR_VIEW}
        under={
          <g fill="none" strokeLinejoin="round">
            {CONTOUR_DEPTHS.map((d, i) => (i === active || (n === 1 && i < active) || n === 3) && (
              <g key={d} stroke={i === active ? ORANGE : CHART_COLOURS.plot} strokeWidth={(i === active ? 9 : 5) / s} opacity={i === active || n === 3 ? 1 : 0.6}>
                <polygon points={polyPoints(islandRing(islandContourK(d)))} />
                {d > 2 && <polygon points={polyPoints(bankRing(d))} />}
              </g>
            ))}
          </g>
        }
      >
        {label && <Pill x={label.x - 40} y={label.y + 10} anchor="end" text={`${CONTOUR_DEPTHS[active]} m contour`} />}
        {n === 2 && (
          <g>
            <rect x={1080} y={40} width={460} height={380} rx={20} fill="rgba(11,25,41,0.92)" stroke={TEAL} strokeWidth={3} />
            {[
              { fill: DRYING_GREEN, text: "Dries" },
              { fill: SHALLOW, text: "0 to 5 m" },
              { fill: MID, text: "5 to 10 m" },
              { fill: "#ffffff", text: "Over 10 m" },
            ].map((r, i) => (
              <g key={r.text} opacity={fade(lp, 0.05 + i * 0.13, 0.12 + i * 0.13)}>
                <rect x={1110} y={68 + i * 86} width={100} height={64} rx={8} fill={r.fill} stroke="#fff" strokeWidth={2} />
                <text x={1240} y={115 + i * 86} fontSize={46} fontWeight={700} fill="#fff">{r.text}</text>
              </g>
            ))}
          </g>
        )}
        {n === 3 && <Label x={40} y={40} lines={["Contours close together:", "the seabed shelves steeply"]} size={52} opacity={phase(lp, 0.1, 0.25)} />}
      </ChartShot>
    );
  }),

  // Sentences: 0 underlined figures, 1 drying height, 2 green tint, 3 where you meet them.
  scene(3, (t, n) => {
    const lp = T3.local(t, n);
    return (
      <ChartShot view={n === 0 ? lerpView(CONTOUR_VIEW, DRY_VIEW, phase(lp, 0, 0.35)) : DRY_VIEW} under={<Ring at={DRYING.at} r={10} />}>
        {n === 0 && <Label x={1540} y={40} anchor="end" lines={["Underlined figure"]} size={60} opacity={phase(lp, 0.35, 0.5)} />}
        {n === 1 && <FigPanel x={980} y={40} depth={DRYING.depth} lines={["dries: above chart datum"]} />}
        {n === 2 && (
          <g>
            <rect x={1000} y={40} width={540} height={130} rx={20} fill="rgba(11,25,41,0.92)" stroke={TEAL} strokeWidth={3} />
            <rect x={1030} y={70} width={110} height={70} rx={8} fill={DRYING_GREEN} stroke="#fff" strokeWidth={2} />
            <text x={1170} y={124} fontSize={56} fontWeight={800} fill="#fff">= dries</text>
          </g>
        )}
        {n === 3 && <Label x={1540} y={40} anchor="end" lines={["Tidal coasts: plenty", "Mediterranean, Caribbean: few"]} size={52} />}
      </ChartShot>
    );
  }),

  // Sentences: 0 intro, 1 cards 1–2, 2 cards 3–4, 3 danger line and wreck, 4 The Teeth, 5 the symbol wins.
  scene(4, (t, n) => {
    const lp = T4.local(t, n);
    if (n >= 4) {
      return (
        <ChartShot view={n === 4 ? lerpView(ISLAND_VIEW, TEETH_VIEW, phase(lp, 0, 0.3)) : TEETH_VIEW} under={<Ring at={feature("teeth").at} r={15} />}>
          {n === 4 && <Label x={1540} y={40} anchor="end" lines={["The Teeth", "rocks awash"]} size={60} opacity={phase(lp, 0.3, 0.42)} />}
          {n === 5 && <Label x={1540} y={40} anchor="end" lines={["The symbol always wins", "keep well clear"]} size={56} accent={AMBER} />}
        </ChartShot>
      );
    }
    const lit = n === 0 ? 0 : n === 1 ? 2 : 4;
    return (
      <Stage>
        <SceneTitle t={t} y={100}>Rocks and wrecks</SceneTitle>
        {ROCK_CARDS.map((c, i) => {
          const x = i % 2 === 0 ? 45 : 815;
          const y = i < 2 ? 140 : 380;
          const current = n === 1 ? i < 2 : n === 2 ? i >= 2 && i < 4 : false;
          return (
            <g key={c.id} opacity={i < lit ? 1 : 0.15}>
              <rect x={x} y={y} width={740} height={215} rx={22} fill={current ? "rgba(245,179,1,0.12)" : "rgba(255,255,255,0.06)"} stroke={current ? AMBER : TEAL} strokeWidth={current ? 5 : 2.5} />
              <g transform={`translate(${x + 24} ${y + 24}) scale(3.5)`}>
                <rect width={48} height={48} rx={5} fill="#fff" />
                <SymbolGlyph id={c.id} />
              </g>
              <text x={x + 220} y={y + 95} fontSize={44} fontWeight={800} fill="#fff">{c.title}</text>
              <text x={x + 220} y={y + 150} fontSize={36} fill={ART.muted}>{c.sub}</text>
            </g>
          );
        })}
        <g opacity={n === 3 ? 1 : 0}>
          <rect x={45} y={620} width={1510} height={220} rx={22} fill="rgba(245,179,1,0.12)" stroke={AMBER} strokeWidth={5} />
          <g transform="translate(70 640) scale(3.75)">
            <rect width={48} height={48} rx={5} fill="#fff" />
            <SymbolGlyph id="rock-uw" />
          </g>
          <text x={290} y={720} fontSize={44} fontWeight={800} fill="#fff">Dotted line: danger</text>
          <g transform="translate(830 640) scale(3.75)">
            <rect width={48} height={48} rx={5} fill="#fff" />
            <SymbolGlyph id="wreck-danger" />
          </g>
          <text x={1050} y={720} fontSize={44} fontWeight={800} fill="#fff">A wreck</text>
          <text x={1050} y={775} fontSize={36} fill={ART.muted}>depth unknown</text>
        </g>
      </Stage>
    );
  }),

  // Sentences: 0 italic letters, 1 S, M, R and weed, 2 sand holds, 3 weed and rock do not, 4 seagrass, 5 coral.
  scene(5, (t, n) => {
    const lp = T5.local(t, n);
    const letters = [
      { k: "S", name: "sand" },
      { k: "M", name: "mud" },
      { k: "R", name: "rock" },
      { k: "Wd", name: "weed" },
    ];
    return (
      <Stage>
        <SceneTitle t={t} y={100}>What the seabed is made of</SceneTitle>
        {letters.map((l, i) => (
          <g key={l.k} opacity={n === 0 ? phase(lp, 0.4 + i * 0.1, 0.5 + i * 0.1) : 1}>
            <rect x={110 + i * 360} y={150} width={300} height={140} rx={16} fill="#fff" />
            <text x={175 + i * 360} y={245} textAnchor="middle" fontSize={70} fontStyle="italic" fill={CHART_COLOURS.ink}>{l.k}</text>
            <text x={255 + i * 360} y={240} fontSize={40} fontWeight={700} fill={CHART_COLOURS.plot} opacity={n >= 1 ? 1 : 0}>{l.name}</text>
          </g>
        ))}
        <SeabedPanel x={70} kind="sand" opacity={n >= 2 ? 1 : 0} caption="Sand" sub="the anchor digs in" good />
        <SeabedPanel
          x={570}
          kind="weed"
          opacity={n >= 3 ? 1 : 0}
          caption={n >= 4 ? "Seagrass" : "Weed"}
          sub={n >= 4 ? "protected in many places" : "skids over the top"}
          good={false}
        />
        <SeabedPanel
          x={1070}
          kind={n >= 5 ? "coral" : "rock"}
          opacity={n >= 3 ? 1 : 0}
          caption={n >= 5 ? "Coral" : "Rock"}
          sub={n >= 5 ? "never anchor on it" : "nothing to grip"}
          good={false}
        />
        {n === 4 && <Pill x={800} y={790} text="Anchor on the pale sand patches" size={44} bg="rgba(31,157,85,0.95)" opacity={phase(lp, 0.55, 0.65)} />}
      </Stage>
    );
  }),

  // Sentences: 0 the rose, 1 outer ring true, 2 inner ring magnetic, 3 the variation note, 4 Med and Caribbean.
  scene(6, (t, n) => {
    const lp = T6.local(t, n);
    if (n === 4) {
      return (
        <Stage>
          <SceneTitle t={t} y={110}>How big is the variation?</SceneTitle>
          <Card2 y={260} title="Mediterranean" body="a few degrees" colour={TEAL} opacity={phase(lp, 0.05, 0.15)} />
          <Card2 y={500} title="Caribbean" body="more than ten degrees" colour={AMBER} opacity={phase(lp, 0.45, 0.55)} />
        </Stage>
      );
    }
    const view = n === 0 ? lerpView(FULL_VIEW, ROSE_VIEW, phase(lp, 0, 0.6)) : n === 3 ? lerpView(ROSE_VIEW, VAR_VIEW, phase(lp, 0, 0.3)) : ROSE_VIEW;
    const m = mapView(ROSE_VIEW);
    const c = m.pt(ROSE.x, ROSE.y);
    const outerAt = polar(c, ROSE_OUTER * m.s, 50);
    const innerAt = polar(c, ROSE_INNER * m.s, 90);
    const magN = polar(c, ROSE_INNER * m.s, VARIATION.dir === "W" ? -VARIATION.degrees : VARIATION.degrees);
    return (
      <ChartShot view={view}>
        {n === 1 && (
          <g>
            <circle cx={c.x} cy={c.y} r={ROSE_OUTER * m.s} fill="none" stroke={TEAL} strokeWidth={12} />
            <line x1={outerAt.x} y1={outerAt.y} x2={1060} y2={outerAt.y} stroke={TEAL} strokeWidth={5} />
            <Pill x={1060} y={outerAt.y} anchor="start" text="Outer ring: true" />
            <line x1={c.x} y1={c.y} x2={c.x} y2={c.y - ROSE_OUTER * m.s} stroke={TEAL} strokeWidth={6} />
          </g>
        )}
        {n === 2 && (
          <g>
            <circle cx={c.x} cy={c.y} r={ROSE_INNER * m.s} fill="none" stroke={ORANGE} strokeWidth={12} />
            <line x1={innerAt.x} y1={innerAt.y} x2={1060} y2={innerAt.y} stroke={ORANGE} strokeWidth={5} />
            <Pill x={1060} y={innerAt.y} anchor="start" text="Inner ring: magnetic" />
            <line x1={c.x} y1={c.y} x2={magN.x} y2={magN.y} stroke={ORANGE} strokeWidth={6} />
          </g>
        )}
        {n === 3 && (
          <g opacity={phase(lp, 0.3, 0.4)}>
            <Pill x={SW / 2} y={100} text={`${VARIATION.degrees}° ${VAR_WORD} in ${VARIATION.year}`} size={54} />
            <Pill x={SW / 2} y={215} text={`Changes ${VARIATION.change}′ ${VARIATION.changeDir === "E" ? "east" : "west"} a year`} size={46} opacity={phase(lp, 0.55, 0.65)} />
          </g>
        )}
      </ChartShot>
    );
  }),

  // Sentences: 0 an address, 1 latitude and longitude, 2 degrees and minutes, 3 the border scales, 4 Lefkas, 5 latitude first, Caribbean west.
  scene(7, (t, n) => {
    const lp = T7.local(t, n);
    if (n === 3) {
      const view = regionView(APPROACH.at);
      const m = mapView(view);
      const side = m.ll({ lat: APPROACH.at.lat, lon: APPROACH_SIDE.sideLon });
      const edge = m.ll({ lat: APPROACH_SIDE.edgeLat, lon: APPROACH.at.lon });
      return (
        <ChartShot
          view={view}
          highlight={["kerran-approach"]}
          under={
            <>
              <ChartLine from={APPROACH.at} to={{ lat: APPROACH.at.lat, lon: APPROACH_SIDE.sideLon }} colour={CHART_COLOURS.plotAlt} width={3} dash="8 5" progress={phase(lp, 0.05, 0.4)} />
              <ChartLine from={APPROACH.at} to={{ lat: APPROACH_SIDE.edgeLat, lon: APPROACH.at.lon }} colour={CHART_COLOURS.plot} width={3} dash="8 5" progress={phase(lp, 0.5, 0.85)} />
            </>
          }
        >
          <Pill x={side.x + (APPROACH_SIDE.side === "left" ? 40 : -40)} y={side.y - 70} anchor={APPROACH_SIDE.side === "left" ? "start" : "end"} text={`Latitude ${formatLat(APPROACH.at.lat)}`} opacity={phase(lp, 0.3, 0.42)} fg={AMBER} />
          <Pill x={edge.x + 40} y={edge.y + (APPROACH_SIDE.edge === "top" ? 80 : -80)} anchor="start" text={`Longitude ${formatLon(APPROACH.at.lon)}`} opacity={phase(lp, 0.75, 0.87)} fg={TEAL} />
        </ChartShot>
      );
    }
    if (n >= 4) {
      return (
        <Stage>
          <SceneTitle t={t} y={110}>Writing a position</SceneTitle>
          <g opacity={phase(T7.local(t, 4), 0.05, 0.15) || (n > 4 ? 1 : 0)}>
            <text x={160} y={290} fontSize={48} fontWeight={700} fill="#fff">Lefkas Marina, Greece</text>
            <text x={160} y={390} fontSize={76} fontWeight={800} fontFamily={MONO}>
              <tspan fill={AMBER}>{formatLat(LEFKAS.lat)}</tspan> <tspan fill={TEAL}>{formatLon(LEFKAS.lon)}</tspan>
            </text>
          </g>
          <g opacity={n === 5 ? 1 : 0}>
            <text x={160} y={540} fontSize={48} fontWeight={700} fill="#fff">Road Town, British Virgin Islands</text>
            <text x={160} y={640} fontSize={76} fontWeight={800} fontFamily={MONO}>
              <tspan fill={AMBER}>{formatLat(ROAD_TOWN.lat)}</tspan> <tspan fill={TEAL}>{formatLon(ROAD_TOWN.lon)}</tspan>
            </text>
            <Pill x={800} y={790} text="Latitude first · west of Greenwich in the Caribbean" size={40} />
          </g>
        </Stage>
      );
    }
    const v: GlobeView = { cx: 800, cy: 530, r: 300, lat0: 25, lon0: -10 + 30 * t };
    const pt = globePoint(v, LEFKAS.lat, LEFKAS.lon);
    return (
      <Stage>
        <SceneTitle t={t}>Latitude and longitude</SceneTitle>
        <GlobeDisc v={v} />
        <GlobeGrid v={v} opacity={0.3} width={2} />
        {n >= 1 && (
          <g>
            <path d={parallelPath(v, 0)} fill="none" stroke={AMBER} strokeWidth={8} opacity={phase(lp, 0, 0.2) || (n > 1 ? 1 : 0)} />
            <path d={meridianPath(v, 0)} fill="none" stroke={TEAL} strokeWidth={8} opacity={phase(lp, 0.5, 0.65) || (n > 1 ? 1 : 0)} />
            <Lines x={80} y={330} lines={["Latitude:", "north or south", "of the equator"]} size={44} fill={AMBER} weight={700} opacity={phase(lp, 0, 0.2) || (n > 1 ? 1 : 0)} />
            <Lines x={1180} y={330} lines={["Longitude:", "east or west", "of Greenwich"]} size={44} fill={TEAL} weight={700} opacity={phase(lp, 0.5, 0.65) || (n > 1 ? 1 : 0)} />
          </g>
        )}
        {n >= 0 && pt.z > 0 && <circle cx={pt.x} cy={pt.y} r={14} fill={ART.port} stroke="#fff" strokeWidth={4} opacity={n === 0 ? phase(lp, 0.3, 0.5) : 1} />}
        {n === 2 && <Pill x={800} y={190} text="1 degree = 60 minutes" size={44} />}
      </Stage>
    );
  }),

  // Sentences: 0 three questions, 1 shelter, 2 sand and depth, 3 dangers, 4 Kerran Roads in a southerly, 5 in a northerly, 6 next lesson.
  scene(8, (t, n) => {
    const lp = T8.local(t, n);
    if (n === 6) {
      return (
        <Stage>
          <text x={800} y={380} textAnchor="middle" fontSize={64} fontWeight={800} fill="#fff">Next: distance, speed and time</text>
          <text x={800} y={470} textAnchor="middle" fontSize={40} fill={ART.muted}>how far, how long, and when you arrive</text>
        </Stage>
      );
    }
    if (n === 3) {
      return (
        <ChartShot view={ISLAND_VIEW} under={["teeth", "mew-rock", "wreck", "head-ledge"].map((id) => <Ring key={id} at={feature(id).at} r={16} />)}>
          <Label x={40} y={40} lines={["3. What is in the way?", "rocks, shallows, wrecks"]} size={52} />
        </ChartShot>
      );
    }
    const view = n === 5 ? lerpView(NORTH_VIEW, SOUTH_VIEW, phase(lp, 0.45, 0.85)) : NORTH_VIEW;
    const m = mapView(view);
    const roads = m.ll(ROADS.at);
    const south = m.ll(SOUTH.at);
    const questions = [
      ["1. Sheltered?", "from the forecast wind"],
      ["2. Sand at a good depth?", "say 4 to 10 metres"],
    ];
    return (
      <ChartShot view={view}>
        {n === 0 && <Label x={SW / 2} y={300} anchor="middle" lines={["Three questions", "before you go in"]} size={70} opacity={phase(lp, 0.1, 0.25)} />}
        {(n === 1 || n === 2) && <Label x={40} y={40} lines={questions[n - 1]!} size={52} />}
        {n === 1 && <WindBadge x={1380} y={250} from={180} text="Forecast?" />}
        {n >= 2 && n <= 4 && (
          <g>
            <circle cx={roads.x} cy={roads.y} r={36} fill="none" stroke={AMBER} strokeWidth={6} />
            <rect x={roads.x + 50} y={roads.y - 40} width={250} height={80} rx={12} fill="#fff" stroke={CHART_COLOURS.ink} strokeWidth={2} />
            <text x={roads.x + 80} y={roads.y + 18} fontSize={52} fontStyle="italic" fill={CHART_COLOURS.ink}>S</text>
            <text x={roads.x + 140} y={roads.y + 18} fontSize={46} fontWeight={700} fill={CHART_COLOURS.plot}>{m1(ROADS.depth)} m</text>
          </g>
        )}
        {n === 4 && (
          <g>
            <WindBadge x={1400} y={250} from={180} text="Southerly" colour="#5fd38d" />
            <Label x={40} y={40} lines={["Kerran Roads", "sheltered in a southerly"]} size={52} accent="#5fd38d" />
          </g>
        )}
        {n === 5 && (
          <g>
            <WindBadge x={1380} y={250} from={0} text="Northerly" colour="#ff8a7a" />
            {lp < 0.45 && <Label x={40} y={40} lines={["Kerran Roads", "wide open to the north"]} size={52} accent="#ff8a7a" />}
            {lp >= 0.85 && (
              <g>
                <circle cx={south.x} cy={south.y} r={36} fill="none" stroke="#5fd38d" strokeWidth={6} />
                <Label x={40} y={40} lines={["Kerran Bay", "the island blocks a northerly"]} size={52} accent="#5fd38d" />
              </g>
            )}
          </g>
        )}
      </ChartShot>
    );
  }),
];

/** A wide caption card on a stage. */
function Card2({ y, title, body, colour, opacity }: { y: number; title: string; body: string; colour: string; opacity: number }) {
  return (
    <g opacity={opacity}>
      <rect x={200} y={y} width={1200} height={190} rx={22} fill="rgba(255,255,255,0.07)" stroke={colour} strokeWidth={4} />
      <text x={260} y={y + 85} fontSize={58} fontWeight={800} fill="#fff">{title}</text>
      <text x={260} y={y + 150} fontSize={44} fill={colour}>{body}</text>
    </g>
  );
}

export function Video() {
  return <LessonPlayer slug={SCRIPT.slug} title="Reading the chart" scenes={SCENES} speak={SCRIPT.speak} />;
}

/* ------------------------------------------------------------------ */
/* Exercises                                                           */
/* ------------------------------------------------------------------ */

/** A charted figure printed large, for questions. */
function FigFigure({ depth }: { depth: number }) {
  return (
    <svg viewBox="0 0 140 70" width={140} height={70} role="img" aria-label={`A figure printed on the chart: ${m1(Math.abs(depth))}${depth < 0 ? ", underlined" : ""}`} className="rounded-lg border border-border bg-white">
      <g fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"><Fig x={70} y={46} depth={depth} size={40} /></g>
    </svg>
  );
}

/** A small crosshair with an open centre, so the tint under the point stays visible. */
function Target({ at }: { at: LatLon }) {
  const p = project(at);
  const c = CHART_COLOURS.plotAlt;
  return (
    <g stroke={c} strokeWidth={1.6} strokeLinecap="round">
      <line x1={p.x - 10} x2={p.x - 3.5} y1={p.y} y2={p.y} />
      <line x1={p.x + 3.5} x2={p.x + 10} y1={p.y} y2={p.y} />
      <line x1={p.x} x2={p.x} y1={p.y - 10} y2={p.y - 3.5} />
      <line x1={p.x} x2={p.x} y1={p.y + 3.5} y2={p.y + 10} />
      <circle cx={p.x} cy={p.y} r={1.3} fill={c} stroke="none" />
    </g>
  );
}

function readExplain(p: LatLon, what: string): string {
  const s = nearestScales(p);
  return (
    `Latitude: from ${what}, go straight across to the ${s.side}-hand scale. It meets the scale ${latReading(p)}, so ${formatLat(p.lat)}. ` +
    `Longitude: go straight ${s.edge === "top" ? "up" : "down"} to the ${s.edge} scale. It meets the scale ${lonReading(p)}, so ${formatLon(p.lon)}. ` +
    `The position is ${formatPosition(p)}.`
  );
}

function plotExplain(p: LatLon): string {
  const s = nearestScales(p);
  return (
    `Find ${formatLat(p.lat)} on the ${s.side}-hand latitude scale (${latReading(p)}) and draw a line straight across. ` +
    `Find ${formatLon(p.lon)} on the ${s.edge} longitude scale (${lonReading(p)}) and draw a line straight ${s.edge === "top" ? "down" : "up"}. ` +
    "The position is where the two lines cross."
  );
}

function readFigure(p: LatLon, highlight?: string, mark?: string) {
  return (
    <PracticeChart zoomable view={regionView(p)} highlight={highlight ? [highlight] : undefined} title="Practice chart: read the position from the border scales">
      {mark && <ChartPoint at={p} cross colour={CHART_COLOURS.plotAlt} label={mark} />}
    </PracticeChart>
  );
}

const colourStretch = (b: Band) => COLOUR_STRETCHES.find((s) => s.band === b)!;
// A spot well inside the green on the south coast (checked against the depth model).
const DRY_CANDIDATE = km(4.98, 13.3);
const DRY_POINT = bandAtMin(toMinutes(DRY_CANDIDATE)) === "drying" ? DRY_CANDIDATE : colourStretch("drying").mid;
const DRY_DEPTH = depthAtPoint(DRY_POINT) ?? 0;
const TOWER = feature("tower");
const PLOT_Q = PLOT_TARGETS[1]!;

export const QUESTIONS: Question[] = [
  {
    id: "read-sounding",
    kind: "choice",
    prompt: "You see this figure printed in the sea on a chart. What does it mean?",
    figure: <FigFigure depth={4.7} />,
    options: ["About 4.7 m of water at the lowest tide", "47 m of water", "The ground dries 4.7 m at low tide", "A rock 4.7 m high"],
    answer: 0,
    explain: <>A plain figure is a sounding: the depth in metres below chart datum, which is about the lowest the tide falls. The small figure set lower down is the tenths, so <FigHtml depth={4.7} /> is 4.7 m.</>,
  },
  {
    id: "read-drying",
    kind: "choice",
    prompt: "Close to the shore you see this underlined figure. What does it mean?",
    figure: <FigFigure depth={-1.8} />,
    options: ["1.8 m of water at the lowest tide", "The ground dries 1.8 m: it is uncovered at low tide", "18 m of water", "A rock 1.8 m below the surface at all times"],
    answer: 1,
    explain: <>Underlining marks a drying height, measured up from chart datum. <FigHtml depth={-1.8} /> means the ground stands 1.8 m clear of the water at the lowest tide, and needs more than 1.8 m of tide before there is any water over it.</>,
  },
  {
    id: "green-area",
    kind: "choice",
    prompt: "What does the green colour at the centre of the orange crosshair tell you?",
    figure: (
      <PracticeChart view={viewAround(DRY_POINT, 1.8)} zoomable title="Practice chart: a point on the green foreshore">
        <Target at={DRY_POINT} />
      </PracticeChart>
    ),
    options: ["It is land, always above the water", "It dries: covered at high tide, uncovered at low tide", "It always has at least 2 m of water", "It is a nature reserve"],
    answer: 1,
    explain: `Green marks ground that dries. Here it is about ${Math.abs(roundDepth(DRY_DEPTH))} m above chart datum, so it is uncovered near low water. Keep off it unless you know the tide.`,
  },
  {
    id: "contours-close",
    kind: "choice",
    prompt: "Approaching a bay, you see the 20 m, 10 m and 5 m contours drawn very close together near the shore. What does that tell you?",
    options: ["The seabed shelves steeply, so the depth will change fast", "The water is shallow a long way out", "There is a strong current", "The chart is out of date"],
    answer: 0,
    explain: "Contours join points of equal depth. Close together means a steep slope: you can go from deep water to a few metres in a short distance, so watch the depth sounder and slow down.",
  },
  {
    id: "seabed-best",
    kind: "choice",
    prompt: "Inside a bay you see the letters S, Wd and R printed in different places. Where should you drop the anchor for the night?",
    options: ["On the S", "On the Wd", "On the R", "It makes no difference"],
    answer: 0,
    explain: "S is sand, the best holding: the anchor digs in. Wd is weed (in the Mediterranean usually seagrass), where the anchor skids over the top; R is rock, which gives it nothing to grip.",
  },
  {
    id: "seagrass",
    kind: "choice",
    prompt: "You arrive in a cala, a small cove, in Mallorca. Looking down, you see dark patches and pale patches on the bottom. Where do you anchor?",
    options: ["On a pale patch: it is sand", "On a dark patch: it holds better", "Anywhere, as long as it is deep enough", "On the dark patch closest to the beach"],
    answer: 0,
    explain: "The dark patches are seagrass, which holds badly and is protected across the Balearics: patrol boats check anchored yachts in summer. Drop the anchor on a pale sand patch, or use a buoy where there is one.",
  },
  {
    id: "tap-awash",
    kind: "plot",
    prompt: "On the chart, tap the rocks that are awash at low tide (a cross with four dots inside a dotted line).",
    answer: feature("teeth").at,
    tolerance: 0.3,
    view: viewAround(km(7.0, 8.5), 10),
    explain: "The Teeth lie just east of Gull Point. A cross with four dots is a rock awash, close to the surface at low tide and hidden most of the time; the dotted line round it says danger.",
  },
  {
    id: "brennan-least",
    kind: "numeric",
    prompt: "Zoom in on Brennan Bank, south-east of the island. What is the least depth printed on the bank, in metres?",
    figure: <PracticeChart view={viewAround(BANK_AT, 6, 16 / 9)} zoomable title="Practice chart: Brennan Bank" />,
    answer: BANK_LEAST,
    tolerance: 0.05,
    unit: "m",
    explain: <>In the middle of the 5 m contour the chart shows <FigHtml depth={BANK_LEAST} />: {m1(BANK_LEAST)} m at chart datum. A charter yacht typically draws about 2 m, so there would be almost nothing under the keel at a low tide.</>,
  },
  {
    id: "rose-rings",
    kind: "choice",
    prompt: "On the compass rose, which ring gives directions relative to true north?",
    figure: <PracticeChart view={frame(ROSE.x, ROSE.y, 300)} zoomable title="Practice chart: the compass rose" />,
    options: ["The outer ring", "The inner ring", "Both rings", "Neither: the rose only shows magnetic north"],
    answer: 0,
    explain: `The outer ring is true, lined up with the meridians. The inner ring is magnetic, turned by the variation printed in the middle: here ${VARIATION.degrees}° ${VAR_WORD} in ${VARIATION.year}.`,
  },
  {
    id: "read-tower",
    kind: "position",
    prompt: "Read the position of the Old tower on the north-east of the island. Its position is the dot at the foot of the symbol. Zoom in on the border scales to count the tenths.",
    figure: readFigure(TOWER.at, TOWER.id),
    answer: TOWER.at,
    tolerance: 0.2,
    explain: readExplain(TOWER.at, "the tower"),
  },
  {
    id: "plot-position",
    kind: "plot",
    prompt: `Plot the position ${formatPosition(PLOT_Q)}.`,
    answer: PLOT_Q,
    tolerance: 0.3,
    explain: plotExplain(PLOT_Q),
  },
  {
    id: "bay-shelter",
    kind: "choice",
    prompt: "The forecast for tonight is a northerly, force 4 to 5. Kerran Roads is on the north side of the island; Kerran Bay is on the south side. Where do you spend the night?",
    figure: <PracticeChart view={ISLAND_VIEW} zoomable highlight={["anchorage", "harbour"]} title="Practice chart: Kerran Roads and Kerran Bay" />,
    options: ["Kerran Bay, with the island between you and the wind", "Kerran Roads, facing into the wind", "Either: the island is small", "Neither: anchor in open water"],
    answer: 0,
    explain: "A northerly blows straight into Kerran Roads. On the south side, in Kerran Bay, the island shelters you. Always pick the side away from the forecast wind, and check the forecast again before dark.",
  },
];

/* ------------------------------------------------------------------ */
/* Practice generator                                                  */
/* ------------------------------------------------------------------ */

const DANGER_MIN = ["teeth", "mew-rock", "wreck", "head-ledge"].map((id) => toMinutes(feature(id).at));
const ROSE_MIN: MinPt = [2.0, 21.0];

let SAMPLES: Record<Band, MinPt[]> | null = null;
/** Points well inside each colour band (not on an edge, under the title block, rose or a danger). */
function bandSamples(): Record<Band, MinPt[]> {
  if (SAMPLES) return SAMPLES;
  const out: Record<Band, MinPt[]> = { land: [], drying: [], shallow: [], mid: [], deep: [] };
  const cos = 0.646;
  for (let la = 0.6; la <= 11.4; la += 0.15) {
    for (let lo = 0.6; lo <= 23.4; lo += 0.15) {
      if (la > 9.8 && lo > 17) continue;
      if (Math.hypot(la - ROSE_MIN[0], (lo - ROSE_MIN[1]) * cos) < 2.1) continue;
      if (DANGER_MIN.some(([a, b]) => Math.hypot(la - a, (lo - b) * cos) < 0.5)) continue;
      const b = bandAtMin([la, lo]);
      const clear = Array.from({ length: 8 }, (_, k) => (k * Math.PI) / 4).every((a) => bandAtMin([la + 0.06 * Math.sin(a), lo + (0.06 * Math.cos(a)) / cos]) === b);
      if (clear) out[b].push([la, lo]);
    }
  }
  SAMPLES = out;
  return out;
}

function bandQuestion(rng: Rng, band: Band): Question {
  const p = pick(rng, bandSamples()[band]);
  const at = km(p[0], p[1]);
  const d = depthAtPoint(at);
  const detail =
    d === null
      ? "The point is on land."
      : d < 0
        ? `It dries about ${Math.abs(roundDepth(d))} m here (written ${soundingText(d)}, underlined).`
        : `The chart gives about ${roundDepth(d)} m here at chart datum.`;
  return {
    id: `p-band-${band}`,
    kind: "choice",
    prompt: "What does the chart tell you about the place at the centre of the orange crosshair?",
    figure: (
      <PracticeChart view={viewAround(at, band === "land" || band === "deep" ? 3 : 1.8)} zoomable title="Practice chart with a marked point">
        <Target at={at} />
      </PracticeChart>
    ),
    options: BAND_ORDER.map((b) => BAND_INFO[b].option),
    answer: BAND_ORDER.indexOf(band),
    fixedOrder: true,
    explain: `${BAND_INFO[band].tint} tint: ${BAND_INFO[band].meaning} ${detail}`,
  };
}

function readQuestion(rng: Rng): Question {
  if (rng() < 0.5) {
    const r = pick(rng, READABLE_FEATURES);
    const f = feature(r.id);
    return {
      id: `p-read-${f.id}`,
      kind: "position",
      prompt: `Read the position of ${r.label} from the chart’s border scales. ${r.hint}`,
      figure: readFigure(f.at, f.id),
      answer: f.at,
      tolerance: 0.2,
      explain: readExplain(f.at, r.label),
    };
  }
  const p = randomSeaPosition(rng);
  return {
    id: "p-read-mark",
    kind: "position",
    prompt: "What is the position of the cross marked X? Read it from the border scales.",
    figure: readFigure(p, undefined, "X"),
    answer: p,
    tolerance: 0.2,
    explain: readExplain(p, "the cross"),
  };
}

function plotQuestion(rng: Rng): Question {
  const p = randomSeaPosition(rng);
  return { id: "p-plot", kind: "plot", prompt: `Plot the position ${formatPosition(p)}.`, answer: p, tolerance: 0.3, explain: plotExplain(p) };
}

const IDENTIFIABLE: SymbolId[] = [
  "rock-nc", "rock-cu", "rock-awash", "rock-uw", "wreck-danger", "wreck-known",
  "seabed-sand", "seabed-weed", "seabed-rock", "seabed-mud", "light", "anchorage", "church",
];

function symbolQuestion(rng: Rng): Question {
  const id = pick(rng, IDENTIFIABLE);
  const info = symbolInfo(id);
  const unfair = id === "wreck-known" ? "wreck-danger" : null;
  const same = shuffle(rng, SYMBOLS.filter((s) => s.group === info.group && s.id !== id && s.id !== unfair)).map((s) => s.name);
  const others = shuffle(rng, SYMBOLS.filter((s) => s.group !== info.group && s.id !== "sounding" && s.id !== "drying")).map((s) => s.name);
  const { options, answer } = choices(rng, info.name, [...same.slice(0, 2), ...others]);
  return {
    id: "p-symbol",
    kind: "choice",
    prompt: "What does this chart symbol mean?",
    figure: <SymbolImage id={id} size={96} label="A chart symbol" className="rounded-lg border border-border" />,
    options,
    answer,
    explain: <><strong>{info.name}.</strong> {info.meaning}</>,
  };
}

const SHELTER_OPTIONS: Record<Shelter, string> = {
  sheltered: "Sheltered: the island is between you and the wind",
  partly: "Partly sheltered: the wind blows along the shore",
  exposed: "Exposed: the wind blows straight in",
};

function shelterQuestion(rng: Rng): Question {
  const s = pick(rng, BAY_STOPS);
  const wind = pick(rng, POINTS);
  const got = shelterAt(s, pointBearing(wind));
  const order: Shelter[] = ["sheltered", "partly", "exposed"];
  return {
    id: "p-shelter",
    kind: "choice",
    prompt: `The wind is from the ${POINT_NAMES[wind]}. How sheltered is the marked spot: ${s.name}?`,
    figure: (
      <PracticeChart view={ISLAND_VIEW} zoomable title={`Practice chart: ${s.name}`}>
        <ChartPoint at={s.at} colour={CHART_COLOURS.plotAlt} r={6} label={s.name.replace(/ \(.*\)$/, "")} />
      </PracticeChart>
    ),
    options: order.map((o) => SHELTER_OPTIONS[o]),
    answer: order.indexOf(got),
    fixedOrder: true,
    explain: `This spot is on the ${compassWord(s.side)} side of the island. A ${POINT_NAMES[wind]} wind ${got === "sheltered" ? "comes over the island first, so you are in its lee" : got === "partly" ? "blows along this shore, so you get some shelter but also some swell" : "blows straight onto this shore"}. ${SEABED[s.seabed].name} on the bottom here: ${SEABED[s.seabed].holding} holding.`,
  };
}

function compassWord(bearing: number): string {
  return POINT_NAMES[POINTS[Math.round(bearing / 45) % 8]!];
}

export const PRACTICE: PracticeGenerator = {
  title: "Chart-reading practice",
  description: "Fresh questions every time: colours and depths at random places, a position to read, one to plot, a symbol and a question of shelter.",
  generate: (rng) => {
    const band = pick(rng, BAND_ORDER);
    return [bandQuestion(rng, band), readQuestion(rng), plotQuestion(rng), symbolQuestion(rng), shelterQuestion(rng)];
  },
};

export function Exercises({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  return <ExerciseSet courseSlug={courseSlug} lessonSlug={lessonSlug} questions={QUESTIONS} practice={PRACTICE} />;
}
