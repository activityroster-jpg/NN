import type { LessonContent } from "@/lib/courses/types";
import { Callout, Interactive, KeyIdea, Section, Table, Worked } from "../../LessonParts";
import ChartTour from "../../widgets/ChartTour";
import { Exercises, Video } from "./client";

function Body() {
  return (
    <>
      <Section id="kit" title="What a charter skipper navigates with">
        <p>
          Step aboard almost any charter yacht and the navigation kit is the same. The <strong>chart plotter</strong> at the helm
          shows the electronic chart with your position, speed and track on it. A <strong>paper chart</strong> of the cruising
          area lives in the saloon, often with a <strong>pilot book</strong> that has a page for every harbour and bay. Most crews
          add a tablet or phone with a charting app as a second opinion. Round the boat are the instruments that feed all of
          this: the <strong>depth sounder</strong>, the <strong>log</strong> (your speed through the water) and the wind
          instruments.
        </p>
        <Table
          head={["On board", "What it is for", "Where you find it"]}
          rows={[
            [<strong key="p">Chart plotter</strong>, "Position, speed, track, the electronic chart, waypoints", "At the helm, sometimes repeated at the chart table"],
            [<strong key="c">Paper chart</strong>, "The whole area at a glance; the backup that never crashes", "Chart table or saloon locker"],
            [<strong key="b">Pilot book</strong>, "Each harbour and bay: approach, dangers, berths, water and fuel", "Saloon shelf; ask at check-in if it is missing"],
            [<strong key="a">Charting app</strong>, "A second chart, and community notes on anchorages", "Your phone or tablet, downloaded before you leave Wi-Fi"],
            [<strong key="d">Depth sounder</strong>, "The depth under the boat, now", "Instrument display at the helm"],
            [<strong key="h">Hand-bearing compass</strong>, "Bearings of landmarks, to check where you are", "Chart table drawer; often not used all week"],
          ]}
        />
        <Callout kind="tip" title="At check-in">
          <p>
            Before the briefing ends, find the paper chart and the pilot book, switch the plotter on and check its chart covers
            where you are going, and ask how the depth sounder is set: some read the depth under the keel, some below the
            waterline. That one question prevents most groundings.
          </p>
        </Callout>
      </Section>

      <Section id="jobs" title="Three jobs: plan, track, arrive">
        <p>Navigating a charter comes down to three jobs, and every lesson in this course serves one of them:</p>
        <ol>
          <li><strong>Plan</strong>, before the lines come off: where you are going, how far it is, how long it will take, what the weather is doing, and where you will stop if it goes wrong.</li>
          <li><strong>Track</strong>, on the way: knowing where you are, what is around you and whether you are still on the plan.</li>
          <li><strong>Arrive</strong>, into a harbour or bay: reading the marks, watching the depth, and getting into the berth or onto the anchor without drama.</li>
        </ol>
        <KeyIdea>Most charter trouble happens on arrival, in the last mile, in the afternoon. The plan you make in the morning is what keeps that mile calm.</KeyIdea>
      </Section>

      <Section id="plotter" title="The plotter is one source, not the only one">
        <p>
          The plotter is superb and you should use it all day. It is also a screen, and a screen can be wrong without looking
          wrong: the chart in it may be years old, a setting may be off, a signal may be lost at the moment you need it. So
          treat the plotter as one witness and cross-examine it with the others:
        </p>
        <ul>
          <li><strong>Your eyes.</strong> Does the headland, the buoy and the colour of the water match what the screen says?</li>
          <li><strong>The depth sounder.</strong> If the chart says eight metres and the sounder says three, believe the sounder and slow down.</li>
          <li><strong>The paper chart.</strong> Keep it open to the day's page, and put a pencil cross on it every hour or so with the time. If the plotter dies, you know where you were.</li>
        </ul>
        <Callout kind="remember">
          <p>Use every source you have and check them against each other. If two disagree, find out why before you carry on.</p>
        </Callout>
      </Section>

      <Section id="chart" title="The chart: a map of the sea">
        <p>
          A land map shows roads and towns; a chart shows what matters to a boat: the <strong>depth</strong> of the water, the
          <strong> dangers</strong> under it, and the <strong>buoys, lights and landmarks</strong> you can use to find your way.
          Inland it shows only what you can see from the sea, such as a church tower or a hill.
        </p>
        <p>
          Throughout the course you will use one practice chart of a fictional island, the <strong>Isle of Kerran</strong>. It is
          drawn with real chart conventions, so everything you learn on it transfers to the charts on your charter yacht.
        </p>
        <Interactive title="Explore the practice chart" instructions="Pick a feature to zoom in on it. Do not worry about what everything means yet; Lesson 2 decodes the chart.">
          <ChartTour ids={["harbour", "gull-point-lt", "teeth", "east-teeth", "no1", "no2", "kerran-approach", "mew-rock", "church", "anchorage"]} />
        </Interactive>
        <Callout kind="warning" title="Not for navigation">
          <p>The Isle of Kerran does not exist. Its chart is for practice only. Real navigation uses the current official charts on board.</p>
        </Callout>
      </Section>

      <Section id="plan" title="The five-minute morning plan">
        <p>Every morning, before you leave, answer five questions with the chart and the pilot book open. It takes five minutes and it is the whole secret.</p>
        <ol>
          <li><strong>Where are we going, and how far is it?</strong> Measure it on the chart or the plotter.</li>
          <li><strong>How long will it take?</strong> At six knots, a mile takes ten minutes. Lesson 3 makes this exact.</li>
          <li><strong>Which way is the wind, and what is the forecast?</strong> Upwind takes longer and is rougher; a rising wind in the afternoon changes the plan.</li>
          <li><strong>Where do we stop if it goes wrong?</strong> A bay or harbour on the way that you could reach if someone is seasick or the wind builds.</li>
          <li><strong>What does the pilot book say about getting in?</strong> The approach, the dangers, where to berth or anchor, and whether to call ahead.</li>
        </ol>
        <Worked
          title="A morning in Croatia"
          steps={[
            "Marina Kaštela to Milna on Brač: about fourteen miles on the chart.",
            "At six knots: fourteen miles times ten minutes a mile is one hundred and forty minutes, about two hours twenty.",
            "Forecast: a light northerly in the morning, a westerly sea breeze from early afternoon. Leave at ten, arrive before one, before the breeze fills in.",
            "Bolt-hole: the bay at Stomorska on Šolta, halfway, if anyone is unwell.",
            "Pilot book: Milna has a marina and a town quay; the harbour master answers on the VHF; approach from the west, mind the shallows on the north side.",
          ]}
          answer="Leave 10:00, arrive about 12:30, Stomorska as the fallback, call Milna on the way in."
        />
      </Section>

      <Section id="crew" title="Who does what on board">
        <p>
          Share the jobs. One person helms. One keeps an eye on the plotter and the paper chart. One is the lookout: other
          boats, the marks, the colour of the water, the depth. Swap round through the week so everyone can do each job. If you
          have a professional skipper, they will navigate, but a crew who understand the plan, and can see the next mark before
          the skipper points at it, have a far better week.
        </p>
      </Section>

      <Section id="course" title="How this course works">
        <p>
          Twelve lessons and a final quiz, in the order a first-time skipper meets things: the kit and the chart first, then
          bearings, buoyage and lights, then harbours, anchoring and the rules of the road, and finally weather and the week's
          plan. Every lesson has the same four parts:
        </p>
        <ol>
          <li><strong>Watch</strong> the narrated walkthrough at the top of the page, with captions or the transcript.</li>
          <li><strong>Read</strong> these notes at your own pace. The key terms are summarised at the end.</li>
          <li><strong>Try</strong> the interactive charts and tools.</li>
          <li><strong>Practise</strong> with the exercises. They are marked instantly, and the practice sets give you fresh questions each time.</li>
        </ol>
        <p className="text-sm text-text-secondary">
          This course is independent training material by Nautical Nomads. It is not accredited by the RYA or any other body and
          does not lead to a qualification. Charter companies set their own requirements for bareboat skippers.
        </p>
      </Section>
    </>
  );
}

const lesson: LessonContent = {
  objectives: [
    "What a charter yacht carries for navigation, and what each item is for",
    "The three jobs of charter navigation: plan, track, arrive",
    "Why the plotter is one source among several, and what to check it against",
    "The five-minute morning plan, and how to share the jobs on board",
  ],
  keyTerms: [
    { term: "Chart plotter", definition: "The screen at the helm that shows the electronic chart with your position, speed and track." },
    { term: "Chart", definition: "A map of the sea showing depths, dangers, buoys, lights and landmarks." },
    { term: "Pilot book", definition: "A guide with a page for each harbour and bay: the approach, the dangers, the berths and the facilities." },
    { term: "Depth sounder", definition: "The instrument that shows the depth of water under the boat right now." },
    { term: "Log", definition: "The instrument that shows your speed through the water, and the distance run." },
    { term: "Bolt-hole", definition: "A harbour or bay on the way that you could reach if the plan goes wrong." },
    { term: "Passage plan", definition: "The decisions for the day: destination, distance, time, weather, fallback and the entrance." },
  ],
  Body,
  Video,
  Exercises,
};

export default lesson;
