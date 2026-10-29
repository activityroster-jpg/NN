"use client";

import { Anchor, BookOpen, CalendarDays, CircleCheck, CircleX, Compass, Eye, Map, PenLine, RotateCcw, Ship, Wind } from "lucide-react";
import { viewAround } from "@/lib/courses/navigation/chart-geometry";
import { feature, km } from "@/lib/courses/navigation/practice-chart";
import { pick, randInt } from "@/lib/courses/random";
import { ExerciseSet, type PracticeGenerator, type Question } from "../../Exercises";
import LessonPlayer, { SceneTitle, Stage, fade, type Scene } from "../../LessonPlayer";
import { IalaMark } from "../../marks";
import { ART, Card, Lines, SceneIcon, Yacht } from "../../scene-art";
import { QUESTION_COUNT, TOPICS } from "./data";
import { charterNavigationQuiz as SCRIPT } from "./script";

/** Show an element from narration sentence `from` onwards. */
const on = (sentence: number, from: number) => (sentence >= from ? 1 : 0);
/** Pair a scripted scene with its visual. */
const scene = (i: number, render: Scene["render"]): Scene => ({ ...SCRIPT.scenes[i]!, render });

/** A can-shaped (port-hand shape) or conical (starboard-hand shape) lateral buoy, in any colour. */
function Lateral({ x, y, shape, colour }: { x: number; y: number; shape: "can" | "cone"; colour: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-70 40 Q 0 70 70 40 L 60 70 Q 0 95 -60 70 Z" fill="#334155" />
      {shape === "can" ? (
        <rect x={-45} y={-110} width={90} height={150} rx={6} fill={colour} stroke="#0b1929" strokeWidth={3} />
      ) : (
        <path d="M0 -130 L 52 40 L -52 40 Z" fill={colour} stroke="#0b1929" strokeWidth={3} />
      )}
    </g>
  );
}

const RED = "#d9342b";
const SHORT: Record<string, string> = {
  kit: "Chart", dst: "Sums", bearings: "Bearings", lateral: "Lateral", cardinal: "Cardinal", lights: "Lights",
  pilotage: "Pilotage", anchoring: "Anchoring", rules: "Rules", weather: "Weather", plan: "Plan",
};
const GREEN = "#1f9d55";

