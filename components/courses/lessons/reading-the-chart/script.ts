import type { LessonScript } from "@/lib/courses/navigation/scripts";

// The spoken script of the lesson video. Plain data: the narration API
// records it ahead of time and the tests check it reads well. Figures for
// the practice chart (Brennan Bank 2.1 metres, variation 3 degrees west,
// Kerran Roads about 8 metres) match lib/courses/navigation/practice-chart.ts
// and this lesson's data.ts.

export const readingTheChart: LessonScript = {
  slug: "reading-the-chart",
  scenes: [
    {
      title: "A map of the sea",
      narration:
        "The chart is the most useful thing on the chart table, and it is easier to read than it looks. " +
        "It tells you how deep the water is, where the rocks are, and what the seabed is made of. " +
        "It gives you directions with the compass rose, and positions with latitude and longitude. " +
        "And before you arrive anywhere, it tells you whether a bay will be a good place to stop.",
    },
    {
      title: "Depths and soundings",
      narration:
        "The small numbers scattered over the sea are soundings. " +
        "Each one is a depth in metres, measured from a low level called chart datum, roughly the lowest the tide ever falls. " +
        "So there is nearly always at least that much water, and usually a little more. " +
        "In shallow water a smaller figure gives the tenths, so a two with a small one beside it means two point one metres. " +
        "In most of the Mediterranean the tide is tiny, so the charted depth is close to what you will find.",
    },
    {
      title: "Contours and colours",
      narration:
        "Lines joining points of the same depth are depth contours, just like the height contours on a walking map. " +
        "On this chart they are drawn at two, five, ten and twenty metres. " +
        "The colours help at a glance: the darker the blue, the shallower the water, and white is deep. " +
        "Where the contours crowd together, the seabed shelves steeply, so the depth can change fast as you come in.",
    },
    {
      title: "Ground that dries",
      narration:
        "Near the shore, some figures are underlined. " +
        "An underlined figure is a drying height: ground that is uncovered at low tide, measured up from chart datum. " +
        "Drying areas are tinted green. " +
        "You will meet plenty of them on tidal coasts, but very few in the Mediterranean or the Caribbean.",
    },
    {
      title: "Rocks and wrecks",
      narration:
        "Rocks are the thing to look for most carefully. " +
        "A rock that is always above water is drawn as a tiny island, and an asterisk is a rock that covers and uncovers. " +
        "A cross with four dots is a rock awash, near the surface at low tide, and a plain cross is a rock that stays underwater. " +
        "A dotted line around any of them means danger, and a wreck has a symbol of its own. " +
        "On the practice chart, The Teeth off Gull Point are rocks awash, hidden under the surface most of the time. " +
        "The symbol always wins: a single rock in deep blue water is still a rock.",
    },
    {
      title: "What the seabed is made of",
      narration:
        "The chart also tells you what the seabed is made of, in small italic letters. " +
        "S is sand, M is mud and R is rock, and weed has letters of its own. " +
        "Sand is what you want, because an anchor digs in and holds. " +
        "Weed is poor holding, because the anchor skids over the top, and rock gives it nothing to grip. " +
        "In the Mediterranean the weed is usually seagrass, which is protected in many places, including Mallorca and Corsica, so anchor on the pale sand patches. " +
        "In the Caribbean and the Seychelles the same goes for coral: never drop an anchor on it.",
    },
    {
      title: "The compass rose",
      narration:
        "The magenta circles are the compass rose. " +
        "The outer ring is true, lined up with true north at the top of the chart. " +
        "The inner ring is magnetic, turned by the variation, the difference between true north and where a compass points. " +
        "On the practice chart it is three degrees west, and the note in the middle says how it changes each year. " +
        "In the Mediterranean variation is only a few degrees, but in the Caribbean it is more than ten, so there it really matters.",
    },
    {
      title: "Latitude and longitude",
      narration:
        "Every position on Earth has an address made of two numbers. " +
        "Latitude is how far north or south of the equator you are, and longitude is how far east or west of Greenwich. " +
        "Both are measured in degrees, and each degree is split into sixty minutes. " +
        "On the chart, latitude is read on the scale up the sides, and longitude on the scale along the top and bottom. " +
        "Lefkas Marina in Greece is at about 38 degrees 50 minutes north, 20 degrees 43 minutes east. " +
        "Latitude always comes first, and in the Caribbean the longitude is west instead of east.",
    },
    {
      title: "Reading a bay before you arrive",
      narration:
        "Before you head for a bay, read it on the chart and ask three questions. " +
        "Is it sheltered from the wind that is forecast, or open to it? " +
        "Is there a patch of sand at a comfortable depth, say four to ten metres? " +
        "And what is in the way: a rock off the headland, a shallow patch, a wreck? " +
        "Kerran Roads, on the north side of the island, is a good stop in a southerly wind, with sand at about eight metres. " +
        "In a northerly it is wide open, so you would go round to Kerran Bay on the south side instead. " +
        "Next, we turn the chart into distances and times.",
    },
  ],
};
