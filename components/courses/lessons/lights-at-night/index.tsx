import type { ReactNode } from "react";
import type { LessonContent } from "@/lib/courses/types";
import { viewAround } from "@/lib/courses/navigation/chart-geometry";
import { km } from "@/lib/courses/navigation/practice-chart";
import { Callout, Figure, Formula, Interactive, KeyIdea, Section, Table, Worked } from "../../LessonParts";
import PracticeChart from "../../PracticeChart";
import { Exercises, Video } from "./client";
import { GULL, GULL_LIGHT, LEADING, MEW, NO1, chartLight, groupOf, piecesOf, sec } from "./data";
import { ArcsFigure } from "./vessel-art";
import { CharacteristicDecoder, DaylightPlanner, NightTrainer, OwnLights, RhythmStrips, ShoreLights } from "./widgets";

// Every number about the practice chart's lights comes from parseLight (via data.ts).
const code = (s: ReactNode) => <span className="font-mono text-[0.92em] font-semibold">{s}</span>;
const G = GULL_LIGHT;
const GP = piecesOf(GULL.light!)!;
const NO4 = chartLight("no4");
const MEW_TIMED = 3 * MEW.light.period + 0.2;

function Body() {
  return (
    <>
      <Section id="chart" title="Lights on the chart">
        <p>
          By day you recognise a mark by its shape and colour. At night those disappear, so every lighthouse, beacon and lit
          buoy shows its own pattern of light and darkness, its <strong>characteristic</strong>, and the chart tells you what
          to look for. Learn to read it, and a dark coast full of winking lights turns into a map you can steer by.
        </p>
        <p>
          On a paper chart a light is marked with a <strong>magenta flare</strong>, a small teardrop. A lighthouse is drawn as a
          star with the flare beside it, and its characteristic is printed alongside in a compact code. Gull Point lighthouse,
          at the eastern end of our practice island, is printed {code(GULL.light)}.
        </p>
        <Figure caption="Gull Point lighthouse on the practice chart: a star, a magenta flare and its characteristic, with the lit buoys off The Teeth to its east.">
          <PracticeChart view={viewAround(km(7.3, 5.65), 4.6, 16 / 9)} zoomable highlight={[GULL.id]} title="Practice chart: Gull Point lighthouse and the buoys off The Teeth" />
        </Figure>
        <p>
          Lit buoys carry a flare too, with a shorter characteristic: just the rhythm, colour and period, such as {code(NO1.text)}{" "}
          on No 1 buoy at the entrance to Port Kerran. Their lights are small and low, and the chart gives no height or range
          for them. On most chart plotters and charting apps you can tap or hover over a light to see the same characteristic
          written out in full, which is handy when the screen is too cluttered to read.
        </p>
        <Callout kind="warning" title="Not for navigation">
          <p>The Isle of Kerran is fictional. Its lights are realistic, but use the official charts and the plotter on board for any real passage.</p>
        </Callout>
      </Section>

      <Section id="decode" title="Reading a characteristic">
        <p>Every characteristic is written in the same order. Learn the order and you can read any light:</p>
        <Formula note="rhythm (and group) · colour · period · height · range">{`${GP.rhythm} ${GP.period} ${GP.height} ${GP.range}`}</Formula>
        <Table
          head={["Part", "Gull Point", "What it means"]}
          rows={[
            [<strong key="r">Rhythm</strong>, code(GP.rhythm), `Group flashing: flashes in groups of ${groupOf(G)}`],
            [<strong key="c">Colour</strong>, <em key="n">none</em>, "No letter means white. Otherwise R red, G green, Y yellow"],
            [<strong key="p">Period</strong>, code(GP.period), `One complete cycle takes ${sec(G.period)} seconds, from the start of one group to the start of the next`],
            [<strong key="e">Height</strong>, code(GP.height), `The light is ${G.height} metres above high water (small m: metres)`],
            [<strong key="m">Range</strong>, code(GP.range), `Seen up to about ${G.range} nautical miles on a clear night (capital M: miles)`],
          ]}
        />
        <p>
          Spacing and dots vary between charts, books and plotters ({code("Fl(3)10s28m15M")}, {code("Fl(3) 10s 28m 15M")} or{" "}
          {code("Fl.(3)10s")}), but the order never changes.
        </p>
        <Interactive title="Characteristic decoder" instructions="Pick a light from the practice chart, or type any characteristic, and watch it flash with every part explained.">
          <CharacteristicDecoder />
        </Interactive>
      </Section>

      <Section id="rhythms" title="The rhythms you will meet">
        <Table
          head={["Written", "Name", "What you see", "Typical use"]}
          rows={[
            [code("F"), "Fixed", "A steady light that never goes out", "Some harbour lights; easy to confuse with shore lights"],
            [code("Fl 5s"), "Flashing", "Single short flashes, more dark than light", "Lighthouses, lateral buoys"],
            [code("Fl(3) 10s"), "Group flashing", "Flashes in groups, with a longer dark gap between", "Lighthouses, lateral buoys such as Fl(2) R"],
            [code("LFl 10s"), "Long flashing", "One flash of two seconds or more", "Safe water marks"],
            [code("Q"), "Quick", "About one flash a second, without a break", "North cardinal marks"],
            [code("VQ"), "Very quick", "About two flashes a second", "Cardinal marks, new dangers"],
            [code("Q(3) 10s"), "Group quick", "Quick flashes in groups", "East, south and west cardinal marks"],
            [code("Iso 4s"), "Isophase", "Equal light and dark", "Lighthouses, leading and safe water lights"],
            [code("Oc 4s"), "Occulting", "Mostly on, blinking out", "Leading lights, harbour lights"],
          ]}
        />
        <KeyIdea>
          For any light ask one question first: is it on for less time than it is dark (flashing), the same (isophase), or more
          (occulting)?
        </KeyIdea>
        <Interactive title="Every rhythm side by side" instructions="Each strip shows the last ten seconds of a light, so the rhythms compare directly.">
          <RhythmStrips />
        </Interactive>
        <Callout kind="tip" title="Red and green at night, and the Caribbean">
          <p>
            Lateral buoys show red or green lights to match their colour by day. In the Mediterranean, the Seychelles and Phuket
            (Region A) the red lights are on your port side going into harbour. In the Caribbean, including the BVI (Region B),
            it is the other way round: red on your starboard side going in. The lights follow the buoys.
          </p>
        </Callout>
      </Section>

      <Section id="range" title="What you really see">
        <p>
          The range on the chart is how far the light can be seen on a <strong>clear</strong> night. Real nights are rarely
          that clear. Summer haze in the Mediterranean, rain, sea spray, and above all the glare of a lit town all cut it down,
          so a light often appears much later than the range suggests. Do not worry if a fifteen-mile light is not in sight
          at twelve miles; do worry if it is still missing when you are close.
        </p>
        <ul>
          <li><strong>Buoy lights are small and low.</strong> Expect to pick them out only in the last mile or two, often against a bright background.</li>
          <li><strong>The curve of the Earth hides low lights.</strong> That is why major lighthouses stand high on headlands: their light clears the horizon from further away.</li>
          <li><strong>A light does not label itself.</strong> Check the colour, the count and the period before you name it, and check what you name against the chart or plotter.</li>
        </ul>
      </Section>

      <Section id="identify" title="Identifying a light">
        <ol>
          <li><strong>Colour.</strong> White, red, green or yellow.</li>
          <li><strong>Count.</strong> How many flashes in each group, or is it steady, quick, equal or mostly on?</li>
          <li><strong>Period.</strong> Time it with the stopwatch on your phone, from the first flash of one group to the first flash of the next. Time several periods and divide.</li>
          <li><strong>Check.</strong> Find the light on the chart or plotter with that characteristic, near where you think you are.</li>
        </ol>
        <Worked
          title="Which light is that?"
          steps={[
            "South of Kerran at night you see a white light giving two flashes, then darkness.",
            `You start the stopwatch at the first flash of one pair and stop it at the first flash of the fourth pair: ${MEW_TIMED.toFixed(1)} seconds.`,
            `That is three periods, not four: ${MEW_TIMED.toFixed(1)} ÷ 3 = ${(MEW_TIMED / 3).toFixed(2)}, so the period is ${sec(MEW.light.period)} seconds.`,
            `White, two flashes, ${sec(MEW.light.period)} seconds: ${MEW.light.rhythm} ${sec(MEW.light.period)}s. No 3 and No 4 buoys share the rhythm but are green and red.`,
          ]}
          answer={<>Mew Rock beacon, {code(MEW.text)}: an isolated danger mark. Keep clear of the rock under it.</>}
        />
        <Interactive title="Night trainer" instructions="A light from the practice chart is flashing. Time it with the stopwatch, then choose which light it is.">
          <NightTrainer />
        </Interactive>
      </Section>

      <Section id="harbour" title="A harbour after dark">
        <p>
          From seaward, a harbour town at night is a carpet of lights: street lamps, bars, cars on the waterfront, windows,
          the anchor lights of boats in the bay. The navigation lights are in there somewhere, and at a big waterfront such as
          Palma or Split they can be very hard to pick out. The trick is rhythm: <strong>shore lights are steady</strong>, while
          navigation lights flash, occult or keep an equal beat. Look low on the water for the buoys, and for pairs of lights
          in line, one above the other, for leading lights.
        </p>
        <p>
          At Port Kerran the leading lights are {code(LEADING.text)}: white, mostly on, blinking out together. The inner buoys
          flash in pairs, {code(chartLight("no3").text)} and {code(NO4.text)}. Above the town, two steady red lights are the
          warning lights on the radio mast, not buoys: a buoy can never be high on a hill.
        </p>
        <Interactive title="Find the lights among the town" instructions="You are between No 1 and No 2 buoys, looking up the channel. Tap the lights each task asks for.">
          <ShoreLights />
        </Interactive>
        <Callout kind="warning" title="Distance lies at night">
          <p>
            Even when every light is named, you cannot judge distance in the dark. A moored yacht without an anchor light, a
            mooring buoy or the end of a quay can appear suddenly in the last few metres. Come in at walking pace, with someone
            on the bow with a torch.
          </p>
        </Callout>
      </Section>

      <Section id="daylight" title="Why charter companies say arrive by daylight">
        <p>
          Most charter companies ask you to be in harbour or at anchor before dark, and many bareboat contracts forbid sailing at
          night altogether. Read yours at check-in: breaking the rule can leave you without insurance cover, and at the very
          least it is a hard conversation if something goes wrong. The reasons are good ones:
        </p>
        <ul>
          <li><strong>Plenty of hazards carry no light.</strong> Rocks, mooring buoys, fish farm cages (common in Croatia, Greece and Turkey), swimming area floats, unlit small boats and fishing-net floats.</li>
          <li><strong>Charter crews are new to the boat and the coast.</strong> Night is not the time to learn where the switches are, or what the pilot book meant by a shallow patch.</li>
          <li><strong>Anchoring and berthing are harder.</strong> You cannot see the seabed, the colour of the water or the lines of the boats either side.</li>
          <li><strong>In the Caribbean</strong> many reefs are unmarked, and in the BVI, for example, charter companies forbid sailing after dark. Near the equator, in the Seychelles or Phuket, the sun sets at roughly the same time all year and dusk is short.</li>
        </ul>
        <p>
          Sunset moves a lot through the Mediterranean season: in Croatia in midsummer the sun sets after eight in the evening,
          but by late October, once the clocks go back, it is down before five. Plan the day so you arrive by mid-afternoon,
          with a couple of hours in hand for a dying wind, a full harbour or an anchor that will not hold.
        </p>
        <Interactive title="Will we be in before dark?" instructions="Enter the day’s distance, your average speed, when you leave and the sunset time.">
          <DaylightPlanner />
        </Interactive>
        <Callout kind="tip" title="If you are caught out">
          <p>
            It happens: a breakdown, a rescue, a forecast that was wrong. Slow down, switch on the navigation lights, put the
            plotter on night mode, and give everyone a job: one on the plotter, one looking out, one on the depth. Choose the
            simplest, best-lit entrance you can reach, not necessarily the nearest, and call the base or the marina to say what
            you are doing. Or stand off in open water and wait for first light: that is often the safest choice of all.
          </p>
        </Callout>
      </Section>

      <Section id="own" title="Your own yacht’s lights">
        <p>
          From sunset to sunrise, and in poor visibility by day, your yacht must show the right navigation lights. Each light
          covers a set arc, so another boat can tell from your lights which way you are heading.
        </p>
        <Figure caption="The arcs of a vessel’s lights, from above: green to starboard and red to port, each from right ahead to just behind the beam; a white sternlight over the rest; and, when the engine is on, the white steaming (masthead) light forward.">
          <ArcsFigure />
        </Figure>
        <Table
          head={["What you are doing", "Lights to show", "Switch panel"]}
          rows={[
            ["Sailing, engine off", "Red and green sidelights and a white sternlight; or, instead, a tricolour at the masthead", "Nav lights, or Tricolour"],
            ["Motoring, or motor-sailing with sails up", "Sidelights, sternlight and the white steaming light on the front of the mast. Never the tricolour", "Nav lights and Steaming"],
            ["At anchor", "One all-round white light, where it can best be seen (usually the masthead)", "Anchor"],
          ]}
        />
        <Interactive title="See your yacht as others see her" instructions="Choose what your yacht is doing and where the other boat is, and see which of your lights they can see.">
          <OwnLights />
        </Interactive>
        <Callout kind="remember" title="At handover">
          <p>
            Switch on every light at the panel and walk round the boat to check each one, including the tricolour and the anchor
            light at the top of the mast (look up from the pontoon). A blown bulb is easy to report in the marina and hard to fix at
            sea.
          </p>
        </Callout>
        <p className="text-sm text-text-secondary">
          Light timings in this lesson are representative; the pattern and the period are what you look for. This course is
          independent training material by Nautical Nomads and is not accredited by the RYA or any other body.
        </p>
      </Section>
    </>
  );
}