export const SCENES: Scene[] = [
  // Sentences: 0 intro, 1 forty questions, 2 not an exam, 3 what to read again, 4 half an hour.
  scene(0, (t, n) => (
    <Stage>
      <path d="M0 660 Q 400 620 800 660 T 1600 660 V900 H0 Z" fill="#123a5a" />
      <Yacht x={1240} y={640} heading={80} scale={1.3} />
      <text x={800} y={250} textAnchor="middle" fontSize={88} fontWeight={800} fill="#fff" opacity={fade(t, 0, 0.12)}>The final check</text>
      <text x={800} y={330} textAnchor="middle" fontSize={42} fill={ART.tealBright} opacity={fade(t, 0.08, 0.2)}>Navigation for charter skippers · Lesson 13</text>
      <g opacity={on(n, 1)}>
        <text x={800} y={470} textAnchor="middle" fontSize={140} fontWeight={800} fill={ART.amber}>{QUESTION_COUNT}</text>
        <text x={800} y={530} textAnchor="middle" fontSize={40} fill="#fff">questions, the whole course</text>
      </g>
      <text x={400} y={620} textAnchor="middle" fontSize={36} fill={ART.muted} opacity={on(n, 2)}>Not an exam</text>
      <text x={400} y={670} textAnchor="middle" fontSize={36} fill={ART.muted} opacity={on(n, 4)}>About half an hour</text>
    </Stage>
  )),
  // Sentences: 0 in order, 1 chart, distance and bearings, 2 marks and lights, 3 harbours, anchoring and rules, 4 weather and plan, 5 for a charter week.
  scene(1, (t, n) => (
    <Stage>
      <SceneTitle t={t}>What it covers</SceneTitle>
      <Card x={110} y={200} w={660} h={180} icon={Map} title="Before you cast off" body="chart · distance, speed, time · bearings" titleSize={44} bodySize={28} opacity={on(n, 1)} />
      <Card x={830} y={200} w={660} h={180} icon={Compass} title="Finding your way" body="Regions A and B · cardinals · lights" titleSize={44} bodySize={28} opacity={on(n, 2)} />
      <Card x={110} y={420} w={660} h={180} icon={Anchor} title="Close to land" body="harbours · anchoring · rules of the road" titleSize={44} bodySize={28} opacity={on(n, 3)} />
      <Card x={830} y={420} w={660} h={180} icon={CalendarDays} title="The week" body="weather · the plotter · the plan" titleSize={44} bodySize={28} opacity={on(n, 4)} />
      <text x={800} y={700} textAnchor="middle" fontSize={40} fill={ART.tealBright} opacity={on(n, 5)}>Written for a charter week, not an exam room</text>
    </Stage>
  )),
  // Sentences: 0 marked at once, 1 second try, 2 answer shown, 3 sums and chart, 4 pencil, 5 reset.
  scene(2, (t, n) => {
    const state = n === 0 ? "right" : n === 1 ? "wrong" : "shown";
    return (
      <Stage>
        <SceneTitle t={t}>How it works</SceneTitle>
        <g transform="translate(120 190)">
          <rect width={820} height={520} rx={24} fill="#f8f4e8" stroke={state === "right" ? GREEN : state === "wrong" ? RED : ART.amber} strokeWidth={8} />
          <text x={50} y={90} fontSize={36} fontWeight={700} fill="#1d2731">In Region A, entering harbour,</text>
          <text x={50} y={140} fontSize={36} fontWeight={700} fill="#1d2731">a red buoy goes on your…</text>
          {["Port side", "Starboard side"].map((o, i) => {
            const right = i === 0;
            const picked = state === "wrong" ? i === 1 : i === 0;
            const fill = picked ? (state === "wrong" ? "#fde2e1" : "#dcfce7") : "#ffffff";
            return (
              <g key={o} transform={`translate(50 ${190 + i * 110})`}>
                <rect width={720} height={88} rx={14} fill={fill} stroke="#cbd5e1" strokeWidth={3} />
                <text x={30} y={58} fontSize={38} fill="#1d2731">{o}</text>
                {picked && <SceneIcon icon={right ? CircleCheck : CircleX} x={670} y={44} size={48} colour={right ? GREEN : RED} />}
              </g>
            );
          })}
          {state === "wrong" && <text x={50} y={470} fontSize={34} fontWeight={700} fill={RED}>Not quite: try again</text>}
          {state === "shown" && <text x={50} y={470} fontSize={32} fill="#1d2731">Red to port going in, in Region A.</text>}
        </g>
        <Card x={1010} y={220} w={500} h={120} icon={PenLine} title="Sums" body="pencil and paper" titleSize={40} bodySize={28} opacity={on(n, 3)} />
        <Card x={1010} y={360} w={500} h={120} icon={Map} title="The chart" body="tap to answer" titleSize={40} bodySize={28} opacity={on(n, 3)} />
        <Card x={1010} y={500} w={500} h={120} icon={RotateCcw} title="Reset" body="start again any time" titleSize={40} bodySize={28} opacity={on(n, 5)} />
      </Stage>
    );
  }),
  // Sentences: 0 seventy percent, 1 the pattern, 2 two wrong on a topic, 3 the table, 4 revise and retake, 5 not a failure.
  scene(3, (t, n) => {
    const scores = [1, 1, 1, 0.6, 1, 1, 0.67, 1, 0.75, 1, 0.75];
    return (
      <Stage>
        <SceneTitle t={t}>Reading your result</SceneTitle>
        <g opacity={on(n, 0)}>
          <rect x={120} y={190} width={1360} height={50} rx={25} fill="rgba(255,255,255,0.1)" />
          <rect x={120} y={190} width={1360 * 0.82} height={50} rx={25} fill={ART.tealBright} />
          <line x1={120 + 1360 * 0.7} y1={176} x2={120 + 1360 * 0.7} y2={254} stroke={ART.amber} strokeWidth={6} />
          <text x={120 + 1360 * 0.7} y={290} textAnchor="middle" fontSize={30} fill={ART.amber}>70 percent: complete</text>
        </g>
        {n >= 1 && TOPICS.map((tp, i) => {
          const s = scores[i] ?? 1;
          const weak = s < 0.65 && n >= 2;
          const x = 140 + i * 125;
          return (
            <g key={tp.id}>
              <rect x={x} y={590 - s * 260} width={90} height={s * 260} rx={8} fill={weak ? "#f87171" : "rgba(43,179,192,0.7)"} />
              <text x={x + 45} y={625} textAnchor="middle" fontSize={22} fill={weak ? "#fca5a5" : ART.muted}>{SHORT[tp.id] ?? tp.id}</text>
            </g>
          );
        })}
        {n >= 2 && <text x={800} y={690} textAnchor="middle" fontSize={36} fontWeight={700} fill="#fca5a5">Two wrong on lateral marks: go back to that lesson</text>}
        {n >= 4 && (
          <g>
            <SceneIcon icon={BookOpen} x={540} y={735} size={44} colour={ART.tealBright} />
            <text x={580} y={748} fontSize={34} fill={ART.tealBright}>Read · practise · try again</text>
          </g>
        )}
      </Stage>
    );
  }),
  // Sentences: 0 intro, 1 Region A, 2 Region B, 3 cardinal, 4 course over the ground, 5 believe your eyes, 6 Mayday.
  scene(4, (t, n) => (
    <Stage>
      <SceneTitle t={t}>The ones that matter most</SceneTitle>
      {n >= 1 && n <= 2 && (
        <g>
          <g opacity={on(n, 1)}>
            <text x={420} y={250} textAnchor="middle" fontSize={44} fontWeight={800} fill="#fff">Region A</text>
            <text x={420} y={300} textAnchor="middle" fontSize={30} fill={ART.muted}>Mediterranean, Seychelles, Thailand</text>
            <Lateral x={260} y={490} shape="can" colour={RED} />
            <Lateral x={580} y={490} shape="cone" colour={GREEN} />
            <path d="M420 680 L 420 570" stroke="#fff" strokeWidth={6} />
            <path d="M400 595 L420 570 L440 595" stroke="#fff" strokeWidth={6} fill="none" />
            <text x={420} y={730} textAnchor="middle" fontSize={30} fill="#fff">Going in: red to port</text>
          </g>
          <g opacity={on(n, 2)}>
            <text x={1180} y={250} textAnchor="middle" fontSize={44} fontWeight={800} fill="#fff">Region B</text>
            <text x={1180} y={300} textAnchor="middle" fontSize={30} fill={ART.muted}>Caribbean and the Americas</text>
            <Lateral x={1020} y={490} shape="can" colour={GREEN} />
            <Lateral x={1340} y={490} shape="cone" colour={RED} />
            <path d="M1180 680 L 1180 570" stroke="#fff" strokeWidth={6} />
            <path d="M1160 595 L1180 570 L1200 595" stroke="#fff" strokeWidth={6} fill="none" />
            <text x={1180} y={730} textAnchor="middle" fontSize={30} fill="#fff">Going in: red to starboard</text>
          </g>
        </g>
      )}
      {n === 0 && <Lines x={800} y={460} lines={["Five things to get right", "every time"]} size={60} weight={800} anchor="middle" />}
      {n === 3 && (
        <g>
          <IalaMark type="north" x={560} y={620} scale={2.4} />
          <Lines x={820} y={420} lines={["North cardinal:", "safe water", "to the north"]} size={56} weight={800} />
        </g>
      )}
      {n === 4 && (
        <g>
          <Yacht x={500} y={540} heading={90} scale={1} />
          <line x1={500} y1={540} x2={1100} y2={540} stroke="#e5e7eb" strokeWidth={5} strokeDasharray="16 12" />
          <line x1={500} y1={540} x2={1080} y2={690} stroke={ART.amber} strokeWidth={8} />
          <text x={1120} y={548} fontSize={34} fill="#e5e7eb">Heading</text>
          <text x={1100} y={720} fontSize={34} fill={ART.amber} fontWeight={700}>Where you really go</text>
        </g>
      )}
      {n === 5 && (
        <g>
          <SceneIcon icon={Eye} x={800} y={440} size={160} colour={ART.tealBright} />
          <text x={800} y={620} textAnchor="middle" fontSize={50} fontWeight={800} fill="#fff">Screen and eyes disagree? Slow down.</text>
        </g>
      )}
      {n >= 6 && (
        <g>
          <SceneIcon icon={Ship} x={800} y={420} size={140} colour="#fca5a5" />
          <text x={800} y={600} textAnchor="middle" fontSize={54} fontWeight={800} fill="#fca5a5">Mayday: grave and immediate danger only</text>
        </g>
      )}
    </Stage>
  )),
  // Sentences: 0 time on the water, 1 not a qualification, 2 the briefing, 3 come back any time, 4 good luck.
  scene(5, (t, n) => (
    <Stage>
      <path d="M0 640 Q 400 600 800 640 T 1600 640 V900 H0 Z" fill="#123a5a" />
      <path d="M0 700 Q 400 670 800 700 T 1600 700 V900 H0 Z" fill="#0f3049" />
      <Yacht x={200 + t * 1100} y={600} heading={90} scale={1.6} />
      <SceneTitle t={t}>Before the briefing</SceneTitle>
      <g opacity={on(n, 1)}>
        <SceneIcon icon={Wind} x={300} y={300} size={56} colour={ART.tealBright} />
        <text x={360} y={316} fontSize={40} fill="#fff">Free training, not a qualification</text>
      </g>
      <g opacity={on(n, 2)}>
        <SceneIcon icon={CircleCheck} x={300} y={400} size={56} colour={ART.tealBright} />
        <text x={360} y={416} fontSize={40} fill="#fff">Ask the base your questions</text>
      </g>
      <text x={800} y={540} textAnchor="middle" fontSize={64} fontWeight={800} fill={ART.amber} opacity={on(n, 4)}>Fair winds</text>
    </Stage>
  )),
];

