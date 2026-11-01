import type { Short } from "../types";

// Praslin and La Digue in 45 seconds: the base, the best months, two highlights
// and the week's loop, all taken from the cruising guide (lib/cruising/guides/seychelles.ts).

export const placeSeychelles: Short = {
  id: "place-seychelles",
  strand: "place",
  title: "Praslin and La Digue: a week by yacht",
  speak: {
    "Baie Sainte Anne": "Bay Sant Ann",
    Praslin: "Prahlin",
    "La Digue": "La Deeg",
    "Anse Source d'Argent": "Ahns Soorss Darzhon",
    Anse: "Ahns",
    "Grand Anse": "Grahn Dahns",
    "Félicité": "Faylisseetay",
    Curieuse: "Kooreeyerz",
    "nauticalnomads.com": "nautical nomads dot com",
  },
  scenes: [
    {
      heading: "Praslin and La Digue",
      sub: "a week by yacht",
      lead: "The Seychelles: granite islands, giant tortoises and white sand beaches, all a short sail apart.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "Seychelles granite beach aerial" } },
    },
    {
      badge: "Start",
      heading: "Baie Sainte Anne",
      narration: "The week starts at Baie Sainte Anne on Praslin, a short ferry ride or flight from the international airport on Mahé.",
      visual: { kind: "footage", footage: { q: "Praslin Seychelles bay boats" } },
    },
    {
      badge: "Best months",
      heading: "April, May",
      sub: "October, November",
      narration: "The calm months between the monsoons, April and October to November, bring light winds and the clearest water for snorkelling.",
      visual: { kind: "footage", footage: { q: "Seychelles turquoise water snorkelling" } },
    },
    {
      badge: "Highlight",
      heading: "La Digue",
      narration: "On La Digue, cycle to Anse Source d'Argent and visit the tortoises at L'Union Estate.",
      visual: { kind: "footage", footage: { q: "La Digue Seychelles beach" } },
    },
    {
      badge: "Highlight",
      heading: "Anse Lazio",
      narration: "Anse Lazio on Praslin is often listed among the finest beaches in the world, so stay for the sunset.",
      visual: { kind: "footage", footage: { q: "Seychelles beach sunset" } },
    },
    {
      badge: "The route",
      heading: "6 days, 43 miles",
      narration: "La Digue, Félicité, Curieuse, Anse Lazio and Grand Anse, then back to Baie Sainte Anne.",
      visual: { kind: "footage", footage: { q: "Seychelles catamaran sailing" } },
    },
    {
      narration: "Plan your week at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "A week by yacht in the Seychelles from Baie Sainte Anne, Praslin: La Digue, Félicité, the tortoises of Curieuse, Anse Lazio and Grand Anse. Best in April, May, October and November.",
  hashtags: ["sailing", "yachtcharter", "seychelles", "praslin", "ladigue", "indianocean", "boatlife", "nauticalnomads"],
  sources: ["Nautical Nomads cruising guide: Praslin and La Digue (lib/cruising/guides/seychelles.ts)"],
};
