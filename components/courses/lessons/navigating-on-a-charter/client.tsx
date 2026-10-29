"use client";

import { BookOpen, CircleCheck, Compass, Eye, Flag, Map, MapPin, Play, Ruler, Smartphone, Tablet, Timer, TriangleAlert, Wind } from "lucide-react";
import { FULL_VIEW, viewAround } from "@/lib/courses/navigation/chart-geometry";
import { FEATURES, km } from "@/lib/courses/navigation/practice-chart";
import { shuffle } from "@/lib/courses/random";
import { ExerciseSet, type PracticeGenerator, type Question } from "../../Exercises";
import LessonPlayer, { SceneTitle, Stage, fade, phase, type Scene } from "../../LessonPlayer";
import { ART, Card, ChartBanner, ChartScene, Lines, SceneIcon, Yacht } from "../../scene-art";
import { navigatingOnACharter as SCRIPT } from "./script";

/** Show an element from narration sentence `from` onwards. */
const on = (sentence: number, from: number) => (sentence >= from ? 1 : 0);
/** Pair a scripted scene with its visual. */
const scene = (i: number, render: Scene["render"]): Scene => ({ ...SCRIPT.scenes[i]!, render });

const ISLAND_VIEW = viewAround(km(6.6, 11.5), 13, 16 / 9);

