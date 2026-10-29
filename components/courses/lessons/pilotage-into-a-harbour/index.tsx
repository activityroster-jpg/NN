import type { LessonContent } from "@/lib/courses/types";
import { LEADING_LINE } from "@/lib/courses/navigation/practice-chart";
import { Callout, Figure, Interactive, KeyIdea, Section, Table, Worked } from "../../LessonParts";
import { PilotBookPage, PilotageCardSketch, PlanChart } from "./art";
import { Exercises, Video } from "./client";
import {
  ABORT_MAG, ABORT_TRUE, BUOY_BEARINGS, C10_PAST34, CLEARS_MEW, CLEARS_WRECK, DEEP_CONTOUR, DRAUGHT, LEAD_BRG, LEGS, M, MEW, MEW_ABEAM_MAG,
  MEW_ABEAM_PAST12, MEW_CLEAR, NO1, NO2, NO3, NO4, PAIR12_WIDTH, SPEED, SPIRE_CHECK_MAG, SPIRE_CLEAR, SPIRE_CLEAR_MAG, SPIRE_LIMIT, T,
  TIMES, TOTAL_DISTANCE, TOTAL_MINUTES, WARN_CONTOUR, WRECK, WRECK_BY_MEW_LINE, WRECK_TO_SPIRE, cab, limitText, onTheBow, signedDiff,
} from "./data";
import { ClearingChecker, LeadingLightsSim, NextMarkQuiz, PlanStepper } from "./widgets";

const L1 = LEGS[0]!;
const L2 = LEGS[1]!;
const L3 = LEGS[2]!;
const dist = (nm: number) => (nm < 1 ? `${cab(nm)} cables` : `${nm.toFixed(1)} miles`);
const EITHER_SIDE = Math.round(Math.abs(signedDiff(BUOY_BEARINGS.no1, LEAD_BRG)));

