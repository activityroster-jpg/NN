import type { Short } from "../types";

// The Saronic Gulf in 45 seconds: the base, the best months, two highlights and
// the week's loop, all taken from the cruising guide (lib/cruising/guides/greece-saronic.ts).

export const placeGreeceSaronic: Short = {
  id: "place-greece-saronic",
  strand: "place",
  title: "Saronic Gulf: a week by yacht",
  speak: {
    Alimos: "Allimos",
    "Palaia Epidavros": "Paleh ah Epeedavros",
    Perdika: "Pairdika",
    quay: "key",
    "nauticalnomads.com": "nautical nomads dot com",
  },
  scenes: [
    {
      heading: "Saronic Gulf",
      sub: "a week by yacht",
      lead: "The Saronic Gulf: island towns an easy sail from Athens, ancient theatres and sheltered water.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "Hydra Greece harbour aerial" } },
    },
    {
      badge: "Start",
      heading: "Alimos Marina",
      narration: "The week starts in Alimos Marina, the biggest charter marina in Greece, under an hour from Athens airport.",
      visual: { kind: "footage", footage: { q: "Athens marina yachts" } },
    },
    {
      badge: "Best months",
      heading: "May, June, September",
      narration: "May, June and September are the best months: warm water, kinder winds and space on the town quays.",
      visual: { kind: "footage", footage: { q: "Greek island sailing yacht" } },
    },
    {
      badge: "Highlight",
      heading: "Hydra",
      narration: "Hydra is the car-free island of stone mansions, with sunset drinks by the cannons at the harbour mouth.",
      visual: { kind: "footage", footage: { q: "Hydra island Greece town" } },
    },
    {
      badge: "Highlight",
      heading: "Epidaurus",
      narration: "From Palaia Epidavros, take a taxi inland to the great theatre of Epidaurus, famous for its acoustics.",
      visual: { kind: "footage", footage: { q: "Epidaurus ancient theatre Greece" } },
    },
    {
      badge: "The route",
      heading: "6 days, 112 miles",
      narration: "Alimos, Aegina, Palaia Epidavros, Poros, Hydra and Perdika, then back to Alimos.",
      visual: { kind: "footage", footage: { q: "Poros Greece aerial" } },
    },
    {
      narration: "Plan your Saronic week at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "A week by yacht in the Saronic Gulf from Athens: start in Alimos, then Aegina, Palaia Epidavros, Poros, car-free Hydra and Perdika. Best in May, June and September.",
  hashtags: ["sailing", "yachtcharter", "greece", "saronicgulf", "hydra", "greekislands", "athens", "nauticalnomads"],
  sources: ["Nautical Nomads cruising guide: Saronic Gulf (lib/cruising/guides/greece-saronic.ts)"],
};
