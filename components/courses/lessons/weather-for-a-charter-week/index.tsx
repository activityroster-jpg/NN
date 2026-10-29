import Link from "next/link";
import { GUIDES } from "@/lib/cruising";
import type { LessonContent } from "@/lib/courses/types";
import { Callout, Interactive, KeyIdea, Section, Table, Worked } from "../../LessonParts";
import { Exercises, Video } from "./client";
import { BEAUFORT, knotsText } from "./data";
import { BeaufortConverter, ForecastDecoder, LocalWinds, SeaBreezeDay, type WindArea } from "./widgets";

const guide = (id: string, name: string) => <Link href={`/en/cruising/${id}`}>{name}</Link>;

// The local winds and forecast sources of every cruising guide, for the widget.
const AREAS: WindArea[] = GUIDES.map((g) => ({ id: g.id, name: g.name, country: g.country, summary: g.weather.summary, winds: g.weather.winds, forecasts: g.weather.forecasts }));

function Body() {
  return (
    <>
      <Section id="plan" title="Weather shapes the week">
        <p>
          On a charter, the weather decides more than anything else: which way round the islands you go, when you leave in the
          morning, and above all where you spend each night. You don't need to be a meteorologist. You need to read a forecast
          properly, know the handful of local winds in your sailing area, and recognise the days to stay put.
        </p>
        <p>
          The example forecasts in this lesson are written for teaching. Before you sail, always get the latest real forecast for
          your area, and listen to your charter company's briefing.
        </p>
      </Section>

      <Section id="reading" title="Reading a forecast: direction, strength, gusts">
        <p>
          <strong>Direction</strong> is where the wind blows <em>from</em>. A northerly blows from the north towards the south;
          a south-westerly from the south-west. The same goes for the local names: the meltemi is a northerly, the bora a
          north-easterly. So a bay is sheltered when there is land on the side the wind is named for.
        </p>
        <p>
          <strong>Strength</strong> comes either in knots (apps, and most charter briefings) or as a <strong>Beaufort force</strong>,
          a band of <em>mean</em> wind speeds (most official Mediterranean forecasts). Learn the bands you will sail in:
        </p>
        <Table
          head={["Force", "Name", "Mean wind", "On a charter"]}
          rows={BEAUFORT.filter((b) => b.force <= 9).map((b) => [
            <strong key="f" className="tabular-nums">{b.force}</strong>, b.name, <span key="k" className="tabular-nums">{knotsText(b.force)}</span>, b.charter,
          ])}
        />
        <p>
          <strong>Gusts</strong> are the short bursts above the mean. Expect them to be a third or more above it, and much more
          where the wind comes down off high land, in squalls and in a bora. Reef for the gusts, not for the average.
        </p>
        <Interactive title="Knots and forces" instructions="Drag the slider (or use the arrow keys) to a mean wind speed, or jump to a force.">
          <BeaufortConverter />
        </Interactive>
        <Worked
          title="What does this forecast mean for the boat?"
          steps={[
            <>“North-west 4, locally 5 in the afternoon, gusts 25 knots.”</>,
            <>North-west: it blows from the north-west, so bays open to the north-west catch it, and those with land to the north-west are sheltered.</>,
            <>Force 4 is {knotsText(4)}: ideal sailing. Locally 5 ({knotsText(5)}) means in places, usually in the channels and off the headlands.</>,
            <>Gusts 25 knots are force 6 strength: put the first reef in before you leave, and you will be comfortable all afternoon.</>,
          ]}
          answer="A good sailing day with one reef in, and a night in a bay with land to the north-west."
        />
      </Section>

      <Section id="sources" title="Where to get the forecast">
        <ul>
          <li><strong>The national weather service.</strong> The official coastal forecast, usually in Beaufort forces, with warnings. Examples: the Croatian Meteorological Service (DHMZ), the Hellenic National Meteorological Service, Météo-France, the Spanish AEMET.</li>
          <li><strong>Apps.</strong> Windy, PredictWind and others show the computer weather models in knots, hour by hour. They are superb for timing, but they smooth out the gusts and can miss local effects such as sea breezes and the wind funnelling between islands.</li>
          <li><strong>Marina noticeboards and the charter base.</strong> Most marinas and harbour offices pin up the day's forecast, and the base briefs you before you leave. The base is also the people to call if the weather turns.</li>
          <li><strong>VHF radio.</strong> Coast stations broadcast forecasts and warnings at set times, announced on channel 16 before they move to a working channel. In Croatia, forecasts run continuously on VHF from the coastal stations, in English and Croatian.</li>
        </ul>
        <Callout kind="tip" title="Two sources, twice a day">
          <p>
            Check the official forecast and an app every morning and every evening. If they agree, good. If they disagree, plan for
            the worse one, and look at the sky and the sea for which is right.
          </p>
        </Callout>
      </Section>

      <Section id="sea-breeze" title="The daily sea breeze">
        <p>
          In settled summer weather, the wind near the coast follows a daily cycle. The land heats faster than the sea, warm air
          rises over it, and cooler air flows in from the sea: a <strong>sea breeze</strong>, blowing onshore from late morning,
          building to force 3 to 5 by mid-afternoon and dying away around sunset. Mornings are often calm, sometimes with a light
          land breeze off the shore, and nights are usually quiet.
        </p>
        <Interactive title="A sea-breeze day" instructions="Drag through the day to see how the breeze builds and fades.">
          <SeaBreezeDay />
        </Interactive>
        <p>
          Many areas have a name for it: the <strong>maestral</strong> in {guide("croatia-split", "Croatia")} and{" "}
          {guide("montenegro-kotor", "Montenegro")}, the <strong>maistro</strong> in {guide("greece-ionian", "the Ionian")}, the{" "}
          <strong>embat</strong> in the Bay of Palma ({guide("mallorca", "Mallorca")}) and the <strong>meltem</strong> in{" "}
          {guide("turkey-gocek", "the Göcek bays")}. Plan the longer legs for the afternoon breeze, and the night in a bay that is
          sheltered from it.
        </p>
      </Section>

      <Section id="local" title="Local winds in our sailing areas">
        <Table
          head={["Wind", "Where", "From", "What to expect", "What to do"]}
          rows={[
            [<strong key="m">Meltemi</strong>, "Aegean, about June to September", "North (north-east to north-west)", "Often force 4 to 6, sometimes 7 or more, for days, under clear skies. Strongest in the afternoon.", "Plan legs south or across it; harbours facing north get a swell. The Saronic Gulf is partly sheltered."],
            [<strong key="b">Bora (bura)</strong>, "Adriatic: Croatia, Montenegro", "North-east", "Cold and dry, falling off the mountains, often suddenly. Violent gusts, far above the mean.", "Be in a safe harbour or a bay sheltered from the north-east. A cap of cloud on the mountains often comes first."],
            [<strong key="j">Jugo</strong>, "Adriatic", "South-east", "Warm and humid, building over a day or two, with cloud, rain and a long, heavy sea.", "Avoid harbours and bays open to the south."],
            [<strong key="s">Mistral (maestrale)</strong>, "Gulf of Lion, Corsica, Sardinia", "North-west", "Cold and dry, force 6 or more for several days; a force or two stronger in the Strait of Bonifacio.", "Stay in a good harbour such as Calvi or Ajaccio, or on the sheltered side of the islands."],
            [<strong key="t">Trade wind</strong>, "Caribbean, almost all year", "East", "Usually 15 to 20 knots; stronger Christmas winds, often December to February; short rain squalls.", "Do the beats east early. Hurricane season is June to November: follow the charter company's plan."],
            [<strong key="y">Trade wind and monsoon</strong>, "Seychelles", "South-east, May to October; north-west, December to March", "Steady trades with a short chop in the channels; a lighter, humid monsoon with showers. Calmer months between.", "Choose bays on the side away from the season's wind."],
            [<strong key="p">Monsoons</strong>, "Thailand, Andaman Sea", "North-east, November to April; south-west, May to October", "The dry north-east monsoon is the sailing season. The south-west brings rain, squalls and swell.", "Book in the north-east monsoon; Phang Nga Bay is sheltered in most weather."],
          ]}
        />
        <Interactive title="The winds of each sailing area" instructions="Pick an area to see its winds on the compass, blowing in from the side they come from, and where to get the forecast there.">
          <LocalWinds areas={AREAS} />
        </Interactive>
        <Callout kind="warning" title="The bora gives little warning">
          <p>
            A bora can arrive within minutes, even under a clear sky, with gusts far stronger than the forecast mean. If one is
            forecast, don't spend the night in a bay open to the north-east, and don't rely on a long line ashore to hold the boat
            sideways to it.
          </p>
        </Callout>
      </Section>

      <Section id="decide" title="Go, stay put or change the plan">
        <p>Read the whole forecast, including tonight and tomorrow, then ask three questions:</p>
        <ol>
          <li><strong>What is the worst it allows?</strong> The top of the force range, and the gusts.</li>
          <li><strong>When does it come?</strong> This afternoon, tonight, in two days?</li>
          <li><strong>Where will we be then?</strong> On passage, in an open bay, or tied up in harbour?</li>
        </ol>
        <p>
          If the answer is beyond your crew or the boat, stay in harbour, or make a short hop downwind to somewhere safer. Check
          the night's shelter against <em>tonight's</em> wind, not this morning's. Many charter companies set their own limits and
          will expect you to stay in above a certain strength: ask at the briefing.
        </p>
        <Interactive title="Decode the forecast, then decide" instructions="Each example forecast comes with a plan. Tap the underlined phrases to decode them, then choose.">
          <ForecastDecoder />
        </Interactive>
        <KeyIdea>The forecast tells you the worst and when; your plan decides where you will be when it comes. A day ashore is part of the holiday.</KeyIdea>
      </Section>
    </>
  );
}

