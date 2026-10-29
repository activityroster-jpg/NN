"use client";

import { BookOpen, CircleDashed, Layers, Ruler, ShieldCheck } from "lucide-react";
import type { LatLon } from "@/lib/courses/geo";
import { norm360 } from "@/lib/courses/geo";
import { viewAround } from "@/lib/courses/navigation/chart-geometry";
import { FEATURES, km } from "@/lib/courses/navigation/practice-chart";
import { pick, randStep, shuffle } from "@/lib/courses/random";
import { ExerciseSet, type PracticeGenerator, type Question } from "../../Exercises";
import LessonPlayer, { SceneTitle, Stage, fade, phase, splitSentences, type Scene } from "../../LessonPlayer";
import { ChartLine, ChartText } from "../../PracticeChart";
import { ART, ChartBanner, ChartScene, Lines, SceneIcon, Yacht } from "../../scene-art";
import { AnchorMark, AnchoredBoat, Arrow, COVE_COLOURS, CoveMap, ScopeSide, WindArrow } from "./art";
import { BOAT, GOOD_SPOT, chainFor, swingRadius, type P } from "./data";
import { anchoringAndMooring as SCRIPT } from "./script";

/** Show an element from narration sentence `from` onwards. */
const on = (sentence: number, from: number) => (sentence >= from ? 1 : 0);
/** Pair a scripted scene with its visual. */
const scene = (i: number, render: Scene["render"]): Scene => ({ ...SCRIPT.scenes[i]!, render });

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

const SPANS = SCRIPT.scenes.map((s) => sentenceSpans(s.narration));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** The practice cove drawn on the stage: 400 × 300 metres at scale `s`. */
function StageCove({ x, y, s, children, ...rest }: { x: number; y: number; s: number } & Parameters<typeof CoveMap>[0]) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-3} y={-3} width={406} height={306} rx={4} fill="#fff" />
      <CoveMap {...rest}>{children}</CoveMap>
    </g>
  );
}

/** Three parallel wind arrows on the practice chart, blowing from `from` (°T). */
function ChartWind({ centre, from, length = 1.2, spread = 0.7, colour = "#d97706" }: { centre: LatLon; from: number; length?: number; spread?: number; colour?: string }) {
  const off = (p: LatLon, b: number, d: number): LatLon => {
    const r = (b * Math.PI) / 180;
    return { lat: p.lat + (d * Math.cos(r)) / 60, lon: p.lon + (d * Math.sin(r)) / (60 * Math.cos((p.lat * Math.PI) / 180)) };
  };
  return (
    <g>
      {[-1, 0, 1].map((i) => {
        const mid = off(centre, norm360(from + 90), i * spread);
        return <ChartLine key={i} from={off(mid, from, length / 2)} to={off(mid, norm360(from + 180), length / 2)} colour={colour} width={4} arrow />;
      })}
    </g>
  );
}

const ROADS = FEATURES.find((f) => f.id === "anchorage")!;
const ROADS_VIEW = viewAround(km(9.4, 12.2), 9, 16 / 9);
const GOOD_CHAIN = chainFor(8.6, 4); // 40 metres at the good spot, matching the narration.

/** A left-hand caption block for stage scenes beside the cove. */
function Caption({ title, body, colour = ART.tealBright, y = 300 }: { title: string; body: string[]; colour?: string; y?: number }) {
  return (
    <g>
      <Lines x={60} y={y} lines={[title]} size={50} weight={800} fill={colour} />
      <Lines x={60} y={y + 70} lines={body} size={34} fill="#fff" />
    </g>
  );
}

const SEABED_CAPTIONS: Array<{ title: string; body: string[]; colour: string; highlight: "sand" | "seagrass" | "rock" }> = [
  { title: "Sand or mud", body: ["Good holding"], colour: "#fcd34d", highlight: "sand" },
  { title: "Weed", body: ["Poor holding:", "the anchor skates", "or drags a clump"], colour: "#86efac", highlight: "seagrass" },
  { title: "Posidonia", body: ["Seagrass meadows,", "dark on the seabed"], colour: "#86efac", highlight: "seagrass" },
  { title: "Protected", body: ["Fines in parts", "of the Med, such as", "the Balearics"], colour: "#fca5a5", highlight: "seagrass" },
  { title: "Drop on sand", body: ["Look for the light,", "sandy patches"], colour: "#fcd34d", highlight: "sand" },
  { title: "Rock and coral", body: ["No good: no grip,", "and coral is", "easily destroyed"], colour: "#fca5a5", highlight: "rock" },
];

