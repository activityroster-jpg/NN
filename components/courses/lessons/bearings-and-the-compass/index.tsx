import type { LessonContent } from "@/lib/courses/types";
import { formatBearing, formatPosition, reciprocal } from "@/lib/courses/geo";
import { Callout, Formula, Interactive, KeyIdea, Section, Table, Worked } from "../../LessonParts";
import { Exercises, Video } from "./client";
import { DEMO_FIX, DEMO_HAT, DEMO_MAG, DEMO_TIME, DEMO_TRUE, formatHat } from "./fix";
import { VAR_TEXT, WORKED } from "./lines";
import { SPIRE_INLAND, SPIRE_TRANSIT, sixteenPoint } from "./transit";
import { CompassDial, FixBuilder, PlotterCheck, TakeABearing, TransitFigure, VariationFlip } from "./widgets";

const T = (b: number) => formatBearing(b, "T");
const M = (b: number) => formatBearing(b, "M");
const DEMO_NAMES = ["Mew Rock beacon", "the church spire", "Gull Point lighthouse"];

function Body() {
  return (
    <>
      <Section id="degrees" title="Directions in degrees">
        <p>
          A <strong>bearing</strong> is a direction, measured in degrees <strong>clockwise from north</strong>, from 000° all
          the way round to 359°. East is 090°, south is 180° and west is 270°. On a charter you use bearings for three things:
          to say where something is (“the harbour entrance bears 045°”), to check where you are, and to stay clear of
          danger on the way into a harbour (Lesson 8).
        </p>
        <ul>
          <li><strong>Always three figures.</strong> North-east is 045°, never 45°. Every bearing then has the same shape, so a slip stands out, and nobody mistakes it for a speed or a depth.</li>
          <li><strong>Say each figure.</strong> “Zero four five”, not “forty-five”, whether you are calling it to the helm or on the radio.</li>
          <li><strong>The reciprocal</strong> is the opposite direction: add 180° if the bearing is under 180°, otherwise take 180° off. If a lighthouse bears 045° from you, you bear 225° from it.</li>
        </ul>
        <Formula note="Add 180 if the bearing is under 180°; take 180 off if it is 180° or more.">reciprocal = bearing ± 180°</Formula>
        <Interactive title="Turn the compass rose" instructions="Drag the pointer, or use the slider and buttons, to set a direction. Watch the three-figure bearing, the nearest compass point and the reciprocal. Then try the challenges.">
          <CompassDial />
        </Interactive>
        <Callout kind="remember" title="Winds come from, streams go to">
          <p>A north-westerly wind blows <em>from</em> the north-west. A current setting 090° flows <em>towards</em> the east. Forecasts and pilot books use both, so read which one is meant.</p>
        </Callout>
      </Section>

      <Section id="true-magnetic" title="True north and magnetic north">
        <p>
          The chart is drawn to <strong>true north</strong>, the direction of the geographic North Pole: straight up the chart,
          along the meridians. A compass points to <strong>magnetic north</strong>, which is somewhere else and moves slowly
          over the years. The angle between the two at your position is the <strong>variation</strong>. It is printed in the
          middle of the compass rose on the chart, with the year it applies to and how much it changes each year; the pilot
          book and the plotter usually give it too.
        </p>
        <Table
          head={["Where you charter", "Variation (roughly)", "What it means"]}
          rows={[
            [<strong key="m">Mediterranean: Croatia, Greece, Turkey, Sardinia, Sicily, Corsica, Mallorca, Montenegro</strong>, "A few degrees east", "Small. A quick check by eye barely notices it, but convert anything you plot or steer for long."],
            [<strong key="b">British Virgin Islands</strong>, "More than ten degrees west", "Far too big to ignore: a bearing left unconverted points you well off."],
            [<strong key="o">Seychelles, Phuket</strong>, "Small", "Check the rose on your chart: it is the only figure that counts."],
            [<strong key="k">Isle of Kerran (practice chart)</strong>, `3°W (${VAR_TEXT} for the course year, rounded)`, "The figure every exercise in this course uses."],
          ]}
        />
        <p>
          To convert, remember which figure is bigger. With <strong>westerly</strong> variation the magnetic figure is the bigger
          one: <em>variation west, magnetic best</em>. With <strong>easterly</strong> variation it is the smaller one:{" "}
          <em>variation east, magnetic least</em>.
        </p>
        <Table
          head={["", "Compass to chart (magnetic to true)", "Chart to compass (true to magnetic)"]}
          rows={[
            [<strong key="w">Variation west</strong>, "Take the variation off", "Add the variation"],
            [<strong key="e">Variation east</strong>, "Add the variation", "Take the variation off"],
          ]}
        />
        <Worked
          title="Two conversions"
          steps={[
            <>On the Kerran practice chart, 3°W: the hand-bearing compass reads {M(WORKED.magnetic)}. West, magnetic best, so take 3° off: {T(WORKED.trueBrg)}.</>,
            <>On a Greek charter, suppose the rose gives 4°E: the pilot book says to approach a harbour on 010°T. East, magnetic least, so take 4° off for the compass: 006°M.</>,
          ]}
          answer={<>Ask “which figure should be bigger?” every time, and the sign looks after itself.</>}
        />
        <Interactive title="Compass to chart" instructions="Pick a variation (or slide your own) and a compass reading, and see the true bearing you would plot.">
          <VariationFlip />
        </Interactive>
        <Callout kind="tip" title="Check the plotter's setting">
          <p>
            Most plotters can show bearings and headings in true or magnetic. On many charter boats it is set to magnetic, so the
            numbers match the steering compass. Look at the settings at check-in, so you know which kind of figure the screen is
            giving you.
          </p>
        </Callout>
      </Section>

      <Section id="steering" title="The steering compass">
        <p>
          The steering compass stands in front of the wheel. Its card is a magnet with a scale on it, and it keeps pointing to
          magnetic north while the boat turns around it. The <strong>lubber line</strong>, a mark on the front of the bowl, lines
          up with the bow, so the figure against it is your <strong>heading</strong>, in degrees magnetic.
        </p>
        <p>
          Steel, the engine, speakers and electronics close to the compass can pull it a degree or two off; that error is
          called <strong>deviation</strong>. A charter yacht&apos;s compass is usually well placed, and for charter navigation you can
          ignore it. Never leave a phone, a winch handle or a handheld radio beside the compass, though: those can pull it a long
          way.
        </p>
        <Callout kind="tip" title="Steer a number, then steer a mark">
          <p>
            Holding a figure on a swinging compass is tiring. Once on course, look ahead and pick something on the horizon right
            on the bow, a headland or a distinctive hill, and steer for that, glancing at the compass now and then.
          </p>
        </Callout>
      </Section>

      <Section id="hand-bearing" title="The hand-bearing compass">
        <p>
          A <strong>hand-bearing compass</strong> is a small compass with a sight, held up to the eye. You look at a landmark
          through it and read its bearing straight off the card. Most charter yachts carry one, often forgotten in the chart
          table drawer. To take a bearing:
        </p>
        <ol>
          <li><strong>Choose a charted landmark</strong> you are sure of: a lighthouse, a church tower, a headland, a radio mast. Avoid buoys for anything important; they swing round their moorings.</li>
          <li><strong>Stand clear</strong> of the steering compass, the engine, the speakers and your own phone, and brace yourself against the boat.</li>
          <li><strong>Hold it level at eye height</strong>, put the landmark on the lubber line, and wait for the card to stop swinging.</li>
          <li><strong>Read it and write it down</strong> at once, with the time. Then convert it to true before it goes on the chart.</li>
        </ol>
        <Worked
          title={`A bearing of the church spire at ${WORKED.time}`}
          steps={[
            <>South-east of Port Kerran, the hand-bearing compass on the church spire reads {M(WORKED.magnetic)}.</>,
            <>Variation 3°W, magnetic best: {WORKED.magnetic} − 3 = {T(WORKED.trueBrg)}.</>,
            <>On the chart, the line runs through the spire and back out towards you, on the reciprocal: {T(WORKED.fromObject)} from the spire.</>,
          ]}
          answer={<>You are somewhere on the {WORKED.time} position line, {T(WORKED.trueBrg)} to the spire.</>}
        />
        <Callout kind="remember" title="A phone in an emergency">
          <p>
            A phone compass app will take a rough bearing if there is nothing else, but calibrate it first, hold it well away
            from the steering compass and other steel, and check whether it is set to true or magnetic.
          </p>
        </Callout>
      </Section>

      <Section id="position-line" title="One bearing: a position line">
        <p>
          A single bearing gives a <strong>position line</strong>: you are somewhere along it, but it cannot say where. That is
          still useful: if the line passes clear of every danger, you know you are safe along it, and Lesson 8 turns this into a
          clearing bearing. Try it below: you are hidden somewhere on the practice chart.
        </p>
        <Interactive title="Take a bearing" instructions="Choose a landmark you can see, take its bearing, convert it to true and draw the line. Take a second one to see where the lines cross, then reveal where the boat really is.">
          <TakeABearing />
        </Interactive>
      </Section>

      <Section id="fix" title="Two or three bearings: a fix">
        <p>
          Take bearings of two landmarks well round from each other and draw both lines: where they cross is your{" "}
          <strong>fix</strong>. Two lines always cross somewhere, even if one is wrong, so a third bearing is the check. Three
          good lines meet in a small triangle called a <strong>cocked hat</strong>; the fix is its middle, marked on the chart
          with a circle and the time.
        </p>
        <ul>
          <li><strong>Spread them out.</strong> Two lines should cross at 60° to 90°; three should be roughly 60° apart (or 120°). Lines that cross at a shallow angle let a small error slide the fix a long way.</li>
          <li><strong>Near before far.</strong> A one-degree error moves the line about a sixtieth of the distance: 30 metres at one mile, nearly 200 metres at six.</li>
          <li><strong>Beam last.</strong> Take the object nearest the bow or stern first; the one on the beam changes bearing fastest, so take it last.</li>
          <li><strong>A big hat means a mistake.</strong> Usually a misidentified landmark or a misread figure. Retake the bearings; until then, assume you are at the corner nearest danger.</li>
        </ul>
        <Worked
          title={`A three-bearing fix at ${DEMO_TIME}`}
          steps={[
            <>Hand-bearing compass: {DEMO_NAMES.map((n, i) => `${n} ${M(DEMO_MAG[i]!)}`).join(", ")}.</>,
            <>Take 3° off each: {DEMO_TRUE.map((b) => T(b)).join(", ")}.</>,
            <>Draw each line through its object. The smallest angle between them is {Math.round(Math.min(...DEMO_HAT.cuts))}°, a well-spread set.</>,
            <>The lines meet in a cocked hat {formatHat(DEMO_HAT.size)} across. Mark its middle with the time.</>,
          ]}
          answer={<>Fix {DEMO_TIME}: {formatPosition(DEMO_FIX)}, south of Port Kerran.</>}
        />
        <Interactive title="Build a fix" instructions="The boat is hidden somewhere on the chart. Choose three objects, convert each compass bearing to true and plot it, then compare a well-spread set with a bunched one.">
          <FixBuilder />
        </Interactive>
      </Section>

      <Section id="transits" title="Transits: two objects in line">
        <p>
          When two charted objects appear exactly one behind the other, they are in <strong>transit</strong>, and you are on
          the straight line through them. A transit needs no compass, so it has no variation, deviation or reading error: it
          is the most accurate position line you can get. Any two fixed, charted things will do: a lighthouse and a hilltop, a
          church and a mast, the edge of one headland against another.
        </p>
        <TransitFigure
          transit={SPIRE_TRANSIT}
          seaward={SPIRE_INLAND + 3}
          label={`The church spire in line with the radio mast: ${T(SPIRE_TRANSIT.bearing)}, seen from ${sixteenPoint(reciprocal(SPIRE_TRANSIT.bearing))} of the island.`}
        />
        <p>
          Harbours build transits on purpose: two <strong>leading marks</strong> or <strong>leading lights</strong>, the rear
          one higher, that line up along the safe way in. Lesson 8 uses the Port Kerran leading lights to bring you into the
          harbour. A transit is also the quickest check of the steering compass: steer along one and compare the compass with
          the charted bearing, converted to magnetic.
        </p>
      </Section>

      <Section id="plotter-check" title="When the plotter and your eyes disagree">
        <p>
          Now and then the plotter shows the boat where your eyes say it cannot be: a headland on the wrong side, a buoy where
          the screen has none, the boat drawn on land. The screen is usually right about the GPS position, but the chart under
          it may be old or badly surveyed, the display may have frozen after losing its signal, or you may be zoomed in far
          beyond the chart&apos;s real detail. A quick bearing tells you which to trust.
        </p>
        <ol>
          <li><strong>Pick a landmark</strong> you are sure of, close and well charted.</li>
          <li><strong>Ask the plotter</strong> what its bearing should be: put the cursor on it, or read it off the chart from the plotter&apos;s position, and convert to magnetic if the plotter shows true.</li>
          <li><strong>Take the real bearing</strong> with the hand-bearing compass.</li>
          <li><strong>Compare.</strong> Within a few degrees: carry on. More than that: slow down, watch the depth, keep clear of anything close and navigate by what you can see until you know why.</li>
        </ol>
        <Interactive title="Check the plotter" instructions="In each situation, see what the plotter predicts, take the real bearing and decide whether to trust the screen. Then reveal where the boat really is.">
          <PlotterCheck />
        </Interactive>
        <KeyIdea>The plotter is one witness. One bearing of a landmark you can see is another. When they disagree, slow down until they agree.</KeyIdea>
        <p className="text-sm text-text-secondary">
          The Isle of Kerran is fictional and its chart is for practice only. Variation on real charts differs from place to
          place and year to year: always use the compass rose on the chart of your own cruising area.
        </p>
      </Section>
    </>
  );
}

