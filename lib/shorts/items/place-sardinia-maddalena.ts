import type { Short } from "../types";

// La Maddalena and the Costa Smeralda in 45 seconds: the base, the best months,
// two highlights and the week's loop, all taken from the cruising guide
// (lib/cruising/guides/sardinia-maddalena.ts).

export const placeSardiniaMaddalena: Short = {
  id: "place-sardinia-maddalena",
  strand: "place",
  title: "La Maddalena and the Costa Smeralda: a week by yacht",
  speak: {
    Maddalena: "Maddalayna",
    Spargi: "Sparjee",
    Bonifacio: "Bonifahcho",
    Cervo: "Chairvo",
    Cannigione: "Kannijohneh",
    "nauticalnomads.com": "nautical nomads dot com",
  },
  scenes: [
    {
      heading: "La Maddalena, Sardinia",
      sub: "a week by yacht",
      lead: "North-east Sardinia: granite islands, turquoise bays and a hop across the strait to Corsica.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "Sardinia turquoise bay sailboat" } },
    },
    {
      badge: "Start",
      heading: "Marina di Portisco",
      narration: "The week starts in Marina di Portisco on the Costa Smeralda, an easy drive from Olbia airport.",
      visual: { kind: "footage", footage: { q: "Sardinia marina yachts" } },
    },
    {
      badge: "Best months",
      heading: "May, June, September",
      narration: "May, June and September are the best months: warm water, fewer boats and easier berths.",
      visual: { kind: "footage", footage: { q: "Costa Smeralda Sardinia beach aerial" } },
    },
    {
      badge: "Highlight",
      heading: "La Maddalena",
      narration: "The La Maddalena archipelago is a national park of granite islands and shallow turquoise water. Swim off the sandy coves of Spargi.",
      visual: { kind: "footage", footage: { q: "La Maddalena Sardinia islands" } },
    },
    {
      badge: "Highlight",
      heading: "Bonifacio",
      narration: "Cross the strait early to Bonifacio in France: white cliffs, an old town on top and a harbour hidden in a narrow inlet.",
      visual: { kind: "footage", footage: { q: "Bonifacio Corsica cliffs" } },
    },
    {
      badge: "The route",
      heading: "6 days, 84 miles",
      narration: "Portisco, Porto Cervo, Caprera, La Maddalena, Bonifacio and Cannigione, then back to Portisco.",
      visual: { kind: "footage", footage: { q: "Sardinia coast sailing yacht" } },
    },
    {
      narration: "Plan your week at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "A week by yacht in north-east Sardinia: start in Portisco, then Porto Cervo, Caprera, La Maddalena, Bonifacio in Corsica and Cannigione. Best in May, June and September.",
  hashtags: ["sailing", "yachtcharter", "sardinia", "lamaddalena", "costasmeralda", "bonifacio", "italy", "nauticalnomads"],
  sources: ["Nautical Nomads cruising guide: La Maddalena and the Costa Smeralda (lib/cruising/guides/sardinia-maddalena.ts)"],
};