const CHAIN_STEPS = [
  { chain: 36, text: "Scope: the length of chain let out" },
  { chain: 36, text: "Depth at the bow: 8 m of water + 1 m of bow = 9 m" },
  { chain: 36, text: "Settled: 4 to 5 times the depth" },
  { chain: 63, text: "Wind forecast: 7 times, if there is room" },
  { chain: 45, text: "9 m × 5 = 45 m of chain" },
  { chain: 45, text: "Marks every 10 m: ask what the colours mean" },
  { chain: 45, text: "How much chain does the boat carry?" },
];

// Dropping the anchor: the spot, and where the boat is at each sentence.
const DROP_AT: P = { x: 900, y: 360 };
const DROP_SCALE = 1.5;
const BOW = 60 * DROP_SCALE;

const SCENES: Scene[] = [
  scene(0, (t) => (
    <Stage>
      <path d="M0 600 Q 400 570 800 600 T 1600 600 V900 H0 Z" fill="#123a5a" />
      <path d="M0 680 Q 400 655 800 680 T 1600 680 V900 H0 Z" fill="#0f3049" />
      <line x1={1250} y1={640} x2={1250} y2={820} stroke={ART.muted} strokeWidth={4} strokeDasharray="10 8" opacity={fade(t, 0.3, 0.45)} />
      <AnchorMark at={{ x: 1250, y: 840 }} size={34} colour={ART.muted} />
      <Yacht x={1250} y={700} heading={0} scale={1.4} />
      <text x={700} y={290} textAnchor="middle" fontSize={80} fontWeight={800} fill="#fff" opacity={fade(t, 0, 0.12)}>Anchoring and mooring buoys</text>
      <text x={700} y={370} textAnchor="middle" fontSize={44} fill={ART.tealBright} opacity={fade(t, 0.15, 0.3)}>Lesson 9 · A night at anchor</text>
      <text x={700} y={450} textAnchor="middle" fontSize={36} fill={ART.muted} opacity={fade(t, 0.55, 0.7)}>The spot · the chain · the check · buoys and lines ashore</text>
    </Stage>
  )),
  // Sentences: 0 chart and pilot book, 1 shelter, 2 depth, 3 seabed, 4 room, 5 Kerran Roads on the chart.
  scene(1, (t, n) => {
    if (n >= 5) {
      return (
        <ChartScene from={viewAround(km(9.4, 12.2), 16, 16 / 9)} to={ROADS_VIEW} t={phase(t, 0.8, 0.9)} highlight={["anchorage"]}>
          <ChartWind centre={km(12.4, 12.3)} from={0} colour="#dc2626" />
          <ChartText at={km(13.6, 12.3)} colour="#b91c1c" size={15} bold>Northerly: blows straight in</ChartText>
          <ChartText at={km(9.0, 11.6)} colour="#166534" size={14} bold>The island shelters it from the south</ChartText>
          <ChartBanner>Kerran Roads: sheltered from southerly winds, open to the north</ChartBanner>
        </ChartScene>
      );
    }
    const rows = [
      { icon: ShieldCheck, title: "Shelter", body: "from tonight's forecast wind, not just today's" },
      { icon: Ruler, title: "Depth", body: "about 3 to 12 metres" },
      { icon: Layers, title: "Seabed", body: "sand or mud, not weed or rock" },
      { icon: CircleDashed, title: "Room to swing", body: "clear of rocks, swimmers and other boats" },
    ];
    return (
      <Stage>
        <SceneTitle t={t}>Choosing the anchorage</SceneTitle>
        <g opacity={fade(t, 0.02, 0.1)}>
          <SceneIcon icon={BookOpen} x={560} y={200} size={52} colour={ART.amber} />
          <text x={610} y={214} fontSize={38} fill={ART.amber}>Chart and pilot book open</text>
        </g>
        {rows.map((r, i) => (
          <g key={r.title} opacity={on(n, i + 1)} transform={`translate(180 ${270 + i * 140})`}>
            <rect width={1240} height={116} rx={18} fill="rgba(255,255,255,0.07)" stroke={ART.tealBright} strokeWidth={2.5} />
            <SceneIcon icon={r.icon} x={70} y={58} size={56} colour={ART.tealBright} />
            <text x={130} y={72} fontSize={46} fontWeight={800} fill="#fff">{r.title}</text>
            <text x={480} y={70} fontSize={34} fill={ART.muted}>{r.body}</text>
          </g>
        ))}
      </Stage>
    );
  }),
  // Sentences: 0 sand and mud, 1 weed, 2 Posidonia, 3 protected, 4 drop on sand, 5 rock and coral.
  scene(2, (t, n) => {
    const c = SEABED_CAPTIONS[Math.min(n, SEABED_CAPTIONS.length - 1)]!;
    return (
      <Stage>
        <SceneTitle t={t} y={90}>The seabed</SceneTitle>
        <Caption title={c.title} body={c.body} colour={c.colour} />
        <StageCove x={590} y={130} s={2.42} others={false} highlight={c.highlight} labels>
          {n >= 4 && <AnchorMark at={GOOD_SPOT} size={10} colour={COVE_COLOURS.you} />}
        </StageCove>
      </Stage>
    );
  }),
  // Sentences: 0 scope, 1 depth at the bow, 2 four to five times, 3 seven times, 4 worked example, 5 chain marks, 6 chain carried.
  scene(3, (t, n) => {
    const step = CHAIN_STEPS[Math.min(n, CHAIN_STEPS.length - 1)]!;
    return (
      <Stage>
        <SceneTitle t={t} y={90}>How much chain</SceneTitle>
        <text x={800} y={175} textAnchor="middle" fontSize={44} fontWeight={700} fill={ART.amber}>{step.text}</text>
        <ScopeSide x={100} y={230} w={1400} h={620} depth={8} bow={1} chain={step.chain} dark labels={n >= 1} colour="#fb923c" />
      </Stage>
    );
  }),
  // Sentences: 0 brief the crew, 1 approach and stop, 2 lower and drift back, 3 no heap, 4 pause at three times, 5 full scope and dig in, 6 snubber.
  scene(4, (t, n) => {
    const S = SPANS[4]!;
    const approach = n < 1 ? 0 : n === 1 ? within(S, 1, t) : 1;
    const back = n < 2 ? 0 : n === 2 ? within(S, 2, t) * 0.5 : n === 3 ? 0.5 : n === 4 ? 0.5 + within(S, 4, t) * 0.1 : n === 5 ? 0.6 + within(S, 5, t) * 0.4 : 1;
    const boatY = n < 2 ? lerp(860, DROP_AT.y + BOW, approach) : DROP_AT.y + BOW + back * 380;
    const anchored = n >= 2;
    return (
      <Stage background="#1f5f8b">
        <SceneTitle t={t} y={90}>Dropping and setting</SceneTitle>
        <g transform="translate(1400 220)">
          <WindArrow at={{ x: 0, y: 0 }} from={0} length={140} colour="#fff" width={8} head={30} />
          <text x={0} y={110} fontSize={32} fontWeight={700} fill="#fff" textAnchor="middle">Wind</text>
        </g>
        {!anchored && <g opacity={0.8}><line x1={DROP_AT.x - 22} y1={DROP_AT.y - 22} x2={DROP_AT.x + 22} y2={DROP_AT.y + 22} stroke={ART.amber} strokeWidth={6} /><line x1={DROP_AT.x + 22} y1={DROP_AT.y - 22} x2={DROP_AT.x - 22} y2={DROP_AT.y + 22} stroke={ART.amber} strokeWidth={6} /></g>}
        {anchored && (
          <>
            <line x1={DROP_AT.x} y1={DROP_AT.y} x2={DROP_AT.x} y2={boatY - BOW} stroke="#fde68a" strokeWidth={6} strokeDasharray={n >= 4 ? undefined : "14 10"} />
            <AnchorMark at={DROP_AT} size={30} colour="#fde68a" />
          </>
        )}
        {n >= 6 && (
          <path d={`M${DROP_AT.x - 18} ${boatY - BOW + 26} L ${DROP_AT.x} ${boatY - BOW - 60} L ${DROP_AT.x + 18} ${boatY - BOW + 26}`} stroke="#fff" strokeWidth={5} fill="none" />
        )}
        <Yacht x={DROP_AT.x} y={boatY} heading={0} scale={DROP_SCALE} />
        <g fontSize={40} fontWeight={700} fill="#fff">
          {n === 0 && <Lines x={120} y={300} lines={["Brief the crew", "Agree hand signals:", "the helm cannot hear", "the bow"]} size={44} weight={700} />}
          {n === 1 && <Lines x={120} y={300} lines={["Slowly, head to wind", "Stop over the spot"]} size={44} weight={700} />}
          {n === 2 && <Lines x={120} y={300} lines={["Lower to the seabed", "Drift or go gently", "astern, chain running"]} size={44} weight={700} />}
          {n === 3 && <Lines x={120} y={300} lines={["Never in a heap", "on top of the anchor"]} size={44} weight={700} fill="#fca5a5" />}
          {n === 4 && <Lines x={120} y={300} lines={["About 3 × depth:", "pause, let it bite"]} size={44} weight={700} />}
          {n === 5 && <Lines x={120} y={300} lines={["Full scope", "Then astern, firmly,", "for a minute"]} size={44} weight={700} />}
          {n >= 6 && <Lines x={120} y={300} lines={["Snubber on:", "a rope bridle takes", "the load off the windlass"]} size={44} weight={700} />}
        </g>
      </Stage>
    );
  }),
  // Sentences: 0 check it holds, 1 a transit abeam, 2 in line or opening, 3 the plotter track, 4 anchor alarm, 5 if it drags.
  scene(5, (t, n) => {
    const S = SPANS[5]!;
    if (n === 3 || n === 4) {
      return (
        <Stage>
          <SceneTitle t={t} y={90}>{n === 3 ? "The plotter track" : "The anchor alarm"}</SceneTitle>
          {n === 3 ? (
            <>
              <g transform="translate(200 200)">
                <rect width={540} height={540} rx={20} fill="#0d3b52" stroke="#5d6f82" strokeWidth={6} />
                <AnchorMark at={{ x: 270, y: 170 }} size={22} colour="#fde68a" />
                <path d="M120 360 Q 270 470 420 360" stroke={ART.tealBright} strokeWidth={8} fill="none" />
                <text x={270} y={510} textAnchor="middle" fontSize={38} fontWeight={700} fill="#fff">Holding: an arc</text>
              </g>
              <g transform="translate(860 200)">
                <rect width={540} height={540} rx={20} fill="#2a1214" stroke="#5d6f82" strokeWidth={6} />
                <AnchorMark at={{ x: 270, y: 120 }} size={22} colour="#fde68a" />
                <path d="M250 180 L 300 300 L 330 440" stroke="#ff6b6b" strokeWidth={8} fill="none" />
                <text x={270} y={510} textAnchor="middle" fontSize={38} fontWeight={700} fill="#ffb3b3">Dragging: a line</text>
              </g>
            </>
          ) : (
            <g>
              <circle cx={800} cy={500} r={300} fill="rgba(245,179,1,0.1)" stroke={ART.amber} strokeWidth={5} strokeDasharray="20 14" />
              <AnchorMark at={{ x: 800, y: 500 }} size={34} colour="#fde68a" />
              <line x1={800} y1={500} x2={800 + 210 * Math.sin(t * 3)} y2={500 + 210 * Math.cos(t * 3)} stroke="#fde68a" strokeWidth={4} strokeDasharray="10 8" />
              <Yacht x={800 + 240 * Math.sin(t * 3)} y={500 + 240 * Math.cos(t * 3)} heading={180 - (t * 3 * 180) / Math.PI} scale={0.9} />
              <Lines x={60} y={260} lines={["Alarm circle centred", "on the anchor,", "not on the boat"]} size={40} weight={700} fill={ART.amber} />
            </g>
          )}
        </Stage>
      );
    }
    const drag = n < 2 ? 0 : n === 2 ? Math.max(0, within(S, 2, t) - 0.45) * 2 : n >= 5 ? 1 : 0;
    const chapelX = 820 - drag * 40;
    const rockX = 820 - drag * 300;
    const inLine = drag < 0.05;
    return (
      <Stage background="#8fc3e6">
        <SceneTitle t={t} y={90}>Is it holding?</SceneTitle>
        <path d="M0 520 Q 300 330 620 400 T 1200 360 T 1600 420 V 640 H 0 Z" fill="#5f7f4a" />
        <g transform={`translate(${chapelX} 380)`}>
          <rect x={-34} y={-70} width={68} height={70} fill="#f8fafc" stroke="#475569" strokeWidth={3} />
          <path d="M-42 -70 L 0 -110 L 42 -70 Z" fill="#b45309" />
          <line x1={0} y1={-110} x2={0} y2={-140} stroke="#475569" strokeWidth={4} />
          <line x1={-12} y1={-128} x2={12} y2={-128} stroke="#475569" strokeWidth={4} />
        </g>
        <path d="M0 640 H 1600 V 900 H 0 Z" fill="#1f6aa0" />
        <path d={`M${rockX - 90} 650 Q ${rockX - 40} 560 ${rockX} 570 Q ${rockX + 50} 575 ${rockX + 90} 650 Z`} fill="#6b5e50" stroke="#3f362d" strokeWidth={3} />
        {n >= 1 && <line x1={chapelX} y1={250} x2={rockX} y2={600} stroke={inLine ? "#16a34a" : "#dc2626"} strokeWidth={5} strokeDasharray="16 10" />}
        {n >= 1 && (
          <text x={1150} y={780} fontSize={52} fontWeight={800} fill={inLine ? "#bbf7d0" : "#fecaca"}>{inLine ? "In line: holding" : "Opening: dragging"}</text>
        )}
        {n >= 5 && <text x={80} y={780} fontSize={44} fontWeight={800} fill="#fff">Lift it and try again</text>}
      </Stage>
    );
  }),
  // Sentences: 0 the boat swings, 1 radius, 2 forty plus twelve, 3 other boats, 4 first boat in, 5 check the circle.
  scene(6, (t, n) => {
    const wind = n === 0 ? norm360(-50 + 100 * Math.sin(t * Math.PI * 4)) : n >= 5 ? norm360(60 * Math.sin(t * Math.PI * 6)) : 0;
    const r = swingRadius(GOOD_CHAIN);
    const caption =
      n <= 0 ? { title: "Swinging", body: ["The boat swings", "round the anchor", "as the wind shifts"] }
      : n === 1 ? { title: "The radius", body: ["chain + boat"] }
      : n === 2 ? { title: `${GOOD_CHAIN} m + ${BOAT.length} m`, body: [`= ${r} m in every`, "direction"] }
      : n === 3 ? { title: "Neighbours", body: ["Lie like them,", "not on top of", "their anchor"] }
      : n === 4 ? { title: "First in", body: ["has the spot:", "leave them room"] }
      : { title: "Check the circle", body: ["No shallows, rocks", "or swimmers, even", "if the wind goes", "right round"] };
    return (
      <Stage>
        <SceneTitle t={t} y={90}>Swinging room</SceneTitle>
        <Caption title={caption.title} body={caption.body} />
        <StageCove x={590} y={130} s={2.42} windFrom={wind} others={n >= 3} otherCircles={n >= 3} highlight={n >= 5 ? "swim" : null}>
          <AnchoredBoat anchor={GOOD_SPOT} chain={GOOD_CHAIN} windFrom={wind} colour={COVE_COLOURS.you} />
          {(n === 1 || n === 2) && (
            <g>
              <line x1={GOOD_SPOT.x} y1={GOOD_SPOT.y} x2={GOOD_SPOT.x + r} y2={GOOD_SPOT.y} stroke={COVE_COLOURS.you} strokeWidth={2} />
              <text x={GOOD_SPOT.x + r / 2} y={GOOD_SPOT.y - 5} fontSize={10} fontWeight={800} textAnchor="middle" fill={COVE_COLOURS.you}>{r} m</text>
            </g>
          )}
        </StageCove>
      </Stage>
    );
  }),
  // Sentences: 0 narrow coves, 1 anchor out and reverse in, 2 the line ashore, 3 back to the boat, 4 tighten the chain, 5 Med mooring.
  scene(7, (t, n) => {
    const S = SPANS[7]!;
    const rev = n < 1 ? 0 : n === 1 ? within(S, 1, t) : 1;
    const boatY = lerp(760, 470, rev);
    const line = n < 2 ? 0 : n === 2 ? within(S, 2, t) : 1;
    const stern = { x: 800, y: boatY - 87 };
    const tree = { x: 960, y: 250 };
    const quay = n >= 5;
    return (
      <Stage background="#2f7fb3">
        <SceneTitle t={t} y={90}>Lines ashore</SceneTitle>
        {/* The narrow cove: land along the top and both sides. */}
        <path d="M0 130 H 1600 V 900 H 1260 Q 1150 600 1150 400 Q 1120 300 1000 270 L 600 270 Q 470 300 450 420 Q 440 650 340 900 H 0 Z" fill={quay ? "#cbd5e1" : "#7a8f4f"} />
        {quay ? (
          <rect x={560} y={240} width={480} height={34} fill="#94a3b8" stroke="#475569" strokeWidth={3} />
        ) : (
          [[640, 230], [780, 210], [960, 250], [1080, 300]].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={34} fill="#2f5d34" />
              <circle cx={x! - 14} cy={y! - 12} r={20} fill="#3c7443" />
            </g>
          ))
        )}
        {n >= 1 && (
          <>
            <line x1={800} y1={boatY + 87} x2={800} y2={860} stroke="#fde68a" strokeWidth={6} strokeDasharray={n >= 4 ? undefined : "14 10"} />
            <AnchorMark at={{ x: 800, y: 870 }} size={26} colour="#fde68a" />
          </>
        )}
        {line > 0 && !quay && (
          <line x1={stern.x} y1={stern.y} x2={lerp(stern.x, tree.x, line)} y2={lerp(stern.y, tree.y + 30, line)} stroke="#f97316" strokeWidth={6} />
        )}
        {n >= 3 && !quay && <line x1={stern.x + 12} y1={stern.y} x2={tree.x + 14} y2={tree.y + 34} stroke="#f97316" strokeWidth={6} />}
        {quay && (
          <>
            <line x1={stern.x - 20} y1={stern.y} x2={stern.x - 120} y2={274} stroke="#f97316" strokeWidth={6} />
            <line x1={stern.x + 20} y1={stern.y} x2={stern.x + 120} y2={274} stroke="#f97316" strokeWidth={6} />
          </>
        )}
        <Yacht x={800} y={boatY} heading={180} scale={1.45} />
        <g>
          {n === 0 && <Lines x={60} y={380} lines={["No room to swing"]} size={42} weight={700} />}
          {n === 1 && <Lines x={60} y={380} lines={["Anchor well out,", "reverse in"]} size={42} weight={700} />}
          {n === 2 && <Lines x={60} y={380} lines={["Long floating line", "round a rock,", "tree or ring"]} size={42} weight={700} />}
          {n === 3 && <Lines x={60} y={380} lines={["End back to", "the boat: let go", "from on board"]} size={42} weight={700} />}
          {n === 4 && <Lines x={60} y={380} lines={["Chain tight:", "no swinging"]} size={42} weight={700} />}
          {quay && <Lines x={60} y={380} lines={["Med mooring:", "the same, with", "the quay instead"]} size={42} weight={700} />}
        </g>
      </Stage>
    );
  }),
  // Sentences: 0 buoy fields, 1 Croatia, 2 British Virgin Islands, 3 approach, 4 line through the loop, 5 checks, 6 next lesson.
  scene(8, (t, n) => {
    const S = SPANS[8]!;
    const buoy = { x: 800, y: 380 };
    const approach = n < 3 ? 0 : n === 3 ? within(S, 3, t) : 1;
    const boatY = lerp(840, buoy.y + 100, approach);
    const others = [{ x: 420, y: 330 }, { x: 1180, y: 330 }, { x: 420, y: 640 }, { x: 1180, y: 640 }];
    return (
      <Stage background="#1f6aa0">
        <SceneTitle t={t} y={90}>Mooring buoys</SceneTitle>
        <g transform="translate(1460 220)">
          <WindArrow at={{ x: 0, y: 0 }} from={0} length={120} colour="#fff" width={7} head={26} />
        </g>
        {others.map((b, i) => (
          <g key={i}>
            <line x1={b.x} y1={b.y} x2={b.x} y2={b.y + 40} stroke="#e2e8f0" strokeWidth={3} />
            <circle cx={b.x} cy={b.y} r={16} fill="#fff" stroke="#334155" strokeWidth={3} />
            <Yacht x={b.x} y={b.y + 100} heading={0} scale={1.1} />
          </g>
        ))}
        <circle cx={buoy.x} cy={buoy.y} r={18} fill="#fff" stroke="#334155" strokeWidth={3} />
        {n >= 4 && (
          <path d={`M${buoy.x - 14} ${boatY - 80} Q ${buoy.x - 30} ${buoy.y + 10} ${buoy.x} ${buoy.y + 12} Q ${buoy.x + 30} ${buoy.y + 10} ${buoy.x + 14} ${boatY - 80}`} stroke="#f97316" strokeWidth={5} fill="none" />
        )}
        <Yacht x={buoy.x} y={boatY} heading={0} scale={1.3} />
        {n === 3 && <Arrow a={{ x: buoy.x + 40, y: boatY - 110 }} b={{ x: buoy.x + 24, y: buoy.y + 22 }} colour={ART.amber} width={5} head={20} />}
        <g>
          {n <= 0 && <Lines x={60} y={200} lines={["Buoy fields in many bays"]} size={42} weight={700} />}
          {n === 1 && <Lines x={60} y={200} lines={["Croatia: paid buoys, the fee collected by boat"]} size={42} weight={700} />}
          {n === 2 && <Lines x={60} y={200} lines={["British Virgin Islands: park moorings for day use"]} size={42} weight={700} />}
          {n === 3 && <Lines x={60} y={200} lines={["Slowly into the wind; the bow points at the buoy"]} size={42} weight={700} />}
          {n === 4 && <Lines x={60} y={200} lines={["Your own line through the loop, both ends to a cleat"]} size={42} weight={700} />}
          {n === 5 && <Lines x={60} y={200} lines={["Right size? Not private?"]} size={42} weight={700} />}
          {n >= 6 && <Lines x={60} y={200} lines={["Next: the rules of the road"]} size={42} weight={700} fill={ART.tealBright} />}
        </g>
      </Stage>
    );
  }),
];

