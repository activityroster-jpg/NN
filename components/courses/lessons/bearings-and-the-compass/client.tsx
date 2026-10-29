"use client";

import { Compass, Eye, Smartphone, Triangle } from "lucide-react";
import { cutAngle, formatBearing, formatPosition, norm360, positionLineCrossing, reciprocal, rhumbDestination, type LatLon } from "@/lib/courses/geo";
import { viewAround } from "@/lib/courses/navigation/chart-geometry";
import { km } from "@/lib/courses/navigation/practice-chart";
import { randInt, type Rng } from "@/lib/courses/random";
import { ExerciseSet, type PracticeGenerator, type Question } from "../../Exercises";
import LessonPlayer, { SceneTitle, Stage, fade, phase, type Scene } from "../../LessonPlayer";
import { ChartFix } from "../../PracticeChart";
import { ART, Card, ChartScene, Lines, SceneIcon, Yacht } from "../../scene-art";
import { Arrow, LandmarkArtwork, MAG_C, Overlay, SightGraphic, StageRose, SteeringCompass, Tag, TRUE_C, toward } from "./art";
import { DEMO_AT, DEMO_POINTS, DEMO_TRUE, cockedHat, sighting, toMag, toTrue } from "./fix";
import { WORKED } from "./lines";
import { sentenceSpans, within } from "./points";
import { bearingsAndTheCompass as SCRIPT } from "./script";
import { SPIRE_TRANSIT } from "./transit";
import { CHECK_CASES, FixPlotFigure, HatShape, LINE_COLOURS, PositionLine, fitView, plotterCheck } from "./widgets";

/** Show an element from narration sentence `from` onwards. */
const on = (sentence: number, from: number) => (sentence >= from ? 1 : 0);
/** Pair a scripted scene with its visual. */
const scene = (i: number, render: Scene["render"]): Scene => ({ ...SCRIPT.scenes[i]!, render });
const spans = (i: number) => sentenceSpans(SCRIPT.scenes[i]!.narration);

/* ------------------------------------------------------------------ */
/* Scene data (all from the practice chart)                            */
/* ------------------------------------------------------------------ */

const S1 = spans(1);
const S4 = spans(4);
const S5 = spans(5);
const S6 = spans(6);
const S7 = spans(7);

const LINE_VIEW = viewAround(rhumbDestination(WORKED.l.f.at, WORKED.fromObject, WORKED.distance * 0.55), 8.5, 16 / 9);
const FIX_VIEW = fitView([DEMO_AT, ...DEMO_POINTS], 6, 1.15, 16 / 9);
const DEMO_LINES = [1, 2, 0]; // church spire, then Gull Point lighthouse, then Mew Rock beacon
const HAT = cockedHat(DEMO_POINTS, DEMO_TRUE);
/** Where the first two lines (spire and lighthouse) cross. */
const TWO_FIX = positionLineCrossing(DEMO_POINTS[1]!, DEMO_TRUE[1]!, DEMO_POINTS[2]!, DEMO_TRUE[2]!);
const CHECK = plotterCheck(CHECK_CASES[1]!);
const CHECK_EXPECT = CHECK.expectM;
const CHECK_REAL = CHECK.realM;

/** Stage pointer for the 360 scene, by sentence. */
function roseBearing(n: number, t: number): number {
  if (n === 0) return 360 * phase(within(S1, 0, t), 0.05, 0.95);
  if (n === 1) {
    const f = within(S1, 1, t);
    return f < 0.35 ? 90 : f < 0.7 ? 180 : 270;
  }
  return 45;
}