const lesson: LessonContent = {
  objectives: [
    "Read a light’s characteristic on the chart: rhythm, colour, period, height and range",
    "Identify a light at night by its colour, count and period, and pick navigation lights out from shore lights",
    "Explain why charter companies say arrive by daylight, and plan a day that does",
    "Show the right lights on your own yacht under sail, under engine and at anchor",
  ],
  keyTerms: [
    { term: "Characteristic", definition: "A light’s pattern of colour, rhythm and period, printed on the chart beside its magenta flare." },
    { term: "Period", definition: "The time for one complete cycle of a light, from the start of one group to the start of the next." },
    { term: "Flashing (Fl)", definition: "Flashes shorter than the darkness between them; Fl(3) is group flashing, three at a time." },
    { term: "Quick (Q)", definition: "About one flash a second; very quick (VQ) is about two a second." },
    { term: "Isophase (Iso)", definition: "Equal periods of light and darkness." },
    { term: "Occulting (Oc)", definition: "On for longer than it is off: a light that blinks out." },
    { term: "Range", definition: "How far a light can be seen on a clear night, in nautical miles (the capital M)." },
    { term: "Tricolour", definition: "One lantern at the masthead showing red, green and white sectors; for use under sail only." },
    { term: "Steaming light", definition: "The white masthead light shown forward when a yacht is under engine, with her sails up or not." },
    { term: "Anchor light", definition: "An all-round white light shown by a vessel at anchor, from sunset to sunrise." },
  ],
  Body,
  Video,
  Exercises,
};

export default lesson;
