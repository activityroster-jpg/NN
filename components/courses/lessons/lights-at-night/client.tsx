"use client";

// Lesson 7, Lights at night. Scenes, questions and practice, ported and
// adapted from the Boaty Jobs lessons on light characteristics, night and
// poor visibility, and navigation lights. The narration lives in script.ts.

import { Anchor, CircleCheck, Clock, FileWarning, Lightbulb, MapPin, TriangleAlert } from "lucide-react";
import { formatPosition } from "@/lib/courses/geo";
import { lightOn, parseLight, type LightCharacteristic, type LightColour } from "@/lib/courses/navigation/lights";
import { lerpView, viewAround } from "@/lib/courses/navigation/chart-geometry";
import { km } from "@/lib/courses/navigation/practice-chart";
import { pick, randInt, shuffle, type Rng } from "@/lib/courses/random";
import { ExerciseSet, type PracticeGenerator, type Question } from "../../Exercises";
import LessonPlayer, { SceneTitle, Stage, fade, phase, splitSentences, type Scene } from "../../LessonPlayer";
import PracticeChart from "../../PracticeChart";
import { LightGlow, RhythmBar } from "../../marks";
import { ART, ChartBanner, ChartScene, Lines, SceneIcon } from "../../scene-art";
import { IslandSilhouette, MONO, NightSea, Overlay, PANO_TOWN, Panel, PanoBackdrop, PanoLights, PatternGlow, Reflection, StopwatchFace, Tag, TimeStrip } from "./art";
import {
  CHART_LIGHTS, COLOUR_NAME, GULL, GULL_LIGHT, KERRAN, KERRAN_LIGHT, LEADING, MEW, RHYTHM_NAMES, capital, chartLight, confusable, flashStarts,
  flashesSoFar, groupOf, isContinuous, kindOf, lightFraction, lightVsDark, piecesOf, readLight, rhythm, rhythmName,
  rhythmText, sayLight, sec, words, type ChartLight, type Pattern,
} from "./data";
import { fitFrame, NightSky, PlanView, VesselNight } from "./vessel-art";
import { vessel } from "./vessels";
import { lightsAtNight as SCRIPT } from "./script";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Pair a scripted scene with its visual. */
const scene = (i: number, render: Scene["render"]): Scene => ({ ...SCRIPT.scenes[i]!, render });
/** Show an element from narration sentence `from` onwards. */
const on = (sentence: number, from: number) => (sentence >= from ? 1 : 0);

/** Where each narration sentence starts and ends as a fraction of the scene. */
function sentenceSpans(narration: string): Array<[number, number]> {
  const parts = splitSentences(narration);
  const total = parts.reduce((n, s) => n + s.length, 0) || 1;
  let at = 0;
  return parts.map((s) => {
    const span: [number, number] = [at / total, (at + s.length) / total];
    at += s.length;
    return span;
  });
}

/** 0 → 1 progress through one sentence (clamped). */
function within(spans: Array<[number, number]>, sentence: number, t: number): number {
  const s = spans[sentence];
  if (!s) return 1;
  return Math.min(1, Math.max(0, (t - s[0]) / (s[1] - s[0] || 1)));
}

const spansOf = (i: number) => sentenceSpans(SCRIPT.scenes[i]!.narration);
const S1 = spansOf(1);
const S3 = spansOf(3);

const GULL_PIECES = piecesOf(GULL.light!)!;
const GULL_GROUP = groupOf(GULL_LIGHT)!;
const MEW_GROUP = groupOf(MEW.light)!;

// The narration names these facts in words; fail loudly if the chart changes under them.
if (GULL_GROUP !== 3 || GULL_LIGHT.period !== 10 || GULL_LIGHT.height !== 28 || GULL_LIGHT.range !== 15) throw new Error("Gull Point changed: update the lights-at-night script");
if (MEW_GROUP !== 2 || MEW.light.period !== 5 || MEW.light.colour !== "W") throw new Error("Mew Rock changed: update the lights-at-night script");
const SAME_AS_MEW = CHART_LIGHTS.filter((c) => c.key !== MEW.key && c.light.rhythm === MEW.light.rhythm && Math.abs(c.light.period - MEW.light.period) < 0.01);
if (SAME_AS_MEW.some((c) => c.light.colour === "W")) throw new Error("Mew Rock is no longer the only white Fl(2)5s: update scene 5");

/* ------------------------------------------------------------------ */
/* Scene pieces                                                        */
/* ------------------------------------------------------------------ */

const HORIZON = 600;
const LX = 760;
const LY = HORIZON - 46 - 46;

const S0_BUOYS = [
  { c: chartLight("no2"), x: 300, y: 690, offset: 1.2 },
  { c: chartLight("no1"), x: 440, y: 674, offset: 3.4 },
  { c: chartLight("n-teeth"), x: 1250, y: 662, offset: 0 },
  { c: chartLight("outfall"), x: 1430, y: 704, offset: 2.1 },
];

const ISLAND_VIEW = viewAround(km(6.6, 11.5), 14, 16 / 9);
const GULL_WIDE = viewAround(km(7.2, 6.7), 5, 16 / 9);
const GULL_CLOSE = viewAround(km(7.05, 6.75), 3.3, 16 / 9);
const BUOYS_VIEW = viewAround(km(4.2, 11.5), 3.4, 16 / 9);

/** A rhythm tile for the side-by-side scene. */
function Tile({ x, y, w, h, text, name, pattern, now, state }: {
  x: number; y: number; w: number; h: number; text: string; name: string; pattern: Pattern; now: number; state: "future" | "current" | "past";
}) {
  return (
    <g opacity={state === "future" ? 0.14 : 1}>
      <Panel x={x} y={y} w={w} h={h} highlight={state === "current"} />
      <text x={x + 24} y={y + 66} fontSize={50} fontWeight={800} fill="#fff" fontFamily={MONO}>{text}</text>
      <text x={x + 24} y={y + 118} fontSize={36} fill={state === "current" ? ART.tealBright : ART.muted}>{name}</text>
      <PatternGlow pattern={pattern} now={now} x={x + 54} y={y + 200} r={16} />
      <TimeStrip pattern={pattern} now={now} x={x + 100} y={y + 175} width={w - 124} height={50} />
    </g>
  );
}

const tileState = (n: number, from: number): "future" | "current" | "past" => (n < from ? "future" : n === from ? "current" : "past");

