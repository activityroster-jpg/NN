import type { LessonContent } from "@/lib/courses/types";
import { formatPosition } from "@/lib/courses/geo";
import { feature } from "@/lib/courses/navigation/practice-chart";
import { Callout, Figure, Interactive, KeyIdea, Section, Table, Worked } from "../../LessonParts";
import { Exercises, Video } from "./client";
import { BANK_LEAST, DRYING, GULL_ELEVATION, HILL_HEIGHT, MEW_DRIES, OFFSHORE, WRECK_DEPTH, m1 } from "./data";
import { VARIATION, formatDegMin } from "./bands";
import { Fig, FigHtml, SymbolImage } from "./symbols";
import { BayReader, DepthProbe, GlobeExplorer, PlotPractice, ReadPosition, SymbolExplorer } from "./widgets";

const TOWER = feature("tower");
const VAR_TEXT = `${formatDegMin(VARIATION.degrees * 60 + VARIATION.minutes, VARIATION.dir)} (${VARIATION.year}) (${VARIATION.change}′${VARIATION.changeDir})`;

/** "7₄" annotated: whole metres and tenths. */
function SoundingFigure() {
  return (
    <svg viewBox="0 0 560 170" className="mx-auto block h-auto w-full max-w-lg" role="img" aria-label="The sounding 7 with a small 4: 7.4 metres below chart datum">
      <g fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif">
        <rect x={1} y={1} width={558} height={168} rx={12} fill="#fff" stroke="#d8e1e8" />
        <Fig x={95} y={112} depth={7.4} size={100} />
        <path d="M100 32 q 20 -14 60 -12 H 200" fill="none" stroke="#0B5563" strokeWidth={2.5} />
        <path d="M128 140 q 10 10 40 8 H 200" fill="none" stroke="#0B5563" strokeWidth={2.5} />
        <text x={210} y={30} fontSize={26} fontWeight={700} fill="#0B5563">7 whole metres</text>
        <text x={210} y={156} fontSize={26} fontWeight={700} fill="#0B5563">4 tenths (0.4 m)</text>
        <text x={210} y={94} fontSize={27} fill="#1d2731">= 7.4 m below chart datum</text>
      </g>
    </svg>
  );
}

function Swatch({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-block h-4 w-6 rounded border border-border" style={{ background: colour }} aria-hidden="true" />
      {label}
    </span>
  );
}

function Bed({ code }: { code: string }) {
  return <span className="font-serif text-lg italic">{code}</span>;
}

