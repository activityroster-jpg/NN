import type { Short } from "../types";

// Göcek and Fethiye Bay in 45 seconds: the base, the best months, two
// highlights and the week's loop, all taken from the cruising guide (lib/cruising/guides/turkey-gocek.ts).

export const placeTurkeyGocek: Short = {
  id: "place-turkey-gocek",
  strand: "place",
  title: "Göcek and Fethiye Bay: a week by yacht",
  speak: {
    "Göcek": "Gurrjeck",
    Gemiler: "Ghemmeeler",
    Fethiye: "Fet heeyeh",
    Tersane: "Tersahneh",
    "nauticalnomads.com": "nautical nomads dot com",
  },
  scenes: [
    {
      heading: "Göcek and Fethiye Bay",
      sub: "a week by yacht",
      lead: "Göcek, Turkey: pine-clad coves, restaurant jetties and ancient ruins at the water's edge.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "Gocek Turkey bay yacht" } },
    },
    {
      badge: "Start",
      heading: "Göcek",
      narration: "The week starts and ends in Göcek, a small yachting village with several marinas, about half an hour from Dalaman airport.",
      visual: { kind: "footage", footage: { q: "Gocek marina Turkey" } },
    },
    {
      badge: "Best months",
      heading: "May, June",
      sub: "September, October",
      narration: "May, June, September and October are the best months: warm water, steady breezes and quieter bays.",
      visual: { kind: "footage", footage: { q: "Turkey pine coast sailboat" } },
    },
    {
      badge: "Highlight",
      heading: "Cleopatra's Bath",
      narration: "In Ruin Bay, snorkel over the walls of a Roman bath house, known as Cleopatra's Bath, lying half under the water.",
      visual: { kind: "footage", footage: { q: "Fethiye Turkey bay snorkelling" } },
    },
    {
      badge: "Highlight",
      heading: "Gemiler Island",
      narration: "Gemiler Island is covered in the ruins of Byzantine churches. Climb the covered stone passageway to the top.",
      visual: { kind: "footage", footage: { q: "Gemiler island ruins Turkey" } },
    },
    {
      badge: "The route",
      heading: "6 days, 67 miles",
      narration: "Cleopatra's Bath, Fethiye, Gemiler Island, Sarsala Bay and Tersane Island, then back to Göcek.",
      visual: { kind: "footage", footage: { q: "Fethiye Turkey sailing yacht" } },
    },
    {
      narration: "Plan your week at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "A week by yacht from Göcek, Turkey: Cleopatra's Bath, Fethiye, the church ruins of Gemiler Island, Sarsala Bay and Tersane Island. Best in May, June, September and October.",
  hashtags: ["sailing", "yachtcharter", "turkey", "gocek", "fethiye", "boatlife", "nauticalnomads"],
  sources: ["Nautical Nomads cruising guide: Göcek and Fethiye Bay (lib/cruising/guides/turkey-gocek.ts)"],
};