// Sentences of scene 4: 1 Fl, 2 Fl(3), 3 Q and VQ, 4 Iso, 5 Oc.
const RHYTHM_TILES: Array<{ text: string; from: number }> = [
  { text: "Fl 5s", from: 1 }, { text: "Fl(3) 10s", from: 2 }, { text: "Q", from: 3 },
  { text: "VQ", from: 3 }, { text: "Iso 4s", from: 4 }, { text: "Oc 4s", from: 5 },
];

/* The characteristic laid out piece by piece for the "Reading the code" scene. */
const CODE_PIECES: Array<{ text: string; label: string; from: number; slot?: boolean }> = [
  { text: GULL_PIECES.rhythm, label: "Rhythm", from: 1 },
  { text: GULL_PIECES.colour ?? "W", label: "Colour", from: 2, slot: !GULL_PIECES.colour },
  { text: GULL_PIECES.period!, label: "Period", from: 3 },
  { text: GULL_PIECES.height!, label: "Height", from: 4 },
  { text: GULL_PIECES.range!, label: "Range", from: 4 },
];
const CODE_GAP = 46;
const CODE_WIDTHS = CODE_PIECES.map((p) => (p.slot ? 150 : p.text.length * 112 * 0.6));
const CODE_LEFT = (1600 - (CODE_WIDTHS.reduce((a, b) => a + b, 0) + CODE_GAP * (CODE_PIECES.length - 1))) / 2;
const CODE_XS = CODE_WIDTHS.map((_, i) => CODE_LEFT + CODE_WIDTHS.slice(0, i).reduce((a, b) => a + b + CODE_GAP, 0));

/* Sea curve for the range scene: a circle far below the stage. */
const EARTH = { cx: 800, cy: 3640, r: 3000 };
const seaY = (x: number) => EARTH.cy - Math.sqrt(EARTH.r * EARTH.r - (x - EARTH.cx) ** 2);
const LH_X = 220;
const BOAT_X = 1400;
const EYE = { x: BOAT_X, y: seaY(BOAT_X) - 30 };

/** Where a straight sight line from the light to the eye first meets the sea, if it does. */
function blockedAt(lx: number, ly: number): number | null {
  for (let x = lx + 10; x < EYE.x; x += 5) {
    const y = ly + ((x - lx) / (EYE.x - lx)) * (EYE.y - ly);
    if (y > seaY(x)) return x;
  }
  return null;
}

function SideYacht({ x }: { x: number }) {
  const y = seaY(x);
  return (
    <g>
      <path d={`M${x - 70} ${y - 14} L ${x + 70} ${y - 14} L ${x + 50} ${y + 6} L ${x - 55} ${y + 6} Z`} fill="#e8eef5" />
      <line x1={x - 5} x2={x - 5} y1={y - 14} y2={y - 150} stroke="#e8eef5" strokeWidth={4} />
      <polygon points={`${x},${y - 146} ${x + 55},${y - 22} ${x},${y - 22}`} fill="#cfd8e3" opacity={0.9} />
      <circle cx={EYE.x - 30} cy={EYE.y} r={7} fill={ART.amber} />
    </g>
  );
}

/** Own-lights scene: which yacht to show for each sentence. */
const OWN = ["sail-deck", "sail-deck", "sail-tricolour", "motorsail", "anchor-small", "anchor-small"].map((id) => vessel(id));
const OWN_LABEL = ["Sunset to sunrise", "Under sail: sidelights and sternlight", "Under sail: or a tricolour", "Engine on: steaming light, no tricolour", "At anchor: all-round white", "Check them all at handover"];

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

