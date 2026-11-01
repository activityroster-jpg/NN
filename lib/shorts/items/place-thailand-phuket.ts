import type { Short } from "../types";

// Phang Nga Bay in 45 seconds: the base, the best months, two highlights and
// the week's loop, all taken from the cruising guide (lib/cruising/guides/thailand-phuket.ts).

export const placeThailandPhuket: Short = {
  id: "place-thailand-phuket",
  strand: "place",
  title: "Phang Nga Bay: a week by yacht",
  speak: {
    "Phang Nga": "Pang Nga",
    "Ao Po": "Ow Paw",
    Phuket: "Poo ket",
    Koh: "Kaw",
    Phanak: "Panak",
    "Yao Noi": "Yow Noy",
    "Phi Phi": "Pee Pee",
    Railay: "Rye lay",
    "nauticalnomads.com": "nautical nomads dot com",
  },
  scenes: [
    {
      heading: "Phang Nga Bay",
      sub: "a week by yacht",
      lead: "Phang Nga Bay, Thailand: limestone towers, hidden lagoons and warm, sheltered water.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "Phang Nga Bay limestone aerial" } },
    },
    {
      badge: "Start",
      heading: "Ao Po Grand Marina",
      narration: "The week starts at Ao Po Grand Marina on the east coast of Phuket, with deep water at any state of the tide.",
      visual: { kind: "footage", footage: { q: "Phuket marina yachts" } },
    },
    {
      badge: "Best months",
      heading: "November, February",
      sub: "and March",
      narration: "November, February and March are the sweet spot: steady light breezes, calm seas and more space in the anchorages.",
      visual: { kind: "footage", footage: { q: "Thailand limestone islands boat" } },
    },
    {
      badge: "Highlight",
      heading: "Koh Hong",
      narration: "Kayak into the hidden lagoon at Koh Hong, arriving in the afternoon as the day trip boats leave.",
      visual: { kind: "footage", footage: { q: "Phang Nga kayak lagoon" } },
    },
    {
      badge: "Highlight",
      heading: "Railay",
      narration: "Anchor off Railay, whose limestone cliffs are one of the great rock climbing spots of Asia.",
      visual: { kind: "footage", footage: { q: "Railay beach Krabi cliffs" } },
    },
    {
      badge: "The route",
      heading: "6 days, 104 miles",
      narration: "Koh Hong, Koh Phanak, Koh Yao Noi, Railay and Koh Phi Phi, then the long run home to Ao Po.",
      visual: { kind: "footage", footage: { q: "Phi Phi island Thailand aerial" } },
    },
    {
      narration: "Plan your week at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "A week by yacht in Phang Nga Bay from Ao Po, Phuket: the hidden lagoon of Koh Hong, Koh Phanak, Koh Yao Noi, the cliffs of Railay and Koh Phi Phi. Best in November, February and March.",
  hashtags: ["sailing", "yachtcharter", "thailand", "phuket", "phangngabay", "krabi", "boatlife", "nauticalnomads"],
  sources: ["Nautical Nomads cruising guide: Phang Nga Bay (lib/cruising/guides/thailand-phuket.ts)"],
};