function Body() {
  return (
    <>
      <Section id="depths" title="Depths: the numbers in the sea">
        <p>
          The small figures scattered over the sea are <strong>soundings</strong>. Each one is the depth at that spot, in
          metres, measured from a low reference level called <strong>chart datum</strong>. On most modern charts chart datum
          is about the lowest the tide ever falls, so a sounding is close to the <em>least</em> water you will find there;
          most of the time there is a little more.
        </p>
        <p>
          In shallower water the chart also gives the tenths, printed as a smaller figure set slightly lower down. Read the two
          as one number: <FigHtml depth={7.4} /> is 7.4 m and <FigHtml depth={OFFSHORE.depth} /> is {m1(OFFSHORE.depth)} m. In
          deep water only whole metres are printed, because a few tenths no longer matter.
        </p>
        <Figure caption="Read the small figure as part of the same number: tenths of a metre, not a separate depth.">
          <SoundingFigure />
        </Figure>
        <p>
          How much the tide adds depends on where you are. In most of the Mediterranean the tide rises and falls by only a few
          tens of centimetres, and in the Caribbean it is small too, so the charted depth is close to what the depth sounder
          will show. On tidal coasts such as the Atlantic shores of Europe the tide can add several metres, and working it out
          becomes part of the plan.
        </p>
        <Interactive
          title="Colours and depths"
          instructions="Tap anywhere on the chart (zoom in with +) or pick a place below it. You will see the depth there, its colour band and the contours either side."
        >
          <DepthProbe />
        </Interactive>
        <Callout kind="tip" title="Your keel and your sounder">
          <p>
            A typical charter monohull draws around 2 m, a catamaran a little over 1 m: the exact figure is in the boat’s
            paperwork. Ask at the briefing whether the depth sounder shows the depth under the keel or below the waterline,
            and keep at least a couple of metres under you when you anchor.
          </p>
        </Callout>
      </Section>

      <Section id="contours" title="Contours and colours">
        <p>
          A <strong>depth contour</strong> is a line joining points of the same depth, just like the height contours on a
          walking map. The practice chart has contours at 2, 5, 10 and 20 m. Between them, colour tints make shallow water
          stand out at a glance:
        </p>
        <Table
          head={["Colour", "Meaning", "On the practice chart"]}
          rows={[
            [<Swatch key="l" colour="#f1deb0" label="Buff" />, "Land", "The Isle of Kerran"],
            [<Swatch key="g" colour="#c4d8a0" label="Green" />, "Dries: covered at high tide, uncovered at low tide", "The foreshore all round the island"],
            [<Swatch key="b" colour="#b6daf1" label="Blue" />, "Shallow: here 0 to 5 m", "A band close inshore, and the middle of Brennan Bank"],
            [<Swatch key="p" colour="#daedf8" label="Pale blue" />, "Here 5 to 10 m", "Between the 5 m and 10 m contours"],
            [<Swatch key="w" colour="#ffffff" label="White" />, "Deeper water", "Open water"],
          ]}
        />
        <p>
          Contours also show the shape of the seabed. Where they crowd together the bottom shelves steeply; where they are far
          apart it shoals gently. That matters when you anchor: volcanic islands such as the Aeolians, and the inner bay of
          Kotor in Montenegro, are deep almost to the shore, so you need plenty of chain and a spot where the contours open
          out. Out to the south-east of Kerran, <strong>Brennan Bank</strong> rises from deep water inside rings of contours to
          just <FigHtml depth={BANK_LEAST} />: {m1(BANK_LEAST)} m, in the middle of open sea.
        </p>
        <Callout kind="remember">
          <p>Where the tints change differs between charts. Check which contours are tinted before you judge shallow water by colour alone.</p>
        </Callout>
      </Section>

      <Section id="drying" title="Ground that dries">
        <p>
          Close to the shore you may find figures that are <strong>underlined</strong>. An underlined figure is a{" "}
          <strong>drying height</strong>: the height of ground that is uncovered at low tide, measured <em>up</em> from chart
          datum. <FigHtml depth={DRYING.depth} /> means the ground there stands {m1(-DRYING.depth)} m clear of the water at the
          lowest tide. Drying areas are tinted green. You will see few of them in the Mediterranean, where the tide is small,
          but on tidal coasts whole bays can empty at low water.
        </p>
        <KeyIdea>A plain figure is a depth below chart datum. An underlined figure is a height above it.</KeyIdea>
      </Section>

      <Section id="dangers" title="Rocks, wrecks and the danger line">
        <p>Rocks are drawn four ways, depending on whether, and when, they show above water:</p>
        <Table
          head={["Symbol", "Meaning", "What you see"]}
          rows={[
            [<SymbolImage key="1" id="rock-nc" size={56} label="Small island shape with a height in brackets" />, <strong key="t">Rock that never covers</strong>, "Always above water. The figure beside it is its height."],
            [<SymbolImage key="2" id="rock-cu" size={56} label="Asterisk with an underlined figure" />, <strong key="t">Rock that covers and uncovers</strong>, `Shows at low tide. The underlined figure is its drying height: Mew Rock dries ${m1(MEW_DRIES)} m.`],
            [<SymbolImage key="3" id="rock-awash" size={56} label="Cross with four dots" />, <strong key="t">Rock awash</strong>, "Near the surface at low tide, hidden the rest of the time. The Teeth, east of Gull Point."],
            [<SymbolImage key="4" id="rock-uw" size={56} label="Cross inside a dotted circle" />, <strong key="t">Underwater rock</strong>, "Never shows. A dotted danger line round it means it is shallow enough to hit."],
          ]}
        />
        <p>
          The dotted ring is a <strong>danger line</strong>, drawn round a hazard to make it stand out. A <strong>wreck</strong> is
          a long line crossed by short strokes; when its depth is known it is printed with <em>Wk</em> instead. South-west of
          Kerran the chart shows <FigHtml depth={WRECK_DEPTH} /> Wk: {m1(WRECK_DEPTH)} m over the wreck at chart datum. That
          is enough water to sail over, but a wreck can foul an anchor, so never anchor on one.
        </p>
        <Callout kind="warning" title="The symbol always wins">
          <p>
            A single rock can sit in otherwise deep blue water, and on the plotter it may only appear when you zoom in. Read
            the symbols as well as the colours, zoom in along the whole route on the plotter, and give every danger line a
            wide berth.
          </p>
        </Callout>
        <p>
          On land the chart shows only what helps you from the sea: the coastline, hilltops such as Beacon Hill at{" "}
          {HILL_HEIGHT} m, and landmarks you can see from offshore, such as the church spire, the radio mast and the old
          tower. Lighthouses are marked with a magenta flare and their light described beside them: Gull Point light stands{" "}
          {GULL_ELEVATION} m high. Lesson 7 decodes the lights.
        </p>
        <Interactive title="Chart symbol explorer" instructions="Tap a symbol to see what it means. If it is on the practice chart, the chart zooms to it.">
          <SymbolExplorer />
        </Interactive>
      </Section>

      <Section id="seabed" title="What the seabed is made of">
        <p>
          Small italic letters on the chart describe the seabed. They matter more to a charter skipper than almost anything
          else on the chart, because they tell you whether the anchor will hold.
        </p>
        <Table
          head={["On the chart", "Seabed", "Holding"]}
          rows={[
            [<Bed key="s" code="S" />, "Sand (fS fine sand, cS coarse sand)", "Good: the anchor digs in"],
            [<Bed key="m" code="M" />, "Mud", "Usually good once dug in; very soft mud can drag"],
            [<Bed key="c" code="Cy" />, "Clay", "Good, if the anchor can bite"],
            [<Bed key="sh" code="Sh" />, "Shells", "Fair: can be a hard crust"],
            [<Bed key="wd" code="Wd" />, "Weed, often seagrass", "Poor: the anchor skids over the top"],
            [<Bed key="r" code="R" />, "Rock", "Poor: nothing to grip, and the anchor can jam"],
          ]}
        />
        <p>
          In the Mediterranean the weed is usually <strong>Posidonia seagrass</strong>, which grows in dark meadows between
          pale patches of sand. It holds an anchor badly, and it is protected in many places. Across the Balearics, Mallorca
          included, anchoring on it is banned and patrol boats check anchored yachts in summer; many Corsican bays and parts of
          the Maddalena national park in Sardinia have similar rules. The answer is the same everywhere: drop the anchor on a
          pale sand patch, or use a buoy.
        </p>
        <p>
          In the Caribbean and the Indian Ocean the same goes for coral. In the British Virgin Islands and the Seychelles you
          anchor only on clear sand, which shows as pale turquoise water, and never on coral or seagrass. Snorkel over the
          anchor to check it has dug in.
        </p>
        <Callout kind="tip" title="Use your eyes as well">
          <p>
            In clear water, with the sun high or behind you, you can see the bottom: pale is sand, dark is weed or rock. The
            chart tells you what to expect; your eyes, and the pilot book, confirm it.
          </p>
        </Callout>
      </Section>

      <Section id="rose" title="The compass rose">
        <p>The magenta <strong>compass rose</strong> lets you measure directions on the chart. It has two rings:</p>
        <ul>
          <li><strong>The outer ring is true:</strong> 000° points to true north, along the meridians to the top of the chart.</li>
          <li>
            <strong>The inner ring is magnetic:</strong> it is turned by the local <strong>variation</strong>, the angle
            between true north and where a compass points.
          </li>
        </ul>
        <p>
          In the middle is a note giving the variation, the year it applies to and how much it changes each year. On the
          practice chart it reads <strong>{VAR_TEXT}</strong>: {VARIATION.degrees}° {VARIATION.dir === "W" ? "west" : "east"} in{" "}
          {VARIATION.year}, changing by {VARIATION.change}′ {VARIATION.changeDir === "E" ? "east" : "west"} a year. In the
          Mediterranean variation is only a few degrees and changes slowly; in the Caribbean it is more than ten degrees west,
          enough to put you well off course if you ignore it. Lesson 4 shows how to use it with the hand-bearing compass.
        </p>
      </Section>

      <Section id="position" title="Latitude, longitude and reading a position">
        <p>
          Every place on Earth has an address made of two numbers. <strong>Latitude</strong> is how far north or south of the
          equator you are, from 0° at the equator to 90° at the poles. <strong>Longitude</strong> is how far east or west of
          the meridian through Greenwich you are, from 0° to 180°. Each degree is divided into 60 <strong>minutes</strong>, and
          on a chart the minutes are divided again into tenths.
        </p>
        <Interactive title="The grid on the globe" instructions="Drag the sliders, or jump to a charter base, to see where its latitude and longitude come from.">
          <GlobeExplorer />
        </Interactive>
        <p>
          A position is always written latitude first, with three-figure degrees for longitude. The Mediterranean bases are
          north and east, the Caribbean is north and west, and the Seychelles are south of the equator:
        </p>
        <Table
          head={["Charter base", "Position (about)"]}
          rows={[
            ["Marina Kaštela, Croatia", <span key="k" className="font-mono">{formatPosition({ lat: 43.545, lon: 16.399 })}</span>],
            ["Lefkas Marina, Greece", <span key="l" className="font-mono">{formatPosition({ lat: 38.826, lon: 20.722 })}</span>],
            ["Road Town, Tortola, BVI", <span key="r" className="font-mono">{formatPosition({ lat: 18.422, lon: -64.611 })}</span>],
            ["Baie Sainte Anne, Praslin, Seychelles", <span key="s" className="font-mono">{formatPosition({ lat: -4.337, lon: 55.773 })}</span>],
          ]}
        />
        <p>
          On the chart, latitude is marked up both sides and longitude along the top and bottom. To read a position, go
          straight across from the point to the side scale and read the latitude, then straight up or down to the top or
          bottom scale and read the longitude. West of Greenwich, longitude increases to the left; east of it, to the right.
        </p>
        <Worked
          title="Read the position of the old tower on Kerran"
          steps={[
            "Go straight across from the tower to the nearer side scale and count the minutes and tenths up from the last whole minute: that is the latitude.",
            "Go straight up to the top scale and count the minutes and tenths: that is the longitude. Here the minutes increase to the left, because Kerran is west of Greenwich.",
            "Write latitude first, then longitude, with N or S and E or W.",
          ]}
          answer={`The old tower is at ${formatPosition(TOWER.at)}.`}
        />
        <Interactive title="Read a position" instructions="Choose a feature, then step through the zooms to the latitude and longitude scales. Write the position down before you check.">
          <ReadPosition />
        </Interactive>
        <Interactive title="Plot a position" instructions="Tap the chart where you think the position is. Zoom in on the borders to count the tenths.">
          <PlotPractice />
        </Interactive>
        <Callout kind="tip" title="Positions on board">
          <p>
            The plotter shows your position in the same format. If you ever need to call for help on the radio, read it off the
            plotter, latitude first. Writing it in the log with the time every hour or so means you always know where you
            were.
          </p>
        </Callout>
      </Section>

      <Section id="bay" title="Reading a bay before you arrive">
        <p>
          This is where reading the chart pays off on a charter. Before you head for a bay, look at it on the chart, in the
          pilot book and on the plotter, and ask three questions:
        </p>
        <ol>
          <li>
            <strong>Is it sheltered from the wind that is forecast?</strong> A bay open to the wind gets the waves too. Look at
            which way it faces, and pick the side of an island away from the wind: in a northerly, anchor on the south side.
            Remember the wind can change overnight.
          </li>
          <li>
            <strong>Is there sand at a comfortable depth?</strong> Look for an S between the 5 m and 10 m contours, with enough
            room to swing. Too shallow and you may touch; too deep and you need more chain than you have.
          </li>
          <li>
            <strong>What is in the way?</strong> Rocks off the headland, a shallow patch across the entrance, a wreck, a buoy
            field or a swimming area. Plan your line in so it keeps clear of all of them.
          </li>
        </ol>
        <Interactive title="Read a bay" instructions="Choose the forecast wind and a stop round the island. The panel reads the chart for you: shelter, depth, seabed and dangers.">
          <BayReader />
        </Interactive>
        <Worked
          title="A southerly is forecast. Where do you stop for the night on Kerran?"
          steps={[
            "Shelter: a southerly blows onto the south coast, so Kerran Bay will be rolly. Kerran Roads, on the north side, has the whole island between it and the wind.",
            "Depth and seabed: Kerran Roads has sand at about 8 m: good holding, at a depth you can anchor in comfortably.",
            "Dangers: none charted close by, and the approach from the north is open water. In Kerran Bay, Mew Rock would be the one to watch.",
          ]}
          answer="Kerran Roads. If the forecast swings to the north, move round to Kerran Bay before dark."
        />
        <KeyIdea>Shelter, sand, and what is in the way: three questions, answered from the chart before you leave in the morning.</KeyIdea>
        <Callout kind="warning" title="Not for navigation">
          <p>The Isle of Kerran does not exist, and the seabed letters in the bay reader are added for this lesson. On a real charter, use the official charts on board and in the plotter, with the pilot book.</p>
        </Callout>
      </Section>
    </>
  );
}

