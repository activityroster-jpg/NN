import type { LessonScript } from "@/lib/courses/navigation/scripts";

// The spoken script of the Lesson 7 video. Plain data: the narration API
// records it ahead of time and the tests check it reads well. Chart
// abbreviations are captioned as printed and spoken through `speak`.

export const lightsAtNight: LessonScript = {
  slug: "lights-at-night",
  speak: {
    "Fl(3)": "F L three",
    "Fl is": "F L is",
    "10s": "ten seconds",
    "28m": "twenty-eight metres",
    "15M": "fifteen miles",
    VQ: "V Q",
    Iso: "Eye-so",
    "Oc is": "O C is",
  },
  scenes: [
    {
      title: "Lights in the dark",
      narration:
        "At night the coastline disappears, and lights take over. " +
        "Every lighthouse, beacon and lit buoy shows its own pattern of light and dark, called its characteristic. " +
        "Out there: three flashes, then darkness, every ten seconds. " +
        "That pattern says Gull Point lighthouse, on our practice chart of the Isle of Kerran. " +
        "In this lesson you will learn to read a light on the chart, find it among the lights of a harbour, and show the right lights on your own yacht. " +
        "You will also see why charter companies want you tied up before dark.",
    },
    {
      title: "Lights on the chart",
      narration:
        "On the chart, a light is marked with a magenta flare, shaped like a teardrop. " +
        "A lighthouse is drawn as a star with the flare beside it, and its characteristic is printed alongside. " +
        "Lit buoys have a flare too, usually with just the rhythm, the colour and the period, like the red and green buoys into Port Kerran. " +
        "On most plotters you can tap a light to see its characteristic written out in full.",
    },
    {
      title: "Reading the code",
      narration:
        "Every characteristic is written in the same order. " +
        "First comes the rhythm: Fl(3) means group flashing, three flashes at a time. " +
        "Next comes the colour, and here there is no letter, which means white. " +
        "Then the period, 10s, the time for one whole cycle from the start of one group to the start of the next. " +
        "Last come the height of the light, 28m, and how far it can be seen on a clear night, 15M.",
    },
    {
      title: "What you really see",
      narration:
        "The charted range is for a clear night, and real nights are rarely that kind. " +
        "Haze, rain and the glare of a town all cut it down, so a light may appear much later than you expect. " +
        "Buoy lights are small and low, and you will often pick them out only in the last mile or two. " +
        "The curve of the Earth hides a low light too, which is why the big lighthouses stand tall. " +
        "So never name a light from one glance: check its colour, its count and its period first.",
    },
    {
      title: "The rhythms",
      narration:
        "Here are the rhythms you will meet most often. " +
        "Fl is flashing: short flashes, with more dark than light. " +
        "Fl(3) is group flashing, with a longer darkness between the groups. " +
        "Q is quick, about one flash a second, and VQ is very quick, about two a second. " +
        "Iso is isophase, with equal light and dark. " +
        "Oc is occulting, the opposite of flashing: mostly on, blinking off once each period.",
    },
    {
      title: "Identifying a light",
      narration:
        "To identify a light, first note its colour. " +
        "Then count the flashes in each group. " +
        "Then time the period with the stopwatch on your phone, from the first flash of one group to the first flash of the next. " +
        "Time several periods and divide, and the answer is better still. " +
        "White, two flashes every five seconds: on our chart, that can only be Mew Rock beacon.",
      seconds: 24,
    },
    {
      title: "A harbour after dark",
      narration:
        "Here is the view ahead as you come into Port Kerran at night. " +
        "The town behind the harbour is a carpet of lights: streets, bars, cars and windows. " +
        "The navigation lights hide among them, and the trick is that shore lights are steady while navigation lights keep a rhythm. " +
        "The two leading lights blink out together, one above the other, and the red and green buoys flash low on the water. " +
        "Red lights high on the hill are not buoys at all, but the warning lights on a radio mast. " +
        "Even when you have named every light, distance is hard to judge in the dark, and a moored boat or the end of a quay can appear very suddenly.",
      seconds: 28,
    },
    {
      title: "Arrive in daylight",
      narration:
        "This is why most charter companies ask you to be in harbour or at anchor before dark. " +
        "Many charter contracts forbid sailing at night altogether, and breaking the rule can leave you without insurance cover. " +
        "Plenty of hazards carry no light at all: rocks, mooring buoys, fish farm cages, swimming area floats and unlit small boats. " +
        "In the Caribbean many reefs are unmarked, and near the equator, in the Seychelles or Phuket, night falls fast at about the same time all year. " +
        "So plan to arrive by mid-afternoon, with a couple of hours in hand if the wind dies or the anchor will not hold. " +
        "If you are caught out, slow right down, put your lights on, and head for the simplest, best-lit entrance you can reach.",
    },
    {
      title: "Your own lights",
      narration:
        "Your yacht must show navigation lights from sunset to sunrise, and in poor visibility. " +
        "Under sail you show red to port, green to starboard and white astern. " +
        "Many yachts can show all three from one tricolour lantern at the top of the mast, but only under sail. " +
        "With the engine running, even with the sails up, you count as a motor boat: use the deck-level lights and add the white steaming light on the front of the mast. " +
        "At anchor, switch the navigation lights off and show one white light that is visible all round, usually at the masthead. " +
        "Check every light at handover, because a blown bulb is easier to fix on the pontoon than at sea.",
    },
  ],
};
