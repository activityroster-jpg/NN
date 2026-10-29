import Link from "next/link";
import type { LessonContent } from "@/lib/courses/types";
import { Callout, Formula, Interactive, KeyIdea, Section, Table, Worked } from "../../LessonParts";
import ChartTour from "../../widgets/ChartTour";
import { Exercises, Video } from "./client";
import { BOAT, SCOPE_RULES, chainFor, swingRadius } from "./data";
import { ScopeCalculator, SwingingRoom } from "./widgets";

const guide = (id: string, name: string) => <Link href={`/en/cruising/${id}`}>{name}</Link>;

function Body() {
  return (
    <>
      <Section id="choose" title="Choosing an anchorage">
        <p>
          A good night at anchor is decided in the morning, with the chart and the pilot book open. The pilot book shows the bays
          with an anchor symbol, says what the bottom is and which winds they are open to; the chart shows the depths and the
          rocks. Check five things:
        </p>
        <Table
          head={["Check", "What you want", "Where to look"]}
          rows={[
            [<strong key="s">Shelter</strong>, "Land between you and the wind that is forecast, tonight as well as now. A swell can arrive from a wind far away.", "The forecast, and the pilot book's “open to” notes"],
            [<strong key="d">Depth</strong>, "About 3 to 12 m for a charter yacht: enough under the keel, not so deep you run out of chain", "The chart's soundings and contours; the sounder on arrival"],
            [<strong key="h">Holding</strong>, "Sand or mud. Not weed, seagrass, rock or coral", "The chart's seabed letters (S, M, Wd, R), the pilot book, and your eyes"],
            [<strong key="r">Room to swing</strong>, "A clear circle round the anchor, away from rocks, swimming areas and moorings", "The chart, then a look round the bay"],
            [<strong key="o">Other boats</strong>, "Space between you and the boats already there", "Arrive early in high summer: the best spots go by mid-afternoon"],
          ]}
        />
        <p>
          On the practice chart, the anchor symbol off the north of the island is <strong>Kerran Roads</strong>. The island
          shelters it from the south, but it is wide open to the north: a lovely spot in a southerly, and the wrong place to be
          when a northerly is forecast.
        </p>
        <Interactive title="Kerran Roads on the practice chart" instructions="Pick the anchorage to zoom in on it, then the harbour, and compare which winds each is open to.">
          <ChartTour ids={["anchorage", "harbour", "tower", "beacon-hill"]} />
        </Interactive>
        <Callout kind="tip" title="Always have a plan B">
          <p>
            Before you settle in, know where you would go if the wind changed in the night: a harbour or a bay on the other side of
            the island, and the route there in the dark. If you would not want to make that trip, choose the safer bay now.
          </p>
        </Callout>
      </Section>

      <Section id="seabed" title="The seabed: sand good, seagrass bad">
        <Table
          head={["Seabed", "Holding", "Notes"]}
          rows={[
            [<strong key="s">Sand</strong>, "Good", "Shows as light turquoise patches in clear water. The best place to drop."],
            [<strong key="m">Mud</strong>, "Good", "Common in Phang Nga Bay in Thailand and some sheltered inlets. Takes a while to set; dig in gently."],
            [<strong key="w">Weed and seagrass</strong>, "Poor", "The anchor skates over it, or pulls out a clump and drags. In the Mediterranean it is usually Posidonia."],
            [<strong key="r">Rock</strong>, "Poor", "Nothing to dig into; the anchor may also jam under a ledge."],
            [<strong key="c">Coral</strong>, "Never", "Easily destroyed and protected wherever it grows. Use a mooring or anchor on sand well clear."],
          ]}
        />
        <p>
          <strong>Posidonia</strong> is a seagrass found only in the Mediterranean. It grows in dark green meadows a few metres to
          forty metres down, shelters fish, keeps the water clear and holds the sand of the beaches in place. A single anchor and
          chain dragged through it tears out growth that takes decades to come back, so it is protected across the region.
        </p>
        <Callout kind="warning" title="Protected areas and fines">
          <p>
            In parts of the Mediterranean anchoring on Posidonia is banned outright, and the rules are enforced. Around{" "}
            {guide("mallorca", "Mallorca and Cabrera")} environmental patrol boats check anchored yachts in summer and fines can be heavy;
            many bays in {guide("corsica-west", "Corsica")} and the {guide("sardinia-maddalena", "La Maddalena")} park restrict
            anchoring; in {guide("croatia-split", "Croatia")} some protected areas ban it. Rules change from season to season, so
            follow local signs, the pilot book and your charter company's briefing.
          </p>
        </Callout>
        <KeyIdea>Look down before you drop: light sand is good, dark patches are seagrass or rock. In clear Mediterranean water you can see the bottom in ten metres.</KeyIdea>
      </Section>

      <Section id="scope" title="Scope: how much chain">
        <p>
          The <strong>scope</strong> is the length of chain you let out, compared with the depth. The anchor holds because the pull
          on it is <em>along</em> the seabed: enough chain lies on the bottom that the boat pulls the anchor flat, not upwards. Too
          little chain and the boat lifts the anchor out every time it snatches in a gust.
        </p>
        <Formula note="Measure the depth from the bow roller, not the waterline, and add any tide still to rise. Use more if it blows.">
          chain = (depth + bow + tide) × {SCOPE_RULES.settled.ratio} to {SCOPE_RULES.breezy.ratio}
        </Formula>
        <Table
          head={["Conditions", "Rule of thumb (all chain)"]}
          rows={(Object.keys(SCOPE_RULES) as Array<keyof typeof SCOPE_RULES>).map((k) => [<strong key={k}>{SCOPE_RULES[k].label}</strong>, SCOPE_RULES[k].note])}
        />
        <p>
          These are rules of thumb for chain. If part of the cable is rope, use more. In most
          of the Mediterranean the tide is a few tens of centimetres and you can ignore it; in {guide("thailand-phuket", "Phang Nga Bay")}{" "}
          the range is up to about three metres at springs, so use the depth at high water.
        </p>
        <Worked
          title="A bay on Šolta, with the afternoon breeze expected"
          steps={[
            "The sounder shows 7 m. The bow roller is about 1 m above the water: 7 + 1 = 8 m.",
            `A breeze is due this afternoon, so five times: 5 × 8 = 40 m. The chain is marked every 10 m, so let out ${chainFor(7, 5)} m, to the fourth mark.`,
            `Swinging room: ${chainFor(7, 5)} m of chain plus ${BOAT.length} m of boat is about ${swingRadius(chainFor(7, 5))} m in every direction.`,
          ]}
          answer={`${chainFor(7, 5)} m of chain, and a clear circle about ${swingRadius(chainFor(7, 5))} m in radius.`}
        />
        <Interactive title="Scope calculator" instructions="Set the depth, the bow height, the tide and tonight's forecast. Try a deep bay with only 50 m on board.">
          <ScopeCalculator />
        </Interactive>
        <Callout kind="tip" title="At the briefing">
          <p>
            Ask how much chain the boat carries, how it is marked, where the windlass breaker and remote are, and
            whether there is a snubber. Run a few metres out at the dock to check the windlass works both ways.
          </p>
        </Callout>
      </Section>

      <Section id="set" title="Dropping and setting the anchor">
        <ol>
          <li><strong>Brief the crew.</strong> One person on the bow with the windlass remote, one on the helm. Agree hand signals for “go ahead”, “stop”, “go astern” and “chain out”, because the helm cannot hear the bow over the engine.</li>
          <li><strong>Approach slowly, head to wind</strong>, or the way the boats already anchored are lying. Stop the boat over the spot you chose.</li>
          <li><strong>Lower the anchor to the seabed</strong>, then pay out chain as the boat drifts back or goes gently astern, so the chain lies in a line along the bottom. Never dump it all in a heap on top of the anchor.</li>
          <li><strong>Let it bite.</strong> At about three times the depth, stop the chain and let the boat's weight pull it taut. The bow swings to face the anchor.</li>
          <li><strong>Full scope, then dig in.</strong> Let out the rest, then go astern, gently at first and then firmly, for a minute. Watch a transit abeam (below): if it stays still, the anchor is set.</li>
          <li><strong>Snubber on.</strong> A rope bridle hooked onto the chain takes the snatching load off the windlass and quietens the night.</li>
        </ol>
        <p>
          By day, an anchored boat should show a black ball in the rigging; at night, an all-round white anchor light. Charter
          boats have the light; ask where the ball is kept. When you leave, motor gently up towards the anchor while the bow takes
          in the chain: the windlass lifts the anchor, it does not pull the boat.
        </p>
      </Section>

      <Section id="holding" title="Is it holding? Transits, the plotter and the alarm">
        <p>
          A <strong>transit</strong> is two objects ashore, one behind the other: a chapel on the hill and a rock on the shore, a
          tree and a headland. Pick one abeam (to one side of the boat) as soon as the anchor is down. While it stays in line you
          are not moving. If it opens steadily, you are dragging. Expect a little movement as the boat swings; take a second transit
          ahead or astern to be sure.
        </p>
        <ul>
          <li><strong>The plotter track.</strong> Zoom in after an hour. A boat swinging on its anchor draws neat arcs; a dragging boat draws a line downwind.</li>
          <li><strong>Anchor alarm.</strong> Most plotters and many phone apps have one. Set its centre where the anchor went down (most apps let you mark it, or move the centre ahead of the boat by the chain length), with a radius a little bigger than your swinging circle.</li>
          <li><strong>Anchor watch.</strong> If the wind gets up in the night, someone gets up too: check the transit, the alarm and the boats around you.</li>
        </ul>
        <Callout kind="remember">
          <p>If the anchor drags, don't argue with it. Lift it, check it is not clogged with weed, and try again, somewhere else if need be.</p>
        </Callout>
      </Section>

      <Section id="swing" title="Swinging room">
        <p>
          A boat on its anchor swings round it as the wind changes, so it needs a circle of clear water with a radius of about the
          chain plus the length of the boat. Boats nearby swing too, and usually together, so overlapping circles are normal in a
          busy bay. What matters is that you lie as your neighbours lie, with similar scope, and that you are not on top of
          their anchor or chain. The first boat in has the spot: give them room, and if you anchor too close, it is you who moves.
        </p>
        <Interactive
          title="Drop the anchor in the practice cove"
          instructions="The cove is fictional, open to the south, with no tide. Tap to drop your anchor, choose the scope and the wind, and see what your swinging circle reaches. Arrow keys move the anchor."
        >
          <SwingingRoom />
        </Interactive>
        <KeyIdea>More chain holds better but needs more room. Choose the spot for the scope you will need tonight, not the one you need now.</KeyIdea>
      </Section>

      <Section id="ashore" title="Lines ashore">
        <p>
          In narrow coves there is no room to swing, so boats anchor with a line ashore. It is the normal way to spend a night in{" "}
          {guide("turkey-gocek", "the Göcek bays")}, in many coves in {guide("croatia-split", "Croatia")}, and in inlets such as
          Kioni in {guide("greece-ionian", "the Ionian")}.
        </p>
        <ol>
          <li>Drop the anchor well out in the deeper water, then reverse slowly towards the shore, letting out chain.</li>
          <li>A crew member takes the end of a long floating line ashore by dinghy, or swims it, and passes it round a rock, a tree (with chafe protection) or a ring set in the rock. Some bays, especially in Turkey, have rings or bollards for this.</li>
          <li>Bring the end back to the boat, so you can let go from on board without anyone going ashore.</li>
          <li>Take in the slack on the line and tighten the chain, so the boat sits between the anchor and the shore and cannot swing.</li>
        </ol>
        <p>
          With the boat held still, a wind on the beam puts a big sideways load on the anchor, so a line ashore suits a cove
          sheltered from every likely wind. Stern-to on a town quay, the Med mooring, works much the same way with the quay instead
          of the tree: Lesson 8 covers coming into a berth.
        </p>
      </Section>

      <Section id="buoys" title="Mooring buoys">
        <p>
          More and more bays have mooring buoys, laid to protect the seabed or simply to fit more boats in. Where they exist,
          anchoring is often not allowed.
        </p>
        <Table
          head={["Where", "What to expect"]}
          rows={[
            [<strong key="hr">{guide("croatia-split", "Croatia")}</strong>, "Paid buoy fields in many popular bays. A boat comes round in the evening to collect the fee. Some konobas (family restaurants) have buoys for their guests."],
            [<strong key="bvi">{guide("bvi", "British Virgin Islands")}</strong>, "Paid mooring balls for the night in almost every bay. National Parks moorings at sites such as the Baths and the Indians are for day use only, with a time limit, and every boat needs a National Parks permit."],
            [<strong key="mal">{guide("mallorca", "Cabrera, Mallorca")}</strong>, "A national park: book the navigation permit and the buoy online in advance; anchoring is not allowed."],
            [<strong key="aeo">{guide("sicily-aeolian", "Aeolian Islands")}</strong>, "Paid buoys in many bays, including Panarea and Stromboli, with the fee collected by boat."],
            [<strong key="th">{guide("thailand-phuket", "Phang Nga Bay")}</strong>, "National park moorings at some islands to protect the coral. Check one suits a boat your size."],
          ]}
        />
        <h3>Picking up a buoy</h3>
        <ol>
          <li>Have a long mooring line ready on the bow, led through the fairlead and back to a cleat, and the boat hook out.</li>
          <li>Approach slowly into the wind, or the way the moored boats are lying (they show the combined effect of wind and current).</li>
          <li>The crew on the bow points at the buoy all the way in, because the helm loses sight of it under the bow in the last few metres.</li>
          <li>Pick up the buoy's pick-up line or ring with the boat hook. Pass your own line through the loop and back to the same side's cleat, or rig a bridle to both bow cleats. Don't rely on a short pennant dropped over a cleat.</li>
          <li>Check the buoy looks sound and is meant for a boat your size, and never use a private buoy without asking.</li>
        </ol>
        <Callout kind="tip">
          <p>Missed it? Don't chase it with the boat hook. Go astern clear, go round, and try again. Everyone in the bay has done it.</p>
        </Callout>
      </Section>
    </>
  );
}