export function Video() {
  return <LessonPlayer slug={SCRIPT.slug} title="The charter navigation quiz" scenes={SCENES} speak={SCRIPT.speak} />;
}

/* ------------------------------------------------------------------ */
/* The forty questions                                                 */
/* ------------------------------------------------------------------ */

const WRECK = feature("wreck");

const ALL: Question[] = [
  // The kit and the chart
  {
    id: "sounder", kind: "choice",
    prompt: "Coming into a bay, the plotter's chart shows 8 metres but the depth sounder reads 3 metres and falling. What do you do?",
    options: ["Believe the sounder: slow down and turn back towards deeper water", "Believe the plotter: the sounder must be wrong", "Speed up to get through the shallow patch", "Switch the sounder off"],
    answer: 0,
    explain: "The sounder measures the water under you now; the chart may be old or the plotter zoomed out. When two sources disagree, slow down and trust the one measuring the real world.",
  },
  {
    id: "distance-scale", kind: "choice",
    prompt: "Where on a chart do you measure a distance in nautical miles?",
    options: ["On the latitude scale at the side, level with where you are measuring", "On the longitude scale along the top or bottom", "On the compass rose", "Anywhere along the border"],
    answer: 0,
    explain: "One minute of latitude is one nautical mile. The latitude scale runs up the sides of the chart; the longitude scale does not give miles, because meridians get closer together away from the equator.",
  },
  {
    id: "chart-depth", kind: "choice",
    prompt: "A sounding on the chart reads 4. What does it tell you?",
    options: [
      "About 4 metres below chart datum, close to the lowest tide: there is normally at least that much water",
      "The water is always exactly 4 metres deep",
      "4 fathoms at high water",
      "The rock is 4 metres high",
    ],
    answer: 0,
    explain: "Modern charts give depths in metres below chart datum, which is close to the lowest tide. In the Mediterranean the tide is tiny, so the charted depth is close to what you get; in tidal waters there is usually more.",
  },
  {
    id: "tap-wreck", kind: "plot",
    prompt: "On the practice chart, tap the wreck.",
    answer: WRECK.at,
    tolerance: 0.5,
    view: viewAround(km(3.5, 15.0), 14),
    explain: `The wreck is off the south-west of the island, with ${WRECK.depth} m over it at chart datum. Wrecks snag anchors and lines: keep well clear.`,
  },
  // Distance, speed and time
  {
    id: "dst-hours", kind: "numeric",
    prompt: "A day's passage is 18 miles and you expect to average 6 knots. How many hours will it take?",
    answer: 3, tolerance: 0.05, unit: "hours",
    explain: "Time = distance ÷ speed: 18 ÷ 6 = 3 hours.",
  },
  {
    id: "dst-arrive", kind: "time",
    prompt: "You leave at 1000 for a bay 14 miles away, averaging 6 knots. What time do you arrive? (24-hour clock)",
    answer: 12 * 60 + 20, tolerance: 5,
    explain: "At 6 knots a mile takes 10 minutes, so 14 miles takes 140 minutes, which is 2 hours 20. 1000 plus 2 hours 20 is 1220.",
  },
  {
    id: "dst-speed", kind: "numeric",
    prompt: "You covered 10 miles in 2 hours. What was your average speed, in knots?",
    answer: 5, tolerance: 0.05, unit: "knots",
    explain: "Speed = distance ÷ time: 10 ÷ 2 = 5 knots. A knot is one nautical mile an hour.",
  },
  // Bearings and the compass
  {
    id: "reciprocal", kind: "bearing",
    prompt: "You are on a bearing of 060° from a headland. What is the bearing of the headland from you?",
    answer: 240, tolerance: 1,
    explain: "The reciprocal: add or take away 180°. 060° + 180° = 240°.",
  },
  {
    id: "true-magnetic", kind: "bearing", suffix: "M",
    prompt: "The chart gives a course of 120° true. The variation is 4° east. What is the magnetic course to steer by the compass?",
    answer: 116, tolerance: 0.5,
    explain: "Variation east, magnetic least: take easterly variation away going from true to magnetic. 120°T − 4° = 116°M.",
  },
  {
    id: "transit", kind: "choice",
    prompt: "A church tower and a lighthouse come into line, one behind the other. What does that tell you?",
    options: ["You are somewhere on the line through the two of them", "You are exactly halfway between them", "You are north of both", "Nothing: transits only work at night"],
    answer: 0,
    explain: "A transit is a position line you can see without any instrument, and it needs no compass correction. Two transits, or a transit and a bearing, give a fix.",
  },
  // Lateral marks
  {
    id: "region-a-red", kind: "choice",
    prompt: "Sailing in Croatia (IALA Region A), you enter a harbour between a red can-shaped buoy and a green conical one. Which side should the red buoy be?",
    options: ["On your port (left) side", "On your starboard (right) side", "Dead ahead", "It does not matter"],
    answer: 0,
    explain: "Region A, which covers Europe, the Mediterranean, the Seychelles and Thailand: going in, red to port and green to starboard.",
  },
  {
    id: "region-b-red", kind: "choice",
    prompt: "In the British Virgin Islands (IALA Region B), you are returning into Road Harbour. Where do the red marks go?",
    options: ["On your starboard (right) side: red right returning", "On your port (left) side, as in the Mediterranean", "Ahead of you", "Behind you"],
    answer: 0,
    explain: "Region B, which covers the Americas and the Caribbean, swaps the colours: going in, red to starboard and green to port. The shapes stay the same: cans to port, cones to starboard.",
  },
  {
    id: "which-b", kind: "choice",
    prompt: "Which of these charter areas uses IALA Region B buoyage?",
    options: ["The British Virgin Islands", "The Seychelles", "Phuket, Thailand", "The Greek islands"],
    answer: 0,
    explain: "The Caribbean, including the BVI, is Region B. The Mediterranean, the Seychelles and Thailand are all Region A.",
  },
  {
    id: "b-port-mark", kind: "choice",
    prompt: "In Region B, what does a port-hand lateral mark look like?",
    options: ["Green and can-shaped", "Red and can-shaped", "Green and conical", "Yellow with an X"],
    answer: 0,
    explain: "Only the colours swap between the regions. A port-hand mark is can-shaped in both; in Region B it is green (and any light is green), in Region A red.",
  },
  {
    id: "leaving-green", kind: "choice",
    prompt: "Leaving a harbour in the Mediterranean (Region A), which side should the green conical buoys be?",
    options: ["On your port (left) side", "On your starboard (right) side", "Either side", "Directly ahead"],
    answer: 0,
    explain: "Going in, green is to starboard in Region A, so coming out it is the other way round: green to port, red to starboard.",
  },
  // Cardinal and other marks
  {
    id: "north-cardinal", kind: "choice",
    prompt: "You see a north cardinal mark: black over yellow, two cones pointing up. Where is the safe water?",
    options: ["To the north of the mark", "To the south of the mark", "All round it", "Only to the east"],
    answer: 0,
    explain: "A cardinal mark is named for the side the safe water is on. Pass north of a north cardinal; the danger is to its south.",
  },
  {
    id: "south-cardinal", kind: "choice",
    prompt: "A buoy is yellow over black, with two cones pointing down. What is it, and which side do you pass?",
    options: ["A south cardinal: pass to the south of it", "A north cardinal: pass to the north of it", "A west cardinal: pass to the west of it", "An isolated danger: pass close by"],
    answer: 0,
    explain: "Cones pointing down, black at the bottom: a south cardinal. Its light, if it has one, is six quick flashes followed by a long flash.",
  },
  {
    id: "isolated-danger", kind: "choice",
    prompt: "A beacon is black with a red band, topped with two black balls. What does it mark?",
    options: ["An isolated danger, such as a single rock, with navigable water all round: give it a good berth", "A safe place to anchor", "The middle of a channel", "A swimming area"],
    answer: 0,
    explain: "An isolated danger mark stands on or over a small danger. There is water all round, but do not pass close: the danger is right under the mark.",
  },
  {
    id: "safe-water", kind: "choice",
    prompt: "A buoy has red and white vertical stripes and a single red ball on top. What is it?",
    options: ["A safe water mark: navigable water all round, often at the start of an approach", "A port-hand mark", "An isolated danger", "A wreck mark"],
    answer: 0,
    explain: "The safe water mark often marks the landfall or the start of a buoyed channel. Set your waypoint a little way off it rather than on it.",
  },
  {
    id: "special-mark", kind: "choice",
    prompt: "Off a Mediterranean beach there is a line of small yellow buoys, and a bigger yellow buoy with a yellow X on top. What are they?",
    options: ["Special marks, often bounding a swimming area: keep out", "Starboard-hand marks", "Mooring buoys for yachts", "Cardinal marks"],
    answer: 0,
    explain: "Yellow special marks show a special area or feature: swimming zones, outfalls, cables or exercise areas. In summer many beaches are fenced off for swimmers this way.",
  },
  // Lights at night
  {
    id: "fl3", kind: "choice",
    prompt: "A lighthouse on the chart is marked Fl(3) 10s. What will you see?",
    options: ["Three flashes in a group, the group repeating every 10 seconds", "A flash every 3 seconds for 10 seconds", "Ten flashes every 3 seconds", "A steady light visible for 10 miles"],
    answer: 0,
    explain: "Fl(3) is a group of three flashes; 10s is the period, from the start of one group to the start of the next. Count it with a stopwatch to identify the light.",
  },
  {
    id: "iso", kind: "choice",
    prompt: "What is an isophase (Iso) light?",
    options: ["Equal periods of light and dark", "Mostly light, with short eclipses", "Very quick flashes", "A light that is always on"],
    answer: 0,
    explain: "Iso: light and dark of equal length. Occulting (Oc) is mostly light with short dark periods; flashing (Fl) is mostly dark with short flashes.",
  },
  {
    id: "daylight", kind: "choice",
    prompt: "Why do charter companies tell you to be in harbour or at anchor by dark?",
    options: [
      "Unlit buoys, moorings, fishing gear and rocks are hard or impossible to see at night, and many charter agreements restrict night sailing",
      "Navigation lights do not work on charter boats",
      "Marinas lock their gates at sunset everywhere",
      "Charts are not valid at night",
    ],
    answer: 0,
    explain: "A harbour after dark is a confusing mass of lights, and a lot of what can hurt a boat is not lit at all. Plan to arrive with daylight in hand.",
  },
  // Pilotage
  {
    id: "clearing-bearing", kind: "choice",
    prompt: "Your plan says: to stay clear of a reef, keep the lighthouse bearing more than 045° magnetic. The hand-bearing compass reads 040°. What do you do?",
    options: ["You are on the danger side: turn away until the bearing is back above 045°", "Carry on: 040° is close enough", "Turn towards the lighthouse", "Stop and anchor"],
    answer: 0,
    explain: "A clearing bearing is a limit. Less than 045° is the reef side, so alter course away from the danger until the bearing is safely more than 045° again.",
  },
  {
    id: "plan-approach", kind: "choice",
    prompt: "When should you plan the approach to an unfamiliar harbour?",
    options: ["Before you get there, with the chart and the pilot book, while it is calm", "At the entrance, as you see it", "Only if the plotter fails", "After you have moored"],
    answer: 0,
    explain: "Read the pilot book's page and look at the chart before the last mile: the marks, the dangers, where to berth, and whether to call ahead. At the entrance you should be looking out, not reading.",
  },
  {
    id: "lazy-line", kind: "choice",
    prompt: "You are reversing stern-to onto a town quay with lazy lines. What do you do with the lazy line?",
    options: [
      "Pick it up from the quay with a boathook, walk it forward and make it fast at the bow",
      "Tie it to the stern next to the mooring lines",
      "Drop it in the water behind the boat",
      "Wrap it round the propeller shaft",
    ],
    answer: 0,
    explain: "The lazy line runs from the quay to a heavy mooring out in the harbour. Walk it forward, pull it tight and cleat it at the bow; keep it clear of the propeller while you do.",
  },
  // Anchoring
  {
    id: "scope", kind: "numeric",
    prompt: "Using the rule of thumb of at least four times the depth in chain, how many metres of chain should you let out in 6 metres of water?",
    answer: 24, tolerance: 0, unit: "metres",
    explain: "4 × 6 = 24 metres at least. Let out more in a strong wind or poor holding, and check your swinging room.",
  },
  {
    id: "seagrass", kind: "choice",
    prompt: "In the clear water of a Mediterranean bay, where should you drop the anchor?",
    options: ["On a pale patch of sand, not on the dark seagrass meadows", "On the dark patches: they are thick mud", "On the rocks, for the best grip", "Anywhere"],
    answer: 0,
    explain: "The dark patches are usually seagrass (Posidonia), which is protected in many places and holds an anchor badly. Pale water is sand: better for the seabed and for your night's sleep.",
  },
  {
    id: "dragging", kind: "choice",
    prompt: "At anchor, how can you tell the anchor is dragging?",
    options: [
      "Your transits and bearings on shore change, and the plotter's anchor alarm goes off",
      "The boat swings round with the wind",
      "The chain makes a noise",
      "The depth stays the same",
    ],
    answer: 0,
    explain: "Every boat swings at anchor. Dragging shows as a steady move in one direction: pick two objects in line ashore when you anchor, and set the anchor alarm.",
  },
  // Rules of the road
  {
    id: "power-sail", kind: "choice",
    prompt: "In open water you are under sail, and a motor cruiser is crossing ahead from your side. Normally, who keeps out of the way?",
    options: ["The motor cruiser: power gives way to sail in open water", "You: sail always gives way", "Whoever is bigger", "Whoever is faster"],
    answer: 0,
    explain: "Power gives way to sail, with important exceptions: an overtaking boat keeps clear, and in a narrow channel a sailing boat must not get in the way of a ship that can only navigate in it. If they do not give way, you must act to avoid a collision.",
  },
  {
    id: "port-tack", kind: "choice",
    prompt: "Two yachts under sail are converging, with the wind on different sides. Which one gives way?",
    options: ["The one with the wind on its port side (on port tack)", "The one with the wind on its starboard side", "The bigger one", "The one to windward"],
    answer: 0,
    explain: "Port tack gives way to starboard tack. When both have the wind on the same side, the boat to windward gives way.",
  },
  {
    id: "overtaking", kind: "choice",
    prompt: "Under sail, you are catching up and overtaking a slower yacht that is motoring. Who keeps clear?",
    options: ["You, the overtaking boat, even under sail", "The motoring yacht, because you are under sail", "Neither", "Whoever is on port tack"],
    answer: 0,
    explain: "An overtaking vessel keeps out of the way of the one it is overtaking, whatever their types. That rule comes before power-gives-way-to-sail.",
  },
  {
    id: "five-blasts", kind: "choice",
    prompt: "A ferry approaching you sounds five or more short, rapid blasts. What does it mean?",
    options: ["I do not understand what you are doing, or doubt you are doing enough to avoid me", "I am turning to starboard", "I am going astern", "Welcome to the harbour"],
    answer: 0,
    explain: "Five or more short blasts is the doubt or wake-up signal. Act now, clearly and early: usually a big turn to starboard, or stop. One short blast means turning to starboard, two to port, three going astern.",
  },
  // Weather
  {
    id: "meltemi", kind: "choice",
    prompt: "What is the meltemi?",
    options: [
      "A strong summer northerly in the Aegean, at its strongest in July and August and often in the afternoon",
      "A warm, wet south-easterly in the Adriatic",
      "A cold north-westerly down the Rhône valley",
      "The Caribbean trade wind",
    ],
    answer: 0,
    explain: "The meltemi can blow force 6 or more for days at a time in high summer. The south-easterly is the sirocco (jugo in Croatia); the north-westerly down the Rhône is the mistral.",
  },
  {
    id: "bora", kind: "choice",
    prompt: "What makes the bora (bura) in the Adriatic dangerous for charter boats?",
    options: [
      "It is a cold, very gusty north-easterly off the mountains that can arrive quickly, even under clear skies",
      "It brings thick fog",
      "It only blows in winter",
      "It is a gentle sea breeze",
    ],
    answer: 0,
    explain: "Bora gusts can be violent and arrive with little warning. Shelter on the mainland side of the islands, or stay in a harbour protected from the north-east, when one is forecast.",
  },
  {
    id: "beaufort", kind: "choice",
    prompt: "The forecast says force 4. Roughly what wind speed is that?",
    options: ["11 to 16 knots", "1 to 3 knots", "22 to 27 knots", "34 to 40 knots"],
    answer: 0,
    explain: "Force 4 is a moderate breeze of 11 to 16 knots: good sailing. Force 6 is 22 to 27 knots, a strong breeze and a hard day for a holiday crew. Gusts are higher than the forecast average.",
  },
  // The plotter and the plan
  {
    id: "cog", kind: "choice",
    prompt: "The plotter shows heading 090° and course over the ground 075°. Where is the boat actually going?",
    options: ["075°: the course over the ground includes current and leeway", "090°: where the bow points", "Halfway between, about 083°", "It cannot be known"],
    answer: 0,
    explain: "The heading is where the bow points; the course over the ground is where you are really going. Here something is setting you to port of the bow.",
  },
  {
    id: "zoom", kind: "choice",
    prompt: "Why must you check a planned route on the plotter zoomed in?",
    options: ["Zoomed out, plotters leave off soundings, small rocks and even reefs", "Zoomed in uses less battery", "The route only saves when zoomed in", "It makes no difference"],
    answer: 0,
    explain: "A route that looks clear zoomed out can cross a rock that only appears when you zoom in. Follow every leg at a scale where the soundings show.",
  },
  {
    id: "marina-channel", kind: "choice",
    prompt: "You want to call a marina on the VHF for a berth. Which channel should you use?",
    options: ["The marina's channel, from the pilot book or its website", "Always channel 16, and stay on it to chat", "Any channel that is quiet", "The distress button"],
    answer: 0,
    explain: "Channel 16 is for distress, safety and calling. Marinas usually have their own working channel: say their name twice, this is, your boat's name twice, over.",
  },
  {
    id: "friday", kind: "choice",
    prompt: "Our cruising guides all end back at the base marina on Friday evening. Where should you aim to be on Thursday night?",
    options: ["Within an easy half day of the base, in case Friday is windy", "As far from the base as possible", "Anywhere: you can motor all night", "In the base already, every time"],
    answer: 0,
    explain: "A short last leg leaves room for a windy morning and the Friday fuel queue. If the weather stops you, call the base early; never sail into bad weather to make the deadline.",
  },
];

