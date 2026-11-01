import type { Short } from "../types";

// The Bay of Kotor and Budva in 45 seconds: the base, the best months, two
// highlights and the week's loop, all taken from the cruising guide
// (lib/cruising/guides/montenegro-kotor.ts).

export const placeMontenegroKotor: Short = {
  id: "place-montenegro-kotor",
  strand: "place",
  title: "Bay of Kotor and Budva: a week by yacht",
  speak: {
    Tivat: "Teevat",
    Perast: "Perrast",
    Budva: "Boodva",
    Petrovac: "Petrovats",
    Rose: "Rosseh",
    "nauticalnomads.com": "nautical nomads dot com",
  },
  scenes: [
    {
      heading: "Bay of Kotor and Budva",
      sub: "a week by yacht",
      lead: "Montenegro: a deep, winding bay under steep mountains, with old Venetian towns on the water.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "Bay of Kotor Montenegro aerial" } },
    },
    {
      badge: "Start",
      heading: "Porto Montenegro",
      narration: "The week starts at Porto Montenegro in Tivat, a large marina in a former naval base, about ten minutes from the airport.",
      visual: { kind: "footage", footage: { q: "Porto Montenegro Tivat marina" } },
    },
    {
      badge: "Best months",
      heading: "May, June, September",
      narration: "May, June and September are the best months, with warm water, steady breezes and quieter harbours.",
      visual: { kind: "footage", footage: { q: "Montenegro coast sailboat" } },
    },
    {
      badge: "Highlight",
      heading: "Perast",
      narration: "Off Perast, circle Our Lady of the Rocks, a church built on a reef of stones and sunken ships.",
      visual: { kind: "footage", footage: { q: "Perast Montenegro island church" } },
    },
    {
      badge: "Highlight",
      heading: "Kotor",
      narration: "In Kotor, climb the town walls to the fortress of Saint John at sunset.",
      visual: { kind: "footage", footage: { q: "Kotor old town walls Montenegro" } },
    },
    {
      badge: "The route",
      heading: "6 days, 83 miles",
      narration: "Perast, Kotor, Budva, Petrovac and Rose, then back to Porto Montenegro.",
      visual: { kind: "footage", footage: { q: "Budva Montenegro coast" } },
    },
    {
      narration: "Plan your week at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "A week by yacht in Montenegro from Porto Montenegro, Tivat: Perast and Our Lady of the Rocks, walled Kotor, Budva, Petrovac and Rose. Best in May, June and September.",
  hashtags: ["sailing", "yachtcharter", "montenegro", "kotor", "bayofkotor", "budva", "boatlife", "nauticalnomads"],
  sources: ["Nautical Nomads cruising guide: Bay of Kotor and Budva (lib/cruising/guides/montenegro-kotor.ts)"],
};