export function Video() {
  return <LessonPlayer slug={SCRIPT.slug} title="Anchoring and mooring buoys" scenes={SCENES} speak={SCRIPT.speak} />;
}

/* ------------------------------------------------------------------ */
/* Exercises                                                            */
/* ------------------------------------------------------------------ */

const SPOTS: Array<{ id: string; at: P }> = [
  { id: "W", at: { x: 150, y: 150 } },
  { id: "X", at: { x: 200, y: 88 } },
  { id: "Y", at: GOOD_SPOT },
  { id: "Z", at: { x: 332, y: 108 } },
];

function SpotFigure() {
  return (
    <svg viewBox="0 0 400 300" className="w-full max-w-xl rounded-card border border-border" role="img" aria-label="The practice cove with four possible anchoring spots, W, X, Y and Z, and a northerly wind">
      <CoveMap windFrom={0} others={false} labels>
        {SPOTS.map((s) => (
          <g key={s.id}>
            <circle cx={s.at.x} cy={s.at.y} r={8} fill="#fff" stroke={COVE_COLOURS.you} strokeWidth={2} />
            <text x={s.at.x} y={s.at.y + 3.5} fontSize={10} fontWeight={800} textAnchor="middle" fill={COVE_COLOURS.you}>{s.id}</text>
          </g>
        ))}
        <g transform="translate(345 30)">
          <circle r={22} fill="rgba(255,255,255,0.8)" />
          <WindArrow at={{ x: 0, y: 0 }} from={0} length={32} width={3} head={10} />
        </g>
      </CoveMap>
    </svg>
  );
}

