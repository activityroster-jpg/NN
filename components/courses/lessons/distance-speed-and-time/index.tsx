import type { LessonContent } from "@/lib/courses/types";
import { GUIDES } from "@/lib/cruising";
import { Callout, Formula, Interactive, KeyIdea, Section, Table, Worked } from "../../LessonParts";
import { Exercises, Video } from "./client";
import { DEMO, LON_MINUTE_NM, nm1 } from "./data";
import { clock, hm, num } from "./maths";
import { DayPlanner, DividersOnChart, SixMinuteQuickFire, SpeedTriangle, WalkingDividers, type PlannerLeg } from "./widgets";

/** Every leg of every cruising guide, for the day planner and the table of real days. */
const LEGS: PlannerLeg[] = GUIDES.flatMap((g) => g.legs.map((l) => ({ area: `${g.name}, ${g.country}`, from: l.from, to: l.to, nm: l.nm })));
const PLANNING_SPEED = 5;
const minutesAt = (nm: number, kn = PLANNING_SPEED) => Math.round((60 * nm) / kn);

/** A handful of real legs, short to long, one per area where possible. */
const SAMPLE_LEGS: PlannerLeg[] = (() => {
  const picks: PlannerLeg[] = [];
  for (const target of [10, 13, 15, 17, 20, 26]) {
    const best = LEGS.filter((l) => !picks.includes(l) && !picks.some((p) => p.area === l.area)).reduce<PlannerLeg | null>(
      (a, l) => (a === null || Math.abs(l.nm - target) < Math.abs(a.nm - target) ? l : a),
      null,
    );
    if (best) picks.push(best);
  }
  return picks.sort((a, b) => a.nm - b.nm);
})();

const SPEED_ROWS = [4, 5, 6, 7];

