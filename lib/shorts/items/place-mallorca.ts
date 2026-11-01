import type { Short } from "../types";

// Southern Mallorca and Cabrera in 45 seconds: the base, the best months, two
// highlights and the week's loop, all taken from the cruising guide (lib/cruising/guides/mallorca.ts).

export const placeMallorca: Short = {
  id: "place-mallorca",
  strand: "place",
  title: "Southern Mallorca and Cabrera: a week by yacht",
  speak: {
    Mallorca: "Mayorka",
    "Cala Pi": "Cala Pee",
    Portocolom: "Porto Coloam",
    "Colònia de Sant Jordi": "Colonia de San Zhordi",
    "nauticalnomads.com": "nautical nomads dot com",
  },
  scenes: [
    {
      heading: "Southern Mallorca",
      sub: "a week by yacht",
      lead: "Southern Mallorca: turquoise calas, an island national park and easy sailing from Palma.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "Mallorca cala turquoise aerial" } },
    },
    {
      badge: "Start",
      heading: "Palma",
      narration: "The week starts and ends in Palma, along the harbour front below the cathedral, a short taxi ride from the airport.",
      visual: { kind: "footage", footage: { q: "Palma de Mallorca cathedral harbour" } },
    },
    {
      badge: "Best months",
      heading: "May, June, September",
      narration: "May, June and September are the sweet spot: warm water, steady sea breezes and space in the calas.",
      visual: { kind: "footage", footage: { q: "Mallorca coast sailboat" } },
    },
    {
      badge: "Highlight",
      heading: "Cabrera",
      narration: "Cabrera is an island national park with almost no buildings and the clearest water of the week. Book a park permit and a buoy before you go.",
      visual: { kind: "footage", footage: { q: "Cabrera island Mallorca" } },
    },
    {
      badge: "Highlight",
      heading: "Es Trenc",
      narration: "Swim off Es Trenc, a long natural beach with shallow turquoise water.",
      visual: { kind: "footage", footage: { q: "Mallorca beach turquoise water" } },
    },
    {
      badge: "The route",
      heading: "6 days, 103 miles",
      narration: "Palma, Cala Pi, Cabrera, Porto Petro, Portocolom and Colònia de Sant Jordi, then back to Palma.",
      visual: { kind: "footage", footage: { q: "Mallorca sailing yacht sea" } },
    },
    {
      narration: "Plan your week at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "A week by yacht in southern Mallorca from Palma: Cala Pi, the Cabrera national park, Porto Petro, Portocolom and Es Trenc. Best in May, June and September.",
  hashtags: ["sailing", "yachtcharter", "mallorca", "cabrera", "palma", "spain", "boatlife", "nauticalnomads"],
  sources: ["Nautical Nomads cruising guide: Southern Mallorca and Cabrera (lib/cruising/guides/mallorca.ts)"],
};
