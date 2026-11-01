import type { Short } from "../types";

// Catamaran or monohull, matching the site's "Sailing yacht or catamaran?"
// copy: a catamaran stays level, has more space and private bathrooms, a
// shallower draft and two engines; a monohull heels, sails closer to the
// wind, usually costs less to charter, and pays less in marinas.

export const howtoCatOrMono: Short = {
  id: "howto-cat-or-mono",
  strand: "howto",
  title: "Catamaran or monohull?",
  speak: { "nauticalnomads.com": "nautical nomads dot com" },
  scenes: [
    {
      heading: "Cat or monohull?",
      sub: "which suits your crew",
      lead: "Catamaran or monohull? Here is how to choose.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "catamaran sailing aerial" } },
    },
    {
      badge: "Catamaran",
      heading: "Stays level",
      narration: "A catamaran has two hulls, so it sails nearly level and rolls less at anchor.",
      visual: { kind: "footage", footage: { q: "catamaran sailing" } },
    },
    {
      badge: "Catamaran",
      heading: "Space for everyone",
      narration: "Huge deck, big saloon, and cabins with their own bathrooms. The favourite for families and non-sailors.",
      visual: { kind: "footage", footage: { q: "catamaran deck turquoise water" } },
    },
    {
      badge: "Catamaran",
      heading: "Shallow, two engines",
      narration: "It draws less water, so you can anchor closer in, and two engines let it turn on the spot.",
      visual: { kind: "footage", footage: { q: "catamaran anchored beach" } },
    },
    {
      badge: "Monohull",
      heading: "Real sailing",
      narration: "A monohull heels with the wind, sails closer to it, and feels like classic sailing.",
      visual: { kind: "footage", footage: { q: "sailboat heeling sailing" } },
    },
    {
      badge: "Monohull",
      heading: "Better value",
      narration: "It usually costs less to charter, and catamarans often pay more in marinas.",
      visual: { kind: "footage", footage: { q: "sailboats marina aerial" } },
    },
    {
      heading: "So which?",
      narration: "Families and non-sailors usually love a cat. Couples and keen sailors often pick a monohull.",
      visual: { kind: "footage", footage: { q: "sailing yacht sunset sea" } },
    },
    {
      narration: "Save this for when you book. More guides at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "Catamaran or monohull? A cat stays level with room for everyone; a monohull sails closer to the wind and usually costs less. Which would you pick?",
  hashtags: ["sailing", "catamaran", "monohull", "yachtcharter", "sailingholiday", "boatlife", "nauticalnomads"],
  sources: [
    "Nautical Nomads: Sailing yacht or catamaran? (lib/i18n/dictionaries/en.ts) and the Med-mooring guide's catamaran tip (lib/cruising/howto.ts)",
    "Navigare Yachting: Catamaran vs monohull, https://navigare-yachting.com/en/blog/catamaran-vs-monohull-on-and-in-charter",
    "boats.com: Catamarans vs monohulls on charter, https://www.boats.com/boat-buyers-guide/catamarans-vs-monohulls-on-charter/",
    "Cruising World: Ready to try your first multihull charter?, https://www.cruisingworld.com/charter/ready-to-try-your-first-multihull-charter/",
  ],
};