export const SCENES: Scene[] = [
  scene(0, (t) => (
    <Stage>
      <path d="M0 640 Q 400 600 800 640 T 1600 640 V900 H0 Z" fill="#123a5a" />
      <path d="M0 700 Q 400 670 800 700 T 1600 700 V900 H0 Z" fill="#0f3049" />
      <Yacht x={200 + t * 1100} y={600} heading={90} scale={1.6} />
      <text x={800} y={290} textAnchor="middle" fontSize={84} fontWeight={800} fill="#fff" opacity={fade(t, 0, 0.12)}>Navigation for charter skippers</text>
      <text x={800} y={370} textAnchor="middle" fontSize={44} fill={ART.tealBright} opacity={fade(t, 0.15, 0.3)}>Lesson 1 · What the skipper does</text>
      <text x={800} y={450} textAnchor="middle" fontSize={38} fill={ART.muted} opacity={fade(t, 0.5, 0.65)}>From Nautical Nomads</text>
    </Stage>
  )),
  // Sentences: 0 intro, 1 plotter, 2 paper chart, 3 pilot book, 4 app.
  scene(1, (t, n) => (
    <Stage>
      <SceneTitle t={t}>What is on board</SceneTitle>
      <Card x={70} y={190} w={710} h={190} icon={Map} title="Chart plotter" body="At the helm: the chart and your position" titleSize={46} bodySize={32} opacity={on(n, 1)} />
      <Card x={820} y={190} w={710} h={190} icon={Ruler} title="Paper chart" body="In the saloon: the backup that never crashes" titleSize={46} bodySize={32} opacity={on(n, 2)} />
      <Card x={70} y={410} w={710} h={190} icon={BookOpen} title="Pilot book" body="A page for every harbour and bay" titleSize={46} bodySize={32} opacity={on(n, 3)} />
      <Card x={820} y={410} w={710} h={190} icon={Tablet} title="Tablet or phone" body="A charting app, as a second opinion" titleSize={46} bodySize={32} opacity={on(n, 4)} accent={ART.amber} />
    </Stage>
  )),
  // Sentences: 0 intro, 1 plan, 2 track, 3 arrive.
  scene(2, (t, n) => (
    <Stage>
      <SceneTitle t={t}>Three jobs</SceneTitle>
      {[
        { icon: Flag, title: "Plan", body: "before you leave" },
        { icon: MapPin, title: "Track", body: "on the way" },
        { icon: CircleCheck, title: "Arrive", body: "safely, into the berth" },
      ].map((s, i) => (
        <g key={s.title} opacity={on(n, i + 1)}>
          <circle cx={360 + i * 440} cy={420} r={105} fill="rgba(43,179,192,0.15)" stroke={ART.tealBright} strokeWidth={4} />
          <SceneIcon icon={s.icon} x={360 + i * 440} y={420} size={90} />
          <Lines x={360 + i * 440} y={600} lines={[s.title]} size={52} weight={700} anchor="middle" />
          <Lines x={360 + i * 440} y={655} lines={[s.body]} size={34} fill={ART.muted} anchor="middle" />
        </g>
      ))}
    </Stage>
  )),
  // Sentences: 0 excellent, 1 shows, 2 can be wrong, 3 one source, 4 the others.
  scene(3, (t, n) => {
    const failed = n >= 2;
    return (
      <Stage>
        <SceneTitle t={t}>The plotter is one source, not the only one</SceneTitle>
        <g transform="translate(260 220)">
          <rect width={460} height={360} rx={28} fill="#1d2a38" stroke="#5d6f82" strokeWidth={6} />
          <rect x={30} y={30} width={400} height={260} rx={10} fill={failed ? "#2a1214" : "#0d3b52"} />
          {!failed ? (
            <>
              <path d="M60 240 Q 160 120 300 150 T 410 80" stroke={ART.tealBright} strokeWidth={6} fill="none" />
              <circle cx={230} cy={160} r={12} fill={ART.port} />
              <text x={230} y={272} textAnchor="middle" fontSize={30} fill="#fff" fontFamily="monospace">43°30.1&apos;N 16°24.8&apos;E</text>
            </>
          ) : (
            <>
              <text x={230} y={150} textAnchor="middle" fontSize={54} fontWeight={800} fill="#ff6b6b">NO FIX</text>
              <text x={230} y={210} textAnchor="middle" fontSize={36} fill="#ffb3b3">Signal lost</text>
            </>
          )}
          <text x={230} y={340} textAnchor="middle" fontSize={32} fill={ART.muted}>Chart plotter</text>
        </g>
        <g opacity={on(n, 4)}>
          {[
            { icon: Eye, label: "Your eyes" },
            { icon: Compass, label: "Depth sounder" },
            { icon: Ruler, label: "Paper chart" },
          ].map((s, i) => (
            <g key={s.label} transform={`translate(${900 + i * 220} 400)`}>
              <circle r={70} fill="rgba(43,179,192,0.15)" stroke={ART.tealBright} strokeWidth={4} />
              <SceneIcon icon={s.icon} x={0} y={0} size={60} />
              <Lines x={0} y={120} lines={[s.label]} size={30} fill="#fff" anchor="middle" />
            </g>
          ))}
        </g>
      </Stage>
    );
  }),
  scene(4, (t) => (
    <ChartScene from={FULL_VIEW} to={ISLAND_VIEW} t={phase(t, 0.2, 0.8)}>
      <ChartBanner>The practice chart: the Isle of Kerran, which does not exist</ChartBanner>
    </ChartScene>
  )),
  // Sentences: 0 intro, 1 where, 2 how long, 3 wind, 4 bolt-hole, 5 pilot book.
  scene(5, (t, n) => (
    <Stage>
      <SceneTitle t={t}>The five-minute plan</SceneTitle>
      {[
        { icon: MapPin, text: "Where are we going, and how far?" },
        { icon: Timer, text: "How long at six knots?" },
        { icon: Wind, text: "Wind and forecast?" },
        { icon: TriangleAlert, text: "Where do we stop if it goes wrong?" },
        { icon: BookOpen, text: "What does the pilot book say about getting in?" },
      ].map((s, i) => (
        <g key={s.text} opacity={on(n, i + 1)} transform={`translate(200 ${215 + i * 100})`}>
          <rect width={1200} height={82} rx={16} fill="rgba(255,255,255,0.06)" />
          <SceneIcon icon={s.icon} x={56} y={41} size={44} />
          <Lines x={110} y={56} lines={[s.text]} size={38} fill="#fff" />
        </g>
      ))}
    </Stage>
  )),
  // Sentences: 0 share, 1 helm, 2 plotter, 3 lookout, 4 swap, 5 skipper.
  scene(6, (t, n) => (
    <Stage>
      <SceneTitle t={t}>Who does what</SceneTitle>
      {[
        { icon: Compass, title: "Helm", body: "steers the course" },
        { icon: Map, title: "Navigator", body: "plotter and chart" },
        { icon: Eye, title: "Lookout", body: "boats, marks, the water" },
      ].map((s, i) => (
        <g key={s.title} opacity={on(n, i + 1)}>
          <circle cx={360 + i * 440} cy={400} r={105} fill="rgba(43,179,192,0.15)" stroke={ART.tealBright} strokeWidth={4} />
          <SceneIcon icon={s.icon} x={360 + i * 440} y={400} size={90} />
          <Lines x={360 + i * 440} y={580} lines={[s.title]} size={52} weight={700} anchor="middle" />
          <Lines x={360 + i * 440} y={635} lines={[s.body]} size={34} fill={ART.muted} anchor="middle" />
        </g>
      ))}
      <text x={800} y={760} textAnchor="middle" fontSize={40} fill={ART.muted} opacity={on(n, 4)}>Swap round, so everyone learns</text>
    </Stage>
  )),
  // Sentences: 0 intro, 1–4 one per step, 5 sign-off.
  scene(7, (t, n) => (
    <Stage>
      <SceneTitle t={t}>How each lesson works</SceneTitle>
      {[
        { icon: Play, title: "Watch", body: "the video" },
        { icon: BookOpen, title: "Read", body: "the notes" },
        { icon: Smartphone, title: "Try", body: "the tools" },
        { icon: CircleCheck, title: "Practise", body: "the exercises" },
      ].map((s, i) => (
        <g key={s.title} opacity={on(n, i + 1)}>
          <circle cx={260 + i * 360} cy={420} r={95} fill="rgba(43,179,192,0.15)" stroke={ART.tealBright} strokeWidth={4} />
          <SceneIcon icon={s.icon} x={260 + i * 360} y={420} size={84} />
          <Lines x={260 + i * 360} y={590} lines={[s.title]} size={50} weight={700} anchor="middle" />
          <Lines x={260 + i * 360} y={645} lines={[s.body]} size={34} fill={ART.muted} anchor="middle" />
        </g>
      ))}
    </Stage>
  )),
];