export const SCENES: Scene[] = [
  // Sentences: 0 lights take over, 1 characteristic, 2 three flashes, 3 Gull Point, 4 this lesson, 5 before dark.
  scene(0, (t, n, s) => {
    const lit = lightOn(GULL_LIGHT, s);
    const seen = flashesSoFar(GULL_LIGHT, s);
    return (
      <Stage background="#040a14">
        <NightSea horizon={HORIZON} id="lan-s0" />
        <IslandSilhouette horizon={HORIZON} lightX={LX} />
        <Reflection x={LX} horizon={HORIZON} on={lit} length={240} />
        <LightGlow x={LX} y={LY} on={lit} r={13} />
        {n >= 1 && S0_BUOYS.map((b) => {
          const bOn = lightOn(b.c.light, s + b.offset);
          return (
            <g key={b.c.key}>
              <Reflection x={b.x} horizon={b.y} on={bOn} colour={b.c.light.colour} length={70} />
              <LightGlow x={b.x} y={b.y} on={bOn} colour={b.c.light.colour} r={7} />
            </g>
          );
        })}
        {n <= 1 && (
          <g>
            <text x={800} y={200} textAnchor="middle" fontSize={84} fontWeight={800} fill="#fff" opacity={fade(t, 0, 0.08)}>Lights at night</text>
            <text x={800} y={275} textAnchor="middle" fontSize={44} fill={ART.tealBright} opacity={fade(t, 0.04, 0.12)}>Lesson 7 · Navigation for charter skippers</text>
          </g>
        )}
        {n === 2 && <text x={800} y={250} textAnchor="middle" fontSize={54} fontWeight={700} fill="#fff">Three flashes · every 10 s</text>}
        {n === 3 && (
          <g>
            <text x={800} y={235} textAnchor="middle" fontSize={56} fontWeight={800} fill="#fff">Gull Point lighthouse</text>
            <text x={800} y={315} textAnchor="middle" fontSize={64} fontWeight={800} fill={ART.tealBright} fontFamily={MONO}>{GULL.light}</text>
          </g>
        )}
        {n >= 4 && (
          <g>
            {["Read the chart", "Find it in a harbour", "Show your own lights", "Arrive before dark"].map((label, i) => (
              <g key={label} opacity={n === 4 ? (i < 3 ? 1 : 0.2) : 1}>
                <rect x={60 + i * 375} y={170} width={350} height={100} rx={18} fill="rgba(11,25,41,0.85)" stroke={i === 3 && n === 5 ? ART.amber : ART.tealBright} strokeWidth={2.5} />
                <text x={235 + i * 375} y={233} textAnchor="middle" fontSize={34} fontWeight={700} fill="#fff">{label}</text>
              </g>
            ))}
          </g>
        )}
        {n >= 2 && n <= 3 && Array.from({ length: GULL_GROUP }, (_, i) => (
          <circle key={i} cx={LX + (i - (GULL_GROUP - 1) / 2) * 70} cy={410} r={18} fill={i < seen ? ART.amber : "none"} stroke={ART.amber} strokeWidth={4} />
        ))}
      </Stage>
    );
  }),
  // Sentences: 0 magenta flare, 1 lighthouse star, 2 lit buoys, 3 tap it on the plotter.
  scene(1, (t, n) => {
    const w = within(S1, n, t);
    const view =
      n === 0 ? lerpView(ISLAND_VIEW, GULL_WIDE, phase(w, 0, 0.5))
        : n === 1 ? lerpView(GULL_WIDE, GULL_CLOSE, phase(w, 0, 0.4))
          : n === 2 ? lerpView(GULL_CLOSE, BUOYS_VIEW, phase(w, 0, 0.35))
            : lerpView(BUOYS_VIEW, GULL_WIDE, phase(w, 0, 0.3));
    const banner = ["A light: the magenta flare", "A lighthouse: star and flare", "Lit buoys have a flare too", "Tap it on the plotter"][Math.min(n, 3)];
    return (
      <>
        <ChartScene from={view} highlight={n <= 1 || n === 3 ? [GULL.id] : ["no1", "no2", "no3", "no4"]} soundings={n === 0 || n === 2}>
          <ChartBanner>{banner}</ChartBanner>
        </ChartScene>
        <Overlay>
          {n === 1 && <Tag x={1560} y={200} anchor="end" text={GULL.light!} size={64} fill={ART.amber} mono />}
          {n === 2 && <Tag x={1560} y={200} anchor="end" text="Rhythm · colour · period" size={48} />}
          {n === 3 && (
            <g opacity={fade(w, 0.25, 0.4)}>
              <rect x={860} y={150} width={700} height={400} rx={20} fill="rgba(11,25,41,0.94)" stroke={ART.tealBright} strokeWidth={3} />
              <text x={900} y={212} fontSize={36} fill={ART.muted}>Plotter · light details</text>
              <text x={900} y={280} fontSize={54} fontWeight={800} fill="#fff">Gull Point</text>
              <text x={900} y={340} fontSize={38} fill="#fff" fontFamily={MONO}>{formatPosition(GULL.at)}</text>
              <text x={900} y={418} fontSize={54} fontWeight={800} fill={ART.amber} fontFamily={MONO}>{GULL.light}</text>
              <text x={900} y={490} fontSize={36} fill="#fff">White, group flashing 3, every 10 s</text>
            </g>
          )}
        </Overlay>
      </>
    );
  }),
  // Sentences: 0 the order, 1 rhythm, 2 colour, 3 period, 4 height and range.
  scene(2, (t, n, s) => {
    const explain = [
      "Rhythm · colour · period · height · range",
      `Group flashing: ${GULL_GROUP} flashes a group`,
      "No colour letter = white",
      `${sec(GULL_LIGHT.period)} s from group to group`,
      `${GULL_LIGHT.height} m high · seen ${GULL_LIGHT.range} miles on a clear night`,
    ][Math.min(n, 4)];
    const bar = { x: 380, y: 570, w: 1080, h: 54 };
    const scale = bar.w / GULL_LIGHT.period;
    return (
      <Stage>
        <SceneTitle t={t}>Reading the code</SceneTitle>
        {CODE_PIECES.map((p, i) => {
          const reached = n >= p.from;
          const current = n === p.from;
          const x = CODE_XS[i]!;
          return (
            <g key={p.label} opacity={reached ? 1 : 0.2}>
              {p.slot ? (
                <g>
                  <rect x={x} y={196} width={150} height={118} rx={12} fill="none" stroke={current ? ART.amber : ART.muted} strokeWidth={4} strokeDasharray="12 9" />
                  <text x={x + 75} y={290} textAnchor="middle" fontSize={92} fontWeight={800} fill={ART.muted} opacity={0.45} fontFamily={MONO}>W</text>
                </g>
              ) : (
                <text x={x} y={292} fontSize={112} fontWeight={800} fill={current ? ART.amber : "#fff"} fontFamily={MONO}>{p.text}</text>
              )}
              {reached && <text x={x + CODE_WIDTHS[i]! / 2} y={366} textAnchor="middle" fontSize={36} fill={current ? ART.amber : ART.muted}>{p.label}</text>}
            </g>
          );
        })}
        <text x={800} y={462} textAnchor="middle" fontSize={46} fontWeight={700} fill={ART.tealBright}>{explain}</text>
        <LightGlow x={210} y={bar.y + bar.h / 2} on={lightOn(GULL_LIGHT, s)} r={26} />
        <RhythmBar light={GULL_LIGHT} x={bar.x} y={bar.y} width={bar.w} height={bar.h} at={s % GULL_LIGHT.period} />
        {n >= 1 && flashStarts(GULL_LIGHT).map((st, i) => (
          <text key={i} x={bar.x + st * scale + 8} y={bar.y - 16} textAnchor="middle" fontSize={38} fontWeight={700} fill={n === 1 ? ART.amber : ART.muted}>{i + 1}</text>
        ))}
        {n >= 3 && (
          <g stroke={n === 3 ? ART.amber : ART.muted} strokeWidth={4} opacity={n === 3 ? 1 : 0.7}>
            <line x1={bar.x} x2={bar.x + bar.w} y1={bar.y + bar.h + 26} y2={bar.y + bar.h + 26} />
            <line x1={bar.x} x2={bar.x} y1={bar.y + bar.h + 12} y2={bar.y + bar.h + 40} />
            <line x1={bar.x + bar.w} x2={bar.x + bar.w} y1={bar.y + bar.h + 12} y2={bar.y + bar.h + 40} />
            <text x={bar.x + bar.w / 2} y={bar.y + bar.h + 84} textAnchor="middle" fontSize={40} fontWeight={700} stroke="none" fill={n === 3 ? ART.amber : ART.muted}>
              one period: {sec(GULL_LIGHT.period)} s, group start to group start
            </text>
          </g>
        )}
      </Stage>
    );
  }),
  // Sentences: 0 clear night, 1 haze and glare, 2 buoy lights low, 3 the curve and tall lighthouses, 4 check before naming.
  scene(3, (t, n) => {
    const w = within(S3, n, t);
    const low = n === 2 ? phase(w, 0, 0.35) : n === 3 ? 1 - phase(w, 0.3, 0.7) : 0;
    const towerH = 170 - 135 * low;
    const ground = seaY(LH_X);
    const ly = ground - towerH - 12;
    const blocked = blockedAt(LH_X, ly);
    const hazy = n === 1;
    const seen = !hazy && blocked === null;
    const endX = blocked ?? EYE.x - 30;
    const endY = ly + ((endX - LH_X) / (EYE.x - LH_X)) * (EYE.y - ly);
    const head = [
      [`Charted range: ${GULL_LIGHT.range} miles`, "on a clear night"],
      ["Haze, rain, town glare", "seen much less far"],
      ["A small, low light", "hidden until you are close"],
      ["A tall lighthouse", "seen over the curve of the Earth"],
      ["Before you name it", "colour · count · period"],
    ][Math.min(n, 4)]!;
    const sea = `M0 ${seaY(0).toFixed(1)} A ${EARTH.r} ${EARTH.r} 0 0 1 1600 ${seaY(1600).toFixed(1)} L1600 900 L0 900 Z`;
    return (
      <Stage background="#0b1a2c">
        <SceneTitle t={t}>What you really see</SceneTitle>
        <text x={800} y={215} textAnchor="middle" fontSize={52} fontWeight={800} fill={n === 1 || n === 2 ? "#ff8a80" : ART.amber}>{head[0]}</text>
        <text x={800} y={272} textAnchor="middle" fontSize={38} fill={ART.muted}>{head[1]}</text>
        <defs>
          <linearGradient id="lan-beam" x1={0} y1={0} x2={1} y2={0}>
            <stop offset={0} stopColor={ART.amber} stopOpacity={0.4} />
            <stop offset={1} stopColor={ART.amber} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="lan-haze" x1={0} y1={0} x2={1} y2={0}>
            <stop offset={0} stopColor="#9fb3c8" stopOpacity={0} />
            <stop offset={0.35} stopColor="#9fb3c8" stopOpacity={0.3} />
            <stop offset={1} stopColor="#9fb3c8" stopOpacity={0.42} />
          </linearGradient>
        </defs>
        {n === 0 && <polygon points={`${LH_X},${ly} 1600,${ly - 120} 1600,${ly + 70}`} fill="url(#lan-beam)" />}
        <path d={sea} fill="#123a5a" />
        <polygon points={`${LH_X - 20},${ground} ${LH_X + 20},${ground} ${LH_X + 12},${ground - towerH} ${LH_X - 12},${ground - towerH}`} fill="#e8eef5" />
        <rect x={LH_X - 16} y={ground - towerH - 22} width={32} height={22} rx={4} fill="#5b6b7b" />
        <LightGlow x={LH_X} y={ly} on r={11} />
        <SideYacht x={BOAT_X} />
        <line x1={LH_X} y1={ly} x2={hazy ? 760 : endX} y2={hazy ? ly + ((760 - LH_X) / (EYE.x - LH_X)) * (EYE.y - ly) : endY} stroke={seen ? "#4ade80" : "#ff8a80"} strokeWidth={4} strokeDasharray="14 10" />
        {!seen && !hazy && <text x={endX} y={endY - 26} textAnchor="middle" fontSize={48} fontWeight={800} fill="#ff8a80">✗</text>}
        <text x={EYE.x - 30} y={EYE.y - 190} textAnchor="middle" fontSize={40} fontWeight={700} fill={seen ? "#4ade80" : "#ff8a80"}>{seen ? "Light seen" : "Not seen yet"}</text>
        {hazy && <rect x={420} y={300} width={1180} height={470} fill="url(#lan-haze)" />}
        {n >= 2 && <text x={1580} y={760} textAnchor="end" fontSize={30} fill={ART.muted}>Not to scale</text>}
      </Stage>
    );
  }),
  // Sentences: 0 side by side, 1 Fl, 2 Fl(3), 3 Q and VQ, 4 Iso, 5 Oc.
  scene(4, (t, n, s) => (
    <Stage>
      <SceneTitle t={t}>The rhythms</SceneTitle>
      {RHYTHM_TILES.map((tile, i) => {
        const r = rhythm(tile.text);
        return (
          <Tile key={tile.text} x={30 + (i % 3) * 520} y={150 + Math.floor(i / 3) * 306} w={500} h={290}
            text={r.text} name={r.name} pattern={r.pattern} now={s} state={n === 0 ? "past" : tileState(n, tile.from)} />
        );
      })}
    </Stage>
  )),
  // Sentences: 0 colour, 1 count, 2 time the period, 3 several periods, 4 Mew Rock.
  scene(5, (t, n, s) => {
    const L = MEW.light;
    const lit = lightOn(L, s);
    const startAt = L.period; // the stopwatch starts at the second group
    const running = n >= 2 && s >= startAt;
    const elapsed = running ? s - startAt : null;
    const laps = elapsed === null ? 0 : Math.floor(elapsed / L.period + 1e-9);
    const count = flashesSoFar(L, s);
    const rows: Array<{ text: string; from: number }> = [
      { text: `Colour: ${COLOUR_NAME[L.colour]}`, from: 0 },
      { text: `Flashes: ${MEW_GROUP} in each group`, from: 1 },
      { text: `Period: ${sec(L.period)} s`, from: 3 },
      { text: `${MEW.text} → Mew Rock beacon`, from: 4 },
    ];
    return (
      <Stage>
        <SceneTitle t={t}>Identifying a light</SceneTitle>
        <g>
          <rect x={40} y={150} width={720} height={600} rx={20} fill="#040a14" stroke="rgba(255,255,255,0.14)" strokeWidth={2} />
          <rect x={40} y={540} width={720} height={210} fill="#061322" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <circle key={i} cx={90 + ((i * 173) % 640)} cy={200 + ((i * 97) % 280)} r={1.8} fill="#cbd5e1" opacity={0.5} />)}
          <Reflection x={400} horizon={545} on={lit} length={150} />
          <LightGlow x={400} y={520} on={lit} colour={L.colour} r={16} />
          {n >= 1 && Array.from({ length: MEW_GROUP }, (_, i) => (
            <circle key={i} cx={400 + (i - (MEW_GROUP - 1) / 2) * 70} cy={330} r={18} fill={i < count ? ART.amber : "none"} stroke={ART.amber} strokeWidth={4} />
          ))}
          <text x={400} y={700} textAnchor="middle" fontSize={48} fontWeight={800} fill={n >= 4 ? "#4ade80" : "#fff"}>{n >= 4 ? "Mew Rock beacon" : "?"}</text>
        </g>
        <g opacity={n >= 2 ? 1 : 0.25}>
          <StopwatchFace x={1200} y={265} seconds={elapsed} running={running} label="Phone stopwatch" />
        </g>
        {n >= 3 && laps >= 2 && (
          <text x={1200} y={410} textAnchor="middle" fontSize={38} fontWeight={700} fill={ART.amber} fontFamily={MONO}>
            {`${laps} periods: ${(laps * L.period).toFixed(1)} s ÷ ${laps} = ${L.period.toFixed(1)} s`}
          </text>
        )}
        {rows.map((r, i) => (
          <text key={r.text} x={860} y={505 + i * 68} fontSize={44} fontWeight={700} fill={i === 3 ? "#4ade80" : "#fff"} opacity={n >= r.from ? 1 : 0}>
            {n >= r.from ? "✓ " : ""}{r.text}
          </text>
        ))}
      </Stage>
    );
  }),
  // Sentences: 0 the view, 1 the town, 2 steady versus rhythm, 3 leading lights and buoys, 4 the mast, 5 judging distance.
  scene(6, (t, n, s) => {
    const ring = n === 3 ? ["front", "rear", "no3", "no4"] : n === 4 ? ["mast-top", "mast-low"] : [];
    const dim = n >= 3 && n <= 4 ? PANO_TOWN : [];
    const tag = [
      "Port Kerran ahead, at night",
      "Shore lights: streets, bars, cars, windows",
      "Shore lights steady · navigation lights keep a rhythm",
      `Leading lights ${LEADING.text}, in line · buoys low and flashing`,
      "Red, steady, high on the hill: a radio mast",
      "Distance is hard to judge: slow right down",
    ][Math.min(n, 5)]!;
    return (
      <Stage background="#04101d">
        <g transform="scale(2)">
          <PanoBackdrop id="lan-s6" />
          <PanoLights seconds={s} ring={ring} dim={dim} />
        </g>
        <SceneTitle t={t} y={95}>A harbour after dark</SceneTitle>
        <Tag x={800} y={575} text={tag} size={40} anchor="middle" />
      </Stage>
    );
  }),
  // Sentences: 0 in before dark, 1 contracts, 2 unlit hazards, 3 Caribbean and the tropics, 4 arrive mid-afternoon, 5 caught out.
  scene(7, (t, n) => {
    const rows = [
      { icon: FileWarning, text: "Many contracts: no sailing at night", from: 1 },
      { icon: TriangleAlert, text: "Rocks, moorings, fish farms: no lights", from: 2 },
      { icon: MapPin, text: "Unmarked reefs · fast tropical dusk", from: 3 },
      { icon: Clock, text: "Arrive mid-afternoon, time in hand", from: 4 },
      { icon: Lightbulb, text: "Caught out? Slow, lit, simplest entrance", from: 5 },
    ];
    const sun = 1 - phase(t, 0, 0.6);
    return (
      <Stage background="#13263c">
        <defs>
          <linearGradient id="lan-dusk" x1={0} y1={0} x2={0} y2={1}>
            <stop offset={0} stopColor="#1b2f4d" />
            <stop offset={0.7} stopColor="#c46a3c" />
            <stop offset={1} stopColor="#f2a65a" />
          </linearGradient>
        </defs>
        <rect x={40} y={150} width={560} height={600} rx={22} fill="url(#lan-dusk)" />
        <circle cx={320} cy={560 + (1 - sun) * 140} r={70} fill="#ffd27a" opacity={0.95} />
        <rect x={40} y={600} width={560} height={150} fill="#0f2a44" />
        <path d={`M40 600 Q 200 585 320 600 T 600 600`} fill="none" stroke="#f2a65a" strokeWidth={3} opacity={0.6} />
        <SceneIcon icon={Anchor} x={480} y={660} size={64} colour="#ffffff" />
        <text x={320} y={230} textAnchor="middle" fontSize={50} fontWeight={800} fill="#fff">In before dark</text>
        <SceneTitle t={t}>Arrive in daylight</SceneTitle>
        {rows.map((r, i) => (
          <g key={r.text} opacity={on(n, r.from)} transform={`translate(650 ${170 + i * 115})`}>
            <rect width={900} height={95} rx={16} fill="rgba(255,255,255,0.07)" stroke={n === r.from ? ART.amber : "rgba(255,255,255,0.12)"} strokeWidth={2.5} />
            <SceneIcon icon={r.icon} x={56} y={47} size={46} colour={n === r.from ? ART.amber : ART.tealBright} />
            <Lines x={110} y={62} lines={[r.text]} size={38} fill="#fff" />
          </g>
        ))}
      </Stage>
    );
  }),
  // Sentences: 0 sunset to sunrise, 1 under sail, 2 tricolour, 3 engine on, 4 at anchor, 5 check at handover.
  scene(8, (t, n, s) => {
    const v = OWN[Math.min(n, 5)]!;
    const aspect = Math.round((20 + s * 18) % 360);
    const fr = fitFrame(v, 1190, 700, 280, 330);
    return (
      <Stage>
        <SceneTitle t={t}>Your own lights</SceneTitle>
        <text x={800} y={190} textAnchor="middle" fontSize={44} fontWeight={700} fill={ART.tealBright}>{OWN_LABEL[Math.min(n, 5)]}</text>
        <rect x={60} y={230} width={700} height={620} rx={20} fill="#0b1929" />
        <PlanView v={v} aspect={aspect} cx={410} cy={540} R={230} fontSize={30} youLabel="Them" />
        <g transform="translate(840 230)">
          <svg width={700} height={620} viewBox="0 0 700 620">
            <NightSky w={700} h={620} horizon={430} />
          </svg>
        </g>
        <VesselNight v={v} aspect={aspect} fr={fr} r={13} outline outlineOpacity={0.55} />
        <text x={1190} y={280} textAnchor="middle" fontSize={30} fill={ART.muted}>What another boat sees</text>
        {n === 5 && (
          <g>
            <rect x={300} y={330} width={1000} height={300} rx={24} fill="rgba(11,25,41,0.95)" stroke={ART.amber} strokeWidth={3} />
            {["Sidelights and sternlight", "Tricolour, if fitted", "Steaming light", "Anchor light"].map((label, i) => (
              <g key={label} transform={`translate(${360 + (i % 2) * 480} ${400 + Math.floor(i / 2) * 120})`}>
                <SceneIcon icon={CircleCheck} x={24} y={0} size={48} colour="#4ade80" />
                <text x={70} y={14} fontSize={38} fontWeight={700} fill="#fff">{label}</text>
              </g>
            ))}
          </g>
        )}
      </Stage>
    );
  }),
];