const TOPIC_OF: Record<string, string> = Object.fromEntries(TOPICS.flatMap((tp) => tp.ids.map((id) => [id, tp.title])));

function tagged(q: Question): Question {
  return {
    ...q,
    prompt: (
      <>
        <span className="mb-1 block text-xs font-semibold tracking-wide text-teal uppercase">{TOPIC_OF[q.id]}</span>
        {q.prompt}
      </>
    ),
  };
}

export const QUESTIONS: Question[] = TOPICS.flatMap((tp) =>
  tp.ids.map((id) => {
    const q = ALL.find((x) => x.id === id);
    if (!q) throw new Error(`final check: no question ${id}`);
    return tagged(q);
  }),
);

/** Ids written above, for the test that checks every question is in a topic. */
export const QUESTION_IDS = ALL.map((q) => q.id);

const AREAS: Array<{ name: string; region: "A" | "B" }> = [
  { name: "Croatia", region: "A" }, { name: "the Greek islands", region: "A" }, { name: "Sardinia", region: "A" }, { name: "Mallorca", region: "A" },
  { name: "Turkey", region: "A" }, { name: "the Seychelles", region: "A" }, { name: "Phuket", region: "A" }, { name: "the British Virgin Islands", region: "B" },
];

export const PRACTICE: PracticeGenerator = {
  title: "Quick fire: regions and day sums",
  description: "Five fresh questions each time on the two things charter skippers do every day: read the buoys and size the day.",
  generate: (rng) => {
    const qs: Question[] = [];
    for (let i = 0; i < 3; i++) {
      const a = pick(rng, AREAS);
      const entering = rng() < 0.5;
      const colour = rng() < 0.5 ? "red" : "green";
      // Region A going in: red to port. Region B going in: red to starboard. Leaving reverses both.
      const redToPortGoingIn = a.region === "A";
      const redToPort = entering ? redToPortGoingIn : !redToPortGoingIn;
      const toPort = colour === "red" ? redToPort : !redToPort;
      qs.push({
        id: `region-${i}-${a.name}-${entering ? "in" : "out"}-${colour}`,
        kind: "choice",
        prompt: `In ${a.name} (Region ${a.region}), ${entering ? "entering" : "leaving"} a harbour, which side should the ${colour} lateral marks be?`,
        options: ["Port (left)", "Starboard (right)"],
        answer: toPort ? 0 : 1,
        fixedOrder: true,
        explain: `Region ${a.region}: going in, red to ${a.region === "A" ? "port" : "starboard"} and green to ${a.region === "A" ? "starboard" : "port"}. ${entering ? "" : "Leaving reverses it. "}So the ${colour} marks go to ${toPort ? "port" : "starboard"}.`,
      });
    }
    for (let i = 0; i < 2; i++) {
      const s = pick(rng, [5, 6]);
      const hours = randInt(rng, 2, 4);
      const d = s * hours;
      qs.push({
        id: `hours-${i}-${d}-${s}`,
        kind: "numeric",
        prompt: `A passage of ${d} miles at an average of ${s} knots: how many hours?`,
        answer: hours, tolerance: 0.05, unit: "hours",
        explain: `Time = distance ÷ speed: ${d} ÷ ${s} = ${hours} hours.`,
      });
    }
    return qs;
  },
};

export function Exercises({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  return <ExerciseSet courseSlug={courseSlug} lessonSlug={lessonSlug} questions={QUESTIONS} practice={PRACTICE} />;
}