function ScopeFigure({ depth, bow, chain }: { depth: number; bow: number; chain: number }) {
  return (
    <svg viewBox="0 0 800 280" className="w-full max-w-xl rounded-card border border-border bg-white" role="img" aria-label={`Side view: ${depth} metres of water, bow roller ${bow} metres up`}>
      <ScopeSide w={800} h={280} depth={depth} bow={bow} chain={chain} labels={false} />
    </svg>
  );
}

export const QUESTIONS: Question[] = [
  {
    id: "best-seabed",
    kind: "choice",
    prompt: "Which seabed gives the best holding for a charter yacht's anchor?",
    options: ["Sand", "Weed", "Rock", "Coral"],
    answer: 0,
    explain: "Sand (and mud) let the anchor dig in. Weed lets it skate or pull up a clump, rock gives nothing to dig into, and coral must never be anchored on.",
  },
  {
    id: "posidonia",
    kind: "choice",
    prompt: "You can see dark meadows of Posidonia seagrass under the boat, with lighter patches between them. What do you do?",
    options: ["Drop on the seagrass: it holds well", "Drop on a light, sandy patch", "Drop anywhere and let out extra chain", "Anchor in the swimming area instead"],
    answer: 1,
    explain: "Posidonia is poor holding and protected; in places such as the Balearics anchoring on it can bring a heavy fine. Drop on sand, or use a buoy.",
  },
  {
    id: "spot",
    kind: "choice",
    figure: <SpotFigure />,
    prompt: "A northerly is forecast all night. Where would you drop the anchor? (Your boat is 12 m long, draws 2 m and will use about 40 m of chain.)",
    options: ["W", "X", "Y", "Z"],
    fixedOrder: true,
    answer: 2,
    explain: "Y is on sand in about 8½ m, with room to swing. W is on seagrass, X swings into the swimming area and the shallows, and Z is on rock, in shallow water close under the headland.",
  },
  {
    id: "scope-settled",
    kind: "numeric",
    figure: <ScopeFigure depth={6} bow={1} chain={35} />,
    prompt: "The sounder shows 6 m, the bow roller is 1 m above the water, and the night is settled. At five times the depth, how much chain do you let out?",
    answer: 35,
    tolerance: 0.5,
    unit: "m",
    explain: "Measure from the bow: 6 + 1 = 7 m. Five times 7 is 35 m of chain.",
  },
  {
    id: "scope-windy",
    kind: "numeric",
    prompt: "In 4 m of water, with a 1 m bow and a strong wind forecast, you use seven times the depth. How much chain is that?",
    answer: 35,
    tolerance: 0.5,
    unit: "m",
    explain: "4 + 1 = 5 m from the bow roller to the seabed, and 7 × 5 = 35 m. Check the swinging room for it.",
  },
  {
    id: "radius",
    kind: "numeric",
    prompt: "You have 35 m of chain out on a 12 m yacht. Roughly what radius of clear water do you need around the anchor?",
    answer: 47,
    tolerance: 1,
    unit: "m",
    explain: "The swinging circle's radius is about the chain plus the boat: 35 + 12 = 47 m, in every direction.",
  },
  {
    id: "transit",
    kind: "choice",
    prompt: "After anchoring you line up a chapel on the hill behind a rock on the shore, abeam. Ten minutes later the chapel has moved well to the left of the rock. What is happening?",
    options: ["Nothing: transits always move", "You are dragging", "The tide has turned", "The chain has wrapped round the keel"],
    answer: 1,
    explain: "A transit abeam stays in line while the anchor holds (it moves a little as you swing). If it opens steadily, the boat is moving: lift and re-anchor.",
  },
  {
    id: "alarm",
    kind: "choice",
    prompt: "Where should the centre of an anchor alarm's circle be?",
    options: ["Where the boat is when you set it", "Where the anchor went down", "At the beach", "Anywhere: it measures speed"],
    answer: 1,
    explain: "The boat swings round the anchor, so the alarm circle is centred on the anchor, with a radius a little bigger than your swinging circle.",
  },
  {
    id: "tap-roads",
    kind: "plot",
    prompt: "On the practice chart, tap the Kerran Roads anchorage.",
    answer: ROADS.at,
    tolerance: 0.6,
    view: viewAround(km(9.0, 12.0), 12),
    explain: "Kerran Roads lies off the north of the island, marked with an anchor. The island shelters it from southerly winds.",
  },
  {
    id: "roads-northerly",
    kind: "choice",
    prompt: "A fresh northerly is forecast tonight. Is Kerran Roads a good place to spend the night?",
    options: ["Yes: it is a recommended anchorage", "No: it is open to the north, so go into Port Kerran", "Yes, with seven times the depth", "Only on a mooring buoy"],
    answer: 1,
    explain: "Kerran Roads is sheltered from the south but wide open to the north. A northerly blows straight in: find shelter on the south side of the island instead.",
  },
  {
    id: "line-ashore",
    kind: "choice",
    prompt: "Taking a line ashore round a tree, why bring the end back to the boat?",
    options: ["It is stronger", "So you can let go from on board, without going ashore", "To stop the tree moving", "It is the law"],
    answer: 1,
    explain: "With both ends on board you can slip the line in the night, or in a hurry, without anyone swimming ashore.",
  },
  {
    id: "buoy",
    kind: "choice",
    prompt: "How do you approach a mooring buoy?",
    options: ["Fast and downwind, so you can stop quickly", "Slowly into the wind, or the way the moored boats are lying", "Sideways, so the crew can grab it amidships", "Astern, so the helm can see it"],
    answer: 1,
    explain: "Come in slowly, head to wind (or to the stronger of wind and current, as the boats nearby show), with a crew member pointing at the buoy, because the helm loses sight of it under the bow.",
  },
];

