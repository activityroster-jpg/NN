"use client";

import { Anchor, BookOpen, Eye, Gauge, ListChecks, Radio, Sailboat, Sun, Undo2 } from "lucide-react";
import { formatBearing, rhumbBearing, rhumbDestination, reciprocal, type LatLon } from "@/lib/courses/geo";
import { viewAround } from "@/lib/courses/navigation/chart-geometry";
import { randInt, randStep, type Rng } from "@/lib/courses/random";
import { ExerciseSet, type PracticeGenerator, type Question } from "../../Exercises";
import LessonPlayer, { SceneTitle, Stage, fade, phase, type Scene } from "../../LessonPlayer";
import { CHART_COLOURS, ChartLine } from "../../PracticeChart";
import { ART, Card, ChartScene, Lines, SceneIcon, Yacht } from "../../scene-art";
import {
  ABORT_MAG, ARRIVAL_TRACK, CHURCH, GATE12, KA, LEAD_BRG, LEGS, MEW, MEW_ABEAM, MEW_ABEAM_MAG, SPEED, SPIRE_CLEAR, SPIRE_CLEAR_MAG,
  SPIRE_LIMIT, WRECK, limitText, spireSafe, toMagnetic, toTrue,
} from "./data";
import { pilotageIntoAHarbour as SCRIPT } from "./script";
import { BoatGlyph, ClearingSides, KeepOut, LightsView, Overlay, Tag } from "./transit-art";
import { approachPoint, lightsFrom, sideOf } from "./transits";

/** Show an element from narration sentence `from` onwards. */
const on = (sentence: number, from: number) => (sentence >= from ? 1 : 0);
/** Pair a scripted scene with its visual. */
const scene = (i: number, render: Scene["render"]): Scene => ({ ...SCRIPT.scenes[i]!, render });

