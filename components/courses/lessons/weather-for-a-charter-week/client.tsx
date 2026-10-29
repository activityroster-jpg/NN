"use client";

import { Building2, ClipboardList, Clock, MapPin, Radio, ShieldCheck, Smartphone, Users, Wind } from "lucide-react";
import { viewAround } from "@/lib/courses/navigation/chart-geometry";
import { FEATURES, km } from "@/lib/courses/navigation/practice-chart";
import { pick, randInt, shuffle } from "@/lib/courses/random";
import { ExerciseSet, type PracticeGenerator, type Question } from "../../Exercises";
import LessonPlayer, { SceneTitle, Stage, fade, splitSentences, type Scene } from "../../LessonPlayer";
import { ART, Card, Lines, SceneIcon, Yacht } from "../../scene-art";
import { BreezeCurve, BreezeSection, MapArrow, WindArrow, WindRose } from "./art";
import { BEAUFORT, POINTS, POINT_DEG, POINT_WORD, SEA_BREEZE_DAY, forceFor, knotsText, opposite, windWord, type Point8 } from "./data";
import { weatherForACharterWeek as SCRIPT } from "./script";

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
function within(spans: Array<[number, number]>, sentence: number, t: number): number {
  const s = spans[sentence];
  if (!s) return 1;
  return Math.min(1, Math.max(0, (t - s[0]) / (s[1] - s[0] || 1)));
}
const SPANS = SCRIPT.scenes.map((s) => sentenceSpans(s.narration));

const COLD = "#60a5fa";
const WARM = "#fb923c";
const MUTED = "rgba(255,255,255,0.35)";

/** A row of parallel wind arrows across the stage, blowing from `from`. */
function WindField({ from, cx, cy, spread = 160, rows = 3, length = 150, colour = "#e0f2fe", t = 0, opacity = 1 }: {
  from: number; cx: number; cy: number; spread?: number; rows?: number; length?: number; colour?: string; t?: number; opacity?: number
}) {
  const perp = ((from + 90) * Math.PI) / 180;
  const along = (from * Math.PI) / 180;
  const drift = ((t * 4) % 1) * 60 - 30;
  return (
    <g opacity={opacity}>
      {Array.from({ length: rows }, (_, i) => {
        const k = i - (rows - 1) / 2;
        const at = { x: cx + Math.sin(perp) * spread * k - Math.sin(along) * drift, y: cy - Math.cos(perp) * spread * k + Math.cos(along) * drift };
        return <WindArrow key={i} at={at} from={from} length={length} colour={colour} width={8} head={28} />;
      })}
    </g>
  );
}