export const SCENES: Scene[] = [
  // Sentences: 0 what a bearing is, 1 check without a screen, 2 what the lesson covers, 3 the plotter check.
  scene(0, (t, n) => (
    <Stage>
      <path d="M0 640 Q 400 600 800 640 T 1600 640 V900 H0 Z" fill="#123a5a" />
      <path d="M0 700 Q 400 670 800 700 T 1600 700 V900 H0 Z" fill="#0f3049" />
      <Yacht x={200 + t * 1100} y={600} heading={90} scale={1.6} />
      <text x={800} y={250} textAnchor="middle" fontSize={84} fontWeight={800} fill="#fff" opacity={fade(t, 0, 0.12)}>Bearings and the compass</text>
      <text x={800} y={330} textAnchor="middle" fontSize={44} fill={ART.tealBright} opacity={fade(t, 0.12, 0.25)}>Lesson 4 · Finding your way</text>
      {[
        { icon: Compass, label: "The compass" },
        { icon: Eye, label: "Bearings" },
        { icon: Triangle, label: "Fixes" },
        { icon: Smartphone, label: "Plotter check" },
      ].map((c, i) => (
        <g key={c.label} opacity={i < 3 ? on(n, 2) : on(n, 3)}>
          <circle cx={350 + i * 300} cy={450} r={56} fill="rgba(43,179,192,0.15)" stroke={ART.tealBright} strokeWidth={3} />
          <SceneIcon icon={c.icon} x={350 + i * 300} y={450} size={52} />
          <text x={350 + i * 300} y={545} textAnchor="middle" fontSize={32} fill="#fff">{c.label}</text>
        </g>
      ))}
    </Stage>
  )),
  // Sentences: 0 degrees clockwise, 1 east south west, 2 three figures, 3 say each figure, 4 the reciprocal.
  scene(1, (t, n) => {
    const b = roseBearing(n, t);
    const tip = toward(560, 490, b, 250);
    const back = toward(560, 490, b + 180, 250);
    const hl = n === 1 ? [90, 180, 270] : n >= 2 ? [] : [0];
    return (
      <Stage>
        <SceneTitle t={t}>Three hundred and sixty degrees</SceneTitle>
        <StageRose x={560} y={490} r={300} highlight={hl} />
        {n >= 4 && <line x1={560} y1={490} x2={back.x} y2={back.y} stroke={ART.amber} strokeWidth={8} strokeDasharray="20 14" strokeLinecap="round" />}
        <Arrow x1={560} y1={490} x2={tip.x} y2={tip.y} colour={TRUE_C} width={10} />
        <circle cx={560} cy={490} r={14} fill={TRUE_C} />
        <text x={1240} y={360} textAnchor="middle" fontSize={150} fontWeight={800} fill="#fff" fontFamily="ui-monospace, monospace">
          {formatBearing(n >= 2 ? 45 : Math.round(b) % 360)}
        </text>
        {n >= 2 && <text x={1240} y={450} textAnchor="middle" fontSize={44} fill={ART.muted} opacity={on(n, 2)}>three figures, every time</text>}
        {n >= 3 && <text x={1240} y={540} textAnchor="middle" fontSize={52} fontWeight={700} fill={ART.tealBright}>“zero four five”</text>}
        {n >= 4 && (
          <g>
            <text x={1240} y={660} textAnchor="middle" fontSize={44} fill={ART.amber}>Reciprocal: ± 180°</text>
            <text x={1240} y={730} textAnchor="middle" fontSize={64} fontWeight={800} fill={ART.amber} fontFamily="ui-monospace, monospace">045° ↔ 225°</text>
          </g>
        )}
      </Stage>
    );
  }),
  // Sentences: 0 true north, 1 magnetic north, 2 variation on the rose, 3 the Med, 4 the BVI, 5 Kerran.
  scene(2, (t, n) => {
    const v = n >= 5 ? -3 : n === 4 ? -14 : n === 3 ? 4 : -8;
    const top = toward(420, 700, 0, 470);
    const mag = toward(420, 700, v, 470);
    return (
      <Stage>
        <SceneTitle t={t}>True and magnetic</SceneTitle>
        <Arrow x1={420} y1={700} x2={top.x} y2={top.y} colour={TRUE_C} width={10} />
        <text x={top.x} y={top.y - 24} textAnchor="middle" fontSize={44} fontWeight={800} fill={TRUE_C}>★ True</text>
        <g opacity={on(n, 1)}>
          <Arrow x1={420} y1={700} x2={mag.x} y2={mag.y} colour={MAG_C} width={10} />
          <text x={mag.x + (v < 0 ? -30 : 30)} y={mag.y + 60} textAnchor={v < 0 ? "end" : "start"} fontSize={40} fontWeight={800} fill={MAG_C}>Magnetic</text>
        </g>
        {n >= 2 && <text x={420} y={770} textAnchor="middle" fontSize={44} fill="#fff">{n === 2 ? "Variation" : `Variation ${Math.abs(v)}°${v < 0 ? "W" : "E"}`}</text>}
        <Card x={760} y={190} w={760} h={130} title="Printed on the rose" body="in the middle of the compass rose" titleSize={40} bodySize={30} opacity={on(n, 2)} />
        <Card x={760} y={345} w={760} h={130} title="Mediterranean" body="a few degrees east" titleSize={40} bodySize={30} opacity={on(n, 3)} />
        <Card x={760} y={500} w={760} h={130} title="British Virgin Islands" body="more than 10° west: never ignore it" titleSize={40} bodySize={30} accent={ART.amber} opacity={on(n, 4)} />
        <Card x={760} y={655} w={760} h={130} title="Kerran practice chart" body="3° west: the figure this course uses" titleSize={40} bodySize={30} opacity={on(n, 5)} />
      </Stage>
    );
  }),
  // Sentences: 0 at the helm, 1 the card points north, 2 lubber line, 3 deviation.
  scene(3, (t, n, seconds) => {
    const heading = norm360(40 + 35 * Math.sin(seconds * 0.6));
    return (
      <Stage>
        <SceneTitle t={t}>The steering compass</SceneTitle>
        <Yacht x={470} y={500} heading={heading} scale={5.2} opacity={0.9} />
        <SteeringCompass x={470} y={500} r={150} heading={heading} lubberGlow={n === 2} />
        <text x={1190} y={765} textAnchor="middle" fontSize={40} fontWeight={700} fill={ART.amber} fontFamily="ui-monospace, monospace" opacity={on(n, 2)}>
          {`Heading ${formatBearing(Math.round(heading) % 360, "M")}`}
        </text>
        <Card x={860} y={210} w={660} h={150} title="The card points north" body="the boat turns around it" titleSize={42} bodySize={32} opacity={on(n, 1)} />
        <Card x={860} y={390} w={660} h={150} title="The lubber line" body="shows the heading" titleSize={42} bodySize={32} accent={ART.amber} opacity={on(n, 2)} />
        <Card x={860} y={570} w={660} h={150} title="Deviation" body="a degree or two: usually ignore it" titleSize={42} bodySize={32} opacity={on(n, 3)} />
      </Stage>
    );
  }),
  // Sentences: 0 what it is, 1 where to stand, 2 sight and settle, 3 note it, 4 the reading.
  scene(4, (t, n) => {
    const settle = within(S4, 2, t);
    const swing = n === 2 ? 12 * (1 - settle) * Math.sin(settle * 22) : 0;
    const value = n >= 2 ? WORKED.magnetic + swing : null;
    return (
      <Stage>
        <SceneTitle t={t}>The hand-bearing compass</SceneTitle>
        <g transform="translate(70 170) scale(2.4)">
          <SightGraphic art={n >= 2 ? "spire" : null} value={value} dim={n === 2 && settle < 0.8} />
        </g>
        <g opacity={on(n, 1)}>
          <Tag x={1070} y={260} text="Clear of the compass" size={34} />
          <Tag x={1070} y={340} text="Clear of the engine" size={34} />
          <Tag x={1070} y={420} text="Braced, both elbows in" size={34} />
        </g>
        {n >= 3 && <Tag x={1070} y={550} text={`${WORKED.time} · spire`} size={44} fill={ART.amber} />}
        {n >= 4 && <Tag x={1070} y={690} text={formatBearing(WORKED.magnetic, "M")} size={80} fill={ART.amber} />}
      </Stage>
    );
  }),
  // Sentences: 0 convert first, 1 west magnetic best, 2 draw the line, 3 somewhere on it.
  scene(5, (t, n) => (
    <>
      <ChartScene from={LINE_VIEW} highlight={["church"]}>
        {n >= 2 && (
          <PositionLine through={WORKED.l.f.at} bearing={WORKED.trueBrg} colour={LINE_COLOURS[0]!} width={3} beyond={0.3} length={8} progress={n === 2 ? phase(within(S5, 2, t), 0.1, 0.9) : 1} />
        )}
      </ChartScene>
      <Overlay>
        {n <= 1 && <Tag x={40} y={110} text={`${formatBearing(WORKED.magnetic, "M")} on the compass`} size={54} />}
        {n >= 1 && <Tag x={40} y={n <= 1 ? 215 : 110} text={`${formatBearing(WORKED.magnetic, "M")} − 3° = ${formatBearing(WORKED.trueBrg, "T")}`} size={54} fill={ART.amber} />}
        {n >= 3 && <Tag x={40} y={215} text="You are somewhere on this line" size={48} />}
      </Overlay>
    </>
  )),
  // Sentences: 0 second line, 1 the fix, 2 third line and the cocked hat, 3 spread them, 4 a big hat.
  scene(6, (t, n) => {
    const shown = n === 0 ? 2 : n === 1 ? 2 : 3;
    const prog = (k: number) => (n === 0 && k === 1 ? phase(within(S6, 0, t), 0.2, 0.9) : n === 2 && k === 2 ? phase(within(S6, 2, t), 0.05, 0.6) : 1);
    return (
      <>
        <ChartScene from={FIX_VIEW} highlight={n === 0 ? ["gull-point-lt"] : n === 2 ? ["mew-rock"] : undefined}>
          {DEMO_LINES.slice(0, shown).map((i, k) => (
            <PositionLine key={i} through={DEMO_POINTS[i]!} bearing={DEMO_TRUE[i]!} colour={LINE_COLOURS[k]!} width={2.6} length={8} progress={prog(k)} />
          ))}
          {n === 1 && TWO_FIX && <ChartFix at={TWO_FIX} />}
          {n >= 2 && within(S6, 2, t) > 0.55 && <HatShape hat={HAT} width={1.6} />}
        </ChartScene>
        <Overlay>
          {n === 1 && <Tag x={40} y={110} text="Two lines cross: a fix" size={54} />}
          {n === 2 && within(S6, 2, t) > 0.55 && <Tag x={40} y={110} text="Three lines: a cocked hat" size={54} />}
          {n === 3 && <Tag x={40} y={110} text={`Cuts of ${HAT.cuts.map((c) => Math.round(c)).join("°, ")}°: well spread`} size={50} />}
          {n >= 4 && <Tag x={40} y={110} text="Big hat? Check the landmarks" size={54} fill={ART.amber} />}
        </Overlay>
      </>
    );
  }),
  // Sentences: 0 in transit, 1 on the line, no compass, 2 spire and mast, 3 leading lights.
  scene(7, (t, n) => {
    const close = n === 0 ? phase(within(S7, 0, t), 0.1, 0.9) : 1;
    const gap = 300 * (1 - close);
    return (
      <Stage>
        <SceneTitle t={t}>Transits</SceneTitle>
        <rect x={100} y={180} width={1400} height={420} rx={16} fill="#cfe6f3" />
        <path d="M100 520 Q 380 430 700 470 T 1200 450 Q 1400 440 1500 500 V 560 H 100 Z" fill="#a9b98d" />
        <rect x={100} y={560} width={1400} height={40} fill="#3f6f8f" />
        <LandmarkArtwork art="mast" x={800} y={470} s={2.2} />
        <LandmarkArtwork art="spire" x={800 - gap} y={540} s={1.9} />
        <line x1={800} x2={800} y1={200} y2={590} stroke={ART.amber} strokeWidth={3} strokeDasharray="10 10" opacity={close >= 1 ? 1 : 0.35} />
        {n >= 1 && <Tag x={800} y={668} text="In line: you are on the transit" size={44} anchor="middle" />}
        {n >= 2 && <Tag x={800} y={748} text={`Church spire and radio mast: ${formatBearing(SPIRE_TRANSIT.bearing, "T")}`} size={40} anchor="middle" fill={ART.amber} />}
        {n >= 3 && (
          <g>
            <circle cx={1380} cy={250} r={16} fill={ART.amber} />
            <circle cx={1380} cy={300} r={16} fill={ART.amber} />
            <text x={1350} y={360} textAnchor="end" fontSize={30} fill="#1d2731" fontWeight={700}>Leading lights: Lesson 8</text>
          </g>
        )}
      </Stage>
    );
  }),
  // Sentences: 0 the plotter disagrees, 1 a quick check, 2 bearing from the plotter, 3 the real bearing, 4 slow down.
  scene(8, (t, n) => {
    const diff = Math.abs(CHECK_REAL - CHECK_EXPECT);
    return (
      <Stage>
        <SceneTitle t={t}>When the plotter and your eyes disagree</SceneTitle>
        <g transform="translate(100 200)">
          <rect width={620} height={420} rx={26} fill="#1d2a38" stroke="#5d6f82" strokeWidth={6} />
          <rect x={26} y={26} width={568} height={300} rx={10} fill="#0d3b52" />
          <path d="M40 300 Q 160 180 300 220 T 580 120" stroke={ART.tealBright} strokeWidth={5} fill="none" />
          <circle cx={300} cy={220} r={13} fill={ART.port} />
          {n >= 2 && <line x1={300} y1={220} x2={520} y2={70} stroke="#fff" strokeWidth={3} strokeDasharray="10 8" />}
          {n >= 2 && <text x={310} y={300} fontSize={34} fill="#fff" fontFamily="ui-monospace, monospace">{`Light ${formatBearing(CHECK_EXPECT, "M")}?`}</text>}
          <text x={310} y={390} textAnchor="middle" fontSize={32} fill={ART.muted}>Chart plotter</text>
        </g>
        <g transform="translate(860 200) scale(1.6)" opacity={on(n, 3)}>
          <SightGraphic art="lighthouse" value={n >= 3 ? CHECK_REAL : null} />
        </g>
        {n >= 1 && n < 3 && <Tag x={1180} y={420} text="Quick check" size={56} anchor="middle" />}
        {n >= 3 && <Tag x={1180} y={680} text={`Compass ${formatBearing(CHECK_REAL, "M")}: ${diff}° apart`} size={44} anchor="middle" fill={ART.amber} />}
        {n >= 4 && (
          <g>
            <Tag x={800} y={758} text="Slow down · watch the depth · trust your eyes" size={42} anchor="middle" />
          </g>
        )}
        {n === 0 && <Lines x={1180} y={420} lines={["Is that headland", "really there?"]} size={54} weight={700} anchor="middle" />}
      </Stage>
    );
  }),
];

