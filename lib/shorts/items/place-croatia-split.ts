import type { Short } from "../types";

// Central Dalmatia in 45 seconds: the base, the best months, two highlights and
// the week's loop, all taken from the cruising guide (lib/cruising/guides/croatia-split.ts).

export const placeCroatiaSplit: Short = {
  id: "place-croatia-split",
  strand: "place",
  title: "Central Dalmatia: a week by yacht",
  speak: {
    "Kaštela": "Kashtela",
    "Šolta": "Sholta",
    "Brač": "Brahtch",
    Vis: "Veece",
    "Komiža": "Kommizha",
    "Biševo": "Bishevo",
    Pakleni: "Packleni",
    Maslinica: "Maslinitsa",
    "Palmižana": "Palmizhana",
    Fortica: "Fortitsa",
    "nauticalnomads.com": "nautical nomads dot com",
  },
  scenes: [
    {
      heading: "Central Dalmatia",
      sub: "a week by yacht",
      lead: "Central Dalmatia in Croatia: islands two hours apart and the clearest water in the Adriatic.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "Hvar Croatia harbour aerial" } },
    },
    {
      badge: "Start",
      heading: "Marina Kaštela",
      narration: "The week starts in Marina Kaštela, one of two main charter bases, both close to Split airport.",
      visual: { kind: "footage", footage: { q: "Split Croatia marina sailboats" } },
    },
    {
      badge: "Best months",
      heading: "May, June, September",
      narration: "May, June and September are the sweet spot: warm water, steady breezes and space in the harbours.",
      visual: { kind: "footage", footage: { q: "Croatia island coast sailboat" } },
    },
    {
      badge: "Highlight",
      heading: "The Blue Cave",
      narration: "Round the west end of Vis to Biševo for the Blue Cave, best around midday, then on to the fishing town of Komiža.",
      visual: { kind: "footage", footage: { q: "Croatia sea cave turquoise water boat" } },
    },
    {
      badge: "Highlight",
      heading: "Hvar town",
      narration: "From the pine-covered Pakleni islands, take a water taxi to Hvar town and climb to the Fortica fortress at sunset.",
      visual: { kind: "footage", footage: { q: "Hvar town Croatia aerial" } },
    },
    {
      badge: "The route",
      heading: "6 days, 89 miles",
      narration: "Kaštela, Maslinica on Šolta, Vis town, Komiža, Palmižana and Milna on Brač, then back to base.",
      visual: { kind: "footage", footage: { q: "sailing yacht Adriatic sea Croatia" } },
    },
    {
      narration: "Plan your week at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "A week by yacht in Central Dalmatia, Croatia: start in Marina Kaštela, then Šolta, Vis, the Blue Cave, Komiža, the Pakleni islands and Brač. Best in May, June and September.",
  hashtags: ["sailing", "yachtcharter", "croatia", "dalmatia", "hvar", "sailingcroatia", "boatlife", "nauticalnomads"],
  sources: ["Nautical Nomads cruising guide: Central Dalmatia (lib/cruising/guides/croatia-split.ts)"],
};