const CONCEPTS: Question[] = [
  QUESTIONS[0]!, QUESTIONS[1]!, QUESTIONS[6]!, QUESTIONS[7]!, QUESTIONS[10]!, QUESTIONS[11]!,
  {
    id: "bvi-park",
    kind: "choice",
    prompt: "National Parks moorings in the British Virgin Islands are…",
    options: ["for day use, with a permit and a time limit", "free overnight for anyone", "for fishing boats only", "for boats over twenty metres"],
    answer: 0,
    explain: "They protect the reefs at sites such as the Baths and the Indians. Each boat needs a National Parks permit; spend the night on a paid mooring ball or at anchor elsewhere.",
  },
  {
    id: "heap",
    kind: "choice",
    prompt: "Why not drop all the chain in one go while the boat is stopped?",
    options: ["It piles on top of the anchor and can foul it", "It is too noisy", "The windlass will not allow it", "It uses too much fuel"],
    answer: 0,
    explain: "Lower the anchor to the seabed, then pay the chain out as the boat drifts or goes gently astern, so it lies in a line along the bottom.",
  },
];

export const PRACTICE: PracticeGenerator = {
  title: "Scope and swinging room",
  description: "Fresh numbers every time: how much chain, and how much room you need.",
  generate: (rng) => {
    const qs: Question[] = [];
    for (let i = 0; i < 2; i++) {
      const depth = randStep(rng, 3, 12, 0.5);
      const bow = pick(rng, [1, 1, 1.5]);
      const ratio = pick(rng, [4, 5, 7]);
      const answer = Math.round((depth + bow) * ratio * 10) / 10;
      qs.push({
        id: `p-scope-${i}`,
        kind: "numeric",
        prompt: `The sounder reads ${depth} m and the bow roller is ${bow} m up. You want ${ratio} times the depth. How much chain is that, before rounding up to a mark?`,
        answer,
        tolerance: 0.6,
        unit: "m",
        explain: `${depth} + ${bow} = ${depth + bow} m from the bow roller to the seabed; ${ratio} × ${depth + bow} = ${answer} m.`,
      });
    }
    const chain = pick(rng, [25, 30, 35, 40, 45, 50, 60]);
    const length = pick(rng, [11, 12, 13, 14]);
    qs.push({
      id: "p-radius",
      kind: "numeric",
      prompt: `You have ${chain} m of chain out on a ${length} m yacht. About what radius of clear water do you need?`,
      answer: swingRadius(chain, length),
      tolerance: 1,
      unit: "m",
      explain: `Chain plus boat: ${chain} + ${length} = ${swingRadius(chain, length)} m.`,
    });
    qs.push(...shuffle(rng, CONCEPTS).slice(0, 2));
    return qs;
  },
};

export function Exercises({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  return <ExerciseSet courseSlug={courseSlug} lessonSlug={lessonSlug} questions={QUESTIONS} practice={PRACTICE} />;
}
