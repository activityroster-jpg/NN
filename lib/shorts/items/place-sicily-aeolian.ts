import type { Short } from "../types";

// The Aeolian Islands in 45 seconds: the base, the best months, two highlights
// and the week's loop, all taken from the cruising guide (lib/cruising/guides/sicily-aeolian.ts).

export const placeSicilyAeolian: Short = {
  id: "place-sicily-aeolian",
  strand: "place",
  title: "Aeolian Islands: a week by yacht",
  speak: {
    Sciara: "Shahra",
    Fuoco: "Fwoko",
    Vulcano: "Voolkahno",
    Panarea: "Panaraya",
    "nauticalnomads.com": "nautical nomads dot com",
  },
  scenes: [
    {
      heading: "Aeolian Islands",
      sub: "a week by yacht",
      lead: "The Aeolian Islands: black beaches, hot springs and a volcano that erupts at dusk.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "Aeolian Islands Lipari aerial" } },
    },
    {
      badge: "Start",
      heading: "Marina di Portorosa",
      narration: "The week starts at Marina di Portorosa on the north coast of Sicily, about two hours by road from Catania airport.",
      visual: { kind: "footage", footage: { q: "Sicily marina sailboats" } },
    },
    {
      badge: "Best months",
      heading: "May, June, September",
      narration: "May, June and September are the best months: warm water, steady breezes and room in the harbours.",
      visual: { kind: "footage", footage: { q: "Aeolian Islands sea sailboat" } },
    },
    {
      badge: "Highlight",
      heading: "Stromboli",
      narration: "After dark off Stromboli, watch the eruptions from the sea at the Sciara del Fuoco, keeping outside the exclusion zone.",
      visual: { kind: "footage", footage: { q: "Stromboli volcano eruption night" } },
    },
    {
      badge: "Highlight",
      heading: "Vulcano",
      narration: "On Vulcano, swim where hot springs bubble up off the beach, and wallow in the warm mud pool if it is open.",
      visual: { kind: "footage", footage: { q: "Vulcano island Sicily" } },
    },
    {
      badge: "The route",
      heading: "6 days, 91 miles",
      narration: "Portorosa, Vulcano, Salina, Panarea, Stromboli and Lipari, then back to Sicily.",
      visual: { kind: "footage", footage: { q: "Lipari Sicily harbour" } },
    },
    {
      narration: "Plan your week at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "A week by yacht in the Aeolian Islands from Portorosa, Sicily: Vulcano's hot springs, Salina, Panarea, the eruptions of Stromboli at dusk and Lipari. Best in May, June and September.",
  hashtags: ["sailing", "yachtcharter", "sicily", "aeolianislands", "stromboli", "volcano", "italy", "nauticalnomads"],
  sources: ["Nautical Nomads cruising guide: Aeolian Islands (lib/cruising/guides/sicily-aeolian.ts)"],
};