function Body() {
  const demo = nm1(DEMO.distance);
  return (
    <>
      <Section id="units" title="Nautical miles, cables and knots">
        <p>
          At sea, distance is measured in <strong>nautical miles</strong>. A nautical mile is the length of one minute of
          latitude, fixed at exactly 1,852 m: a little longer than a land mile (1,609 m), and nearly twice a kilometre. Sixty
          minutes make a degree, so a degree of latitude is 60 miles. That link is what makes the chart’s latitude scale a
          ruler.
        </p>
        <Table
          head={["Unit", "What it is", "Written"]}
          rows={[
            [<strong key="m">Nautical mile</strong>, "One minute of latitude: 1,852 m", "M (or nm, NM on the plotter)"],
            [<strong key="c">Cable</strong>, "A tenth of a mile, about 185 m: handy in harbours and pilot books", "cable"],
            [<strong key="k">Knot</strong>, "A speed of one nautical mile an hour", "kn (or kt)"],
          ]}
        />
        <p>
          A <strong>knot</strong> is a speed: one nautical mile an hour. A yacht making six knots covers six miles in an hour,
          three in half an hour. Because the hour is built in, there is no such thing as “knots per hour”.
        </p>
        <Callout kind="tip" title="Check the plotter’s units">
          <p>
            Plotters and phone apps can be set to show kilometres or land miles, and speeds in km/h. At check-in, make sure
            distance is in nautical miles and speed in knots, so the screen, the chart and the pilot book all agree.
          </p>
        </Callout>
      </Section>

      <Section id="dividers" title="Measuring distance with dividers">
        <p>To measure a distance on a paper chart you need a pair of dividers and the latitude scale down the side of the chart:</p>
        <ol>
          <li>Open the dividers so that one point sits on each end of the line you want to measure.</li>
          <li>Without changing the spread, carry them to the <strong>latitude scale</strong> at the side of the chart, level with where you measured.</li>
          <li>Read the minutes and tenths between the two points. Each minute is a mile.</li>
        </ol>
        <Worked
          title="How far is it from the Kerran Approach buoy to Mew Rock?"
          steps={[
            "Put one point of the dividers on the buoy and the other on Mew Rock.",
            "Carry them, still open, to the latitude scale on the left-hand side of the chart.",
            `Put one point on a whole minute and count up to the other: ${demo} minutes of latitude.`,
          ]}
          answer={`${demo} nautical miles.`}
        />
        <Interactive
          title="Dividers on the practice chart"
          instructions="Drag the two points onto the marks (zoom in with + to be exact), then carry the dividers to the latitude scale. Try the longitude scale too, to see why it is wrong."
        >
          <DividersOnChart />
        </Interactive>
        <Callout kind="warning" title="Never the top or bottom scale">
          <p>
            The longitude scale along the top and bottom is also in minutes, but a minute of longitude is only a mile at the
            equator. The meridians close up towards the poles: at the Isle of Kerran a minute of longitude is just{" "}
            {LON_MINUTE_NM.toFixed(2)} M, in Croatia about 0.73 M and in Greece about 0.78 M. Use it as a ruler and every
            distance comes out too long.
          </p>
        </Callout>
        <p>
          On a chart that covers a big area, the latitude scale itself stretches a little towards the poles, so always measure
          against the part of the scale level with your line. On the large-scale charts you use for a charter week the
          difference is tiny, but the habit costs nothing.
        </p>
      </Section>

      <Section id="longer" title="Longer passages and routes">
        <p>
          For a line longer than the dividers will comfortably open, set them to a round figure on the latitude scale (one,
          two or five miles) and <strong>walk</strong> them along the line, swinging them over at each step and counting. When
          less than a full step is left, close them onto the gap, measure it on the scale and add it on.
        </p>
        <p>
          Most days have more than one leg: out of the bay, round a headland, across to the next island. Measure each leg on
          its own, write its distance beside it on the chart, and add them up.
        </p>
        <Interactive title="Walking the dividers" instructions="Step the dividers along a three-leg route from the harbour approach to Kerran Roads, measure the gaps and add up the legs.">
          <WalkingDividers />
        </Interactive>
        <Callout kind="tip" title="The plotter does this too">
          <p>
            Every plotter and charting app has a route or measure tool that adds up the legs for you. Use it, but check one leg
            against the paper chart early in the week. If the two agree, you can trust the screen; if they don’t, you have
            found a wrong setting before it matters.
          </p>
        </Callout>
      </Section>

      <Section id="rule" title="60D = ST: distance, speed and time">
        <p>
          Distance, speed and time are linked by one rule. Time at sea is counted in minutes, so the rule is written with a
          60 in it:
        </p>
        <Formula note="D = distance in miles · S = speed in knots · T = time in minutes">60D = ST</Formula>
        <p>Cover the one you want and the other two tell you how to find it:</p>
        <Table
          head={["You want", "Work it out as", "Example"]}
          rows={[
            [<strong key="t">Time</strong>, <span key="tf" className="font-mono">T = 60 × D ÷ S</span>, "15 M at 5 kn: 60 × 15 ÷ 5 = 180 min = 3 h"],
            [<strong key="d">Distance</strong>, <span key="df" className="font-mono">D = S × T ÷ 60</span>, "6 kn for 40 min: 6 × 40 ÷ 60 = 4 M"],
            [<strong key="s">Speed</strong>, <span key="sf" className="font-mono">S = 60 × D ÷ T</span>, "3.1 M in 30 min: 60 × 3.1 ÷ 30 = 6.2 kn"],
          ]}
        />
        <Interactive title="The 60D = ST calculator" instructions="Choose what you want to find, then set the other two. The working is shown step by step.">
          <SpeedTriangle />
        </Interactive>
        <p>Two shortcuts are worth learning by heart:</p>
        <ul>
          <li>
            <strong>Minutes per mile.</strong> Sixty divided by your speed is how long a mile takes: 15 minutes at 4 knots,
            12 at 5, 10 at 6.
          </li>
          <li>
            <strong>The six-minute rule.</strong> Six minutes is a tenth of an hour, so in six minutes you cover a tenth of your
            speed: 0.6 M at 6 knots, 0.5 M at 5.
          </li>
        </ul>
        <Table
          head={["Speed", "One mile takes", "In an hour", "Fifteen miles take"]}
          rows={SPEED_ROWS.map((s) => [`${s} kn`, `${num(60 / s, 1)} min`, `${s} M`, hm(minutesAt(15, s))])}
        />
        <Interactive title="Six-minute rule quick-fire" instructions="How far in the time shown? Start with a tenth of the speed.">
          <SixMinuteQuickFire />
        </Interactive>
        <Callout kind="warning" title="The decimal-hours trap">
          <p>
            A calculator gives time in hours as a decimal. 1.5 hours is one hour <em>thirty</em>, not one hour fifty, and 2.3
            hours is two hours eighteen. Multiply the decimal part by 60 to get minutes, or work in minutes from the start with
            60D = ST and the trap never arises.
          </p>
        </Callout>
      </Section>

      <Section id="day" title="Sizing a charter day">
        <p>
          A good charter day is <strong>15 to 20 miles</strong>. At five to six knots that is three to four hours of sailing,
          which leaves room for a swim stop, a long lunch and an unhurried arrival. Most of the legs in our cruising guides
          sit in that range on purpose:
        </p>
        <Table
          head={["Leg", "Area", "Distance", `At ${PLANNING_SPEED} kn`]}
          rows={SAMPLE_LEGS.map((l) => [`${l.from} to ${l.to}`, l.area, `about ${l.nm} M`, hm(minutesAt(l.nm))])}
        />
        <p>Three things make a day longer than the sum suggests:</p>
        <ul>
          <li>
            <strong>Average speed.</strong> A charter yacht may touch seven knots, but light patches, tacking, sail changes
            and the last mile into harbour pull the average down. Plan on <strong>five knots</strong>, and treat anything
            better as a bonus.
          </li>
          <li>
            <strong>Upwind legs.</strong> A yacht can’t sail straight into the wind; she zigzags at roughly 45° either side
            of it, so the distance through the water can be half as far again as the line on the chart. Allow more time, or
            plan to motor.
          </li>
          <li>
            <strong>Stops.</strong> A swim, lunch at anchor, a wait for fuel: write them into the plan, because they always
            take longer than you think.
          </li>
        </ul>
        <KeyIdea>Fifteen to twenty miles, planned at five knots, with the stops written in. Save the 25 to 30 mile days for a settled forecast.</KeyIdea>
      </Section>

      <Section id="arrive" title="Arrive in good time">
        <p>Plan the day backwards, from when you want to arrive, because three things on a charter happen at the end of the day:</p>
        <ul>
          <li>
            <strong>The afternoon breeze.</strong> In much of the Mediterranean the wind builds through the afternoon: the
            maestral in Croatia from late morning, the maistro in the Ionian from around midday. It is lovely to sail in, and
            much harder to berth in. Mooring stern-to in a crosswind is the trickiest job of the day.
          </li>
          <li>
            <strong>Full harbours.</strong> In summer, popular town quays and buoy fields fill by mid-afternoon. Aim to be in
            by about three.
          </li>
          <li>
            <strong>Darkness.</strong> Charter contracts usually forbid sailing after dark, and harbours, rocks and unlit pot
            buoys are far harder to see at dusk. Keep at least a couple of hours of daylight in hand. Sunset in the
            Mediterranean is between about half past eight and half past nine in midsummer, depending on where you are, and
            much earlier in spring and autumn; in the Seychelles it
            is dark by about half past six all year.
          </li>
        </ul>
        <Worked
          title="Eighteen miles, in by 1500, with an hour for lunch"
          steps={[
            `Sailing time at ${PLANNING_SPEED} knots: 60 × 18 ÷ ${PLANNING_SPEED} = ${minutesAt(18)} minutes = ${hm(minutesAt(18))}.`,
            `Add the hour for lunch: ${hm(minutesAt(18) + 60)} in all.`,
            `Work back from the arrival: 1500 − ${hm(minutesAt(18) + 60)} = ${clock(15 * 60 - minutesAt(18) - 60)}.`,
          ]}
          answer={`Leave by ${clock(15 * 60 - minutesAt(18) - 60)}: in practice, aim to slip the lines at ten.`}
        />
        <Interactive title="Plan a day" instructions="Pick a leg from our cruising guides (or enter your own), a planning speed, your stops and when you want to arrive. The planner works back to a leave-by time and checks the daylight.">
          <DayPlanner legs={LEGS} />
        </Interactive>
        <Callout kind="remember" title="Speed through the water and over the ground">
          <p>
            The log measures your speed through the water; the plotter’s GPS measures your speed over the ground. Where a
            current or tidal stream runs, the two differ, and it is the speed over the ground that decides when you arrive. Most
            of the Mediterranean has little current, but always glance at both.
          </p>
        </Callout>
      </Section>
    </>
  );
}

