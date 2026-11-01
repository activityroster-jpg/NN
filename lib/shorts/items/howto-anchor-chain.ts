import type { Short } from "../types";

// How much chain to let out, matching the course lesson and the safe
// anchorage guide: depth plus the bow height, four to five times in settled
// weather, up to seven if wind is forecast, with a worked example, the
// chain marks and the swinging circle.

export const howtoAnchorChain: Short = {
  id: "howto-anchor-chain",
  strand: "howto",
  title: "Anchoring: how much chain to let out",
  speak: { "the bow": "the bough", "nauticalnomads.com": "nautical nomads dot com" },
  scenes: [
    {
      heading: "How much chain?",
      sub: "anchoring, made simple",
      lead: "Anchoring: how much chain do you really need?",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "sailboat anchored bay aerial" } },
    },
    {
      narration: "The chain you let out is called the scope.",
      visual: { kind: "footage", footage: { q: "anchor chain windlass" } },
    },
    {
      badge: "Step 1 of 4",
      heading: "Measure the depth",
      narration: "Take the depth, and add about a metre for the height of the bow. In tidal waters, use the depth at high water.",
      visual: { kind: "footage", footage: { q: "clear water seabed sand boat" } },
    },
    {
      badge: "Step 2 of 4",
      heading: "Four to five times",
      narration: "In settled weather, let out four to five times that depth.",
      visual: { kind: "footage", footage: { q: "anchor chain underwater" } },
    },
    {
      badge: "Step 3 of 4",
      heading: "More if it blows",
      narration: "If wind is forecast, let out more, up to seven times, if you have room.",
      visual: { kind: "footage", footage: { q: "sailboat anchored wind waves" } },
    },
    {
      badge: "Step 4 of 4",
      heading: "Do the sum",
      sub: "8 + 1 = 9, × 5 = 45 m",
      narration: "In eight metres, add one to make nine. Five times nine is forty-five metres of chain.",
      visual: { kind: "footage", footage: { q: "yacht bow anchor" } },
    },
    {
      badge: "Tip",
      heading: "Know your chain",
      narration: "Ask at the briefing how the chain is marked, and how much the boat carries.",
      visual: { kind: "footage", footage: { q: "anchor chain deck" } },
    },
    {
      badge: "Tip",
      heading: "Room to swing",
      narration: "You swing round the anchor at about the chain length plus the boat length, so keep that circle clear.",
      visual: { kind: "footage", footage: { q: "sailboats anchored lagoon aerial" } },
    },
    {
      narration: "Save this for your first night at anchor. More guides at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "How much anchor chain? Depth plus a metre for the bow, times 4 to 5 in settled weather, more if wind is forecast. Save it for your first night at anchor.",
  hashtags: ["sailing", "anchoring", "yachtcharter", "sailingtips", "learntosail", "boatlife", "nauticalnomads"],
  sources: [
    "Nautical Nomads course lesson: Anchoring and mooring buoys (components/courses/lessons/anchoring-and-mooring)",
    "Nautical Nomads guide: Choosing a safe anchorage for the night (lib/cruising/howto.ts)",
    "Sail Magazine: Short scope anchoring in deep water, https://sailmagazine.com/cruising/short-scope-anchoring-in-deep-water/",
    "Yachting Monthly: How much anchor chain, https://www.yachtingmonthly.com/sailing-skills/how-much-anchor-chain-70603",
  ],
};
