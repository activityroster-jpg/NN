import type { LessonContent } from "@/lib/courses/types";
import { formatBearing } from "@/lib/courses/geo";
import { QuestionCard } from "../../Exercises";
import { Callout, Figure, Interactive, KeyIdea, Section, Table, Worked } from "../../LessonParts";
import { MARK_INFO } from "../../marks";
import { FishFarmFigure, FourMarks, MarkCards, MarkPicture, QuadrantDiagram, SafeWaterRhythms, SwimmingAreaFigure } from "./art";
import { Exercises, Video } from "./client";
import { APPROACH, CARD, CARDINALS, CHART_CARDINALS, MEW, MEW_FROM_HARBOUR, OUTFALL, miles, quadrantText } from "./data";
import { CardinalTrainer, ClockFace, MarkChartTour, MarkTrainer, QuadrantExplorer } from "./widgets";

const mono = (s: string) => <span className="whitespace-nowrap font-mono text-[0.92em]">{s}</span>;
const E_TEETH = CHART_CARDINALS.find((c) => c.id === "east-teeth")!;

function Body() {
  return (
    <>
      <Section id="quadrants" title="Marks named after the compass">
        <p>
          Lateral marks (Lesson 5) show the sides of a channel. Many dangers, though, lie out in open water: a reef off a
          headland, a shoal in the middle of a bay, a rock between two islands. <strong>Cardinal marks</strong> guard them
          using the points of the compass instead of port and starboard.
        </p>
        <p>
          Imagine four lines drawn out from the danger on the true bearings north-east, south-east, south-west and north-west.
          They split the sea round it into four <strong>quadrants</strong>: north ({quadrantText("north")}), east (
          {quadrantText("east")}), south ({quadrantText("south")}) and west ({quadrantText("west")}). A cardinal mark is placed
          in one quadrant and named after it, and <strong>the safe water is on its named side</strong>.
        </p>
        <Figure caption="The four quadrants round a danger. Each cardinal mark stands in its own quadrant, and you pass on its named side.">
          <QuadrantDiagram />
        </Figure>
        <KeyIdea>Pass north of a north cardinal, east of an east cardinal, south of a south cardinal and west of a west cardinal.</KeyIdea>
        <p>A danger may have one cardinal mark or several. Whichever you meet, never pass between it and the danger it guards.</p>
      </Section>

      <Section id="cardinals" title="The four cardinal marks">
        <p>
          Every cardinal mark is black and yellow, with a topmark of two black cones. Read the <strong>cones first</strong>:
          they are the biggest clue, and they always <strong>point to where the black is</strong> on the mark.
        </p>
        <MarkCards />
        <Table
          head={["Mark", "Cones", "Colours", "Memory aid"]}
          rows={CARDINALS.map((c) => [
            <strong key="n">{CARD[c].short}</strong>,
            CARD[c].cones,
            CARD[c].colours,
            CARD[c].aid.replace(/^./, (s) => s.toUpperCase()),
          ])}
        />
        <Interactive title="Cardinal mark trainer" instructions="Name the mark and choose which side to pass. Try it by day, by night (count the flashes) or mixed.">
          <CardinalTrainer />
        </Interactive>
      </Section>

      <Section id="lights" title="Cardinal lights: think of a clock">
        <p>
          Every cardinal light is <strong>white</strong> and flashes <strong>quick</strong> ({mono("Q")}, about once a second) or{" "}
          <strong>very quick</strong> ({mono("VQ")}, about twice a second). The number of flashes in a group follows a clock face:
        </p>
        <ul>
          <li><strong>East, at 3 o&rsquo;clock:</strong> groups of three, {mono(CARD.east.quick)} or {mono(CARD.east.veryQuick)}.</li>
          <li><strong>South, at 6:</strong> groups of six and then one long flash, {mono(CARD.south.quick)} or {mono(CARD.south.veryQuick)}.</li>
          <li><strong>West, at 9:</strong> groups of nine, {mono(CARD.west.quick)} or {mono(CARD.west.veryQuick)}.</li>
          <li><strong>North, at 12:</strong> no groups, flashing without a break, {mono("Q")} or {mono("VQ")}.</li>
        </ul>
        <p>
          The south light adds its long flash because quick flashes are hard to count from a moving boat, and six could
          easily be mistaken for three or nine.
        </p>
        <Interactive title="The clock face" instructions="Watch the four lights side by side, quick or very quick.">
          <ClockFace />
        </Interactive>
      </Section>

      <Section id="chart" title="Cardinals on the practice chart">
        <p>
          The practice chart has four cardinal marks. <strong>North Teeth</strong> and <strong>East Teeth</strong> buoys guard
          The Teeth, rocks awash east of Gull Point; <strong>South Brennan</strong> buoy guards Brennan Bank; and{" "}
          <strong>West Ledge</strong> buoy guards Head Ledge off Kerran Head.
        </p>
        <Worked
          title="Which quadrant is East Teeth buoy in?"
          steps={[
            <>Measure the bearing <em>from the danger to the mark</em>: from The Teeth to East Teeth buoy it is {formatBearing(E_TEETH.bearing, "T")}.</>,
            <>That lies between 045° and 135°T: the east quadrant.</>,
            <>So the buoy must be an east cardinal, and its light, {mono(E_TEETH.mark.light ?? "")}, agrees: three quick flashes, 3 o&rsquo;clock.</>,
            <>The safe water is to its east. Heading south past The Teeth, keep east of it, {miles(E_TEETH.distance)} miles or more from the rocks.</>,
          ]}
          answer="East quadrant, east cardinal: pass east of it."
        />
        <Interactive title="Quadrant explorer" instructions="Pick a cardinal mark, then place the yacht round it with the buttons or by tapping the chart. See which quadrant you are in and whether you are on the safe side.">
          <QuadrantExplorer />
        </Interactive>
        <Callout kind="tip" title="On a charter">
          <p>
            Cardinal marks are common wherever rocks and shoals lie off the coast, from the Dalmatian islands to the Ionian. If
            you meet one you did not expect, slow down, find it on the chart and see what it is guarding before you decide which
            way to go.
          </p>
        </Callout>
      </Section>

      <Section id="isolated" title="Isolated danger marks">
        <p>
          An <strong>isolated danger mark</strong> sits right on top of a small danger, such as a single rock, a small shoal or a
          wreck, with navigable water all round it. One mark replaces a ring of cardinals.
        </p>
        <Table
          head={["", "Isolated danger mark"]}
          rows={[
            [<strong key="c">Colours</strong>, `${MARK_INFO["isolated-danger"].colours} (bands run across)`],
            [<strong key="s">Shape</strong>, "Usually a pillar or spar buoy, or a beacon standing on the danger itself"],
            [<strong key="t">Topmark</strong>, `${MARK_INFO["isolated-danger"].topmark}, one above the other`],
            [<strong key="l">Light</strong>, <>White, flashing in groups of two: {mono("Fl(2)")}</>],
          ]}
        />
        <Callout kind="tip" title="Two balls, two flashes">
          <p>The two black balls on top go with the two white flashes at night.</p>
        </Callout>
        <p>
          &ldquo;Navigable water all round&rdquo; means you may pass on either side. It does not mean you may pass close: the
          mark shows where the danger is, not how far it spreads. You will see these beacons on rocks and shoals all over the
          Mediterranean. On the practice chart, <strong>Mew Rock beacon</strong> ({mono(MEW.light ?? "")}) stands on a rock{" "}
          {miles(MEW_FROM_HARBOUR.dist)} miles {MEW_FROM_HARBOUR.dir} of Port Kerran that is covered for much of the tide.
        </p>
        <QuestionCard
          question={{
            id: "inline-spheres",
            kind: "choice",
            prompt: "Check your understanding: ahead you see a beacon with two black balls on top. Can you pass close to it?",
            options: ["No: it is an isolated danger mark, with a danger right beneath it", "Yes: it is a safe water mark", "Yes: it is a special mark", "Only on its north side"],
            answer: 0,
            explain: "Two black balls mean an isolated danger mark. You may pass it on either side, but give it a good berth. A safe water mark has a single red ball.",
          }}
        />
      </Section>

      <Section id="safe-water" title="Safe water marks">
        <p>
          A <strong>safe water mark</strong> says there is navigable water all round it. It marks a place, not a danger: the
          seaward end of a channel, the middle of a channel, or a <strong>landfall</strong> mark to look for when arriving from
          sea. On the practice chart, <strong>Kerran Approach</strong> buoy ({mono(APPROACH.light ?? "")}) marks the start of the
          Port Kerran approach.
        </p>
        <Table
          head={["", "Safe water mark"]}
          rows={[
            [<strong key="c">Colours</strong>, `${MARK_INFO["safe-water"].colours}: the stripes run up and down`],
            [<strong key="s">Shape</strong>, MARK_INFO["safe-water"].shape],
            [<strong key="t">Topmark</strong>, `${MARK_INFO["safe-water"].topmark} (if it has one)`],
            [<strong key="l">Light</strong>, "White: isophase, occulting, one long flash every 10 seconds, or Morse A"],
          ]}
        />
        <Figure caption="Ten seconds of each safe water rhythm on the same time scale. Only the long flash has a set period; the others are examples. Lesson 7 covers every light rhythm.">
          <SafeWaterRhythms />
        </Figure>
        <Callout kind="remember" title="Balls and stripes">
          <p>
            <strong>Two black balls:</strong> isolated danger, with a danger under it. <strong>One red ball:</strong> safe water,
            no danger at all. Vertical stripes appear only on the safe water mark and the emergency wreck buoy.
          </p>
        </Callout>
      </Section>

      <Section id="special" title="Special marks: swimming areas and fish farms">
        <p>
          <strong>Special marks</strong> are yellow, with a yellow X on top if they have a topmark and a yellow light if they are
          lit. They do not show you the way; they mark an area or feature that the chart or pilot book explains. On a
          Mediterranean charter you will meet two above all.
        </p>
        <h3>Swimming areas</h3>
        <p>
          In summer, lines of small yellow buoys off a beach mark a <strong>swimming area</strong>. Keep the yacht outside the
          line, and take the tender in slowly, by the marked boat lane where there is one. Distances, speed limits and the way
          lanes are marked vary between countries and beaches, so follow local signs and the charter company&rsquo;s briefing.
        </p>
        <Figure caption="A typical swimming area: a line of yellow buoys off the beach, sometimes with a buoyed lane for boats. Not to scale.">
          <SwimmingAreaFigure />
        </Figure>
        <h3>Fish farms</h3>
        <p>
          Fish farms are common in sheltered bays in Greece, Turkey and Croatia: rows of round floating pens, with yellow special
          marks at the corners, often flashing yellow at night. The pens are held in place by mooring lines and anchors that
          spread well beyond them, so give the whole farm plenty of room, never anchor near it and never tie up to it.
        </p>
        <Figure caption="A fish farm in plan: yellow special marks at the corners, with mooring lines spreading beyond the pens. Not to scale.">
          <FishFarmFigure />
        </Figure>
        <p>
          Yellow marks can also show an outfall pipe (the <strong>Outfall</strong> buoy on the practice chart,{" "}
          {mono(OUTFALL.light ?? "")}), a cable on the seabed, a water-ski area or a racing mark. When you see yellow, look it up.
        </p>
        <Callout kind="warning" title="Anchor lights are white">
          <p>
            A cluster of yellow lights in a bay at night is a fish farm or another special area, not boats at anchor: anchor
            lights are white. Plan to arrive by daylight and you will see what the yellow marks are guarding.
          </p>
        </Callout>
      </Section>

      <Section id="wreck" title="The emergency wreck marking buoy">
        <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
          <MarkPicture type="emergency-wreck" className="mx-auto block h-auto w-full max-w-[12rem] rounded-lg" />
          <p>
            The newest mark in the system marks a <strong>new wreck</strong> that is not yet on the charts. It has{" "}
            <strong>blue and yellow vertical stripes</strong>, a <strong>yellow upright cross</strong> on top, and at night it
            flashes <strong>blue and yellow alternately</strong>. It stays until the wreck is charted and permanently marked.
            Keep well clear, and listen for navigational warnings on the radio.
          </p>
        </div>
      </Section>

      <Section id="practice" title="Putting it together">
        <Figure caption="The four marks after the cardinals, as you would see them from a boat.">
          <FourMarks />
        </Figure>
        <p>
          All the marks in this lesson are the <strong>same in Region A and Region B</strong>: only lateral marks change between
          regions, so a cardinal reads the same in Greece and in the British Virgin Islands.
        </p>
        <Interactive title="The practice chart's other marks" instructions="Zoom in on Mew Rock beacon, Kerran Approach buoy and the Outfall buoy, see each light at night and what to do.">
          <MarkChartTour />
        </Interactive>
        <Interactive title="What is it, and what do I do?" instructions="Every mark in this lesson, by day or at night: name it, then choose what to do.">
          <MarkTrainer />
        </Interactive>
        <KeyIdea>For any mark, ask two questions: what is it, and what does it tell me to do? By day read the topmark, then the colours; by night read the colour of the light, then count.</KeyIdea>
        <p>Next: lights at night, and why charter companies ask you to arrive by daylight.</p>
      </Section>
    </>
  );
}

