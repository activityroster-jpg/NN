import type { Short } from "../types";

// Seven things to photograph at the yacht check-in, from the site's
// check-in and check-out guides: hull, deck and hatches, swim platform,
// dinghy and outboard, sails, fuel gauge and engine hours, and the signed
// form with every mark on it; then the same photos at check-out.

export const howtoCheckInPhotos: Short = {
  id: "howto-check-in-photos",
  strand: "howto",
  title: "Charter check-in: 7 things to photograph",
  speak: { "nauticalnomads.com": "nautical nomads dot com" },
  scenes: [
    {
      heading: "Check-in photos",
      sub: "7 things to shoot before you sign",
      lead: "Seven things to photograph at check-in, to protect your deposit.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "sailing yachts marina" } },
    },
    {
      narration: "Anything you do not note now may be charged to you at check-out.",
      visual: { kind: "footage", footage: { q: "yacht marina pontoon" } },
    },
    {
      badge: "Photo 1 of 7",
      heading: "Hull and topsides",
      narration: "Every scratch, chip and repair on the hull, both sides.",
      visual: { kind: "footage", footage: { q: "yacht hull water" } },
    },
    {
      badge: "Photo 2 of 7",
      heading: "Deck and hatches",
      narration: "Cracks in the deck, the hatches and the windows.",
      visual: { kind: "footage", footage: { q: "sailboat deck" } },
    },
    {
      badge: "Photo 3 of 7",
      heading: "Swim platform",
      narration: "The swim platform and the ladder, close up.",
      visual: { kind: "footage", footage: { q: "yacht stern swim ladder" } },
    },
    {
      badge: "Photo 4 of 7",
      heading: "The dinghy",
      narration: "The dinghy and the outboard, from every side.",
      visual: { kind: "footage", footage: { q: "inflatable dinghy outboard" } },
    },
    {
      badge: "Photo 5 of 7",
      heading: "The sails",
      narration: "Unroll the sails and photograph any tears or old repairs.",
      visual: { kind: "footage", footage: { q: "sailboat sail unfurling" } },
    },
    {
      badge: "Photo 6 of 7",
      heading: "Fuel and hours",
      narration: "The fuel gauge and the engine hours, so the numbers are clear at the end.",
      visual: { kind: "footage", footage: { q: "boat engine dashboard" } },
    },
    {
      badge: "Photo 7 of 7",
      heading: "The signed form",
      narration: "The check-in form, with every mark written on it before you sign.",
      visual: { kind: "footage", footage: { q: "signing document pen" } },
    },
    {
      badge: "Tip",
      heading: "Repeat at the end",
      narration: "Then take the same photos at check-out.",
      visual: { kind: "footage", footage: { q: "sailboat harbour sunset" } },
    },
    {
      narration: "Save this for your next handover. More guides at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "Charter check-in: 7 things to photograph before you sign, from the hull to the fuel gauge. Your photos protect your deposit. Save it for your next handover.",
  hashtags: ["sailing", "yachtcharter", "charterlife", "sailingtips", "boatlife", "checkin", "nauticalnomads"],
  sources: [
    "Nautical Nomads guide: How to do the yacht check-in (handover) (lib/cruising/howto.ts)",
    "Nautical Nomads guide: Check-out and getting your deposit back (lib/cruising/howto.ts)",
    "YACHT: Check-in, important tips for taking over a charter yacht, https://www.yacht.de/en/travel-and-charter/counsellor/check-in-important-tips-for-taking-over-a-charter-yacht/",
    "12 Knots: Yacht handover procedure, https://12knots.com/en/sailing-school/tips/checkin-procedure/",
  ],
};