const lesson: LessonContent = {
  objectives: [
    "Read and write bearings in three figures, and work out a reciprocal",
    "Convert between true and magnetic using the variation on the chart's compass rose",
    "Take a bearing with the hand-bearing compass and fix your position from two or three of them",
    "Use transits, and check the plotter against your eyes when they disagree",
  ],
  keyTerms: [
    { term: "Bearing", definition: "A direction measured clockwise from north, written in three figures, such as 045°." },
    { term: "Reciprocal", definition: "The opposite direction: the bearing plus or minus 180°." },
    { term: "True north", definition: "The direction of the geographic North Pole; straight up the chart." },
    { term: "Magnetic north", definition: "The direction a compass points." },
    { term: "Variation", definition: "The angle between true and magnetic north, printed on the chart's compass rose." },
    { term: "Lubber line", definition: "The mark on a compass that lines up with the bow (or the sight), against which you read the heading or bearing." },
    { term: "Deviation", definition: "A compass error caused by the boat's own steel and electronics; small enough to ignore on most charter yachts." },
    { term: "Position line", definition: "A line on the chart that you know you are somewhere on, such as one bearing of a landmark." },
    { term: "Cocked hat", definition: "The small triangle three position lines make; the fix is its middle." },
    { term: "Transit", definition: "Two charted objects in line, giving a position line with no compass error." },
  ],
  Body,
  Video,
  Exercises,
};

export default lesson;