const lesson: LessonContent = {
  objectives: [
    "Choose an anchorage from the chart, the pilot book and the forecast: shelter, depth, seabed, room and other boats",
    "Work out the scope for the depth, bow height, tide and forecast, and the swinging room it needs",
    "Drop and set the anchor, and check it holds with a transit, the plotter track and an anchor alarm",
    "Take a line ashore, and pick up mooring buoys in Croatia, the British Virgin Islands and elsewhere",
  ],
  keyTerms: [
    { term: "Scope", definition: "The length of chain let out, as a multiple of the depth from the bow roller: four to five times in settled weather, more if it blows." },
    { term: "Holding", definition: "How well the seabed grips the anchor. Sand and mud are good; weed, rock and coral are poor or off limits." },
    { term: "Posidonia", definition: "A protected Mediterranean seagrass growing in dark meadows. Poor holding; anchoring on it is banned in some areas." },
    { term: "Swinging circle", definition: "The clear water a boat at anchor needs: a radius of about the chain plus the boat's length." },
    { term: "Transit", definition: "Two objects in line, one behind the other. A transit abeam that stays in line shows the anchor is holding." },
    { term: "Anchor alarm", definition: "A plotter or phone alarm that sounds if the boat leaves a circle centred on the anchor." },
    { term: "Snubber", definition: "A rope bridle hooked onto the chain to take the load off the windlass." },
    { term: "Windlass", definition: "The electric winch on the bow that raises and lowers the anchor chain." },
    { term: "Line ashore", definition: "A long line from the stern to a rock, tree or ring, holding a boat at anchor in a narrow cove so it cannot swing." },
    { term: "Mooring buoy", definition: "A buoy fixed to the seabed for boats to tie to, often paid, sometimes for day use only." },
  ],
  Body,
  Video,
  Exercises,
};

export default lesson;