export function Video() {
  return <LessonPlayer slug={SCRIPT.slug} title="Lights at night" scenes={SCENES} speak={SCRIPT.speak} />;
}

/* ------------------------------------------------------------------ */
/* Exercises                                                           */
/* ------------------------------------------------------------------ */

const code = (s: string) => <span className="font-mono font-semibold">{s}</span>;

const GULL_Q_VIEW = viewAround(km(7.1, 6.6), 4.2, 16 / 9);
const KERRAN_Q_VIEW = viewAround(km(7.1, 17.9), 4.2, 16 / 9);
const ISLAND_Q_VIEW = viewAround(km(6.6, 11.5), 16);

const COLOUR_OPTIONS: LightColour[] = ["W", "R", "G", "Y"];
const colourLabel = (c: LightColour) => capital(COLOUR_NAME[c]);

const LONGER_OPTIONS = ["Fl 5s", "Iso 4s", "Oc 4s", "Q"].map((x) => ({ text: x, light: parseLight(x) }));
const LONGER_ANSWER = LONGER_OPTIONS.findIndex((o) => lightVsDark(o.light) === "more");

const ISO = CHART_LIGHTS.find((c) => kindOf(c.light) === "Iso")!;
const NO4 = chartLight("no4");
const WRITE_OPTIONS = [NO4.text, "Fl R 5s", "Oc(2) R 5s", "Fl(2) G 5s"];
WRITE_OPTIONS.forEach((o) => parseLight(o));

