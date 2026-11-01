import type { Short } from "../types";

// The British Virgin Islands in 45 seconds: the base, the best months, two
// highlights and the week's loop, all taken from the cruising guide (lib/cruising/guides/bvi.ts).

export const placeBvi: Short = {
  id: "place-bvi",
  strand: "place",
  title: "British Virgin Islands: a week by yacht",
  speak: {
    Jost: "Yoast",
    Anegada: "Annegahda",
    "nauticalnomads.com": "nautical nomads dot com",
  },
  scenes: [
    {
      heading: "British Virgin Islands",
      sub: "a week by yacht",
      lead: "The British Virgin Islands: steady trade winds, warm turquoise water and dozens of islands in sight of each other.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "British Virgin Islands aerial" } },
    },
    {
      badge: "Start",
      heading: "Road Town, Tortola",
      narration: "The week starts in Road Town on Tortola, home to the largest charter fleets, about half an hour from the airport.",
      visual: { kind: "footage", footage: { q: "Tortola marina sailboats" } },
    },
    {
      badge: "Best months",
      heading: "December to May",
      narration: "The main season runs from December to April, with steady trade winds and dry weather, and May is quieter and cheaper.",
      visual: { kind: "footage", footage: { q: "Caribbean turquoise water sailboat" } },
    },
    {
      badge: "Highlight",
      heading: "The Baths",
      narration: "At the Baths on Virgin Gorda, giant granite boulders make grottoes and pools on the beach.",
      visual: { kind: "footage", footage: { q: "Virgin Gorda Baths boulders beach" } },
    },
    {
      badge: "Highlight",
      heading: "Jost Van Dyke",
      narration: "Jost Van Dyke is famous for its beach bars, so swim ashore to the Soggy Dollar Bar in White Bay.",
      visual: { kind: "footage", footage: { q: "Caribbean island beach bar" } },
    },
    {
      badge: "The route",
      heading: "6 days, 79 miles",
      narration: "Norman Island, Cooper Island, North Sound, Anegada and Jost Van Dyke, then back to Road Town.",
      visual: { kind: "footage", footage: { q: "British Virgin Islands catamaran sailing" } },
    },
    {
      narration: "Plan your week at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "A week by yacht in the British Virgin Islands from Road Town, Tortola: Norman Island, Cooper Island, the Baths, North Sound, Anegada and Jost Van Dyke. Main season December to April.",
  hashtags: ["sailing", "yachtcharter", "bvi", "britishvirginislands", "caribbean", "tortola", "boatlife", "nauticalnomads"],
  sources: ["Nautical Nomads cruising guide: British Virgin Islands (lib/cruising/guides/bvi.ts)"],
};
