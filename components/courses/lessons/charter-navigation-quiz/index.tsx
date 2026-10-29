import Link from "next/link";
import type { LessonContent } from "@/lib/courses/types";
import { locateLesson } from "@/lib/courses/navigation/outline";
import { lessonPath } from "@/lib/courses/navigation/seo";
import { Callout, KeyIdea, Section, Table } from "../../LessonParts";
import { QUESTION_COUNT, TOPICS, questionNumbers } from "./data";
import { Exercises, Video } from "./client";

function LessonRef({ slug }: { slug: string }) {
  const loc = locateLesson(slug);
  if (!loc) return null;
  const label = `Lesson ${loc.number}: ${loc.lesson.title}`;
  return loc.lesson.published ? <Link href={lessonPath(slug)} className="font-semibold text-teal underline-offset-2 hover:underline">{label}</Link> : <span>{label}</span>;
}

/** The points each topic's questions test, for revision. */
const ESSENTIALS: Record<string, string> = {
  kit: "Use every source and check them against each other; distances on the latitude scale (one minute is one mile); depths below chart datum.",
  dst: "Time = distance ÷ speed. At six knots a mile takes ten minutes; at five, twelve.",
  bearings: "Reciprocal: add or take away 180°. Variation east, magnetic least; west, magnetic best. A transit is a free position line.",
  lateral: "Region A (Mediterranean, Seychelles, Thailand): red to port going in. Region B (Caribbean): red to starboard going in. Cans to port, cones to starboard in both. Leaving reverses it.",
  cardinal: "A cardinal is named for the side the safe water is on. Isolated danger: water all round, but keep off. Safe water: red and white stripes. Yellow: special areas such as swimming zones.",
  lights: "Fl(3) 10s is three flashes every ten seconds; Iso is equal light and dark; Oc is mostly light. Plan to arrive by daylight.",
  pilotage: "Plan the approach before you arrive. A clearing bearing is a limit: on the wrong side, turn away. Lazy lines go to the bow.",
  anchoring: "At least four times the depth in chain, more in wind. Anchor on sand, not seagrass. Transits and the anchor alarm show dragging.",
  rules: "Power gives way to sail in open water; port tack gives way to starboard; the overtaking boat keeps clear; five short blasts means wake up.",
  weather: "Meltemi: Aegean summer northerly. Bora: gusty Adriatic north-easterly, sometimes from a clear sky. Force 4 is 11 to 16 knots; gusts are higher.",
  plan: "Course over the ground is where you are going. Check routes zoomed in. Channel 16 for distress, safety and calling. Thursday night within an easy half day of the base.",
};