function describeChoice(c: ChartLight) {
  return <span>{c.name} <span className="font-mono text-xs text-text-secondary">{c.text}</span></span>;
}

export const QUESTIONS: Question[] = [
  {
    id: "gull-period",
    kind: "numeric",
    prompt: <>Read Gull Point lighthouse’s characteristic on the chart. What is the <strong>period</strong> of its light, in seconds?</>,
    figure: <PracticeChart view={GULL_Q_VIEW} zoomable highlight={[GULL.id]} title="Practice chart: Gull Point lighthouse" />,
    answer: GULL_LIGHT.period,
    tolerance: 0.1,
    unit: "s",
    explain: <>The chart prints {code(GULL.light!)}. After the rhythm ({code(GULL_PIECES.rhythm)}) and the colour (none, so white) comes the period: {code(GULL_PIECES.period!)}. One complete cycle, a group of {GULL_GROUP} flashes and the darkness after it, takes {sec(GULL_LIGHT.period)} seconds, measured from the start of one group to the start of the next.</>,
  },
  {
    id: "kerran-height",
    kind: "numeric",
    prompt: <>Read Kerran Head light’s characteristic on the chart. How high is the light, in metres?</>,
    figure: <PracticeChart view={KERRAN_Q_VIEW} zoomable highlight={[KERRAN.id]} title="Practice chart: Kerran Head light" />,
    answer: KERRAN_LIGHT.height!,
    tolerance: 0.1,
    unit: "m",
    explain: <>{code(KERRAN.light!)}: isophase, white, a {sec(KERRAN_LIGHT.period)}-second period, then {code(`${KERRAN_LIGHT.height}m`)}, the height of the light ({KERRAN_LIGHT.height} metres above high water), and {code(`${KERRAN_LIGHT.range}M`)}, its range of {KERRAN_LIGHT.range} miles. A small m is metres; a capital M is nautical miles.</>,
  },
  {
    id: "mew-colour",
    kind: "choice",
    prompt: <>Mew Rock beacon is charted {code(MEW.text)}. What colour is its light?</>,
    options: COLOUR_OPTIONS.map(colourLabel),
    answer: COLOUR_OPTIONS.indexOf(MEW.light.colour),
    explain: <>There is no colour letter, and no letter means <strong>{COLOUR_NAME[MEW.light.colour]}</strong>: charts leave the W out. Compare No 4 buoy, {code(NO4.text)}: the same rhythm, but the R makes it red.</>,
  },
  {
    id: "range-meaning",
    kind: "choice",
    prompt: <>Gull Point is {code(GULL.light!)}. What does the {code(GULL_PIECES.range!)} at the end tell you?</>,
    options: [
      `On a clear night it can be seen up to about ${GULL_LIGHT.range} miles away`,
      `You will always see it from ${GULL_LIGHT.range} miles away`,
      `The light is ${GULL_LIGHT.range} metres high`,
      `It flashes ${GULL_LIGHT.range} times a minute`,
    ],
    answer: 0,
    explain: <>A capital M is nautical miles: the light’s <strong>range</strong> in clear weather. In haze, rain or against the glare of a town you will see it much less far, and the curve of the Earth can hide a low light before then, so it is not a promise. The height is the small-m figure, {GULL_LIGHT.height} m.</>,
  },
  {
    id: "light-longer",
    kind: "choice",
    prompt: "Which of these lights is on for LONGER than it is dark in each period?",
    options: LONGER_OPTIONS.map((o) => <span key={o.text}>{code(o.text)} ({rhythmName(o.light).toLowerCase()})</span>),
    answer: LONGER_ANSWER,
    explain: <>Occulting lights are mostly on, blinking out briefly (“occult” means hide). Flashing and quick lights are mostly dark, and isophase lights are exactly half and half.</>,
  },
  {
    id: "find-iso",
    kind: "plot",
    prompt: `At night you see a white light with equal periods of light and darkness: ${words(ISO.light.period / 2)} seconds on, ${words(ISO.light.period / 2)} seconds off. Tap that light on the practice chart.`,
    answer: ISO.at,
    tolerance: 0.45,
    view: ISLAND_Q_VIEW,
    explain: <>Equal light and dark is <strong>isophase</strong>, Iso, and {sec(ISO.light.period / 2)} s on plus {sec(ISO.light.period / 2)} s off is a {sec(ISO.light.period)}-second period. The only such light on the chart is {ISO.name}, {code(ISO.text)}, at the western end of the island.</>,
  },
  {
    id: "write-red",
    kind: "choice",
    prompt: `You see a red light: ${words(groupOf(NO4.light)!)} flashes, then darkness, the pattern starting again every ${words(NO4.light.period)} seconds. How would the chart print it?`,
    options: WRITE_OPTIONS.map((o) => code(o)),
    answer: 0,
    explain: <>Rhythm first: flashes in groups of {groupOf(NO4.light)} is {code(NO4.light.rhythm)}. Then the colour, R for red, then the period: {code(NO4.text)}. On the practice chart that is {NO4.name}. {code("Oc(2) R 5s")} would be mostly on, blinking out twice; {code("Fl(2) G 5s")} is green.</>,
  },
  {
    id: "town-red",
    kind: "choice",
    prompt: "Approaching a harbour at night, you see two red lights, one above the other, high above the town. They never go out. What are they most likely to be?",
    options: [
      "Warning lights on a radio mast or tall building",
      "Port-hand buoys marking the entrance",
      "A fishing boat",
      "The harbour’s leading lights",
    ],
    answer: 0,
    explain: "Buoy and beacon lights stand low on the water and keep a rhythm. Steady red lights high on the land are obstruction lights on masts, cranes or towers. Look for the rhythm, and look low, to find the marks.",
  },
  {
    id: "harbour-trick",
    kind: "choice",
    prompt: "A harbour town is ablaze with lights. What is the best way to pick out the navigation lights among them?",
    options: [
      "Watch for lights that keep a rhythm: shore lights are steady",
      "Look for the brightest lights",
      "Head for the biggest cluster of lights, where the quay must be",
      "Wait for the lights to go off at midnight",
    ],
    answer: 0,
    explain: "Navigation lights flash, occult or are isophase; street lights, bars and windows do not. Name each one against the chart or plotter, and slow right down: distance is hard to judge at night.",
  },
  {
    id: "before-dark",
    kind: "choice",
    prompt: "At 15:30 the wind dies. You are 15 miles from tonight’s marina, motoring at 5 knots, and sunset is at 18:20. The contract says no sailing at night. What is the best plan?",
    options: [
      "Divert to a bay or harbour you can reach well before sunset",
      "Carry on: you will arrive only a little after dark and the plotter will get you in",
      "Speed up to full throttle and hope",
      "Anchor in open water for the night",
    ],
    answer: 0,
    explain: "15 miles at 5 knots is 3 hours: you would arrive about 18:30, after sunset and with no time in hand. Choose a closer stop and call the marina or the base to say so. That is exactly what the bolt-hole in your morning plan is for.",
  },
  {
    id: "motor-lights",
    kind: "choice",
    prompt: "At dusk you are motor-sailing: main up, engine running. Which lights should you show?",
    options: [
      "Sidelights, sternlight and the white steaming light on the front of the mast",
      "The tricolour at the masthead",
      "The tricolour and the steaming light",
      "The anchor light",
    ],
    answer: 0,
    explain: "With the engine driving you, you are a power-driven vessel, sails or not: deck-level sidelights and sternlight, plus the steaming (masthead) light. A tricolour is for sailing only, and never with the steaming light.",
  },
  {
    id: "anchor-light",
    kind: "choice",
    prompt: "You are spending the night at anchor in a bay. Which light do you show?",
    options: [
      "One all-round white light, where it can best be seen",
      "Red and green sidelights",
      "The tricolour",
      "No light: you are not moving",
    ],
    answer: 0,
    explain: "A yacht at anchor shows one all-round white light, usually at the masthead, from sunset to sunrise. Switch the navigation lights off. Some skippers add a second, lower white light in the cockpit so that dinghies coming back late can see them.",
  },
];

