import type { LessonScript } from "@/lib/courses/navigation/scripts";

// The spoken script of the lesson video. Plain data: the narration API
// records it ahead of time and the tests check it reads well. The speak
// entries for the Adriatic winds match lib/cruising/guides/croatia-split.ts.

export const weatherForACharterWeek: LessonScript = {
  slug: "weather-for-a-charter-week",
  speak: { VHF: "V H F", jugo: "hugo", maestral: "ma esstrahl", maestrale: "ma esstrahleh" },
  scenes: [
    {
      title: "Weather shapes the week",
      narration:
        "On a charter, the weather decides more than anything else: where you go, when you leave and where you spend the night. " +
        "This lesson shows how to read a forecast, where to find one, and which local winds to watch for in our sailing areas. " +
        "And it shows when the right answer is to stay put.",
    },
    {
      title: "Reading a forecast",
      narration:
        "A forecast gives the wind direction, its strength and the gusts. " +
        "The direction is where the wind blows from, so a northerly blows from the north towards the south. " +
        "Strength comes in knots, or as a force on the Beaufort scale. " +
        "Force four is eleven to sixteen knots, a pleasant sailing breeze, and force six is twenty-two to twenty-seven, a strong breeze with white crests everywhere. " +
        "Force eight, from thirty-four to forty knots, is a gale. " +
        "Gusts can be a third or more above the mean, and much more off high land, so reef for the gusts, not the average.",
      seconds: 34,
    },
    {
      title: "Where to get it",
      narration:
        "Check at least two sources, morning and evening. " +
        "The national weather service gives the official forecast for the coast, often in Beaufort forces. " +
        "Apps show the computer models in knots, hour by hour, but they smooth out the gusts and the local effects. " +
        "Marinas pin the forecast on the noticeboard, and the charter base briefs you before you leave. " +
        "On the radio, coast stations read forecasts and warnings at set times, announced on channel sixteen of the VHF.",
    },
    {
      title: "The daily sea breeze",
      narration:
        "In settled summer weather, the wind follows a daily pattern. " +
        "Mornings are often calm, with a light breeze off the land. " +
        "As the land heats up, a sea breeze sets in from late morning, blowing onshore, and builds through the afternoon, often to force three to five. " +
        "It dies away around sunset, and the night is usually quiet. " +
        "In Croatia this afternoon breeze is the maestral, and in the Ionian it is the maistro, both from the north-west. " +
        "So plan the longer legs for the breeze, and the night in a bay that is sheltered from it.",
      seconds: 32,
    },
    {
      title: "The meltemi",
      narration:
        "In the Aegean, the summer wind is the meltemi, a northerly that blows from about June to September, strongest in July and August. " +
        "It often blows force four to six, sometimes seven or more, for days at a time under clear blue skies. " +
        "It is usually strongest in the afternoon and can ease at night, but not always. " +
        "It kicks up a short, steep sea, and sends a swell into harbours and bays that face north. " +
        "The Saronic Gulf, near Athens, is partly sheltered from it, which is why it suits a first charter.",
    },
    {
      title: "The bora and the jugo",
      narration:
        "In the Adriatic, two winds change plans. " +
        "The bora is a cold north-easterly that falls off the mountains, and it can arrive suddenly, even under a clear sky. " +
        "Its gusts are violent, far above the mean, so when a bora is forecast, stay in a safe harbour or a bay sheltered from the north-east. " +
        "A cap of cloud along the mountain tops often comes first. " +
        "The jugo is the opposite: a warm, humid south-easterly that builds slowly over a day or two. " +
        "It brings cloud and rain, and a long, heavy sea that rolls into harbours open to the south.",
      seconds: 34,
    },
    {
      title: "The mistral",
      narration:
        "The mistral is a cold, dry north-westerly that blows down the Rhône valley into the Gulf of Lion. " +
        "It reaches Corsica and Sardinia, where the Sardinians call it the maestrale, and it can blow force six or more for several days. " +
        "It funnels through the Strait of Bonifacio, between the two islands, often a force or two stronger than out at sea. " +
        "When it is forecast, stay in a good harbour such as Calvi or Ajaccio, or on the sheltered side of the islands.",
    },
    {
      title: "Trade winds and monsoons",
      narration:
        "In the Caribbean, the trade wind blows from the east almost all year, usually fifteen to twenty knots. " +
        "Around Christmas it often blows harder for days, and short rain squalls bring gusts well above the mean. " +
        "The hurricane season runs from June to November, and charter companies have their own rules for it. " +
        "In the Seychelles, the south-east trade wind blows from May to October, and the north-west monsoon from December to March, with calmer months between. " +
        "In Thailand, the dry north-east monsoon from November to April is the sailing season, and the south-west monsoon brings rain and swell for the rest of the year. " +
        "So the season you book decides the wind you get.",
      seconds: 36,
    },
    {
      title: "When to stay put",
      narration:
        "The best charter skippers are the ones who know when not to go. " +
        "Read the whole forecast: the wind, the gusts, the direction, and how it changes tonight and tomorrow. " +
        "Then ask what the worst is, when it comes, and where you will be at the time. " +
        "If the forecast is beyond your crew or the boat, stay in harbour, or make a short hop downwind to somewhere safer. " +
        "Check the night's shelter against tonight's wind, not this morning's. " +
        "A day ashore is part of the holiday, but a rough passage with a frightened crew is not. " +
        "Next, the plotter, the apps and the week's plan.",
    },
  ],
};