const lesson: LessonContent = {
  objectives: [
    "Name the four cardinal marks by topmark, colours and light, and pass each on its named side",
    "Read cardinal lights with the clock face, including the south cardinal's long flash",
    "Recognise isolated danger, safe water and emergency wreck marks, and say what each asks you to do",
    "Recognise the yellow special marks round swimming areas and fish farms, and keep clear of them",
  ],
  keyTerms: [
    { term: "Cardinal mark", definition: "A black and yellow mark placed in one quadrant of a danger, with the safe water on its named side." },
    { term: "Quadrant", definition: "One quarter of the sea round a danger, bounded by the true bearings NE, SE, SW and NW from it." },
    { term: "Topmark", definition: "The shape on top of a mark: two black cones on a cardinal, which point to where the black is." },
    { term: "Q, VQ", definition: "Quick flashing (about once a second) and very quick flashing (about twice a second): the rhythms of cardinal lights." },
    { term: "Isolated danger mark", definition: "Black with a red band and two black balls; on a small danger with navigable water all round. Light white Fl(2)." },
    { term: "Safe water mark", definition: "Red and white vertical stripes and a red ball; navigable water all round, often a landfall or channel start." },
    { term: "Special mark", definition: "Yellow, with a yellow X if it has a topmark: an area or feature such as a swimming area, fish farm, cable or outfall." },
    { term: "Emergency wreck marking buoy", definition: "Blue and yellow vertical stripes, yellow upright cross, alternating blue and yellow light: a new, uncharted wreck." },
  ],
  Body,
  Video,
  Exercises,
};

export default lesson;