/* ------------------------------------------------------------------ */
/* Practice generator (ported from Boaty Jobs)                         */
/* ------------------------------------------------------------------ */

interface Built {
  text: string;
  light: LightCharacteristic;
}

type Shape = "Fl" | "Fl(n)" | "LFl" | "Q" | "VQ" | "Q(n)" | "VQ(n)" | "Iso" | "Oc" | "Oc(n)";
const SHAPES: Shape[] = ["Fl", "Fl(n)", "Fl(n)", "LFl", "Q", "VQ", "Q(n)", "VQ(n)", "Iso", "Oc", "Oc(n)"];
const COLOURS: LightColour[] = ["W", "W", "W", "R", "R", "G", "G", "Y"];

/** A random characteristic built from valid parts, checked with readLight. */
function buildLight(rng: Rng, want?: (l: LightCharacteristic) => boolean): Built {
  for (let tries = 0; tries < 200; tries++) {
    const shape = pick(rng, SHAPES);
    let rhythmText = "";
    let period: number | undefined;
    let colour: LightColour = pick(rng, COLOURS);
    let lighthouse = false;
    switch (shape) {
      case "Fl": rhythmText = "Fl"; period = pick(rng, [3, 4, 5, 6, 10]); lighthouse = true; break;
      case "Fl(n)": { const g = randInt(rng, 2, 5); rhythmText = `Fl(${g})`; period = pick(rng, [5, 6, 8, 10, 12, 15, 20]); lighthouse = true; break; }
      case "LFl": rhythmText = "LFl"; period = pick(rng, [6, 8, 10, 12]); lighthouse = true; break;
      case "Q": rhythmText = "Q"; colour = pick(rng, ["W", "W", "R", "G"] as LightColour[]); break;
      case "VQ": rhythmText = "VQ"; colour = pick(rng, ["W", "W", "R", "G"] as LightColour[]); break;
      case "Q(n)": { const g = pick(rng, [3, 9]); rhythmText = `Q(${g})`; period = g === 3 ? 10 : 15; colour = "W"; break; }
      case "VQ(n)": { const g = pick(rng, [3, 9]); rhythmText = `VQ(${g})`; period = g === 3 ? 5 : 10; colour = "W"; break; }
      case "Iso": rhythmText = "Iso"; period = pick(rng, [2, 4, 6, 8, 10]); lighthouse = true; break;
      case "Oc": rhythmText = "Oc"; period = pick(rng, [3, 4, 5, 6, 8, 10]); lighthouse = true; break;
      case "Oc(n)": { const g = randInt(rng, 2, 3); rhythmText = `Oc(${g})`; period = pick(rng, [6, 8, 10, 12, 15]); lighthouse = true; break; }
    }
    const withHeights = lighthouse && colour !== "Y" && rng() < 0.55;
    const height = withHeights ? randInt(rng, 5, 60) : undefined;
    // Coloured lights are weaker than white ones, so they get shorter ranges.
    const range = height !== undefined ? Math.max(3, Math.min(colour === "W" ? 25 : 12, Math.round(height / 3) + randInt(rng, 2, 9))) : undefined;
    const text = [rhythmText, colour !== "W" ? colour : "", period !== undefined ? `${period}s` : "", height !== undefined ? `${height}m` : "", range !== undefined ? `${range}M` : ""].filter(Boolean).join(" ");
    const res = readLight(text);
    if (res.light && (!want || want(res.light))) return { text, light: res.light };
  }
  throw new Error("could not build a light");
}