function Body() {
  return (
    <>
      <Section id="about" title="About the final check">
        <p>
          You have reached the end of Navigation for charter skippers. This last lesson is a single set of {QUESTION_COUNT} questions
          across the whole course, in the order the lessons teach it: the chart and the sums, bearings, the marks in both buoyage
          regions, lights, harbours, anchoring, the rules of the road, the weather, and the plotter and the week&apos;s plan.
        </p>
        <ul>
          <li><strong>Marked as you go.</strong> Each answer is checked straight away. Get one wrong and you have a second try; after that the answer and a short explanation are shown.</li>
          <li><strong>Mixed kinds.</strong> Most are multiple choice; some are sums (have a pencil and paper handy) and one asks you to find something on the practice chart.</li>
          <li><strong>The pass mark is 70%.</strong> Reach it and the course is marked complete in this browser. Reset and try again whenever you like.</li>
          <li><strong>Practice more.</strong> Under the set, a quick-fire practice gives fresh buoyage and day-sum questions every time.</li>
        </ul>
        <Callout kind="tip" title="Before you start">
          <p>Do it in one sitting if you can, in about half an hour, without looking back at the notes. Then use the table below to see where to go back to.</p>
        </Callout>
      </Section>

      <Section id="revise" title="Using your result: what to revise">
        <p>
          The score matters less than the pattern. Two wrong answers in the same topic tell you which lesson to go back to. The
          table gives the question numbers for each topic and the lesson that teaches it.
        </p>
        <Table
          head={["Topic", "Questions", "Revise in"]}
          rows={TOPICS.map((tp) => {
            const nums = questionNumbers(tp.id);
            return [
              <strong key="t">{tp.title}</strong>,
              <span key="n" className="tabular-nums">{nums[0]}–{nums[nums.length - 1]}</span>,
              <span key="l" className="flex flex-col gap-0.5">{tp.lessons.map((s) => <LessonRef key={s} slug={s} />)}</span>,
            ];
          })}
        />
        <ol>
          <li><strong>Read every explanation,</strong> including the ones you got right first time. Make sure you got there for the right reason.</li>
          <li><strong>Sort the mistakes.</strong> A slip (a sum, port for starboard) needs a habit: say it out loud, write it down. A gap needs the lesson again.</li>
          <li><strong>Go back to the weakest topic first.</strong> Watch the lesson&apos;s video, reread its notes and do its exercises until they feel easy.</li>
          <li><strong>Take the check again</strong> a day or two later. One good score can be luck; two is knowledge.</li>
        </ol>
        <KeyIdea>The score tells you where you are. The explanations, and the lessons behind them, tell you how to get better.</KeyIdea>
      </Section>

      <Section id="essentials" title="The essentials, topic by topic">
        <p>A one-line reminder of what each part of the check is testing. If any line surprises you, that is the lesson to read again.</p>
        <Table head={["Topic", "What to know"]} rows={TOPICS.map((tp) => [<strong key="t">{tp.title}</strong>, ESSENTIALS[tp.id] ?? ""])} />
        <Callout kind="warning" title="The one that catches charter skippers out">
          <p>
            Buoyage swaps between the regions. In the Mediterranean, the Seychelles and Thailand (Region A), red marks are to port
            going in. In the British Virgin Islands and the rest of the Caribbean (Region B), red marks are to starboard going in.
            If you charter in both, say it out loud on the way in: <em>red right returning</em> in the Caribbean, <em>red to port</em> everywhere else we sail.
          </p>
        </Callout>
      </Section>

      <Section id="next" title="Before your charter">
        <p>
          Take what you have learned to the check-in briefing. Ask how old the plotter&apos;s charts are, how the depth sounder is set,
          where the man overboard button and the radio&apos;s distress button are, what time the base wants the boat back on Friday,
          and what the forecast holds for the week. Then plan the first day with the chart and the pilot book open.
        </p>
        <Callout kind="remember" title="What this course is, and is not">
          <p>
            This course and its final check are free training material by Nautical Nomads. They are not accredited by the RYA or any
            other body and do not lead to a qualification. Charter companies and the countries you sail in set their own
            requirements for skippers, such as a recognised sailing licence and a radio certificate. The Isle of Kerran practice chart
            is fictional: never use it, or any part of this course, to navigate a real boat.
          </p>
        </Callout>
      </Section>
    </>
  );
}

const lesson: LessonContent = {
  objectives: [
    "Check what you know across every lesson of the course in one set of forty questions",
    "Spot the topics where your answers are weakest",
    "Know which lesson to go back to for each topic, and how to revise it",
    "Go into the charter briefing knowing the questions to ask",
  ],
  keyTerms: [
    { term: "Region A", definition: "Buoyage in Europe, the Mediterranean, Africa, most of Asia and Australasia, including the Seychelles and Thailand: red to port going in." },
    { term: "Region B", definition: "Buoyage in the Americas, including the Caribbean, and parts of Asia: red to starboard going in." },
    { term: "Cardinal mark", definition: "A yellow and black mark named for the side of it where the safe water lies." },
    { term: "Clearing bearing", definition: "A bearing of a landmark that keeps you clear of a danger as long as it stays on the safe side of a limit." },
    { term: "Scope", definition: "The length of anchor chain let out compared with the depth of water." },
    { term: "Course over the ground", definition: "The direction you are actually moving, including current and leeway." },
    { term: "Pass mark", definition: "The score, 70% here, at which the check marks the course complete." },
  ],
  Body,
  Video,
  Exercises,
};

export default lesson;
