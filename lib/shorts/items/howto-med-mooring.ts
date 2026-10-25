import type { Short } from "../types";

// Stern-to Mediterranean mooring with the boat's own anchor, the way the RYA
// teaches it: prepare, line up, drop and reverse, lines ashore (windward
// first), then tension on the chain. Lazy lines are mentioned as the common
// alternative.

export const howtoMedMooring: Short = {
  id: "howto-med-mooring",
  strand: "howto",
  title: "Med mooring in 5 steps",
  speak: { quay: "key", "nauticalnomads.com": "nautical nomads dot com" },
  scenes: [
    {
      heading: "Med mooring",
      sub: "in 5 steps",
      lead: "Med mooring, stern to the quay, in five steps.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "sailing yacht harbour aerial" } },
    },
    {
      narration: "In most Mediterranean harbours you park stern first, and it is easier than it looks.",
      visual: { kind: "footage", footage: { q: "sailboat marina mediterranean" } },
    },
    {
      badge: "Step 1 of 5",
      heading: "Prepare",
      narration: "Fenders both sides, two long stern lines ready, anchor free to run, crew briefed.",
      visual: { kind: "footage", footage: { q: "sailing yacht deck ropes" } },
    },
    {
      badge: "Step 2 of 5",
      heading: "Line up",
      narration: "Stop three to four boat lengths off your gap, bow out, and check the wind.",
      visual: { kind: "diagram", id: "med-mooring", step: 2 },
    },
    {
      badge: "Step 3 of 5",
      heading: "Drop and reverse",
      narration: "Drop the anchor and reverse slowly, paying out chain with a little slack. With lazy lines, skip the anchor and pick the line up instead.",
      visual: { kind: "diagram", id: "med-mooring", step: 3 },
    },
    {
      badge: "Step 4 of 5",
      heading: "Lines ashore",
      narration: "A metre or two off, pass the windward stern line first, then the other.",
      visual: { kind: "diagram", id: "med-mooring", step: 4 },
    },
    {
      badge: "Step 5 of 5",
      heading: "Tension",
      narration: "Take in on the chain until you sit a metre off the quay, then snug the stern lines. Passerelle down, engine off.",
      visual: { kind: "diagram", id: "med-mooring", step: 5 },
    },
    {
      narration: "Save this for your first charter. More guides at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "Med mooring, stern-to, in 5 steps. Save it for your first charter.",
  hashtags: ["sailing", "yachtcharter", "medmooring", "sailingtips", "learntosail", "mediterranean", "boatlife", "nauticalnomads"],
  sources: ["RYA Day Skipper Handbook, Sail (Sara Hopkinson): Mediterranean mooring", "RYA Boat Handling for Sail and Power (Rob Gibson): berthing stern-to"],
};
