import type { LessonContent } from "@/lib/courses/types";
import { formatBearing } from "@/lib/courses/geo";
import { LEADING_LINE } from "@/lib/courses/navigation/practice-chart";
import { QuestionCard } from "../../Exercises";
import { Callout, Interactive, KeyIdea, Section, Table, Worked } from "../../LessonParts";
import { Exercises, Video } from "./client";
import { BUOYS, GATES_APART_CABLES, GATE_1_CABLES, GATE_2_CABLES, KERRAN_IDS, REGION_TEXT, coloursText, lightText, sayLight, topmarkText } from "./data";
import { parseLight } from "@/lib/courses/navigation/lights";
import { ApproachFigure, LateralLineup, MarkIdentifier, PilotWidget, RegionFinder, SilhouetteFigure } from "./widgets";

const mono = (s: string) => <span className="whitespace-nowrap font-mono text-[0.92em]">{s}</span>;

function Body() {
  return (
    <>
      <Section id="why" title="Signposts at sea">
        <p>
          Buoys and beacons are the road signs of the sea. A <strong>buoy</strong> floats, moored to the seabed, so it swings a
          little with the wind and current. A <strong>beacon</strong> is fixed: a pole, post or small tower standing on a rock
          or the seabed. Both are <strong>marks</strong>. Many carry a <strong>topmark</strong>, a small shape on top, and many
          are lit at night.
        </p>
        <p>
          Almost every country lays its marks to one scheme: the <strong>IALA Maritime Buoyage System</strong>. It has lateral
          marks (this lesson), and cardinal, isolated danger, safe water and special marks (Lesson 6). The world is split into
          two <strong>regions</strong>, and they differ in one thing only: the colours of the lateral marks.
        </p>
        <Table
          head={["", "Region A", "Region B"]}
          rows={[
            [<strong key="w">Where</strong>, REGION_TEXT.A, REGION_TEXT.B],
            [<strong key="c">Our charter areas</strong>, "Croatia, Greece, Italy, Corsica, Mallorca, Montenegro, Turkey, the Seychelles, Thailand", "The British Virgin Islands (and all the Caribbean)"],
            [<strong key="p">Port-hand marks</strong>, "Red, can-shaped", "Green, can-shaped"],
            [<strong key="s">Starboard-hand marks</strong>, "Green, conical", "Red, conical"],
            [<strong key="o">Every other mark</strong>, "The same in both regions", "The same in both regions"],
          ]}
        />
        <KeyIdea>Region A, going into harbour: red to port. Region B, going into harbour: red to starboard.</KeyIdea>
      </Section>

      <Section id="direction" title="The direction of buoyage">
        <p>
          <strong>Lateral marks</strong> (from the Latin for &ldquo;side&rdquo;) show the two sides of a channel:{" "}
          <strong>port-hand marks</strong> on one side, <strong>starboard-hand marks</strong> on the other. But your port side
          becomes your starboard side the moment you turn round, so the marks need an agreed direction to refer to: the{" "}
          <strong>direction of buoyage</strong>.
        </p>
        <ul>
          <li><strong>Near a harbour, river, bay or channel</strong>, it is the direction you take coming in from the sea.</li>
          <li>
            <strong>Along an open coast</strong> the buoyage authorities set it, and the chart shows it with a{" "}
            <strong>magenta arrow</strong> wherever it might not be obvious.
          </li>
        </ul>
        <p>
          Every rule about lateral marks is stated for a boat going <em>with</em> the direction of buoyage. Going against it, leaving
          harbour, everything reverses.
        </p>
        <ApproachFigure />
      </Section>

      <Section id="region-a" title="Region A: port-hand and starboard-hand marks">
        <p>
          Every Mediterranean charter area, and the Seychelles and Thailand, use Region A. Going in, with the direction of
          buoyage:
        </p>
        <Table
          head={["", "Port-hand mark", "Starboard-hand mark"]}
          rows={[
            [<strong key="c">Colour</strong>, coloursText("port", "A"), coloursText("starboard", "A")],
            [<strong key="s">Shape</strong>, "Can (flat top); or a pillar or spar", "Cone (pointed); or a pillar or spar"],
            [<strong key="t">Topmark (if any)</strong>, topmarkText("port", "A"), topmarkText("starboard", "A")],
            [<strong key="l">Light (if any)</strong>, lightText("port", "A"), lightText("starboard", "A")],
            [<strong key="k">Going in</strong>, "Keep it on your port side", "Keep it on your starboard side"],
          ]}
        />
        <p>
          A <strong>can</strong> is an upright cylinder with a flat top; a <strong>cone</strong> comes to a point. Bigger marks
          are often <strong>pillar</strong> buoys or <strong>spars</strong>, whose shape says nothing, so the topmark and colour
          do the work. In harbour entrances you will also see lateral marks as painted <strong>beacons</strong> or lights on
          the ends of the breakwaters: red on the port side going in, green on the starboard side.
        </p>
        <Callout kind="remember" title="A memory aid for Region A">
          <p>
            <strong>Port wine is red</strong>, and port is on the left. Going in: red, port, left. A port-hand mark keeps its
            name whichever way you are going; only the side you keep it on changes.
          </p>
        </Callout>
      </Section>

      <Section id="kerran" title="Into Port Kerran">
        <p>
          The practice chart is laid out in Region A. The approach to Port Kerran is a short buoyed channel running north: first
          the pair <strong>No 1</strong> (a green cone, east side) and <strong>No 2</strong> (a red can, west side),{" "}
          {GATE_1_CABLES} cables apart, then {GATES_APART_CABLES} cables on, <strong>No 3</strong> and <strong>No 4</strong>,{" "}
          {GATE_2_CABLES} cables apart. Coming in you head north with the direction of buoyage, so the green cones pass down
          your starboard side and the red cans down your port side. The leading lights, in line on{" "}
          {formatBearing(LEADING_LINE.bearing, "T")}, take you straight up the middle.
        </p>
        <p>
          Here, as on many Region A charts, the starboard-hand marks have odd numbers and the port-hand marks even ones,
          counting up from seaward. It is common practice rather than a rule, so always read the numbers from the chart.
        </p>
      </Section>

      <Section id="night" title="Lights at night">
        <p>
          At night you see only the lights. A lateral mark&rsquo;s light is the same colour as the mark, so in Region A red is
          port-hand and green is starboard-hand. To tell one buoy from its neighbour, read the rhythm printed beside it on the
          chart: {mono("Fl")} is a single flash, {mono("Fl(2)")} flashes in groups of two, {mono("Q")} is quick flashing, and the
          number with an {mono("s")} is the <strong>period</strong>, the time the pattern takes to repeat.
        </p>
        <Table
          head={["Buoy", "Light", "Entering, keep it"]}
          rows={KERRAN_IDS.map((id) => {
            const b = BUOYS[id];
            return [
              <span key="n"><strong>{b.name}</strong><br /><span className="text-sm text-text-secondary">{b.type === "port" ? "Port-hand, red can" : "Starboard-hand, green cone"}</span></span>,
              <span key="l">{mono(b.light)}<br /><span className="text-sm text-text-secondary">{sayLight(parseLight(b.light))}</span></span>,
              `To ${b.type}`,
            ];
          })}
        />
        <Worked
          title="A light ahead: red, in pairs, every five seconds"
          steps={[
            <>Kerran is in Region A and the light is red, so it is on a port-hand mark.</>,
            <>Its flashes come in pairs, and the pattern repeats every 5 seconds: {mono(BUOYS.no4.light)}.</>,
            <>On the chart that is No 4, the inner port-hand mark. No 2, the outer one, shows a single flash: {mono(BUOYS.no2.light)}.</>,
            <>You are entering, going with the direction of buoyage, so keep it on your port side.</>,
          ]}
          answer="No 4: keep it to port. You are nearly through the channel."
        />
        <Callout kind="warning" title="Arrive by daylight">
          <p>
            Many small marks in charter areas are unlit, and lights on the shore can hide the ones that are. Most charter
            contracts ask you to be in by dark; the lights are for the day you are late, not for planning.
          </p>
        </Callout>
      </Section>

      <Section id="leaving" title="Leaving harbour: everything reverses">
        <p>
          Leaving harbour you go against the direction of buoyage, so in Region A the red port-hand marks pass down your{" "}
          <strong>starboard</strong> side and the green ones down your <strong>port</strong> side. The marks have not changed;
          you have turned round. Say it to the crew before you slip the lines: <em>going out, red to starboard</em>.
        </p>
        <Interactive
          title="Which side? In and out, in either region"
          instructions="Take the boat in and out again. For each mark, choose which side of the boat to keep it, then see where your choice takes you. Region A uses Port Kerran on the practice chart; Region B uses an example channel laid out as in the Caribbean. Try it by day, into the sun (only shapes show) and at night (only lights)."
        >
          <PilotWidget />
        </Interactive>
      </Section>

      <Section id="preferred" title="Preferred channel marks">
        <p>
          Where a channel divides, a lateral mark with one broad band of the other colour can show which branch is the{" "}
          <strong>preferred</strong>, or main, channel. Read its <strong>main colour and shape</strong> and treat it as that mark:
        </p>
        <Table
          head={["Region A", "Looks like", "Treat it as", "Preferred channel"]}
          rows={[
            [<strong key="s">Preferred channel to starboard</strong>, `${coloursText("preferred-channel-to-starboard", "A")}; can; ${lightText("preferred-channel-to-starboard", "A")}`, "Port-hand: keep it to port", "To starboard of it"],
            [<strong key="p">Preferred channel to port</strong>, `${coloursText("preferred-channel-to-port", "A")}; cone; ${lightText("preferred-channel-to-port", "A")}`, "Starboard-hand: keep it to starboard", "To port of it"],
          ]}
        />
        <p>
          In Region B the colours swap as usual: the preferred-channel-to-starboard mark is a green can with a red band, and the
          preferred-channel-to-port mark a red cone with a green band. In both regions the light matches the main colour and
          flashes two, then one: {mono("Fl(2+1)")}, a rhythm lateral marks keep for preferred channels.
        </p>
        <LateralLineup types={["preferred-channel-to-starboard", "preferred-channel-to-port"]} caption="Preferred channel marks in each region: to starboard (left) and to port (right)." />
        <QuestionCard
          question={{
            id: "inline-pc-port",
            kind: "choice",
            prompt: "Check your understanding: in Region A, going in, you reach a fork. On the dividing point is a green conical buoy with one broad red band. Which branch is the preferred channel?",
            options: ["The left-hand (port) branch: keep the mark to starboard", "The right-hand (starboard) branch: keep the mark to port", "Neither: it marks a danger in the fork", "Either: both branches are equally good"],
            answer: 0,
            explain: "Mainly green and conical: a Region A starboard-hand mark, modified with a red band. Treat it as a starboard-hand mark, keep it to starboard, and you follow the preferred channel, which lies to port of it.",
          }}
        />
      </Section>

      <Section id="region-b" title="Region B: red right returning">
        <p>
          The Americas use Region B, and so does the whole Caribbean, including the <strong>British Virgin Islands</strong>,
          even though they are British. So do Japan, South Korea and the Philippines. In Region B the colours of the lateral
          marks swap sides; nothing else changes.
        </p>
        <LateralLineup types={["port", "starboard"]} caption="Going in, with the direction of buoyage: the port-hand mark (left) and starboard-hand mark (right) in each region. The shapes stay; the colours swap." />
        <ul>
          <li><strong>Going in, red is on your right:</strong> &ldquo;red, right, returning&rdquo;, returning from the sea.</li>
          <li><strong>The shapes do not swap.</strong> Cans are still port-hand and cones starboard-hand. Americans call the cone a <em>nun</em>.</li>
          <li><strong>Numbers often swap too:</strong> in the Americas, red marks usually carry even numbers and green marks odd numbers, counting up from seaward.</li>
          <li><strong>Leaving, everything reverses</strong>, exactly as in Region A: going out, red to port.</li>
        </ul>
        <Worked
          title="Into Setting Point, Anegada"
          steps={[
            <>Anegada, in the British Virgin Islands, is ringed by reef, and the way in to Setting Point is a marked channel. Many charter companies allow it only in good light, if at all.</>,
            <>The BVI are Region B. Coming in from the sea you go with the direction of buoyage: red marks on your starboard side, green on your port side.</>,
            <>Check each mark&rsquo;s shape as well as its colour: a cone is starboard-hand, a can port-hand, whatever the light is doing to the colours.</>,
            <>Going out the next morning, it reverses: red to port.</>,
          ]}
          answer="Red right returning. And follow the charter company's briefing for Anegada: the reef has wrecked many boats."
        />
        <Callout kind="warning" title="Habits travel with you">
          <p>
            A skipper used to the Med who charters in the Caribbean will feel that red belongs on the left. That instinct is
            exactly wrong there. Before the first entrance, say the rule out loud, and read the shapes as well as the colours.
          </p>
        </Callout>
      </Section>

      <Section id="your-charter" title="Which region is your charter in?">
        <Interactive title="Region finder" instructions="Pick a charter area from our cruising guides to see its buoyage region and what you keep where going in.">
          <RegionFinder />
        </Interactive>
        <Interactive
          title="Lateral mark identifier"
          instructions="Explore the lateral marks in either region by day, into the sun and at night. Then press Test yourself to identify marks from a picture or a light; each one tells you which region you are in."
        >
          <MarkIdentifier />
        </Interactive>
      </Section>

      <Section id="shapes" title="When colours let you down">
        <p>
          Looking into a low sun every buoy is a black outline, and at dusk or in haze red and green are hard to tell apart.
          That is why lateral marks differ in shape as well as colour: <strong>can for port, cone for starboard</strong>, with
          topmarks to match, in both regions.
        </p>
        <SilhouetteFigure />
        <Callout kind="warning" title="Buoys are guides, not guarantees">
          <ul className="list-disc space-y-1 pl-5">
            <li>Buoys swing round their moorings, can drag in bad weather and are sometimes missing. Small marks in charter areas can be faded or unlit.</li>
            <li>The marks show the edge of the channel where they stand; between them it is not marked. Keep well inside, and do not cut corners.</li>
            <li>Inside a narrow channel you still share the water with ferries and fishing boats: Lesson 10 covers who gives way.</li>
          </ul>
        </Callout>
        <KeyIdea>Find the direction of buoyage first. Then read the shape, then the colour. Region A going in: red to port. Region B going in: red to starboard.</KeyIdea>
        <p>Next: cardinal marks, which tell you where the safe water lies around a danger using the compass instead of port and starboard.</p>
      </Section>
    </>
  );
}

