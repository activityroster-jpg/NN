import type { Short } from "../types";

// What a hired skipper does and what the guests do not need to: the skipper
// sails, navigates, moors and anchors, watches the weather and is
// responsible for the boat; guests need no licence. Usually the guests feed
// the skipper and give them a berth; cooking and cleaning are not part of the
// job (a chef or host is). Terms vary by company.

export const howtoSkipperRole: Short = {
  id: "howto-skipper-role",
  strand: "howto",
  title: "What a charter skipper does (and what you don't)",
  speak: { "nauticalnomads.com": "nautical nomads dot com" },
  scenes: [
    {
      heading: "Hiring a skipper?",
      sub: "what they do, and what you don't",
      lead: "Booking a skipper? Here is what they do, and what you do not need to.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "sailboat helm wheel" } },
    },
    {
      badge: "They do",
      heading: "Sail the boat",
      narration: "They sail and navigate the boat, moor it, and anchor it for the night.",
      visual: { kind: "footage", footage: { q: "sailing yacht ocean" } },
    },
    {
      badge: "They do",
      heading: "Keep you safe",
      narration: "They watch the weather and look after the boat and everyone on it. If they say stay in port, trust that call.",
      visual: { kind: "footage", footage: { q: "sailboats marina storm clouds" } },
    },
    {
      badge: "They do",
      heading: "Know the area",
      narration: "They know the best bays and restaurants, and plan each day around the wind.",
      visual: { kind: "footage", footage: { q: "sailboat anchored turquoise bay" } },
    },
    {
      badge: "You don't",
      heading: "No licence needed",
      narration: "You need no licence and no experience. You choose where to go, swim, eat and relax.",
      visual: { kind: "footage", footage: { q: "swimming yacht turquoise water" } },
    },
    {
      badge: "Good to know",
      heading: "Meals and a berth",
      narration: "Usually you pay for the skipper's meals, and they sleep aboard, in a crew cabin or a guest cabin.",
      visual: { kind: "footage", footage: { q: "yacht cabin interior" } },
    },
    {
      badge: "Good to know",
      heading: "Not a chef",
      narration: "A skipper is not a cook or a cleaner, so add a chef if you want one.",
      visual: { kind: "footage", footage: { q: "sailing yacht galley" } },
    },
    {
      narration: "Save this before you book. More guides at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "No licence? A skipper sails, navigates, moors and keeps you safe; you swim, eat and relax. Check what your quote includes for the skipper's meals and berth.",
  hashtags: ["sailing", "yachtcharter", "skipperedcharter", "sailingholiday", "sailingtips", "boatlife", "nauticalnomads"],
  sources: [
    "Nautical Nomads: How chartering works and Licences and paperwork (lib/i18n/dictionaries/en.ts, lib/cruising/howto.ts)",
    "The Moorings: Skippered charter FAQs, https://www.moorings.com/uk/skippered-charters-faqs",
    "Yacht-Rent: Skipper duties and boundaries, https://www.yacht-rent.com/skipper-duties-and-boundaries-what-to-expect-when-renting-a-boat-with-a-skipper",
  ],
};
