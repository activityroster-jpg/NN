import type { LessonContent } from "@/lib/courses/types";
import { formatBearing } from "@/lib/courses/geo";
import { GUIDES } from "@/lib/cruising";
import { croatiaSplit } from "@/lib/cruising/guides/croatia-split";
import { Callout, Interactive, KeyIdea, Section, Table, Worked } from "../../LessonParts";
import { AIS_FERRY, AIS_FERRY_CPA, AIS_OWN, DEMO, DEMO_CURRENT, DEMO_HEADING, DEMO_SPEED, hm, one, weekOf } from "./data";
import { Exercises, Video } from "./client";
import { AisCpa, HeadingCog, PlotterZoom, WaypointQuiz, WeekPlanner } from "./widgets";

const WEEKS = GUIDES.map(weekOf);
const CROATIA = weekOf(croatiaSplit);
const CROATIA_LONGEST = CROATIA.legs.reduce((a, l) => (l.nm > a.nm ? l : a));

function Body() {
  return (
    <>
      <Section id="plotter" title="The chart plotter, and what the zoom level hides">
        <p>
          The chart plotter at the helm is the best navigation tool on a charter yacht. It shows the electronic chart with your
          position, your speed and the line you are moving along, and it does it all day without getting tired. It has one big
          trap, and it is the zoom.
        </p>
        <p>
          An electronic chart is drawn differently at different zoom levels. Zoomed out, to fit a whole day&apos;s sail on the screen,
          most plotters leave things off to keep the picture clear: the soundings, small rocks, sometimes whole reefs and shallow
          patches. The route line you drew looks fine. Zoom in along the leg and the same line may run straight over a rock.
        </p>
        <Interactive title="What the zoom level hides" instructions="Step through the zoom levels on the same route. Watch for the moment the danger appears, then what happens when you zoom in too far.">
          <PlotterZoom />
        </Interactive>
        <p>
          The opposite problem is <strong>overzoom</strong>. Zoom in beyond the scale the chart was made at and the plotter simply
          enlarges it: coastlines go blocky, and the chart looks far more precise than the survey behind it. Some plotters warn you
          with a hatched pattern or an &quot;overzoom&quot; note; many do not.
        </p>
        <KeyIdea>Plan zoomed out, check zoomed in. Follow every leg on the screen at a scale where the soundings show, and keep a sensible distance off every danger.</KeyIdea>
        <Callout kind="warning" title="It happens to professionals">
          <p>
            In 2014 a Volvo Ocean Race yacht, Team Vestas Wind, ran onto a reef in the Indian Ocean at night. The inquiry found the
            reef had not been apparent on the electronic chart at the zoom level the crew were using. Nobody was badly hurt; the boat
            was wrecked. It is the clearest lesson there is in zooming in.
          </p>
        </Callout>
      </Section>

      <Section id="chart-age" title="How old is the chart, and how good is the survey?">
        <p>
          The charts in a charter boat&apos;s plotter live on a memory card or in the plotter&apos;s own memory, and they are not always
          kept up to date. At check-in it is worth asking how old the charts are; on many plotters the chart card&apos;s date is in the
          settings or the &quot;about&quot; screen. New marinas, moved buoys and changed harbour works may be missing.
        </p>
        <p>
          Every chart, new or old, is only as good as the survey behind it, and some areas were last surveyed long before satellite
          positioning. In parts of the Caribbean, the Seychelles and Thailand, a reef can sit a little away from where the screen
          puts it. The position from the satellites is accurate; it is the chart under it that can be out.
        </p>
        <Callout kind="tip" title="Reading the water near reefs">
          <p>
            In the British Virgin Islands, the Seychelles or round Phuket, approach anchorages with the sun high and behind you,
            polarised sunglasses on and someone on the bow. The old rhyme is a good guide: <em>brown, brown, run aground; white,
            white, you might; green, green, nice and clean; blue, blue, sail on through.</em> Brown is coral heads or rock, white is
            shallow sand, green is moderate depth, deep blue is deep water. Low sun, cloud and choppy water hide all of it, so plan
            to arrive by early afternoon.
          </p>
        </Callout>
      </Section>

      <Section id="cog" title="Position, heading and course over the ground">
        <p>The plotter shows three different things, and mixing them up is one of the commonest mistakes on a charter.</p>
        <Table
          head={["", "What it is", "Where it comes from"]}
          rows={[
            [<strong key="p">Position</strong>, "Where you are, as latitude and longitude, and the boat symbol on the chart", "The satellite receiver (GPS and its cousins)"],
            [<strong key="h">Heading</strong>, "The way the bow points", "The compass, or a heading sensor wired to the plotter"],
            [<strong key="c">Course over the ground (COG)</strong>, "The way you are actually moving over the seabed", "Worked out from how your position changes"],
            [<strong key="s">Speed over the ground (SOG)</strong>, "How fast you are moving over the seabed", "Worked out from the position too; the log shows speed through the water"],
          ]}
        />
        <p>
          With no current and no wind pushing you sideways, heading and course over the ground are the same. With a current
          across your course, or leeway when the wind pushes the boat sideways under sail, they are not. The course over the
          ground already includes both, so it is the line that shows where you will end up. If it points at a rock, you are
          going to the rock, whatever the bow says.
        </p>
        <Worked
          title="A current across the course"
          steps={[
            `You steer ${formatBearing(DEMO_HEADING, "T")} at ${DEMO_SPEED} knots through the water.`,
            `A current of ${one(DEMO_CURRENT.rate)} knots is setting due south, across your course.`,
            `The plotter shows course over the ground ${formatBearing(DEMO.cog, "T")} and speed over the ground ${one(DEMO.sog)} knots.`,
            "The boat moves about fourteen degrees to starboard of where the bow points. To make good 090°, point the bow up to the north of it until the course over the ground line reads 090°.",
          ]}
          answer={`Heading ${formatBearing(DEMO_HEADING, "T")}, but you are really going ${formatBearing(DEMO.cog, "T")}.`}
        />
        <Interactive title="Heading against course over the ground" instructions="Change the heading, the speed, the current and the leeway, and watch the two lines part company.">
          <HeadingCog />
        </Interactive>
        <Callout kind="remember">
          <p>
            On some plotters the boat symbol points along the heading; on others, with no heading sensor fitted, it points along the
            course over the ground. At very low speeds, in a marina or at anchor, the course over the ground wanders about and means
            little.
          </p>
        </Callout>
      </Section>

      <Section id="waypoints" title="Waypoints, routes, tracks and the man overboard button">
        <ul>
          <li>
            <strong>A waypoint</strong> is a position you store in the plotter: the start of a harbour approach, the point off a
            headland where you turn, the entrance to a bay. You can tap it onto the chart or type in its latitude and longitude.
          </li>
          <li>
            <strong>A route</strong> joins waypoints into legs. Following a route, the plotter shows the bearing and distance to the
            next waypoint, the time to get there and how far you are off the line (the cross-track error).
          </li>
          <li>
            <strong>The track</strong> is the trail the plotter leaves behind you. It is the easiest way to get back out of a bay
            you came into, along the line you know is clear, especially after dark.
          </li>
        </ul>
        <p>
          The one rule for waypoints: <strong>never put one on a buoy, a rock or a wreck.</strong> Satellite positions are good
          enough to take you right onto it, and every other boat aiming at the same mark converges on the same spot. Set the
          waypoint a little way off, in clear water, on the side the mark tells you is safe. Then zoom in and check each leg of the
          route clears every danger. If your plotter offers automatic routing, treat its line as a suggestion and check it the
          same way.
        </p>
        <Interactive title="Good or bad waypoint?" instructions="Judge each proposed waypoint on the practice chart. Zoom in if you need to.">
          <WaypointQuiz />
        </Interactive>
        <Callout kind="warning" title="The man overboard button">
          <p>
            Every plotter has a man overboard function, often a dedicated button or a long press. Find it at the briefing. If anyone
            goes over the side: shout, point and keep pointing, throw the lifebuoy, and press the button. It marks the spot and shows
            the bearing and distance back. A current carries the person away from the marked spot, so the pointing crew member
            matters as much as the plotter.
          </p>
        </Callout>
      </Section>

      <Section id="apps" title="Phones and tablets: a superb second opinion">
        <p>
          A charting app on a tablet or phone is the best backup you can carry, and handy for planning in the cockpit or the
          café. Its limits are practical ones:
        </p>
        <ul>
          <li><strong>Offline charts.</strong> Download the charts for the whole cruising area before you leave Wi-Fi. Mobile signal comes and goes at sea, and roaming data can be expensive.</li>
          <li><strong>Position needs no signal.</strong> The phone&apos;s satellite receiver works without mobile coverage, but only shows you something useful if the charts are already on it.</li>
          <li><strong>Battery.</strong> A bright screen and continuous positioning flatten a phone in a few hours. Keep it on a charger or a power bank.</li>
          <li><strong>Heat.</strong> In a Mediterranean or tropical sun, phones overheat and dim or switch off. Keep it in the shade.</li>
          <li><strong>Water.</strong> Spray and a drop in the cockpit end most phones. Use a waterproof case on a lanyard.</li>
        </ul>
        <KeyIdea>The plotter, the app and the paper chart should agree. When they do not, slow down and find out why.</KeyIdea>
      </Section>

      <Section id="ais" title="AIS: seeing the ships, and what it does not show">
        <p>
          AIS (Automatic Identification System) is a radio system in which vessels broadcast their name, position, course and
          speed. On a plotter with AIS, ships appear as triangles moving across the chart. Big ships and passenger ships, ferries
          included, must transmit it. Many yachts carry a transmitter too; some charter boats have only a receiver, so you see
          others but they do not see you.
        </p>
        <p>
          From both boats&apos; courses and speeds the plotter works out the <strong>closest point of approach</strong> (CPA) and the
          time until it (TCPA), assuming nobody alters course. In the ferry example below, a ferry {AIS_FERRY.range} miles away on a
          bearing of {formatBearing(AIS_FERRY.bearing, "T")}, doing {AIS_FERRY.speed} knots, while you make {AIS_OWN.speed} knots
          due north, has a CPA of {AIS_FERRY_CPA.cpa.toFixed(1)} miles in about {Math.round(AIS_FERRY_CPA.tcpa ?? 0)} minutes: a
          steady bearing and a closing range, which means risk of collision.
        </p>
        <Interactive title="AIS: how close will she pass?" instructions="Try the examples, then move the sliders. The plot shows both boats at the closest point of approach.">
          <AisCpa />
        </Interactive>
        <Callout kind="remember" title="AIS is not a lookout">
          <p>
            Fishing boats, small motor boats, ribs and many yachts do not show on AIS at all. Keep a lookout by eye all the time,
            and check any ship that worries you with a compass bearing: if the bearing does not change as she gets closer, act early.
          </p>
        </Callout>
      </Section>

      <Section id="vhf" title="The VHF radio: channel 16, calling a marina, and a Mayday in outline">
        <p>
          The VHF radio is the boat&apos;s telephone to the coastguard, the marinas and other boats. Most charter countries and
          companies expect the skipper or a crew member to hold a radio operator&apos;s certificate, such as the Short Range
          Certificate; check yours before you book. In an emergency anyone on board may use it.
        </p>
        <ul>
          <li><strong>Channel 16</strong> is the international channel for distress, safety and calling. Keep the radio on and listening to it at sea.</li>
          <li><strong>Marinas</strong> usually work on their own channel, given in the pilot book or the marina&apos;s website. It is often not 16.</li>
          <li><strong>Low power</strong> (usually one watt) is enough for a marina in sight; use high power for long range.</li>
        </ul>
        <Worked
          title="Calling a marina for a berth"
          steps={[
            "Find the marina's channel in the pilot book and select it. Listen first, so you do not talk over someone.",
            <><em>Marina Milna, Marina Milna, this is sailing yacht Blue Moon, Blue Moon, over.</em></>,
            "Wait for the reply. Then say what you want: a berth for one night, the length of the boat, and how soon you will arrive.",
            "Follow their instructions: often which pontoon, which side to have fenders, and whether a marinero will meet you.",
          ]}
          answer="Name of the station twice, this is, your boat's name twice, over. Short, clear, and listen first."
        />
        <Table
          head={["Call", "When"]}
          rows={[
            [<strong key="m">Mayday</strong>, "Grave and immediate danger to the boat or a person: a fire you cannot control, sinking, someone seriously injured or overboard and not recovered."],
            [<strong key="p">Pan-Pan</strong>, "Urgent, but no immediate danger to life: a disabled boat drifting towards danger, a crew member who needs medical advice."],
            [<strong key="s">Sécurité</strong>, "Safety information for others, usually from the coastguard: navigation warnings and weather."],
          ]}
        />
        <p>A Mayday, in outline only (the briefing and the card by the radio give the exact form):</p>
        <ol>
          <li>If the radio has a red <strong>distress button</strong> (DSC), lift the cover and hold it down until it sends. It transmits your position automatically.</li>
          <li>On channel 16, high power: <em>Mayday, Mayday, Mayday, this is</em> the boat&apos;s name three times.</li>
          <li><em>Mayday</em>, the boat&apos;s name, then <strong>where you are</strong> (latitude and longitude from the plotter, or a bearing and distance from a headland).</li>
          <li><strong>What is wrong</strong>, <strong>what help you need</strong>, and <strong>how many people</strong> are on board. Any other useful information. <em>Over.</em></li>
          <li>Listen. If nobody answers, repeat it.</li>
        </ol>
        <Callout kind="tip" title="At the briefing">
          <p>Ask to see the radio switched on, find the distress button and the card with the Mayday procedure, and check the boat&apos;s name and call sign written by the set. Put the plotter&apos;s position where the person on the radio can read it.</p>
        </Callout>
      </Section>

      <Section id="week" title="Planning seven days">
        <p>
          A charter week runs Saturday to Saturday, but the sailing happens in six days. Every one of our cruising guides follows
          the same shape:
        </p>
        <Table
          head={["Day", "What happens"]}
          rows={[
            ["Saturday", "Check-in from late afternoon: the briefing, the shopping, the first night in the base marina."],
            ["Sunday", "A short first sail while everyone finds their feet."],
            ["Monday to Wednesday", "The longer passages and the furthest point of the week, while you have days in hand."],
            ["Thursday", "Work back towards the base: aim to end within an easy half day of it."],
            ["Friday", "Back in the base marina by late afternoon or early evening, refuelled, for the inspection."],
            ["Saturday", "Check-out, usually by nine in the morning."],
          ]}
        />
        <p>Some rules of thumb that make a week work:</p>
        <ul>
          <li><strong>Ten to twenty miles a day</strong> is three or four hours at a realistic five or six knots, with time to swim, eat ashore and arrive while berths and buoys are still free.</li>
          <li><strong>A rest day, or a short day,</strong> mid-week keeps everyone happy and gives you slack when the weather moves the plan.</li>
          <li><strong>Long and far early.</strong> Put the longest crossing and the furthest point early in the week. If the wind turns, you are coming home, not setting out.</li>
          <li><strong>Weather windows.</strong> Read the week&apos;s forecast at check-in and every morning, and move the plan round the windy days: do the open crossing on the settled day, and spend the windy one in a sheltered harbour.</li>
          <li><strong>A bolt-hole every day.</strong> For each passage, know the nearest harbour or bay you could reach if someone is unwell or the wind builds, and which winds it is open to.</li>
        </ul>
        <Worked
          title={`A week in ${CROATIA.name}, from ${CROATIA.base}`}
          steps={[
            <>Six legs: {CROATIA.legs.map((l) => `${l.day} ${l.to.split(",")[0]} ${l.nm}`).join(", ")} miles. {CROATIA.total} miles in all, about {hm((CROATIA.total / 5) * 60)} at sea at five knots.</>,
            <>The longest leg, {CROATIA_LONGEST.from} to {CROATIA_LONGEST.to} ({CROATIA_LONGEST.nm} miles, most of it open water), is on {CROATIA_LONGEST.day}, early, so a bad forecast can push it back a day without breaking the week.</>,
            "Weather: the guide warns that Komiža is open to the west, so leave if a strong westerly or the jugo is forecast. In a bura, shelter on the mainland side of the islands or stay in harbour.",
            "Bolt-holes: Milna on Brač, a deep inlet sheltered from most directions, is never far away in the second half of the week.",
            <>Thursday night in Milna leaves {CROATIA.legs[5]!.nm} miles back to {CROATIA.base} on Friday: an easy morning, fuel before the queues, and in before the inspection.</>,
          ]}
          answer="Long crossing early, a short Thursday, an easy Friday, and a sheltered harbour within reach every day."
        />
        <Interactive title="Plan the week" instructions="Pick one of our cruising areas. Toggle days in port for a rest day or a weather day and see what happens to the rest of the week, then change the speed and departure time.">
          <WeekPlanner weeks={WEEKS} />
        </Interactive>
      </Section>

      <Section id="friday" title="Getting back on Friday">
        <p>
          All our cruising guides start and end at the base marina, and the last leg is Friday&apos;s. Most bases want the boat back
          by late afternoon or early evening on Friday, refuelled, so they can inspect it before Saturday morning&apos;s check-out.
          The base tells you the exact time at the briefing.
        </p>
        <ul>
          <li><strong>Thursday night within an easy half day of the base,</strong> so a windy Friday morning is an inconvenience, not a crisis.</li>
          <li><strong>Fuel early.</strong> Fuel stations near the bases have long queues on Friday afternoon. Refuel on Friday morning or on Thursday.</li>
          <li><strong>If the weather stops you,</strong> call the base early: they would far rather collect the boat from a safe harbour than have you sail into a gale to make the deadline.</li>
        </ul>
        <Callout kind="warning" title="Never race the deadline">
          <p>
            Late returns cost money; bad decisions cost far more. If the forecast for Friday is bad, come back on Thursday. If you
            are stuck, stay where you are safe and phone the base.
          </p>
        </Callout>
        <p className="text-sm text-text-secondary">
          The Isle of Kerran in the widgets and exercises is fictional; never use its chart to navigate a real boat.
        </p>
      </Section>
    </>
  );
}