export function Video() {
  return <LessonPlayer slug={SCRIPT.slug} title="Navigating on a charter" scenes={SCENES} speak={SCRIPT.speak} />;
}

export const QUESTIONS: Question[] = [
  {
    id: "three-jobs",
    kind: "choice",
    prompt: "Navigating a charter comes down to three jobs. Which list is right?",
    options: ["Plan, track, arrive", "Sail, motor, anchor", "Fuel, water, food", "Check in, sail, check out"],
    answer: 0,
    explain: "Plan before you leave, keep track of where you are on the way, and bring the boat in safely on arrival. Everything in the course serves one of the three.",
  },
  {
    id: "plotter-source",
    kind: "choice",
    prompt: "The plotter shows a clear position and track. What is the right attitude to it?",
    options: ["It is always right, so the paper chart can stay in the locker", "It is one source: check it against your eyes, the depth and the chart", "It is only for motor boats", "It should be switched off under sail"],
    answer: 1,
    explain: "A screen can be wrong without looking wrong: an out-of-date chart, a wrong setting or a lost signal. Use it, and cross-check it.",
  },
  {
    id: "pilot-book",
    kind: "choice",
    prompt: "Which book has a page on each harbour and bay, with the approach, the berths and the hazards?",
    options: ["The logbook", "The pilot book", "The almanac of tides", "The charter contract"],
    answer: 1,
    explain: "The pilot book (also called a cruising guide) describes each harbour and anchorage. Reading its page before you arrive is the single most useful habit on a charter.",
  },
  {
    id: "five-minute-plan",
    kind: "choice",
    prompt: "Which of these is NOT part of the five-minute morning plan?",
    options: ["Where are we going, and how far?", "How long will it take?", "What is the forecast?", "Which film is on tonight?"],
    answer: 3,
    explain: "The plan covers the destination and distance, the time it will take, the wind and forecast, a bolt-hole if things go wrong, and what the pilot book says about the entrance.",
  },
  {
    id: "six-knots",
    kind: "choice",
    prompt: "A charter yacht typically plans a day at about…",
    options: ["Two knots", "Six knots", "Twelve knots", "Twenty knots"],
    answer: 1,
    explain: "Five to six knots is a realistic average for a cruising yacht under sail or engine. Lesson 3 shows how to turn that into arrival times.",
  },
  {
    id: "chart-shows",
    kind: "choice",
    prompt: "What does a nautical chart show that a road map does not?",
    options: ["Hotels and restaurants", "Depths, rocks, shallows, buoys and lights", "Bus routes", "Hiking trails"],
    answer: 1,
    explain: "A chart is a map of the sea: the depth of the water, the dangers under it, and the marks and lights you steer by.",
  },
  {
    id: "tap-harbour",
    kind: "plot",
    prompt: "On the practice chart, tap the harbour at Port Kerran.",
    answer: FEATURES.find((f) => f.id === "harbour")!.at,
    tolerance: 0.6,
    view: viewAround(km(6.6, 11.5), 16),
    explain: "Port Kerran is the harbour on the west side of the island, at the top of the buoyed channel. Lesson 8 takes you in.",
  },
  {
    id: "real-use",
    kind: "choice",
    prompt: "Can the Isle of Kerran practice chart be used to navigate a real boat?",
    options: ["Yes, if you are careful", "Only in daylight", "No: it is a fictional training chart", "Yes, it is an official chart"],
    answer: 2,
    explain: "Kerran does not exist. On a real charter you navigate with the current official charts on board and in the plotter.",
  },
];

const FINDABLE = FEATURES.filter((f) => f.kind !== "harbour");

export const PRACTICE: PracticeGenerator = {
  title: "Find it on the chart",
  description: "Get to know the practice chart: you will be asked to find four features. Zoom in if you need to.",
  generate: (rng) =>
    shuffle(rng, FINDABLE)
      .slice(0, 4)
      .map((f, i) => ({ id: `find-${i}-${f.id}`, kind: "plot" as const, prompt: `Tap the ${f.name.replace(/^The /, "the ")} on the chart.`, answer: f.at, tolerance: 0.45, explain: f.note })),
};

export function Exercises({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  return <ExerciseSet courseSlug={courseSlug} lessonSlug={lessonSlug} questions={QUESTIONS} practice={PRACTICE} />;
}
