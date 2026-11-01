import type { Short } from "../types";

// Picking up a mooring buoy under engine, the way the course lesson teaches
// it: check the buoy, prepare, approach slowly into the wind (or the way the
// other boats lie) with the bow crew pointing, stop alongside and hook the
// pick-up line, then make fast with your own line as a slip line.

export const howtoMooringBuoy: Short = {
  id: "howto-mooring-buoy",
  strand: "howto",
  title: "Picking up a mooring buoy in 5 steps",
  speak: { "the bow": "the bough", "nauticalnomads.com": "nautical nomads dot com" },
  scenes: [
    {
      heading: "Mooring buoy",
      sub: "pick it up in 5 steps",
      lead: "Picking up a mooring buoy, in five steps.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "sailboat mooring buoy" } },
    },
    {
      narration: "Many bays now have buoys, and in some you must use them.",
      visual: { kind: "footage", footage: { q: "sailboats moored bay aerial" } },
    },
    {
      badge: "Step 1 of 5",
      heading: "Check the buoy",
      narration: "Check it is meant for a boat your size, and never use a private one without asking.",
      visual: { kind: "footage", footage: { q: "mooring buoy sea" } },
    },
    {
      badge: "Step 2 of 5",
      heading: "Get ready",
      narration: "Line and boat hook ready at the bow, and hand signals agreed.",
      visual: { kind: "footage", footage: { q: "sailing yacht deck ropes" } },
    },
    {
      badge: "Step 3 of 5",
      heading: "Approach slowly",
      narration: "Come in slowly, into the wind or the way the other boats lie. The crew at the bow keeps pointing at the buoy.",
      visual: { kind: "footage", footage: { q: "sailboat motoring slowly bay" } },
    },
    {
      badge: "Step 4 of 5",
      heading: "Stop and hook it",
      narration: "Stop with the buoy at the bow, then lift its pick-up line with the hook. Engine in neutral, lines clear of the propeller.",
      visual: { kind: "footage", footage: { q: "boat hook mooring line" } },
    },
    {
      badge: "Step 5 of 5",
      heading: "Make fast",
      narration: "Pass your line through its loop and back to a cleat, so you can let go from on board.",
      visual: { kind: "footage", footage: { q: "boat cleat rope" } },
    },
    {
      narration: "Save this for your first night on a buoy. More guides at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "Picking up a mooring buoy in 5 steps: check it, get ready, come in slow, hook it, make fast. Save it for your first charter.",
  hashtags: ["sailing", "yachtcharter", "mooringbuoy", "sailingtips", "learntosail", "boatlife", "nauticalnomads"],
  sources: [
    "Nautical Nomads course lesson: Anchoring and mooring buoys (components/courses/lessons/anchoring-and-mooring)",
    "Sailtrain (RYA): How to pick up a mooring buoy, https://sailtrain.org.uk/how-to-pick-mooring-buoy-sail/",
    "BoatUS Magazine: Picking up a mooring, https://www.boatus.com/magazine/2015/december/picking-up-a-mooring.asp",
  ],
};