export function Video() {
  return <LessonPlayer slug={SCRIPT.slug} title="Bearings and the compass" scenes={SCENES} speak={SCRIPT.speak} />;
}

/* ------------------------------------------------------------------ */
/* Exercises                                                           */
/* ------------------------------------------------------------------ */

interface PlotSet {
  ids: string[];
  trueBearings: number[];
  fix: LatLon;
  view: ReturnType<typeof fitView>;
}

function plotSet(at: LatLon, ids: string[]): PlotSet {
  const sightings = ids.map((id) => sighting(at, id));
  const trueBearings = sightings.map((s) => Math.round(s.bearing) % 360);
  const points = sightings.map((s) => s.at);
  const fix = cockedHat(points, trueBearings).centre!;
  return { ids, trueBearings, fix, view: fitView([fix, ...points], 4) };
}

const QT = plotSet(km(8.2, 18.4), ["mast", "kerran-head-lt", "w-ledge"]);
const QT_NAMES = ["the radio mast", "Kerran Head light", "West Ledge buoy"];

export const QUESTIONS: Question[] = [
  {
    id: "east-figures",
    kind: "choice",
    prompt: "How is due east written as a bearing?",
    options: ["090°", "90°", "E90", "009°"],
    answer: 0,
    explain: "Bearings are always three figures, clockwise from north: east is 090°, said “zero nine zero”. Three figures make a slip obvious, and they can never be mistaken for a speed or a depth.",
  },
  {
    id: "reciprocal",
    kind: "bearing",
    prompt: "From your boat, a lighthouse bears 070°T. What is the bearing of your boat from the lighthouse?",
    answer: 250,
    tolerance: 0.5,
    suffix: "T",
    explain: "That is the reciprocal: the same line, the other way. 070 is under 180, so add 180: 250°T. A quick check: the light is roughly east-north-east of you, so you are roughly west-south-west of it.",
  },
  {
    id: "where-variation",
    kind: "choice",
    prompt: "Where do you find the variation for your cruising area?",
    options: ["Printed in the middle of the compass rose on the chart", "On the steering compass", "In the charter contract", "On the depth sounder display"],
    answer: 0,
    explain: "The compass rose on every chart gives the variation and the year it applies to, often with a small yearly change. The pilot book and the plotter usually give it too.",
  },
  {
    id: "west-convert",
    kind: "bearing",
    prompt: "On the Kerran practice chart variation is 3°W. The hand-bearing compass gives a bearing of the old tower: 128°M. What true bearing do you plot?",
    answer: 125,
    tolerance: 0.5,
    suffix: "T",
    explain: "Variation west, magnetic best: with westerly variation the compass figure is the bigger one, so take 3° off. 128 − 3 = 125°T.",
  },
  {
    id: "east-convert",
    kind: "bearing",
    prompt: "Suppose the compass rose of your Mediterranean chart gives a variation of 5°E. The hand-bearing compass reads 100°M. What true bearing goes on the chart?",
    answer: 105,
    tolerance: 0.5,
    suffix: "T",
    explain: "Variation east, magnetic least: with easterly variation the compass figure is the smaller one, so add 5°. 100 + 5 = 105°T.",
  },
  {
    id: "where-stand",
    kind: "choice",
    prompt: "Where should you stand to take a bearing with the hand-bearing compass?",
    options: [
      "Right beside the steering compass, so the two agree",
      "Clear of the steering compass, the engine and the speakers, braced against the boat",
      "Below at the chart table, through a porthole",
      "Anywhere, holding the phone in the other hand",
    ],
    answer: 1,
    explain: "Steel, magnets and electronics pull a compass off. Stand well clear of them (and of your phone), wedge yourself in, hold the compass level at eye height and wait for the card to settle.",
  },
  {
    id: "one-line",
    kind: "choice",
    prompt: "You take one bearing of a church spire and plot it. What does it tell you?",
    options: ["Exactly where you are", "That you are somewhere on that line", "How fast you are going", "Nothing until you add the variation twice"],
    answer: 1,
    explain: "One bearing gives a position line: you are somewhere along it. A second bearing, of something well round to one side, crosses it to give a fix.",
  },
  {
    id: "plot-fix",
    kind: "plot",
    prompt: `North-west of Kerran Head you take three bearings and convert them to true: ${QT.ids.map((_, i) => `${QT_NAMES[i]} ${formatBearing(QT.trueBearings[i]!, "T")}`).join(", ")}. Draw the three lines with the plotter, then tap the fix on the chart below.`,
    answer: QT.fix,
    tolerance: 0.25,
    view: QT.view,
    figure: <FixPlotFigure ids={QT.ids} view={QT.view} />,
    explain: (
      <>
        Each line goes through its object on the true bearing. The three cross in a small cocked hat; the fix is its middle: <strong>{formatPosition(QT.fix)}</strong>.
      </>
    ),
  },
  {
    id: "best-pair",
    kind: "choice",
    prompt: "Which pair of bearings gives the most reliable two-bearing fix?",
    options: ["045°T and 135°T", "045°T and 055°T", "045°T and 220°T", "045°T and 030°T"],
    answer: 0,
    explain: `The lines should cross as near square as possible. 045 and 135 cut at ${cutAngle(45, 135)}°. 045 and 055 cut at only ${cutAngle(45, 55)}°, 045 and 030 at ${cutAngle(45, 30)}°, and 220 is almost the reciprocal of 045, so those two lines cut at just ${cutAngle(45, 220)}°.`,
  },
  {
    id: "big-hat",
    kind: "choice",
    prompt: "Your three position lines make a large cocked hat. What is the most likely reason, and what do you do?",
    options: [
      "One bearing is wrong, or a landmark was misidentified: check which objects you used and take them again",
      "You are exactly in the middle, so all is well",
      "The variation has changed since this morning",
      "The chart is upside down",
    ],
    answer: 0,
    explain: "Three good bearings meet in a small triangle. A big one means a bad bearing or the wrong landmark, often a similar headland or a different church. Re-identify the objects and retake the bearings; until then, assume you are at the corner of the hat nearest danger.",
  },
  {
    id: "transit",
    kind: "choice",
    prompt: "Two charted objects line up, one exactly behind the other. What does that tell you?",
    options: [
      "You are on the line through them, with no compass error at all",
      "You are halfway between them",
      "You have a fix",
      "Nothing until you take a compass bearing",
    ],
    answer: 0,
    explain: "That is a transit: a position line that needs no compass, so it carries no variation, deviation or reading errors. Cross it with one bearing of something to the side and you have a good fix.",
  },
  {
    id: "disagree",
    kind: "choice",
    prompt: `The plotter says Kerran Head light should bear ${formatBearing(CHECK_EXPECT, "M")}. Your hand-bearing compass gives ${formatBearing(CHECK_REAL, "M")}. What do you do?`,
    options: [
      "Slow down, watch the depth and navigate by what you can see until you know why they differ",
      "Trust the plotter: it is satellite navigation",
      "Trust the compass and carry on at full speed",
      "Average the two and carry on",
    ],
    answer: 0,
    explain: `${Math.abs(CHECK_REAL - CHECK_EXPECT)}° is more than a hand-bearing compass error, so one of them is wrong. A plotter can show a good GPS position on a badly drawn chart, or freeze when the signal drops. Slow down, keep clear of anything close, use the depth, and take a second bearing to find out which to believe.`,
  },
];