function Body() {
  return (
    <>
      <Section id="why" title="Pilotage: the last mile, by eye">
        <p>
          Most charter trouble happens in the last mile: in the afternoon, with the wind up, the crew tired and twenty other
          boats heading for the same quay. Close to land the marks come up every few minutes and the decisions come faster
          than you could ever work them out on the chart. Navigating by eye in confined water like this is{" "}
          <strong>pilotage</strong>.
        </p>
        <p>
          The secret is that the thinking is done before you arrive, at the chart table or over breakfast. You prepare a short
          plan of the way in, and on deck you do not plot anything at all: you look up, compare what you see with the plan,
          and tick things off.
        </p>
        <KeyIdea>Plan at the table. On deck: look, compare, tick off.</KeyIdea>
      </Section>

      <Section id="pilot-book" title="Reading the pilot book page">
        <p>
          The pilot book (or cruising guide) has a page for each harbour and bay, usually with a sketch plan. It is the single
          most useful thing to read before you arrive. Look for:
        </p>
        <ul>
          <li><strong>The approach</strong>: which way to come in, and the line to follow.</li>
          <li><strong>The dangers</strong>: rocks, shoals, reefs, wrecks, fish farms and shallow patches off the entrance.</li>
          <li><strong>What you will see</strong>: the lighthouse, the breakwater, the leading marks, a conspicuous church or hotel.</li>
          <li><strong>The lights and depths</strong>, in case you are late, and to set a stop depth for the sounder.</li>
          <li><strong>Where to berth or anchor</strong>, whom to call, and on which VHF channel.</li>
          <li><strong>The shelter</strong>: which way the harbour or bay is open, and so which wind sends a swell in.</li>
        </ul>
        <Figure caption="A pilot book page for the practice harbour, Port Kerran. Real pilot books add a sketch plan, photographs and the facilities ashore.">
          <PilotBookPage />
        </Figure>
        <p>
          Real pages read the same way. Our Central Dalmatia cruising guide describes Milna on Brač as a deep, sheltered inlet, one of the
          best-protected harbours in the area. In Göcek, our note for Sarsala Bay warns of a fish farm near the entrance. In
          the British Virgin Islands, Anegada is surrounded by reef: the advice is to go only in good daylight and follow the
          marked channel to Setting Point.
        </p>
        <Callout kind="tip" title="Read it twice">
          <p>
            Read the page the evening before, when you choose the harbour, and again an hour out, when you can see the coast.
            Check the edition: harbours change, and a pontoon or a breakwater may be newer than the book.
          </p>
        </Callout>
      </Section>

      <Section id="plan" title="Planning the approach, leg by leg">
        <p>
          Start the plan from a point you can recognise offshore, ideally one with deep water all round it. Then break the way
          in into <strong>legs</strong>, each from one mark you can recognise to the next. For each leg note:
        </p>
        <ol>
          <li><strong>The heading</strong>, in °M for the steering compass, with the true figure beside it.</li>
          <li><strong>The distance and the time</strong> it should take, so you know when the next mark is due.</li>
          <li><strong>What you expect to see</strong>: the next marks, what they look like and where they will appear.</li>
          <li><strong>The depth</strong> you expect, and the reading that means stop.</li>
          <li><strong>The checks</strong>: transits, clearing bearings, and where you will stop and decide.</li>
        </ol>
        <Figure caption={`The plan on the practice chart: three legs up the Port Kerran leading line from the Approach buoy, and the western limit for the arrival, a clearing line on the church spire with its danger side hatched. Dotted rings: 4 cables round the wreck and Mew Rock.`}>
          <PlanChart id="nn-pilotage-plan" />
        </Figure>
        <Worked
          title="Leg 1: Kerran Approach buoy to No 1 and No 2"
          steps={[
            <>The track runs up the leading line: {T(LEAD_BRG)}. Variation 3°W, so add 3° for the compass: {M(L1.magnetic)}.</>,
            <>On the chart, the Approach buoy to the line joining No 1 and No 2 is {L1.distance.toFixed(1)} miles.</>,
            <>At {SPEED} knots a mile takes {60 / SPEED} minutes: {L1.distance.toFixed(1)} × {60 / SPEED} ≈ {L1.minutes} minutes.</>,
            <>Expect No 1, a green cone ({NO1.light}), {onTheBow(LEAD_BRG, BUOY_BEARINGS.no1)}, and No 2, a red can ({NO2.light}), {onTheBow(LEAD_BRG, BUOY_BEARINGS.no2)}: {EITHER_SIDE}° either side of the line, {cab(PAIR12_WIDTH)} cables apart, with the leading lights in line ahead.</>,
          ]}
          answer={<>Leg 1: {M(L1.magnetic)}, {L1.distance.toFixed(1)} miles, {L1.minutes} minutes.</>}
        />
        <Table
          head={["Leg", "Heading", "Distance · time", "Expect to see"]}
          rows={[
            [<strong key="1">1 · Approach buoy to Nos 1 and 2</strong>, `${M(L1.magnetic)} (${T(L1.trueCourse)})`, `${dist(L1.distance)} · ${L1.minutes} min`, "No 1 to starboard, No 2 to port; leading lights in line"],
            [<strong key="2">2 · Nos 1 and 2 to Nos 3 and 4</strong>, `${M(L2.magnetic)} (${T(L2.trueCourse)})`, `${dist(L2.distance)} · ${L2.minutes} min`, `No 3 (${NO3.light}) and No 4 (${NO4.light}); Mew Rock beacon abeam (${M(MEW_ABEAM_MAG)}) after ${cab(MEW_ABEAM_PAST12)} cables`],
            [<strong key="3">3 · Nos 3 and 4 to the harbour</strong>, `${M(L3.magnetic)} (${T(L3.trueCourse)})`, `${dist(L3.distance)} · ${L3.minutes} min`, "No more buoys; the inlet narrowing, depth falling"],
            [<strong key="a">Way out</strong>, `${M(ABORT_MAG)} (${T(ABORT_TRUE)})`, "Back to the Approach buoy", "Leading lights in line astern"],
          ]}
        />
        <p>
          At {SPEED} knots the whole approach, {TOTAL_DISTANCE.toFixed(1)} miles, takes about {TOTAL_MINUTES} minutes: arriving at the
          Approach buoy at {TIMES.ka}, you are off the harbour at {TIMES.end}.
        </p>
        <Interactive title="Step through the plan" instructions="Pick each part of the plan to see its leg on the chart and its notes. Tick off each pair of marks as you would on deck.">
          <PlanStepper />
        </Interactive>
        <Figure caption="The same plan as a skipper might sketch it on a card for the cockpit: legs to scale along the line, not across it. The boxes are ticked on deck with the time.">
          <PilotageCardSketch />
        </Figure>
        <Callout kind="remember" title="Depths on a Mediterranean charter">
          <p>
            The practice chart has tides, but in most of the Mediterranean the tide is only a few tens of centimetres, so the
            sounder reads close to the charted depth. The plan uses charted depths: over {DEEP_CONTOUR} m to No 3 and No 4, then
            shoaling, with the 10 m contour {cab(C10_PAST34)} cables past them. With a draught of about {DRAUGHT.toFixed(1)} m, make
            under {WARN_CONTOUR} m on the sounder your stop reading. In places with a real tide, such as Phuket or the Seychelles,
            check the tide table as well.
          </p>
        </Callout>
      </Section>

      <Section id="leading-lines" title="Leading lines">
        <p>
          Many harbours mark the safe way in with a <strong>leading line</strong>: two marks, or two lights at night, the rear one
          further away and higher. When they are in line, one directly above the other, you are on the line. The chart and the
          pilot book give its bearing from seaward; Port Kerran&apos;s leading lights ({LEADING_LINE.light}) are in line on {T(LEAD_BRG)}.
        </p>
        <Table
          head={["You see", "You are", "Steer"]}
          rows={[
            [<strong key="o">Rear directly above front</strong>, "On the line", "Hold it"],
            [<strong key="l">Rear open to the left</strong>, "Left of the line", "To starboard"],
            [<strong key="r">Rear open to the right</strong>, "Right of the line", "To port"],
          ]}
        />
        <KeyIdea>Steer towards the rear light (or rear mark) until the two line up again.</KeyIdea>
        <Interactive title="Follow the leading lights" instructions="Move the boat across the channel and closer to the lights, and watch how they open out. Then test yourself: from a hidden position, which way do you steer?">
          <LeadingLightsSim />
        </Interactive>
        <Callout kind="tip" title="Steer by the lights, not the number">
          <p>
            A cross wind or current pushes you sideways, so the heading that keeps the lights in line may be a few degrees off the
            line&apos;s bearing. Put the heading on the card as a guide, but steer by the lights: they show where you are going over
            the ground. By day the leading marks are often painted boards, triangles or beacons, and can be hard to pick out
            against the land; binoculars help.
          </p>
        </Callout>
      </Section>

      <Section id="clearing" title="Clearing bearings">
        <p>
          Sometimes a danger lies near your way in and no leading line keeps you clear. Then draw a <strong>clearing line</strong>{" "}
          from a landmark you can see, passing a safe distance clear of the danger, and measure its bearing. While the
          landmark&apos;s bearing stays on the right side of that figure, you are on the safe side of the line. To decide which side:
          imagine drifting towards the danger. If the landmark&apos;s bearing would grow, the limit is <strong>not more than</strong>{" "}
          (NMT); if it would shrink, it is <strong>not less than</strong> (NLT).
        </p>
        <Worked
          title="A western limit for the arrival at Port Kerran"
          steps={[
            <>Arriving from the south-west, the wreck ({WRECK.depth?.toFixed(1)} m over it) and Mew Rock (dries {MEW.dries?.toFixed(1)} m) lie west of the approach. The church spire, above the head of Kerran Bay, is easy to see.</>,
            <>From the wreck the spire bears {T(WRECK_TO_SPIRE.bearing)}. Take a few degrees off, so the line passes at least 4 cables east of it: {T(SPIRE_CLEAR)}.</>,
            <>Looking along the line at the spire, the wreck is on your left. Drifting towards it, the spire&apos;s bearing would grow, so the limit is NMT.</>,
            <>For the hand-bearing compass, add the 3°W variation: {limitText(SPIRE_LIMIT, SPIRE_CLEAR_MAG, "M")}.</>,
          ]}
          answer={<>Church spire {limitText(SPIRE_LIMIT, SPIRE_CLEAR)} ({limitText(SPIRE_LIMIT, SPIRE_CLEAR_MAG, "M")}): {cab(CLEARS_WRECK)} cables clear of the wreck and {cab(CLEARS_MEW)} cables clear of Mew Rock.</>}
        />
        <p>
          A clearing bearing guards only the dangers it was drawn for. A line drawn for Mew Rock alone ({limitText(MEW_CLEAR.limit, MEW_CLEAR.bearing)})
          passes only {cab(WRECK_BY_MEW_LINE.distance)} cables from the wreck, further out. Compare the two below.
        </p>
        <Interactive title="Safe or not? Check a bearing of the spire" instructions="Enter a hand-bearing compass reading of the church spire (°M), or try a random one, and see which side of the clearing line it puts you.">
          <ClearingChecker />
        </Interactive>
      </Section>

      <Section id="gap" title="Picking the gap">
        <p>
          From a few miles out, a harbour entrance is often invisible against the land behind it, and a bay looks like every
          other bay. Pick it out from what the pilot book says you will see: the lighthouse, the end of the breakwater, a
          conspicuous building, boats going in and out. Read the bearing of the entrance off the plotter and look along it with
          the hand-bearing compass. Then get onto the approach line well outside, rather than cutting the corner past the
          rocks off the entrance.
        </p>
        <p>
          Where the way in is through coral, as at Anegada in the British Virgin Islands, you navigate by the colour of the water:
          dark blue is deep, turquoise is shallow, and brown or dark patches are coral. You can only read it with the sun high
          and behind you, so go in the middle of the day, with someone on the bow, and do not trust the electronic chart alone.
        </p>
        <Interactive title="What should you see next?" instructions="At each position on the Port Kerran approach, choose what the plan says you should see next. The view ahead appears once you have answered.">
          <NextMarkQuiz />
        </Interactive>
      </Section>

      <Section id="last-mile" title="The last mile into the marina">
        <ul>
          <li><strong>Slow down</strong>, to five knots or less, so there is time to look and think.</li>
          <li><strong>Take the sails down outside</strong> the entrance, where there is room to drift while you do it.</li>
          <li><strong>Fenders and lines ready</strong> on both sides if you do not yet know which side, and brief the crew: who does the stern lines, who takes the lazy line, who fends off.</li>
          <li><strong>Decide the stop depth</strong> before you go in, and watch the sounder.</li>
          <li><strong>Know your way out</strong>: here {T(ABORT_TRUE)} ({M(ABORT_MAG)}) back down the line with the lights astern.</li>
        </ul>
        <h3>Decision points, and a missing mark</h3>
        <p>
          Choose in advance where you will stop and decide. At the Approach buoy: can you identify the marks and the leading
          lights? If not, stay in the deep water there until you can. Off the entrance: is the berth clear, is the crew ready?
          If anything does not add up, use the way out.
        </p>
        <p>
          Buoys drag, sink or get moved, and lights fail. Do not go hunting for a missing mark: stay on the leading line, check
          the depth and the time, and use a check bearing. Here, Mew Rock beacon bears {M(MEW_ABEAM_MAG)} from the line{" "}
          {cab(MEW_ABEAM_PAST12)} cables past No 1 and No 2. If the leading lights cannot be picked out, the church spire stands
          almost on the line, at about {M(SPIRE_CHECK_MAG)}.
        </p>
      </Section>

      <Section id="marina" title="Calling the marina">
        <p>
          Call before you arrive, ideally from a few miles out: by phone, or on the VHF working channel the pilot book gives for
          the marina or harbour office. Channel 16 is for distress, safety and calling, not for arranging a berth. Say:
        </p>
        <ul>
          <li>the boat&apos;s name, and that you are a visiting charter yacht;</li>
          <li>her length (and beam, for a catamaran);</li>
          <li>how many nights you want, and when you will arrive.</li>
        </ul>
        <p>
          They will tell you where to go and which side to have the fenders. In many Mediterranean marinas a marinero comes out
          in a dinghy, leads you to the berth and hands you the lazy line: a line from a sunken mooring that you take forward to
          the bow while you go in stern-to and the crew pass the stern lines ashore. Stern-to mooring is a skill of its own, and
          our Med mooring video takes you through it step by step. In busy towns in July and August the quays fill by
          mid-afternoon: another reason to arrive early.
        </p>
      </Section>

      <Section id="daylight" title="Arrive with daylight">
        <p>
          Plan every day to arrive with plenty of daylight to spare. Many charter contracts ban sailing at night, and after
          dark the unlit fishing floats, nets and mooring buoys become very hard to see: in Phang Nga Bay, off Phuket, fishing
          nets and floats are often unlit. Near the equator the dark comes early and quickly: in the Seychelles it is dark by
          about half past six all year round.
        </p>
        <p>
          So aim to be in by mid-afternoon, and if the day is running late, choose the easier harbour: one with a wide, lit
          entrance and deep water, or a bay you already know. The morning plan from Lesson 1 always has a bolt-hole for this.
        </p>
        <Table
          head={["Mistake", "What goes wrong", "The defence"]}
          rows={[
            [<strong key="m">Misidentifying a mark</strong>, "You take No 4 for No 2, or a mooring buoy for a channel mark, and turn early.", "Check colour, shape, topmark, number and light against the plan."],
            [<strong key="h">Buoy hopping</strong>, "Steering from buoy to buoy while the wind sets you sideways onto the shallows.", "Stay on the leading line or transit; know the track between marks."],
            [<strong key="c">Losing count</strong>, "You expect the harbour when there is another pair to come.", "Tick off each mark with the time."],
            [<strong key="d">Heads down</strong>, "Someone goes below to look at the chart in the middle of the channel.", "Do the work before you arrive; hand over the lookout first."],
            [<strong key="l">Arriving late</strong>, "The berth has gone, the light is going and the crew are tired.", "Leave early; choose the easier harbour if you are behind."],
          ]}
        />
        <p className="text-sm text-text-secondary">
          The Isle of Kerran and Port Kerran are fictional: never use this plan or chart to navigate a real boat. Variation on
          the practice chart is 3°W; use the compass rose on the chart of your own cruising area.
        </p>
      </Section>
    </>
  );
}