/** A simple island blob. */
const Island = ({ x, y, rx, ry, rot = 0, label, size = 30 }: { x: number; y: number; rx: number; ry: number; rot?: number; label?: string; size?: number }) => (
  <g>
    <ellipse cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${rot} ${x} ${y})`} fill="#c9b27a" stroke="#8f7a4a" strokeWidth={3} />
    {label && <text x={x} y={y + size * 0.35} textAnchor="middle" fontSize={size} fontWeight={700} fill="#3b2f1a">{label}</text>}
  </g>
);

const SCENES: Scene[] = [
  scene(0, (t) => (
    <Stage background="#2b6c99">
      <circle cx={1350} cy={170} r={70} fill="#fbbf24" opacity={0.9} />
      <path d="M0 620 Q 400 590 800 620 T 1600 620 V900 H0 Z" fill="#123a5a" />
      <path d="M0 700 Q 400 675 800 700 T 1600 700 V900 H0 Z" fill="#0f3049" />
      <WindField from={315} cx={1380} cy={540} spread={100} t={t} opacity={0.7} />
      <Yacht x={260 + t * 700} y={650} heading={100} scale={1.5} />
      <text x={800} y={280} textAnchor="middle" fontSize={84} fontWeight={800} fill="#fff" opacity={fade(t, 0, 0.12)}>Weather for a charter week</text>
      <text x={800} y={360} textAnchor="middle" fontSize={44} fill="#a5f3fc" opacity={fade(t, 0.15, 0.3)}>Lesson 11 · Reading the wind</text>
      <text x={800} y={440} textAnchor="middle" fontSize={36} fill="#e0f2fe" opacity={fade(t, 0.6, 0.75)}>Forecasts · local winds · when to stay put</text>
    </Stage>
  )),
  // Sentences: 0 what a forecast gives, 1 direction is where it blows from, 2 knots or Beaufort, 3 forces four and six, 4 force eight, 5 gusts.
  scene(1, (t, n) => {
    if (n === 0) {
      return (
        <Stage>
          <SceneTitle t={t}>Reading a forecast</SceneTitle>
          <g transform="translate(360 250)">
            <rect width={880} height={420} rx={24} fill="#fff" />
            <rect width={880} height={90} rx={24} fill={ART.navy} />
            <rect y={60} width={880} height={30} fill={ART.navy} />
            <text x={40} y={60} fontSize={38} fontWeight={700} fill="#fff">Wind forecast</text>
            <text x={40} y={190} fontSize={44} fill={ART.navy}>Direction: <tspan fontWeight={800}>north-east</tspan></text>
            <text x={40} y={270} fontSize={44} fill={ART.navy}>Strength: <tspan fontWeight={800}>4 to 5</tspan> (11 to 21 knots)</text>
            <text x={40} y={350} fontSize={44} fill={ART.navy}>Gusts: <tspan fontWeight={800} fill="#b91c1c">28 knots</tspan></text>
          </g>
        </Stage>
      );
    }
    if (n === 1) {
      return (
        <Stage>
          <SceneTitle t={t}>Where the wind blows from</SceneTitle>
          <WindRose x={800} y={500} r={290} dark ink="#fff" ring="#5d7a92" winds={[{ from: 0, colour: COLD }]} labelSize={46} />
          <Lines x={70} y={420} lines={["A northerly", "blows from", "the north"]} size={50} weight={800} fill={COLD} />
          <Yacht x={1330} y={540} heading={0} scale={1.3} />
        </Stage>
      );
    }
    const base = 760;
    const k = 11;
    const lit = (f: number) => (n === 3 && (f === 4 || f === 6)) || (n === 4 && f === 8);
    const forces = BEAUFORT.filter((b) => b.force <= 9);
    return (
      <Stage>
        <SceneTitle t={t} y={92}>The Beaufort scale</SceneTitle>
        <text x={800} y={160} textAnchor="middle" fontSize={36} fill={ART.muted}>Mean wind speed in knots for each force</text>
        {forces.map((b, i) => {
          const top = b.max ?? 50;
          const x = 170 + i * 140;
          const h = top * k;
          const hot = lit(b.force);
          const gust = n >= 5 && b.force >= 3 && b.force <= 7 ? h * (0.33 + 0.08 * Math.sin(t * 40 + i)) : 0;
          return (
            <g key={b.force}>
              {gust > 0 && <rect x={x - 44} y={base - h - gust} width={88} height={gust} fill="none" stroke={ART.amber} strokeWidth={4} strokeDasharray="12 9" />}
              <rect x={x - 44} y={base - h} width={88} height={h} rx={8} fill={hot ? ART.tealBright : "rgba(255,255,255,0.22)"} />
              <text x={x} y={base + 56} textAnchor="middle" fontSize={44} fontWeight={800} fill={hot ? ART.tealBright : "#fff"}>{b.force}</text>
              {hot && <text x={x} y={base - h - 22} textAnchor="middle" fontSize={36} fontWeight={800} fill="#fff">{b.min} to {b.max}</text>}
            </g>
          );
        })}
        {n === 4 && <text x={170 + 8 * 140} y={base - 40 * k - 80} textAnchor="middle" fontSize={46} fontWeight={800} fill={ART.amber}>Gale</text>}
        {n >= 5 && <text x={200} y={260} fontSize={46} fontWeight={800} fill={ART.amber}>Gusts: a third or more above the mean</text>}
      </Stage>
    );
  }),
  // Sentences: 0 two sources, 1 national service, 2 apps, 3 noticeboards and the base, 4 radio.
  scene(2, (t, n) => (
    <Stage>
      <SceneTitle t={t}>Where to get the forecast</SceneTitle>
      <text x={800} y={190} textAnchor="middle" fontSize={40} fill={ART.amber} opacity={fade(t, 0.03, 0.12)}>At least two sources, morning and evening</text>
      <Card x={80} y={250} w={700} h={250} icon={Building2} title="Weather service" body="The official coastal forecast" titleSize={46} bodySize={32} opacity={on(n, 1)} />
      <Card x={820} y={250} w={700} h={250} icon={Smartphone} title="Apps" body="Models in knots: smoothed gusts" titleSize={46} bodySize={32} opacity={on(n, 2)} accent={ART.amber} />
      <Card x={80} y={540} w={700} h={250} icon={ClipboardList} title="Marina and base" body="Noticeboard, and the briefing" titleSize={46} bodySize={32} opacity={on(n, 3)} />
      <Card x={820} y={540} w={700} h={250} icon={Radio} title="VHF radio" body="Coast stations, at set times" titleSize={46} bodySize={32} opacity={on(n, 4)} />
    </Stage>
  )),
  // Sentences: 0 a daily pattern, 1 calm mornings, 2 the sea breeze builds, 3 dies at sunset, 4 maestral and maistro, 5 plan for it.
  scene(3, (t, n) => {
    const S = SPANS[3]!;
    if (n === 2) return <Stage><BreezeSection night={false} t={t} /></Stage>;
    if (n === 3) return <Stage><BreezeSection night t={t} title="A quiet night" /></Stage>;
    if (n === 4) {
      return (
        <Stage>
          <SceneTitle t={t}>The afternoon breeze has a name</SceneTitle>
          <WindRose x={1100} y={510} r={270} dark ink="#fff" ring="#5d7a92" winds={[{ from: 315, colour: ART.tealBright }]} labelSize={42} />
          <Lines x={80} y={360} lines={["Croatia: maestral", "Ionian: maistro", "", "Both from the", "north-west"]} size={52} weight={700} />
        </Stage>
      );
    }
    const hour = n <= 0 ? 6 + within(S, 0, t) * 16 : n === 1 ? 8 : 15;
    return (
      <Stage>
        <SceneTitle t={t} y={92}>The daily sea breeze</SceneTitle>
        <rect x={120} y={170} width={1360} height={640} rx={20} fill="#fff" />
        <BreezeCurve x={240} y={230} w={1160} h={470} hour={hour} points={SEA_BREEZE_DAY} fontSize={30} />
        {n === 1 && <text x={300} y={300} fontSize={44} fontWeight={800} fill="#0B1929">Calm mornings</text>}
        {n >= 5 && (
          <g>
            <rect x={240 + (6 / 16) * 1160} y={230} width={(6 / 16) * 1160} height={470} fill="#0f766e" opacity={0.1} />
            <text x={240 + (9 / 16) * 1160} y={290} textAnchor="middle" fontSize={40} fontWeight={800} fill="#0f766e">Longer legs here</text>
            <text x={300} y={300} fontSize={36} fontWeight={700} fill="#0B1929">Night in a bay sheltered from it</text>
          </g>
        )}
      </Stage>
    );
  }),
  // Sentences: 0 the meltemi, 1 strength, 2 afternoons, 3 the sea and swell, 4 the Saronic.
  scene(4, (t, n) => (
    <Stage background="#1f6aa0">
      <SceneTitle t={t} y={92}>The meltemi</SceneTitle>
      <path d="M0 130 H 700 Q 640 260 520 300 Q 420 330 380 420 Q 330 520 200 560 Q 100 600 0 700 Z" fill="#c9b27a" stroke="#8f7a4a" strokeWidth={3} />
      <text x={170} y={260} fontSize={40} fontWeight={800} fill="#3b2f1a">Greece</text>
      <path d="M1600 130 V 900 H 1450 Q 1380 760 1420 640 Q 1460 520 1400 420 Q 1360 300 1430 130 Z" fill="#c9b27a" stroke="#8f7a4a" strokeWidth={3} />
      <text x={1510} y={520} fontSize={40} fontWeight={800} fill="#3b2f1a" textAnchor="middle">Turkey</text>
      <Island x={820} y={520} rx={70} ry={44} rot={-20} />
      <Island x={980} y={640} rx={60} ry={40} rot={10} />
      <Island x={700} y={680} rx={50} ry={36} />
      <Island x={1060} y={470} rx={46} ry={30} />
      <text x={880} y={790} fontSize={36} fontWeight={700} fill="#fff" textAnchor="middle">The Cyclades</text>
      <WindField from={0} cx={900} cy={300} spread={180} rows={4} t={t} length={170} colour="#fff" />
      <g opacity={on(n, 4)}>
        <circle cx={430} cy={500} r={70} fill="none" stroke={ART.amber} strokeWidth={5} strokeDasharray="12 8" />
        <text x={430} y={610} fontSize={32} fontWeight={800} fill={ART.amber} textAnchor="middle">Saronic Gulf</text>
      </g>
      {n === 3 && <path d="M790 470 q 15 -12 30 0 t 30 0 M780 448 q 15 -12 30 0 t 30 0" stroke="#fecaca" strokeWidth={5} fill="none" />}
      <g>
        {n <= 0 && <Lines x={1000} y={200} lines={["Summer: June to September"]} size={40} weight={700} />}
        {n === 1 && <Lines x={1000} y={200} lines={["Force 4 to 6, sometimes 7+"]} size={40} weight={700} />}
        {n === 2 && <Lines x={1000} y={200} lines={["Strongest in the afternoon"]} size={40} weight={700} />}
        {n === 3 && <Lines x={1000} y={200} lines={["Steep seas; swell into", "north-facing bays"]} size={40} weight={700} />}
        {n >= 4 && <Lines x={1000} y={200} lines={["Partly sheltered:", "the Saronic Gulf"]} size={40} weight={700} fill={ART.amber} />}
      </g>
    </Stage>
  )),
  // Sentences: 0 two winds, 1 bora, 2 gusts and shelter, 3 cap cloud, 4 jugo, 5 the sea it brings.
  scene(5, (t, n) => {
    const bora = n >= 1 && n <= 3;
    const jugo = n >= 4;
    return (
      <Stage>
        <SceneTitle t={t} y={92}>The bora and the jugo</SceneTitle>
        <WindRose x={430} y={420} r={200} dark ink="#fff" ring="#5d7a92" winds={[{ from: 45, colour: bora || n === 0 ? COLD : MUTED }]} labelSize={36} />
        <WindRose x={1170} y={420} r={200} dark ink="#fff" ring="#5d7a92" winds={[{ from: 135, colour: jugo || n === 0 ? WARM : MUTED }]} labelSize={36} />
        <g opacity={bora || n === 0 ? 1 : 0.4}>
          <text x={430} y={705} textAnchor="middle" fontSize={52} fontWeight={800} fill={COLD}>Bora</text>
          <text x={430} y={760} textAnchor="middle" fontSize={32} fill="#fff">{n === 3 ? "Cap cloud on the mountains first" : n === 2 ? "Violent gusts: find shelter" : "Cold, sudden, off the mountains"}</text>
        </g>
        <g opacity={jugo || n === 0 ? 1 : 0.4}>
          <text x={1170} y={705} textAnchor="middle" fontSize={52} fontWeight={800} fill={WARM}>Jugo</text>
          <text x={1170} y={760} textAnchor="middle" fontSize={32} fill="#fff">{n >= 5 ? "Rain, and a heavy sea from the south" : "Warm, humid, builds slowly"}</text>
        </g>
        {n === 3 && (
          <g transform="translate(632 300) scale(0.94)">
            <path d="M0 110 L 90 30 L 170 80 L 260 10 L 360 110 Z" fill="#475569" />
            <path d="M40 40 Q 120 -10 200 30 Q 280 -20 340 40 Q 260 60 180 50 Q 100 70 40 40 Z" fill="#f8fafc" />
          </g>
        )}
      </Stage>
    );
  }),
  // Sentences: 0 the mistral, 1 Corsica and Sardinia, 2 the Strait of Bonifacio, 3 shelter.
  scene(6, (t, n) => (
    <Stage background="#1f6aa0">
      <SceneTitle t={t} y={92}>The mistral</SceneTitle>
      <path d="M0 130 H 1600 V 260 Q 1300 300 1100 250 Q 900 220 760 300 Q 620 360 480 300 Q 360 260 200 330 Q 100 370 0 360 Z" fill="#c9b27a" stroke="#8f7a4a" strokeWidth={3} />
      <text x={760} y={210} fontSize={40} fontWeight={800} fill="#3b2f1a" textAnchor="middle">France</text>
      <text x={500} y={360} fontSize={28} fontWeight={700} fill="#fff" textAnchor="middle">Gulf of Lion</text>
      <path d="M760 300 L 700 140" stroke="#60a5fa" strokeWidth={8} opacity={0.6} />
      <Island x={1100} y={500} rx={70} ry={130} rot={4} label="Corsica" size={30} />
      <Island x={1080} y={770} rx={90} ry={140} rot={-4} label="Sardinia" size={30} />
      <WindField from={315} cx={800} cy={480} spread={150} rows={3} t={t} length={170} colour="#e0f2fe" />
      {n >= 2 && (
        <g>
          <WindArrow at={{ x: 1095, y: 632 }} from={290} length={220} colour={ART.amber} width={12} head={36} />
          <text x={1260} y={650} fontSize={32} fontWeight={800} fill={ART.amber}>Strait of Bonifacio</text>
        </g>
      )}
      {n >= 3 && (
        <g fontSize={30} fontWeight={800} fill="#fff">
          <circle cx={1075} cy={398} r={12} fill={ART.amber} /><text x={950} y={392}>Calvi</text>
          <circle cx={1050} cy={540} r={12} fill={ART.amber} /><text x={890} y={560}>Ajaccio</text>
        </g>
      )}
      <g>
        {n <= 0 && <Lines x={60} y={700} lines={["Cold, dry, from the north-west"]} size={40} weight={700} />}
        {n === 1 && <Lines x={60} y={700} lines={["Force 6 or more, for days"]} size={40} weight={700} />}
        {n === 2 && <Lines x={60} y={700} lines={["A force or two stronger in the strait"]} size={40} weight={700} />}
        {n >= 3 && <Lines x={60} y={700} lines={["Stay in a good harbour"]} size={40} weight={700} fill={ART.amber} />}
      </g>
    </Stage>
  )),
  // Sentences: 0 Caribbean trade wind, 1 Christmas winds and squalls, 2 hurricane season, 3 Seychelles, 4 Thailand, 5 the season decides.
  scene(7, (t, n) => {
    const lit = (i: number) => n >= 5 || (i === 0 && n <= 2) || (i === 1 && n === 3) || (i === 2 && n === 4);
    const panels = [
      { title: "Caribbean", lines: n === 2 ? ["Hurricane season:", "June to November"] : n === 1 ? ["Harder at Christmas;", "squalls"] : ["Trade wind from the", "east, 15 to 20 knots"], winds: [{ from: 90, colour: ART.tealBright }] },
      { title: "Seychelles", lines: ["South-east: May to October", "North-west: December to March"], winds: [{ from: 135, colour: WARM }, { from: 315, colour: COLD }] },
      { title: "Thailand", lines: ["North-east: November to April", "South-west: May to October"], winds: [{ from: 45, colour: ART.tealBright }, { from: 225, colour: WARM }] },
    ];
    return (
      <Stage>
        <SceneTitle t={t} y={92}>Trade winds and monsoons</SceneTitle>
        {panels.map((p, i) => (
          <g key={p.title} opacity={lit(i) ? 1 : 0.3}>
            <WindRose x={280 + i * 520} y={390} r={150} dark ink="#fff" ring="#5d7a92" winds={p.winds} labelSize={30} />
            <text x={280 + i * 520} y={630} textAnchor="middle" fontSize={50} fontWeight={800} fill="#fff">{p.title}</text>
            <Lines x={280 + i * 520} y={685} lines={p.lines} size={30} anchor="middle" fill={ART.muted} />
          </g>
        ))}
        {n >= 5 && <text x={800} y={180} textAnchor="middle" fontSize={40} fontWeight={800} fill={ART.amber}>The season you book decides the wind you get</text>}
      </Stage>
    );
  }),
  // Sentences: 0 know when not to go, 1 the whole forecast, 2 worst, when, where, 3 beyond the crew, 4 tonight's shelter, 5 a day ashore, 6 next lesson.
  scene(8, (t, n) => (
    <Stage>
      <SceneTitle t={t}>When to stay put</SceneTitle>
      {[
        { icon: Wind, text: "The whole forecast: wind, gusts, direction, changes" },
        { icon: Clock, text: "What is the worst, when, and where will we be?" },
        { icon: Users, text: "Beyond the crew or the boat? Stay, or a short hop downwind" },
        { icon: ShieldCheck, text: "Tonight's shelter against tonight's wind" },
        { icon: MapPin, text: "A day ashore is part of the holiday" },
      ].map((s, i) => (
        <g key={s.text} opacity={on(n, i + 1)} transform={`translate(160 ${200 + i * 112})`}>
          <rect width={1280} height={92} rx={16} fill="rgba(255,255,255,0.06)" />
          <SceneIcon icon={s.icon} x={60} y={46} size={48} />
          <Lines x={120} y={60} lines={[s.text]} size={38} fill="#fff" />
        </g>
      ))}
      {n >= 6 && <text x={800} y={810} textAnchor="middle" fontSize={40} fill={ART.tealBright}>Next: the plotter, the apps and the week&apos;s plan</text>}
    </Stage>
  )),
];

export function Video() {
  return <LessonPlayer slug={SCRIPT.slug} title="Weather for a charter week" scenes={SCENES} speak={SCRIPT.speak} />;
}

/* ------------------------------------------------------------------ */
/* Exercises                                                            */
/* ------------------------------------------------------------------ */

const HARBOUR = FEATURES.find((f) => f.id === "harbour")!;

export const QUESTIONS: Question[] = [
  {
    id: "nw-bearing",
    kind: "bearing",
    prompt: "The forecast says north-westerly 4. As a bearing, which direction is the wind blowing from?",
    answer: 315,
    tolerance: 5,
    explain: "Winds are named for where they come from: north-west is 315°. It blows towards the south-east (135°).",
  },
  {
    id: "southerly",
    kind: "choice",
    prompt: "A southerly wind blows…",
    options: ["from the south, towards the north", "from the north, towards the south", "along the south coast", "only in the southern hemisphere"],
    answer: 0,
    explain: "A wind's name is where it comes from. A southerly comes from the south, so bays open to the south catch it.",
  },
  {
    id: "knots-force",
    kind: "numeric",
    prompt: "Your app shows a mean wind of 19 knots. What force is that on the Beaufort scale?",
    answer: 5,
    tolerance: 0,
    explain: `Force 5 is ${knotsText(5)}: a fresh breeze. Reef early, and expect gusts well above 19 knots.`,
  },
  {
    id: "gusts",
    kind: "choice",
    prompt: "The forecast is 15 knots, gusting 25. What do you set the sails for?",
    options: ["15 knots: the mean", "25 knots: the gusts", "20 knots: halfway", "Nothing: gusts are too short to matter"],
    answer: 1,
    explain: "Reef for the gusts, not the average. A boat set up for 15 knots is overpowered every time a 25-knot gust arrives, which on a charter means a frightened crew.",
  },
  {
    id: "breeze-peak",
    kind: "choice",
    prompt: "On a settled summer day in the Mediterranean, when is the sea breeze usually strongest?",
    options: ["At dawn", "Mid-morning", "Mid-afternoon", "Around midnight"],
    fixedOrder: true,
    answer: 2,
    explain: "The land heats through the day, so the onshore breeze sets in from late morning, peaks in mid-afternoon and dies around sunset.",
  },
  {
    id: "meltemi",
    kind: "choice",
    prompt: "What is the meltemi?",
    options: ["A warm south-easterly in the Adriatic", "The strong northerly summer wind of the Aegean", "A Caribbean squall", "A land breeze in the Ionian"],
    answer: 1,
    explain: "The meltemi blows from the north (north-east to north-west, depending on where you are) across the Aegean from about June to September, often force 4 to 6 and sometimes more, for days at a time.",
  },
  {
    id: "bora",
    kind: "choice",
    prompt: "A bora is forecast for tonight in Croatia. What should you expect?",
    options: ["A gentle sea breeze from the north-west", "A cold north-easterly that can arrive suddenly, with violent gusts", "Warm, humid air and a slow-building swell from the south-east", "Fog"],
    answer: 1,
    explain: "The bora falls off the mountains from the north-east, often suddenly and even under a clear sky, with gusts far above the mean. Be in a safe harbour or a bay sheltered from the north-east before evening.",
  },
  {
    id: "jugo",
    kind: "choice",
    prompt: "The jugo has been building for a day. Which harbour is the worst choice for tonight?",
    options: ["One open to the south", "One open to the north", "One sheltered on all sides", "A marina behind a breakwater facing north"],
    answer: 0,
    explain: "The jugo blows from the south-east and brings a long, heavy sea that rolls into harbours open to the south.",
  },
  {
    id: "mistral",
    kind: "choice",
    prompt: "Where does the mistral blow hardest for a charter yacht between Corsica and Sardinia?",
    options: ["In the Strait of Bonifacio", "In the Gulf of Lion only", "In the lee of Sardinia", "It never reaches the islands"],
    answer: 0,
    explain: "The wind funnels through the Strait of Bonifacio between the two islands, often a force or two stronger than out at sea.",
  },
  {
    id: "trade",
    kind: "choice",
    prompt: "In the British Virgin Islands the trade wind blows from the east. When is the best time for the beat east to the Baths?",
    options: ["Early in the day", "Late afternoon", "At night", "It makes no difference"],
    answer: 0,
    explain: "The beats east are wet and slow, so do them early, when the wind and sea are often a little lighter and the day-use moorings at the Baths are still free. Save the downwind legs west for later.",
  },
  {
    id: "thailand",
    kind: "choice",
    prompt: "When is the main sailing season around Phuket?",
    options: ["During the north-east monsoon, November to April", "During the south-west monsoon, May to October", "All year: there are no seasons", "Only in August"],
    answer: 0,
    explain: "The dry north-east monsoon brings steady, moderate winds and calm water. The south-west monsoon brings rain, squalls and swell on west-facing coasts.",
  },
  {
    id: "kerran-northerly",
    kind: "plot",
    prompt: "On the practice chart, a strong northerly is forecast tonight. Tap the place you would spend the night: the Kerran Roads anchorage, or the harbour on the far side of the island?",
    answer: HARBOUR.at,
    tolerance: 0.7,
    view: viewAround(km(8.0, 12.0), 12),
    explain: "Kerran Roads is open to the north, so a northerly blows straight in. Port Kerran, on the south side, has the whole island between it and the wind.",
  },
];

const BAY_FACING: Point8[] = POINTS;

export const PRACTICE: PracticeGenerator = {
  title: "Wind drills",
  description: "Knots to forces, directions as bearings, and which bay is sheltered. Fresh questions every time.",
  generate: (rng) => {
    const qs: Question[] = [];
    const kn = randInt(rng, 3, 45);
    qs.push({
      id: `p-force-${kn}`,
      kind: "numeric",
      prompt: `A mean wind of ${kn} knots is which Beaufort force?`,
      answer: forceFor(kn),
      tolerance: 0,
      explain: `Force ${forceFor(kn)} is ${knotsText(forceFor(kn))}: ${BEAUFORT[forceFor(kn)]!.name.toLowerCase()}. On a charter: ${BEAUFORT[forceFor(kn)]!.charter}`,
    });
    const p = pick(rng, POINTS);
    qs.push({
      id: `p-bearing-${p}`,
      kind: "bearing",
      prompt: `The forecast says ${windWord(p)}. As a bearing, which direction does the wind blow from?`,
      answer: POINT_DEG[p],
      tolerance: 5,
      explain: `A ${windWord(p)} comes from the ${POINT_WORD[p]}: ${String(POINT_DEG[p]).padStart(3, "0")}°. It blows towards the ${POINT_WORD[opposite(p)]}.`,
    });
    const wind = pick(rng, POINTS);
    // Four bays, each open to one direction: the one facing away from the wind is sheltered.
    const good = opposite(wind);
    const others = shuffle(rng, BAY_FACING.filter((b) => b !== good && b !== wind)).slice(0, 2);
    const options = [good, wind, ...others];
    qs.push({
      id: `p-bay-${wind}`,
      kind: "choice",
      prompt: `A fresh ${windWord(wind)} is forecast all night. Four bays are each open to one direction. Which is the most sheltered?`,
      options: options.map((o) => `The bay open to the ${POINT_WORD[o]}`),
      answer: 0,
      explain: `The ${windWord(wind)} blows from the ${POINT_WORD[wind]}, so the bay open to the ${POINT_WORD[good]} has land between it and the wind. The bay open to the ${POINT_WORD[wind]} is the worst.`,
    });
    qs.push(...shuffle(rng, QUESTIONS.filter((q) => q.kind === "choice")).slice(0, 2));
    return qs;
  },
};

export function Exercises({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  return <ExerciseSet courseSlug={courseSlug} lessonSlug={lessonSlug} questions={QUESTIONS} practice={PRACTICE} />;
}