const lesson: LessonContent = {
  objectives: [
    "Say which IALA region each charter area uses, and what changes between Region A and Region B",
    "Find the direction of buoyage, and keep each lateral mark on the right side going in and coming out",
    "Recognise port-hand and starboard-hand marks by shape, colour, topmark and light, in either region",
    "Read a preferred channel mark and say which way the main channel lies",
  ],
  keyTerms: [
    { term: "IALA Maritime Buoyage System", definition: "The international scheme of buoys and beacons, used worldwide in two regions, A and B." },
    { term: "Region A", definition: "Europe and the Mediterranean, Africa, most of Asia, Australia: going in, red marks to port. All our Med charter areas, the Seychelles and Thailand." },
    { term: "Region B", definition: "The Americas and the Caribbean (including the BVI), Japan, South Korea, the Philippines: going in, red marks to starboard." },
    { term: "Red right returning", definition: "The Region B memory aid: red marks on your right as you return from the sea." },
    { term: "Lateral mark", definition: "A mark showing the port or starboard side of a channel." },
    { term: "Direction of buoyage", definition: "The direction lateral marks refer to: in from the sea; along open coasts set by the authorities and shown by a magenta arrow on the chart." },
    { term: "Port-hand mark", definition: "A can-shaped mark kept to port going in: red in Region A, green in Region B." },
    { term: "Starboard-hand mark", definition: "A cone-shaped mark kept to starboard going in: green in Region A, red in Region B." },
    { term: "Preferred channel mark", definition: "A lateral mark with a broad band of the other colour, where a channel divides; light Fl(2+1). Treat it by its main colour and shape." },
    { term: "Period", definition: "The time a light's pattern takes to repeat, such as 5 seconds (5s)." },
  ],
  Body,
  Video,
  Exercises,
};

export default lesson;
