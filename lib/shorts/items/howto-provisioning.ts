import type { Short } from "../types";

// Provisioning for a week, from the site's provisioning guide: plan meals,
// water per person, heavy basics first and fresh food as you go, cans over
// glass, cardboard off, heavy things low and central, and the easy-to-forget
// lighter and thin toilet paper.

export const howtoProvisioning: Short = {
  id: "howto-provisioning",
  strand: "howto",
  title: "Provisioning a yacht for a week",
  speak: { "nauticalnomads.com": "nautical nomads dot com" },
  scenes: [
    {
      heading: "Provisioning",
      sub: "a week aboard, sorted",
      lead: "How to shop for a week on a yacht, in five steps.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "sailing yacht galley" } },
    },
    {
      badge: "Step 1 of 5",
      heading: "Plan meals first",
      narration: "Plan meals, not shopping. Most crews eat breakfast and lunch aboard, and cook dinner three or four nights.",
      visual: { kind: "footage", footage: { q: "breakfast on boat deck" } },
    },
    {
      badge: "Step 2 of 5",
      heading: "Water",
      sub: "15 to 20 litres each",
      narration: "Allow fifteen to twenty litres of bottled water per person for the week.",
      visual: { kind: "footage", footage: { q: "bottled water" } },
    },
    {
      badge: "Step 3 of 5",
      heading: "Basics first",
      narration: "Buy the heavy, long-life basics on day one, and fresh food every two or three days. Fridges are small and run off the batteries.",
      visual: { kind: "footage", footage: { q: "fruit vegetables market" } },
    },
    {
      badge: "Step 4 of 5",
      heading: "Cans, not glass",
      narration: "Cans and boxes stow better than glass, which breaks in a seaway. Take off the cardboard before you stow it.",
      visual: { kind: "footage", footage: { q: "supermarket shopping cart" } },
    },
    {
      badge: "Step 5 of 5",
      heading: "Stow it low",
      narration: "Heavy things low and near the middle, and nothing loose when you sail.",
      visual: { kind: "footage", footage: { q: "sailboat cabin interior" } },
    },
    {
      badge: "Tip",
      heading: "Easy to forget",
      narration: "And pack a lighter for the stove, and thin toilet paper for the marine toilets.",
      visual: { kind: "footage", footage: { q: "sailboat sunset anchored" } },
    },
    {
      narration: "Save this for your shopping list. More guides at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "Provisioning a yacht for a week: plan the meals, 15 to 20 litres of water each, basics on day one, fresh food as you go, and stow it low. Save it for your shopping list.",
  hashtags: ["sailing", "yachtcharter", "provisioning", "boatlife", "sailingtips", "galley", "nauticalnomads"],
  sources: [
    "Nautical Nomads guide: How to provision a yacht for a week (lib/cruising/howto.ts)",
    "Nautical Nomads guide: Living aboard, water, power, the heads and gas (lib/cruising/howto.ts)",
  ],
};
