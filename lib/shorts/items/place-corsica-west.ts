import type { Short } from "../types";

// West Corsica in 45 seconds: the base, the best months, two highlights and the
// week's loop, all taken from the cruising guide (lib/cruising/guides/corsica-west.ts).

export const placeCorsicaWest: Short = {
  id: "place-corsica-west",
  strand: "place",
  title: "West Corsica: a week by yacht",
  speak: {
    Ajaccio: "Azhaksyo",
    Girolata: "Jeerolahta",
    "Calanques de Piana": "Kalonk duh Piana",
    "Cargèse": "Carzhez",
    "nauticalnomads.com": "nautical nomads dot com",
  },
  scenes: [
    {
      heading: "West Corsica",
      sub: "a week by yacht",
      lead: "West Corsica: red granite cliffs, deep blue water and wild, quiet bays.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "Corsica cliffs sea aerial" } },
    },
    {
      badge: "Start",
      heading: "Ajaccio",
      narration: "The week starts and ends in Ajaccio, in one of two city marinas, a short taxi ride from the airport.",
      visual: { kind: "footage", footage: { q: "Ajaccio Corsica harbour" } },
    },
    {
      badge: "Best months",
      heading: "June and September",
      narration: "June and September are the best months: warm water, more settled weather and room in the small harbours.",
      visual: { kind: "footage", footage: { q: "Corsica coast sailboat" } },
    },
    {
      badge: "Highlight",
      heading: "Scandola reserve",
      narration: "Sail slowly along the red cliffs of the Scandola reserve to Girolata, a hamlet with no road.",
      visual: { kind: "footage", footage: { q: "Scandola Corsica red cliffs" } },
    },
    {
      badge: "Highlight",
      heading: "Calanques de Piana",
      narration: "Take the boat slowly beneath the Calanques de Piana and watch the cliffs glow red at sunset.",
      visual: { kind: "footage", footage: { q: "Piana Corsica red rocks sea" } },
    },
    {
      badge: "The route",
      heading: "6 days, 112 miles",
      narration: "Ajaccio, Cargèse, Girolata, Calvi, Porto and Cargèse again, then back to Ajaccio. This coast faces the mistral, so plan each day around the forecast.",
      visual: { kind: "footage", footage: { q: "Calvi Corsica citadel" } },
    },
    {
      narration: "Plan your Corsican week at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "A week by yacht on the west coast of Corsica from Ajaccio: Cargèse, Girolata, the Scandola reserve, Calvi and the red cliffs of the Calanques de Piana. Best in June and September.",
  hashtags: ["sailing", "yachtcharter", "corsica", "ajaccio", "scandola", "france", "boatlife", "nauticalnomads"],
  sources: ["Nautical Nomads cruising guide: West Corsica (lib/cruising/guides/corsica-west.ts)"],
};
