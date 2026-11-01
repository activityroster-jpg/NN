import type { Short } from "../types";

// Seasickness, kept general and safe, as the NHS and sailing schools put it:
// the horizon, fresh air and the middle of the boat, staying busy on deck,
// water and light meals, medicine started before you sail as the label or a
// pharmacist says, and telling someone. No claims beyond those sources.

export const howtoSeasickness: Short = {
  id: "howto-seasickness",
  strand: "howto",
  title: "Seasickness: what actually works",
  speak: { "nauticalnomads.com": "nautical nomads dot com" },
  scenes: [
    {
      heading: "Seasick?",
      sub: "what actually works",
      lead: "Worried about seasickness? Here is what actually helps.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "sailboat waves horizon" } },
    },
    {
      badge: "Tip 1",
      heading: "Watch the horizon",
      narration: "Stay on deck and look at the horizon, not your phone.",
      visual: { kind: "footage", footage: { q: "sea horizon from boat" } },
    },
    {
      badge: "Tip 2",
      heading: "Fresh air",
      narration: "Get fresh air, and sit near the middle of the boat, where it moves least.",
      visual: { kind: "footage", footage: { q: "sailing yacht cockpit" } },
    },
    {
      badge: "Tip 3",
      heading: "Stay busy",
      narration: "Take the helm, or a job on deck: being busy helps.",
      visual: { kind: "footage", footage: { q: "sailboat helm wheel steering" } },
    },
    {
      badge: "Tip 4",
      heading: "Drink, eat light",
      narration: "Sip water often, eat small plain meals, and go easy on alcohol the night before.",
      visual: { kind: "footage", footage: { q: "water bottle boat" } },
    },
    {
      badge: "Tip 5",
      heading: "Medicine early",
      narration: "If you use tablets or patches, start them before you sail, as the label or a pharmacist says. Ask a pharmacist which one suits you.",
      visual: { kind: "footage", footage: { q: "pharmacy medicine shelf" } },
    },
    {
      badge: "Tip 6",
      heading: "It usually passes",
      narration: "Usually it eases as your body gets used to the motion. If you feel ill, tell someone, and stay in the cockpit with your lifejacket on.",
      visual: { kind: "footage", footage: { q: "calm sea sailboat sunset" } },
    },
    {
      narration: "Save this for your first sail. More guides at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "Seasickness on a charter: watch the horizon, get fresh air, stay busy on deck, sip water, and start any medicine before you sail as the label or a pharmacist says.",
  hashtags: ["sailing", "seasickness", "yachtcharter", "sailingtips", "learntosail", "boatlife", "nauticalnomads"],
  sources: [
    "NHS: Motion sickness, https://www.nhs.uk/conditions/motion-sickness/",
    "NHS 111 Wales: Motion sickness, https://111.wales.nhs.uk/Encyclopaedia/m/article/motionsickness",
    "Healthdirect Australia: Motion sickness, https://healthdirect.gov.au/motion-sickness",
    "12 Knots: Seasickness management, https://12knots.com/en/sailing-school/tips/seasick/",
    "Nautical Nomads guide: What to pack for a charter week (lib/cruising/howto.ts)",
  ],
};