const lesson: LessonContent = {
  objectives: [
    "Use nautical miles, cables and knots, and know why a minute of latitude is a mile",
    "Measure distance on the chart with dividers and the latitude scale, including routes with several legs",
    "Use 60D = ST, the six-minute rule and minutes per mile to work out time, distance, speed and ETA",
    "Size a charter day and work back to a leave-by time that beats the afternoon wind, the crowds and the dark",
  ],
  keyTerms: [
    { term: "Nautical mile (M)", definition: "One minute of latitude: 1,852 m." },
    { term: "Cable", definition: "A tenth of a nautical mile, about 185 m." },
    { term: "Knot (kn)", definition: "A speed of one nautical mile an hour." },
    { term: "Latitude scale", definition: "The scale down the sides of the chart: the one to measure distance on." },
    { term: "Dividers", definition: "A two-legged measuring tool, opened between two points and read against the latitude scale." },
    { term: "60D = ST", definition: "Distance in miles, speed in knots, time in minutes: know any two and work out the third." },
    { term: "Six-minute rule", definition: "In six minutes you cover a tenth of your speed in miles." },
    { term: "ETA", definition: "Estimated time of arrival: departure time plus passage time." },
    { term: "Speed over the ground", definition: "Speed past the seabed, shown by GPS; it differs from log speed when the water is moving." },
  ],
  Body,
  Video,
  Exercises,
};

export default lesson;