const lesson: LessonContent = {
  objectives: [
    "Read soundings, contours, colours and drying heights, and know what chart datum means",
    "Recognise rocks, wrecks and the danger line, and know which seabed holds an anchor",
    "Read the compass rose, and read and plot a position in latitude and longitude",
    "Judge a bay from the chart before you arrive: shelter, depth and seabed, and dangers in the approach",
  ],
  keyTerms: [
    { term: "Sounding", definition: "A depth printed on the chart, in metres below chart datum; a small lowered figure gives the tenths." },
    { term: "Chart datum", definition: "The low level depths are measured from: about the lowest the tide falls." },
    { term: "Depth contour", definition: "A line joining points of equal depth. Close together means a steep seabed." },
    { term: "Drying height", definition: "An underlined figure: ground uncovered at low tide, measured up from chart datum." },
    { term: "Rock awash", definition: "A rock near the surface at low tide and hidden the rest of the time: a cross with four dots." },
    { term: "Holding", definition: "How well the seabed grips an anchor. Sand is good; weed, seagrass and rock are poor." },
    { term: "Compass rose", definition: "The magenta circles: outer ring true, inner ring magnetic, with the variation in the middle." },
    { term: "Variation", definition: "The angle between true north and magnetic north, where a compass points." },
    { term: "Latitude", definition: "Distance north or south of the equator, in degrees and minutes, read on the side scales." },
    { term: "Longitude", definition: "Distance east or west of Greenwich, in degrees and minutes, read on the top and bottom scales." },
  ],
  Body,
  Video,
  Exercises,
};

export default lesson;