const lesson: LessonContent = {
  objectives: [
    "Use the chart plotter safely: check every leg zoomed in, know the chart's age, and tell heading from course over the ground",
    "Set good waypoints, follow a route, use the track, and find the man overboard button",
    "Use a phone or tablet app, AIS and the VHF radio for what they are good at, and know their limits",
    "Plan a seven-day charter that gets you back to the base on Friday evening",
  ],
  keyTerms: [
    { term: "Overzoom", definition: "Zooming an electronic chart beyond the scale it was made at: it gets bigger, not more accurate." },
    { term: "Heading", definition: "The direction the bow points, from the compass." },
    { term: "Course over the ground (COG)", definition: "The direction you are actually moving over the seabed, including current and leeway." },
    { term: "Waypoint", definition: "A stored position used to navigate by. Never put one on a mark or a danger." },
    { term: "Route", definition: "Waypoints joined into legs, which the plotter follows one by one." },
    { term: "Track", definition: "The trail of where the boat has been, drawn by the plotter." },
    { term: "AIS", definition: "Automatic Identification System: vessels broadcast name, position, course and speed by radio." },
    { term: "CPA", definition: "Closest point of approach: how near another vessel will pass if neither of you alters course." },
    { term: "Channel 16", definition: "The VHF channel for distress, safety and calling." },
    { term: "Mayday", definition: "The distress call, for grave and immediate danger to a boat or a person." },
  ],
  Body,
  Video,
  Exercises,
};

export default lesson;