/* ------------------------------------------------------------------ */
/* Practice                                                            */
/* ------------------------------------------------------------------ */

function practiceReciprocal(rng: Rng, i: number): Question {
  const b = randInt(rng, 0, 359);
  return {
    id: `recip-${i}-${b}`,
    kind: "bearing",
    prompt: `A buoy bears ${formatBearing(b, "T")} from you. What is your bearing from the buoy?`,
    answer: reciprocal(b),
    tolerance: 0.5,
    suffix: "T",
    explain: `The reciprocal: ${b < 180 ? `${formatBearing(b)} is under 180, so add 180` : `${formatBearing(b)} is 180 or more, so take 180 off`}, giving ${formatBearing(reciprocal(b), "T")}.`,
  };
}

function practiceToTrue(rng: Rng, i: number): Question {
  const v = [-14, -6, -3, -2, 2, 3, 4, 5][randInt(rng, 0, 7)]!;
  const m = randInt(rng, 5, 354);
  const t = norm360(m + v);
  const vt = `${Math.abs(v)}°${v < 0 ? "W" : "E"}`;
  return {
    id: `totrue-${i}-${m}-${v}`,
    kind: "bearing",
    prompt: `Variation is ${vt}. The hand-bearing compass reads ${formatBearing(m, "M")}. What true bearing do you plot?`,
    answer: t,
    tolerance: 0.5,
    suffix: "T",
    explain: v < 0
      ? `Variation west, magnetic best: take ${-v}° off. ${formatBearing(m)} − ${-v} = ${formatBearing(t, "T")}.`
      : `Variation east, magnetic least: add ${v}°. ${formatBearing(m)} + ${v} = ${formatBearing(t, "T")}.`,
  };
}

