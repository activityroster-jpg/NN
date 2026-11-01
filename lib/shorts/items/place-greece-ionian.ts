import type { Short } from "../types";

// The Ionian Islands in 45 seconds: the base, the best months, two highlights
// and the week's loop, all taken from the cruising guide (lib/cruising/guides/greece-ionian.ts).

export const placeGreeceIonian: Short = {
  id: "place-greece-ionian",
  strand: "place",
  title: "Ionian Islands: a week by yacht",
  speak: {
    Preveza: "Prevuhza",
    Meganisi: "Meganeesee",
    Kalamos: "Kallamos",
    Sivota: "Seevuhta",
    quay: "key",
    "nauticalnomads.com": "nautical nomads dot com",
  },
  scenes: [
    {
      heading: "Ionian Islands",
      sub: "a week by yacht",
      lead: "The Ionian: gentle breezes, green islands and the most sheltered sailing in Greece.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "Lefkada Greece sailing" } },
    },
    {
      badge: "Start",
      heading: "Lefkas Marina",
      narration: "The week starts in Lefkas Marina, about half an hour from Preveza airport and a short walk from the old town.",
      visual: { kind: "footage", footage: { q: "Lefkada marina boats" } },
    },
    {
      badge: "Best months",
      heading: "May, June, September",
      narration: "May, June and September are the sweet spot: warm water, steady afternoon breezes and room on the quays.",
      visual: { kind: "footage", footage: { q: "Ionian sea sailboat Greece" } },
    },
    {
      badge: "Highlight",
      heading: "Kioni, Ithaca",
      narration: "Kioni sits in a narrow inlet on Ithaca, the home island of Odysseus, with three ruined windmills on the headland.",
      visual: { kind: "footage", footage: { q: "Ithaca Greece harbour" } },
    },
    {
      badge: "Highlight",
      heading: "Fiskardo",
      narration: "Fiskardo is the prettiest harbour on Kefalonia, with Venetian houses that survived the great earthquake of nineteen fifty-three.",
      visual: { kind: "footage", footage: { q: "Kefalonia Fiskardo harbour" } },
    },
    {
      badge: "The route",
      heading: "6 days, 87 miles",
      narration: "Lefkas, Meganisi, Kalamos, Kioni, Fiskardo and Sivota, then back to Lefkas.",
      visual: { kind: "footage", footage: { q: "Greek island sailing yacht Ionian" } },
    },
    {
      narration: "Plan your Ionian week at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "A week by yacht in the Ionian Islands from Lefkas: Meganisi, Kalamos, Kioni on Ithaca, Fiskardo on Kefalonia and Sivota. Gentle breezes and sheltered water. Best in May, June and September.",
  hashtags: ["sailing", "yachtcharter", "greece", "ionianislands", "lefkada", "kefalonia", "greekislands", "nauticalnomads"],
  sources: ["Nautical Nomads cruising guide: Ionian Islands (lib/cruising/guides/greece-ionian.ts)"],
};