const lesson: LessonContent = {
  objectives: [
    "Read a pilot book page and turn it into a short plan of the way in, leg by leg",
    "Follow a leading line, and use a clearing bearing to stay clear of a danger",
    "Pick out a harbour entrance, run the last mile with the crew briefed, and know your way out",
    "Call the marina before you arrive, and plan every day to arrive in good daylight",
  ],
  keyTerms: [
    { term: "Pilotage", definition: "Navigating by eye in confined water, using marks, transits, bearings and the depth." },
    { term: "Pilot book", definition: "A guide with a page for each harbour and bay: approach, dangers, lights, berths and shelter." },
    { term: "Leg", definition: "One part of the plan, from one recognisable mark to the next." },
    { term: "Leading line", definition: "Two marks or lights, the rear one higher, that line up along the safe way in." },
    { term: "Clearing bearing", definition: "A bearing of a landmark, not more than or not less than a figure, that keeps you clear of a danger." },
    { term: "Check bearing", definition: "A bearing, often of a mark abeam, that tells you how far along a leg you are." },
    { term: "Decision point", definition: "A place chosen in advance to confirm all is as planned before you carry on." },
    { term: "Way out", definition: "A planned route back to open water if anything does not match the plan." },
    { term: "Lazy line", definition: "A line from a sunken mooring, handed up in a marina, that holds the bow when you moor stern-to." },
  ],
  Body,
  Video,
  Exercises,
};

export default lesson;