function practiceToMag(rng: Rng, i: number): Question {
  const t = randInt(rng, 5, 354);
  const m = toMag(t);
  return {
    id: `tomag-${i}-${t}`,
    kind: "bearing",
    prompt: `On the Kerran practice chart (variation 3°W) you measure a clearing bearing of ${formatBearing(t, "T")}. What will the hand-bearing compass read along it?`,
    answer: m,
    tolerance: 0.5,
    suffix: "M",
    explain: `Going from the chart to the compass with westerly variation, the magnetic figure is the bigger one: ${formatBearing(t)} + 3 = ${formatBearing(m, "M")}. Check: converting back, ${formatBearing(m)} − 3 = ${formatBearing(toTrue(m), "T")}.`,
  };
}

function practiceCut(rng: Rng, i: number): Question {
  const b1 = randInt(rng, 0, 359);
  const gap = randInt(rng, 3, 33) * 5;
  const b2 = norm360(b1 + gap * (rng() < 0.5 ? 1 : -1));
  const cut = cutAngle(b1, b2);
  return {
    id: `cut-${i}-${b1}-${b2}`,
    kind: "numeric",
    prompt: `You take bearings of two landmarks: ${formatBearing(b1, "T")} and ${formatBearing(b2, "T")}. At what angle do their position lines cross (the smaller angle)?`,
    answer: cut,
    tolerance: 1,
    unit: "°",
    explain: `The bearings are ${Math.round(Math.min(Math.abs(b1 - b2), 360 - Math.abs(b1 - b2)))}° apart, and a line runs both ways, so the lines cut at ${Math.round(cut)}°${cut < 30 ? ": too shallow for a reliable fix" : cut >= 60 ? ": a good cut" : ""}.`,
  };
}

export const PRACTICE: PracticeGenerator = {
  title: "Bearing practice",
  description: "Four fresh questions each time: a reciprocal, compass to true, chart to compass, and the angle between two position lines.",
  generate: (rng) => [practiceReciprocal(rng, 0), practiceToTrue(rng, 1), practiceToMag(rng, 2), practiceCut(rng, 3)],
};

export function Exercises({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  return <ExerciseSet courseSlug={courseSlug} lessonSlug={lessonSlug} questions={QUESTIONS} practice={PRACTICE} />;
}