type Maker = (rng: Rng, i: number) => Question;

const nameIn = (l: LightCharacteristic) => rhythmName(l).toLowerCase();

const periodQ: Maker = (rng, i) => {
  const b = buildLight(rng, (l) => !isContinuous(l));
  return {
    id: `period-${i}-${b.text}`,
    kind: "numeric",
    prompt: <>A light is charted {code(b.text)}. What is its period?</>,
    answer: b.light.period,
    tolerance: 0.05,
    unit: "s",
    explain: <>The figure followed by s is the period: {code(`${sec(b.light.period)}s`)}, the time for one complete cycle{groupOf(b.light) ? ", from the start of one group to the start of the next" : ""}. In full: {sayLight(b.light, false)}.</>,
  };
};

const countQ: Maker = (rng, i) => {
  const b = buildLight(rng, (l) => groupOf(l) !== undefined);
  const g = groupOf(b.light)!;
  const k = kindOf(b.light);
  return {
    id: `count-${i}-${b.text}`,
    kind: "numeric",
    prompt: <>A light is charted {code(b.text)}. {k === "Oc" ? "How many eclipses (dark moments) are there in each period?" : "How many flashes are there in each group?"}</>,
    answer: g,
    tolerance: 0.01,
    explain: <>The number in brackets after the rhythm: {code(b.light.rhythm)} is {nameIn(b.light)}, {g} {k === "Oc" ? "eclipses in each period" : "flashes in each group"}.</>,
  };
};