/** Where each narration sentence starts and ends as a fraction of the scene (the player advances t by characters). */
function sentenceSpans(narration: string): Array<[number, number]> {
  const parts = narration.split(/(?<=[.!?…])\s+(?=[A-Z0-9"“‘(£])/).map((s) => s.trim()).filter(Boolean);
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
const spans = (i: number) => sentenceSpans(SCRIPT.scenes[i]!.narration);
const lerp = (a: LatLon, b: LatLon, f: number): LatLon => ({ lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f });
const C = CHART_COLOURS;
const L1 = LEGS[0]!;

/* ------------------------------------------------------------------ */
/* Scene data (all from the practice chart)                            */
/* ------------------------------------------------------------------ */

const S2 = spans(2);
const S3 = spans(3);
const S4 = spans(4);
const CHANNEL_VIEW = viewAround({ lat: 49 + 43.75 / 60, lon: KA.at.lon + 0.6 / 60 }, 8.2, 16 / 9);
const ARRIVE_VIEW = viewAround({ lat: 49 + 43.55 / 60, lon: -(4 + 14.2 / 60) }, 11.6, 16 / 9);
const CLEAR_END = rhumbDestination(CHURCH.at, reciprocal(SPIRE_CLEAR), 7.6);

function trackPoint(f: number): LatLon {
  const segs = ARRIVAL_TRACK.length - 1;
  const k = Math.min(segs - 1e-9, Math.max(0, f * segs));
  const i = Math.floor(k);
  return lerp(ARRIVAL_TRACK[i]!, ARRIVAL_TRACK[i + 1]!, k - i);
}
function trackHeading(f: number): number {
  const segs = ARRIVAL_TRACK.length - 1;
  const i = Math.min(segs - 1, Math.floor(Math.max(0, f * segs)));
  return rhumbBearing(ARRIVAL_TRACK[i]!, ARRIVAL_TRACK[i + 1]!);
}

function StageCard({ x, y, w, h, title, body, opacity = 1, accent = ART.tealBright, icon }: {
  x: number; y: number; w: number; h: number; title: string; body?: string; opacity?: number; accent?: string; icon?: Parameters<typeof Card>[0]["icon"];
}) {
  return <Card x={x} y={y} w={w} h={h} title={title} body={body} opacity={opacity} accent={accent} icon={icon} titleSize={44} bodySize={32} />;
}

const SCENES: Scene[] = [
  // Sentences: 0 the last mile, 1 pilotage by eye, 2 no time for the chart, 3 think first, then look, compare, tick.
  scene(0, (t, n) => (
    <Stage>
      <path d="M0 560 L 420 520 L 560 600 L 640 600 L 640 520 L 760 520 L 760 600 L 1600 600 V 900 H 0 Z" fill="#123a5a" />
      <path d="M0 560 L 420 520 L 560 600 L 0 600 Z M760 520 L 1600 470 L 1600 600 L 760 600 Z" fill="#6f7f55" />
      <rect x={560} y={590} width={80} height={12} fill="#c9c2b0" />
      <rect x={760} y={590} width={60} height={12} fill="#c9c2b0" />
      <Yacht x={700} y={880 - 220 * phase(t, 0, 1)} heading={0} scale={1.4} />
      <text x={800} y={230} textAnchor="middle" fontSize={80} fontWeight={800} fill="#fff" opacity={fade(t, 0, 0.12)}>Pilotage into a harbour or bay</text>
      <text x={800} y={310} textAnchor="middle" fontSize={44} fill={ART.tealBright} opacity={fade(t, 0.1, 0.22)}>Lesson 8 · Close to land</text>
      {n === 0 && <text x={800} y={420} textAnchor="middle" fontSize={44} fill="#fff" opacity={fade(t, 0.12, 0.2)}>The last mile, in the afternoon</text>}
      {n >= 3 &&
        ["Plan", "Look", "Compare", "Tick off"].map((w, i) => (
          <g key={w}>
            <rect x={250 + i * 290} y={370} width={240} height={90} rx={18} fill="rgba(43,179,192,0.18)" stroke={ART.tealBright} strokeWidth={3} />
            <text x={370 + i * 290} y={430} textAnchor="middle" fontSize={40} fontWeight={700} fill="#fff">{w}</text>
          </g>
        ))}
      {(n === 1 || n === 2) && <text x={800} y={420} textAnchor="middle" fontSize={44} fill="#fff">{n === 1 ? "Navigating by eye" : "No time to study the chart"}</text>}
    </Stage>
  )),
  // Sentences: 0 the page, 1 approach dangers and what you see, 2 lights depths berths, 3 shelter and swell, 4 when to read it.
  scene(1, (t, n) => (
    <Stage>
      <SceneTitle t={t}>Read the pilot book page</SceneTitle>
      <g transform="translate(120 160)">
        <rect width={720} height={680} rx={14} fill="#fffdf3" stroke="#d6cfbf" strokeWidth={4} />
        <text x={40} y={70} fontSize={42} fontWeight={800} fill="#1d2731">Port Kerran</text>
        <text x={40} y={110} fontSize={24} fill="#475569">Practice harbour: fictional</text>
        {[
          { h: "Approach", b: "From the south, on the leading lights", from: 1 },
          { h: "Dangers", b: "Mew Rock and a wreck to the west", from: 1 },
          { h: "Lights and depths", b: "Leading lights Oc 4s · over 5 m in the channel", from: 2 },
          { h: "Berths", b: "Visitors stern-to on the quay", from: 2 },
          { h: "Shelter", b: "Open to the south: swell in a southerly", from: 3 },
        ].map((r, i) => (
          <g key={r.h} opacity={on(n, r.from)}>
            <text x={40} y={190 + i * 100} fontSize={30} fontWeight={800} fill="#0b5563">{r.h}</text>
            <text x={40} y={230 + i * 100} fontSize={28} fill="#1d2731">{r.b}</text>
          </g>
        ))}
      </g>
      <SceneIcon icon={BookOpen} x={1180} y={360} size={180} colour={ART.tealBright} />
      {n >= 4 && (
        <g>
          <Tag x={1180} y={600} text="The evening before" size={44} anchor="middle" />
          <Tag x={1180} y={700} text="And again an hour out" size={44} anchor="middle" fill={ART.amber} />
        </g>
      )}
    </Stage>
  )),
  // Sentences: 0 plan from a recognisable point, 1 Kerran Approach buoy, 2 legs, 3 what to note, 4 leg one.
  scene(2, (t, n) => {
    const boat = n >= 4 ? lerp(KA.at, GATE12, phase(within(S2, 4, t), 0.1, 0.95)) : KA.at;
    return (
      <>
        <ChartScene from={CHANNEL_VIEW} highlight={n === 1 ? ["kerran-approach"] : n === 2 ? ["no1", "no2", "no3", "no4"] : n >= 4 ? ["no1", "no2"] : undefined}>
          {n >= 2 && LEGS.map((l, i) => (
            <ChartLine key={l.id} from={l.from} to={l.to} colour={C.plot} width={n >= 4 && i === 0 ? 3.2 : 1.8} dash={n >= 4 && i > 0 ? "5 4" : undefined} arrow
              progress={n === 2 ? phase(within(S2, 2, t), i * 0.25, i * 0.25 + 0.4) : 1} />
          ))}
          {n >= 1 && <BoatGlyph at={boat} heading={LEAD_BRG} size={16} />}
        </ChartScene>
        <Overlay>
          {n === 0 && <Tag x={40} y={110} text="Start from something you can recognise" size={50} />}
          {n === 1 && <Tag x={40} y={110} text="Kerran Approach buoy: safe water" size={52} />}
          {n === 2 && <Tag x={40} y={110} text="Mark to mark, leg by leg" size={52} />}
          {n === 3 && (
            <g>
              <Tag x={40} y={110} text="Heading · distance · time" size={50} />
              <Tag x={40} y={215} text="What you expect to see" size={50} fill={ART.amber} />
            </g>
          )}
          {n >= 4 && <Tag x={40} y={110} text={`Leg 1: ${formatBearing(L1.magnetic, "M")} · ${L1.distance.toFixed(1)} miles · ${L1.minutes} min`} size={50} />}
          {n >= 4 && <Tag x={40} y={215} text={`at ${SPEED} knots`} size={40} fill={ART.muted} />}
        </Overlay>
      </>
    );
  }),
  // Sentences: 0 what a leading line is, 1 Port Kerran's on 000°T, 2 rear open left: starboard, 3 rear open right: port, 4 steer towards the rear light.
  scene(3, (t, n) => {
    const offset = n <= 1 ? 0 : n === 2 ? -1.3 : n === 3 ? 1.3 : 1.3 * (1 - phase(within(S3, 4, t), 0.1, 0.8));
    const say = n === 2 ? "Rear open left: steer to starboard" : n === 3 ? "Rear open right: steer to port" : n >= 4 ? "Steer towards the rear light" : n === 1 ? `In line on ${formatBearing(LEAD_BRG, "T")}` : "One behind and above the other";
    return (
      <Stage>
        <SceneTitle t={t}>Leading lines</SceneTitle>
        <rect x={196} y={156} width={1208} height={536} rx={18} fill="#0b1929" />
        <LightsView rearOffset={offset} box={{ x: 200, y: 160, w: 1200, h: 525 }} />
        <Tag x={800} y={752} text={say} size={48} anchor="middle" fill={n >= 2 && n <= 3 ? ART.amber : "#fff"} />
      </Stage>
    );
  }),
  // Sentences: 0 a danger near the way in, 1 the wreck and Mew Rock, 2 the clearing line, 3 not more than, 4 check it.
  scene(4, (t, n) => {
    const f = n >= 3 ? (n === 3 ? phase(within(S4, 3, t), 0, 1) * 0.66 : 0.66 + 0.34 * phase(within(S4, 4, t), 0, 1)) : 0;
    return (
      <>
        <ChartScene from={ARRIVE_VIEW} highlight={n === 1 ? ["wreck", "mew-rock"] : n === 2 ? ["church"] : undefined}>
          {n >= 2 && <ClearingSides id="nn-pilot-s4" landmark={CHURCH.at} limit={SPIRE_LIMIT} value={SPIRE_CLEAR} r1={2.6} r2={7.6} spread={30} />}
          {n >= 2 && <ChartLine from={CHURCH.at} to={CLEAR_END} colour={C.plotAlt} width={3} progress={n === 2 ? phase(within(S4, 2, t), 0.1, 0.6) : 1} />}
          {n >= 1 && <KeepOut at={WRECK.at} radiusNm={0.4} />}
          {n >= 1 && <KeepOut at={MEW.at} radiusNm={0.4} />}
          {n >= 3 && ARRIVAL_TRACK.slice(1).map((p, i) => <ChartLine key={i} from={ARRIVAL_TRACK[i]!} to={p} colour={C.plot} width={2.2} dash="7 5" />)}
          {n >= 3 && <BoatGlyph at={trackPoint(f)} heading={trackHeading(f)} size={18} />}
        </ChartScene>
        <Overlay>
          {n === 0 && <Tag x={40} y={110} text="A danger near the way in" size={54} />}
          {n === 1 && <Tag x={40} y={110} text="The wreck and Mew Rock, to the west" size={52} />}
          {n >= 2 && <Tag x={40} y={110} text={`Spire ${limitText(SPIRE_LIMIT, SPIRE_CLEAR)} = ${formatBearing(SPIRE_CLEAR_MAG, "M")}`} size={54} />}
          {n >= 3 && <Tag x={40} y={215} text="Green side: safe" size={44} fill="#86efac" />}
          {n >= 4 && <Tag x={40} y={310} text="Check every few minutes" size={44} fill={ART.amber} />}
        </Overlay>
      </>
    );
  }),
  // Sentences: 0 hard to see, 1 what to look for, 2 the bearing, 3 coral and the sun, 4 line up outside.
  scene(5, (t, n) => (
    <Stage>
      <SceneTitle t={t}>Picking the gap</SceneTitle>
      {n <= 2 ? (
        <g>
          <rect x={100} y={170} width={1400} height={420} rx={16} fill="#cfe3f2" />
          <path d="M100 470 Q 300 380 520 420 Q 700 440 760 470 L 840 470 Q 900 430 1100 400 Q 1300 380 1500 440 V 560 H 100 Z" fill="#8fa47a" />
          <rect x={100} y={540} width={1400} height={50} fill="#3d6f93" />
          <rect x={700} y={500} width={70} height={10} fill="#d6d3cb" opacity={on(n, 1)} />
          <g opacity={on(n, 1)}>
            <polygon points="760,500 770,500 768,460 762,460" fill="#fff" stroke="#475569" />
            <rect x={758} y={452} width={14} height={8} fill="#f5c400" />
            <circle cx={765} cy={480} r={60} fill="none" stroke={ART.amber} strokeWidth={5} />
          </g>
          {n >= 2 && <line x1={800} y1={860} x2={770} y2={480} stroke={ART.port} strokeWidth={5} strokeDasharray="16 12" />}
          <text x={800} y={660} textAnchor="middle" fontSize={40} fill="#fff">{n === 0 ? "Where is the entrance?" : n === 1 ? "Lighthouse, breakwater, boats going in" : "Plotter bearing, then the hand-bearing compass"}</text>
        </g>
      ) : (
        <g>
          <rect x={100} y={170} width={860} height={520} rx={16} fill="#1b6fa8" />
          <path d="M100 420 Q 400 360 560 430 T 960 410 V 520 Q 700 560 500 500 T 100 540 Z" fill="#3ec8d4" />
          <path d="M380 470 q 40 -30 90 0 q 40 30 100 0" stroke="#8a6d3b" strokeWidth={30} fill="none" strokeLinecap="round" />
          <text x={530} y={640} textAnchor="middle" fontSize={34} fill="#fff">Dark blue deep · turquoise shallow · brown coral</text>
          <SceneIcon icon={Sun} x={1250} y={300} size={150} colour={ART.amber} />
          <Lines x={1250} y={470} lines={["Sun high", "and behind you"]} size={48} weight={700} anchor="middle" />
          {n >= 4 && <Tag x={1250} y={680} text="Line up well outside" size={44} anchor="middle" fill={ART.amber} />}
        </g>
      )}
    </Stage>
  )),
  // Sentences: 0 slow down, 1 sails down outside, 2 fenders lines crew, 3 the stop depth, 4 the way out.
  scene(6, (t, n) => (
    <Stage>
      <SceneTitle t={t}>The last mile</SceneTitle>
      <StageCard x={110} y={180} w={680} h={150} icon={Gauge} title="Slow down" body="time to look and think" opacity={on(n, 0)} />
      <StageCard x={810} y={180} w={680} h={150} icon={Sailboat} title="Sails down outside" body="where there is room" opacity={on(n, 1)} />
      <StageCard x={110} y={360} w={680} h={150} icon={ListChecks} title="Fenders, lines, brief" body="which side, who does what" opacity={on(n, 2)} />
      <StageCard x={810} y={360} w={680} h={150} icon={Eye} title="A stop depth" body="decided before you go in" accent={ART.amber} opacity={on(n, 3)} />
      <StageCard x={460} y={540} w={680} h={150} icon={Undo2} title={`Way out: ${formatBearing(ABORT_MAG, "M")}`} body="back down the line you came in on" accent={ART.port} opacity={on(n, 4)} />
    </Stage>
  )),
  // Sentences: 0 call ahead, 1 what to say, 2 the marinero, 3 stern-to, 4 take it slowly.
  scene(7, (t, n) => {
    const backing = n >= 3 ? phase(t, 0.6, 0.95) : 0;
    return (
      <Stage>
        <SceneTitle t={t}>Calling the marina</SceneTitle>
        <SceneIcon icon={Radio} x={250} y={360} size={170} colour={ART.tealBright} />
        <g opacity={on(n, 1)}>
          <rect x={420} y={200} width={1080} height={250} rx={30} fill="rgba(255,255,255,0.08)" stroke={ART.tealBright} strokeWidth={3} />
          <Lines x={460} y={270} lines={["Marina, this is the yacht Kerran Star,", "thirteen metres, two nights,", "requesting a berth, over."]} size={42} />
        </g>
        <g opacity={on(n, 2)}>
          <SceneIcon icon={Anchor} x={250} y={620} size={90} colour={ART.amber} />
          <text x={250} y={720} textAnchor="middle" fontSize={32} fill="#fff">Marinero</text>
        </g>
        {n >= 3 && (
          <g>
            <rect x={600} y={500} width={880} height={50} fill="#c9c2b0" />
            <line x1={1040} y1={550} x2={1040} y2={830} stroke={ART.amber} strokeWidth={4} strokeDasharray="10 8" />
            <Yacht x={1040} y={830 - 160 * backing} heading={180} scale={1.6} />
            <text x={1260} y={760} fontSize={30} fill={ART.amber}>lazy line</text>
          </g>
        )}
        {n >= 4 && <Tag x={250} y={830} text="Ask the marinero, take it slowly" size={36} anchor="middle" />}
      </Stage>
    );
  }),
  // Sentences: 0 arrive with daylight, 1 contracts, nets and floats, 2 the Seychelles, 3 in by mid-afternoon.
  scene(8, (t, n) => {
    const x = (h: number) => 160 + ((h - 8) / 13) * 1280;
    const sunH = 12 + 8 * phase(t, 0, 1);
    return (
      <Stage background={sunH > 18.5 ? "#13263a" : "#1b3a52"}>
        <SceneTitle t={t}>Arrive with daylight</SceneTitle>
        <line x1={x(8)} y1={600} x2={x(21)} y2={600} stroke={ART.muted} strokeWidth={4} />
        {[8, 10, 12, 14, 16, 18, 20].map((h) => (
          <g key={h}>
            <line x1={x(h)} y1={590} x2={x(h)} y2={610} stroke={ART.muted} strokeWidth={3} />
            <text x={x(h)} y={650} textAnchor="middle" fontSize={30} fill="#fff" fontFamily="ui-monospace, monospace">{`${String(h).padStart(2, "0")}00`}</text>
          </g>
        ))}
        <circle cx={x(sunH)} cy={560 - 260 * Math.sin(((sunH - 6) / 13) * Math.PI)} r={44} fill={ART.amber} />
        <rect x={x(14)} y={680} width={x(16) - x(14)} height={40} rx={10} fill={ART.tealBright} opacity={on(n, 3)} />
        <text x={x(15)} y={770} textAnchor="middle" fontSize={34} fill="#fff" opacity={on(n, 3)}>In by mid-afternoon</text>
        {n >= 1 && <Tag x={800} y={250} text="Unlit floats and moorings after dark" size={44} anchor="middle" />}
        {n >= 2 && (
          <g>
            <line x1={x(18.5)} y1={560} x2={x(18.5)} y2={720} stroke={ART.port} strokeWidth={4} strokeDasharray="10 8" />
            <text x={x(18.5)} y={760} textAnchor="middle" fontSize={30} fill={ART.port}>Seychelles: dark</text>
          </g>
        )}
      </Stage>
    );
  }),
];

export function Video() {
  return <LessonPlayer slug={SCRIPT.slug} title="Pilotage into a harbour or bay" scenes={SCENES} speak={SCRIPT.speak} />;
}

/* ------------------------------------------------------------------ */
/* Exercises                                                           */
/* ------------------------------------------------------------------ */

const PLOT_VIEW = viewAround({ lat: MEW_ABEAM.lat, lon: (MEW_ABEAM.lon + MEW.at.lon) / 2 }, 4.2, 1.4);
const SPIRE_UNSAFE_M = SPIRE_CLEAR_MAG + 4;
const LEFT = lightsFrom(approachPoint(2, -0.12)).rearOffset;
const RIGHT = lightsFrom(approachPoint(1.6, 0.1)).rearOffset;

export const QUESTIONS: Question[] = [
  {
    id: "pilot-book",
    kind: "choice",
    prompt: "Where do you find the approach, the dangers off the entrance, the lights and where visitors berth, for a harbour you have never visited?",
    options: ["The pilot book (cruising guide) page for that harbour", "The charter contract", "The weather forecast", "The boat's logbook"],
    answer: 0,
    explain: "The pilot book has a page, often with a sketch plan, for each harbour and anchorage. Read it the evening before and again an hour out, and note anything you need on deck.",
  },
  {
    id: "leg-time",
    kind: "numeric",
    prompt: `Leg 1 of the Port Kerran plan is ${L1.distance.toFixed(1)} miles and you will motor in at ${SPEED} knots. How many minutes should it take?`,
    answer: (60 * L1.distance) / SPEED,
    tolerance: 1,
    unit: "min",
    explain: `At ${SPEED} knots a mile takes ${60 / SPEED} minutes, so ${L1.distance.toFixed(1)} miles take about ${Math.round((60 * L1.distance) / SPEED)} minutes. Knowing when a mark is due tells you when to start worrying if it has not appeared.`,
  },
  {
    id: "lead-mag",
    kind: "bearing",
    prompt: `The Port Kerran leading lights are in line on ${formatBearing(LEAD_BRG, "T")}. Variation is 3°W. What should the steering compass show while you follow them in, on a calm day?`,
    answer: toMagnetic(LEAD_BRG),
    tolerance: 0.5,
    suffix: "M",
    explain: `Chart to compass with westerly variation: add it. ${formatBearing(LEAD_BRG)} + 3 = ${formatBearing(toMagnetic(LEAD_BRG), "M")}. With a cross wind or current you may need a few degrees more or less to keep the lights in line: steer by the lights, and use the figure as a check.`,
  },
  {
    id: "rear-left",
    kind: "choice",
    prompt: "Heading in on the leading line, you see the rear light open to the left of the front light. Which way do you steer?",
    figure: <LightsView rearOffset={LEFT} title="The view ahead: the rear light is to the left of the front light" />,
    options: ["Alter to starboard until they line up", "Alter to port until they line up", "Hold your course", "Stop and go astern"],
    answer: 0,
    explain: "The rear light shows the side you are on: open to the left means you are left of the line. Alter to starboard until the rear light is back above the front one, then steer to keep them that way.",
  },
  {
    id: "rear-right",
    kind: "choice",
    prompt: "A little later the rear light has opened to the right of the front light. Now what?",
    figure: <LightsView rearOffset={RIGHT} title="The view ahead: the rear light is to the right of the front light" />,
    options: ["Alter to port until they line up", "Alter to starboard until they line up", "Hold your course: it will sort itself out", "Speed up"],
    answer: 0,
    explain: "You are right of the line, perhaps set there by the wind. Steer towards the rear light: to port, until they line up again. Then hold a heading a little to the left of the one you had, to stop it happening again.",
  },
  {
    id: "clearing",
    kind: "choice",
    prompt: `Arriving from the south-west, your clearing bearing is church spire ${limitText(SPIRE_LIMIT, SPIRE_CLEAR_MAG, "M")}. The hand-bearing compass gives the spire ${formatBearing(SPIRE_UNSAFE_M, "M")}. Are you safe?`,
    options: [
      "No: you are on the danger side. Head east, away from the wreck, until the spire bears less than the limit",
      "Yes: any bearing near the limit is fine",
      "Yes: a bigger bearing means more room",
      "It depends on the tide only",
    ],
    answer: 0,
    explain: `Not more than means the bearing must stay at or below the limit. ${formatBearing(SPIRE_UNSAFE_M, "M")} is more, so you have strayed west of the line, towards the wreck and Mew Rock. Alter east until the spire bears ${formatBearing(SPIRE_CLEAR_MAG, "M")} or less.`,
  },
  {
    id: "abeam-plot",
    kind: "plot",
    prompt: `On the leading line, with the lights in line, Mew Rock beacon bears ${formatBearing(MEW_ABEAM_MAG, "M")}, due west once converted. Tap your position.`,
    answer: MEW_ABEAM,
    tolerance: 0.15,
    view: PLOT_VIEW,
    explain: `You are on the leading line (the transit) and on the line due west to Mew Rock beacon: where they cross. That is a check bearing, telling you how far along the leg you are even if a buoy is missing.`,
  },
  {
    id: "missing-mark",
    kind: "choice",
    prompt: "On leg 2 of the plan, No 3 and No 4 are due but you cannot see No 4. What do you do?",
    options: [
      "Stay on the leading line, check the depth and the time, and use the Mew Rock check bearing; if anything else is wrong, turn back",
      "Go off the line to look for it",
      "Assume you have passed it and turn into the harbour",
      "Stop the engine and wait",
    ],
    answer: 0,
    explain: "Buoys drag, sink or get moved. Do not go hunting for one: the rest of the plan still tells you where you are. If more than one thing disagrees, use the way out back down the line.",
  },
  {
    id: "coral",
    kind: "choice",
    prompt: "The pilot book says the way into a Caribbean anchorage is through a gap in the reef. When is the best time to go in?",
    options: ["With the sun high and behind you, so you can see the colour of the water", "At dawn, looking into the sunrise", "At dusk, when the wind has dropped", "Any time: the plotter shows the reef"],
    answer: 0,
    explain: "In coral you navigate by the colour of the water: dark blue deep, turquoise shallow, brown or dark patches coral. You can only read it with good light from above or behind. Electronic charts of reef areas can be well out.",
  },
  {
    id: "call-marina",
    kind: "choice",
    prompt: "How do you call a marina to ask for a berth?",
    options: [
      "On the working channel given in the pilot book, or by phone",
      "On channel 16, and stay on it while you discuss the berth",
      "By sounding the horn as you enter",
      "There is no need: just find a gap",
    ],
    answer: 0,
    explain: "Channel 16 is for distress, safety and calling, not for chatting about berths. The pilot book gives the marina's channel and phone number. Give the boat's name, her length and how many nights you want.",
  },
  {
    id: "daylight",
    kind: "choice",
    prompt: "It is 1700 and you are still 15 miles from tonight's harbour, a narrow rocky inlet. What is the sensible plan?",
    options: [
      "Divert to an easier harbour or bay you can reach in good daylight",
      "Press on at full speed and arrive in the dark",
      "Turn the plotter's brightness up",
      "Anchor anywhere, whatever the depth",
    ],
    answer: 0,
    explain: "Fifteen miles at six knots is two and a half hours: arrival in the dusk or dark, into a place you have never seen. Charter contracts often ban night sailing, and unlit floats and moorings are hard to see. Choose the easier harbour and come back tomorrow.",
  },
];

/* ------------------------------------------------------------------ */
/* Practice                                                            */
/* ------------------------------------------------------------------ */

function practiceLights(rng: Rng, i: number): Question {
  const along = randStep(rng, 1.3, 3, 0.1);
  const r = rng();
  const cross = r < 0.2 ? 0 : (rng() < 0.5 ? -1 : 1) * randStep(rng, 0.06, 0.2, 0.01);
  const off = lightsFrom(approachPoint(along, cross)).rearOffset;
  const side = sideOf(off);
  const answer = side === "left" ? 0 : side === "right" ? 1 : 2;
  return {
    id: `lights-${i}-${along}-${cross}`,
    kind: "choice",
    prompt: `Heading in towards the Port Kerran leading lights, ${along.toFixed(1)} miles out. Which way do you steer?`,
    figure: <LightsView rearOffset={off} title="The view ahead towards the leading lights" />,
    options: ["Alter to starboard", "Alter to port", "Hold your course"],
    fixedOrder: true,
    answer,
    explain: side === "on" ? "The rear light is directly above the front one: you are on the line. Hold your course." : `The rear light is open to the ${side}, so you are ${side} of the line. Steer towards the rear light: to ${side === "left" ? "starboard" : "port"}.`,
  };
}

function practiceTime(rng: Rng, i: number): Question {
  const d = randStep(rng, 0.5, 3.5, 0.1);
  const s = randInt(rng, 4, 7);
  return {
    id: `time-${i}-${d}-${s}`,
    kind: "numeric",
    prompt: `A leg of your pilotage plan is ${d.toFixed(1)} miles. At ${s} knots, how many minutes should it take?`,
    answer: (60 * d) / s,
    tolerance: 1,
    unit: "min",
    explain: `Minutes = 60 × distance ÷ speed = 60 × ${d.toFixed(1)} ÷ ${s} = ${((60 * d) / s).toFixed(1)} minutes.`,
  };
}

function practiceClearing(rng: Rng, i: number): Question {
  const limitM = SPIRE_CLEAR_MAG;
  const reading = (limitM + randInt(rng, -6, 6) + 360) % 360;
  const safe = spireSafe(SPIRE_LIMIT, SPIRE_CLEAR, toTrue(reading));
  return {
    id: `clear-${i}-${reading}`,
    kind: "choice",
    prompt: `Clearing bearing: church spire ${limitText(SPIRE_LIMIT, limitM, "M")}. The hand-bearing compass reads ${formatBearing(reading, "M")}. Safe?`,
    options: ["Safe: carry on, and keep checking", "Not safe: alter away from the danger"],
    fixedOrder: true,
    answer: safe ? 0 : 1,
    explain: safe
      ? `${formatBearing(reading, "M")} is not more than ${formatBearing(limitM, "M")}, so you are on the safe side of the line.`
      : `${formatBearing(reading, "M")} is more than ${formatBearing(limitM, "M")}: you are on the danger side, west of the line. Head east until the spire bears ${formatBearing(limitM, "M")} or less.`,
  };
}

export const PRACTICE: PracticeGenerator = {
  title: "Pilotage practice",
  description: "Four fresh questions each time: two leading-light views, a leg time and a clearing-bearing check.",
  generate: (rng) => [practiceLights(rng, 0), practiceTime(rng, 1), practiceLights(rng, 2), practiceClearing(rng, 3)],
};

export function Exercises({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  return <ExerciseSet courseSlug={courseSlug} lessonSlug={lessonSlug} questions={QUESTIONS} practice={PRACTICE} />;
}