const lesson: LessonContent = {
  objectives: [
    "Read a forecast: direction as where the wind comes from, strength in knots and Beaufort forces, and the gusts",
    "Find the forecast from the weather service, apps, marina noticeboards and VHF, and know the limits of each",
    "Use the daily sea-breeze cycle, and recognise the meltemi, bora, jugo, mistral, trade winds and monsoons",
    "Decide when to go, when to change the plan and when to stay put",
  ],
  keyTerms: [
    { term: "Wind direction", definition: "Where the wind blows from: a northerly comes from the north." },
    { term: "Beaufort force", definition: `A band of mean wind speeds: force 4 is ${knotsText(4)}, force 6 ${knotsText(6)}, force 8 (gale) ${knotsText(8)}.` },
    { term: "Gust", definition: "A short burst above the mean wind, often a third or more stronger. Reef for the gusts." },
    { term: "Sea breeze", definition: "An onshore wind on sunny days, from late morning to sunset, often force 3 to 5." },
    { term: "Meltemi", definition: "The strong northerly summer wind of the Aegean, about June to September." },
    { term: "Bora", definition: "A cold north-easterly in the Adriatic (bura in Croatian), falling suddenly off the mountains with violent gusts." },
    { term: "Jugo", definition: "A warm, humid south-easterly in the Adriatic, building slowly with rain and a heavy sea." },
    { term: "Mistral", definition: "A cold north-westerly from the Gulf of Lion to Corsica and Sardinia, where it is called the maestrale." },
    { term: "Trade wind", definition: "The steady easterly of the Caribbean, usually 15 to 20 knots." },
    { term: "Monsoon", definition: "A seasonal wind that reverses through the year, as in the Seychelles and Thailand." },
  ],
  Body,
  Video,
  Exercises,
};

export default lesson;