const colourQ: Maker = (rng, i) => {
  const b = buildLight(rng);
  return {
    id: `colour-${i}-${b.text}`,
    kind: "choice",
    prompt: <>What colour is the light charted {code(b.text)}?</>,
    options: COLOUR_OPTIONS.map(colourLabel),
    answer: COLOUR_OPTIONS.indexOf(b.light.colour),
    explain: b.light.colour === "W"
      ? <>There is no colour letter, so it is <strong>white</strong>: charts leave the W out.</>
      : <>The letter after the rhythm is the colour: {code(b.light.colour)} = <strong>{COLOUR_NAME[b.light.colour]}</strong>. No letter at all would mean white.</>,
  };
};

const nameQ: Maker = (rng, i) => {
  const b = buildLight(rng);
  const right = rhythmName(b.light);
  const others = shuffle(rng, RHYTHM_NAMES.filter((n) => n !== right && n !== "Morse code")).slice(0, 3);
  const options = shuffle(rng, [right, ...others]);
  return {
    id: `name-${i}-${b.text}`,
    kind: "choice",
    prompt: <>What kind of light is {code(b.text)}?</>,
    options,
    answer: options.indexOf(right),
    explain: <>{code(b.light.rhythm)} is {nameIn(b.light)}: {rhythmText(b.light).split(": ").slice(1).join(": ") || rhythmText(b.light)}.</>,
  };
};

const LD_OPTIONS = ["Less light than dark", "Equal light and dark", "More light than dark"];

const lightDarkQ: Maker = (rng, i) => {
  const b = buildLight(rng, (l) => !isContinuous(l));
  const vs = lightVsDark(b.light);
  return {
    id: `ld-${i}-${b.text}`,
    kind: "choice",
    prompt: <>In each period of {code(b.text)}, is the light showing for less time than it is dark, the same, or more?</>,
    options: LD_OPTIONS,
    fixedOrder: true,
    answer: vs === "less" ? 0 : vs === "equal" ? 1 : 2,
    explain: <>{code(b.light.rhythm)} is {nameIn(b.light)}. {kindOf(b.light) === "Oc" ? "Occulting lights are on for longer than they are off: they blink out." : kindOf(b.light) === "Iso" ? "Isophase means equal light and darkness." : "Flashes, short, long or quick, are separated by longer darkness."} With this course’s representative timings it shows light for about {Math.round(lightFraction(b.light) * 100)}% of the period.</>,
  };
};

const identifyQ: Maker = (rng, i) => {
  const target = pick(rng, CHART_LIGHTS);
  const others = shuffle(rng, CHART_LIGHTS.filter((c) => c.key !== target.key && !confusable(c.light, target.light)));
  const picked: ChartLight[] = [];
  for (const c of others) if (picked.length < 3 && picked.every((p) => !confusable(p.light, c.light))) picked.push(c);
  const options = shuffle(rng, [target, ...picked]);
  const look = sayLight(target.light, false);
  return {
    id: `identify-${i}-${target.key}`,
    kind: "choice",
    prompt: `At night near the Isle of Kerran you see ${look}. Which charted light is it?`,
    options: options.map(describeChoice),
    answer: options.indexOf(target),
    explain: <>{capital(look)} is {code(target.text)}: the {target.name}.{target.key === "gull-point-lt" || target.key === "east-teeth" ? " Gull Point Fl(3)10s and East Teeth Q(3)10s both show three white flashes every 10 seconds: the buoy’s are quick flashes, about one a second, and the lighthouse is far brighter and higher." : ""}</>,
  };
};

const OWN_SITUATIONS: Array<{ id: string; situation: string; answer: string }> = [
  { id: "sail", situation: "sailing, engine off", answer: "Red and green sidelights and a white sternlight, or a tricolour at the masthead" },
  { id: "motor", situation: "motoring with the sails stowed", answer: "Sidelights, sternlight and the white steaming light" },
  { id: "motorsail", situation: "motor-sailing, with the main up and the engine running", answer: "Sidelights, sternlight and the white steaming light" },
  { id: "anchor", situation: "at anchor for the night", answer: "One all-round white light" },
];
const OWN_ANSWERS = ["Red and green sidelights and a white sternlight, or a tricolour at the masthead", "Sidelights, sternlight and the white steaming light", "One all-round white light", "The tricolour and the steaming light together"];

const ownLightsQ: Maker = (rng, i) => {
  const s = pick(rng, OWN_SITUATIONS);
  const options = shuffle(rng, OWN_ANSWERS);
  return {
    id: `own-${i}-${s.id}`,
    kind: "choice",
    prompt: `After dark your charter yacht is ${s.situation}. Which lights should she show?`,
    options,
    answer: options.indexOf(s.answer),
    explain: "Under sail alone: sidelights and sternlight, or a tricolour instead. Engine running, sails up or not: you are a power-driven vessel, so deck-level lights plus the steaming light, and never the tricolour. At anchor: one all-round white light.",
  };
};

const MAKERS: Maker[] = [periodQ, countQ, colourQ, nameQ, lightDarkQ, identifyQ, ownLightsQ];

export const PRACTICE: PracticeGenerator = {
  title: "Decode the light",
  description: "Five fresh questions each time: periods, groups, colours and rhythms of randomly built lights, the practice chart’s lights, and your own yacht’s lights.",
  generate: (rng) => shuffle(rng, MAKERS).slice(0, 5).map((make, i) => make(rng, i)),
};

export function Exercises({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  return <ExerciseSet courseSlug={courseSlug} lessonSlug={lessonSlug} questions={QUESTIONS} practice={PRACTICE} />;
}
