import type { Short } from "../types";

// What a bareboat charter needs, from the site's licences guide: a
// recognised sailing licence for the skipper, a radio licence where the
// country asks for one, experience (a sailing résumé), sometimes a second
// experienced crew member, original documents, passports and a card for the
// deposit. Rules vary by country and operator; no licence means a skipper.

export const howtoBareboatNeeds: Short = {
  id: "howto-bareboat-needs",
  strand: "howto",
  title: "What you need for a bareboat charter",
  speak: { "nauticalnomads.com": "nautical nomads dot com" },
  scenes: [
    {
      heading: "Bareboat charter?",
      sub: "what the skipper needs",
      lead: "Sailing without a skipper? Here is what you need.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "sailing yacht open sea" } },
    },
    {
      narration: "Bareboat means you sail the yacht yourselves. Rules vary by country and by operator, so always check.",
      visual: { kind: "footage", footage: { q: "sailboat marina mediterranean" } },
    },
    {
      badge: "1 of 5",
      heading: "Sailing licence",
      narration: "The skipper needs a recognised sailing licence, such as the International Certificate of Competence.",
      visual: { kind: "footage", footage: { q: "sailboat helm wheel" } },
    },
    {
      badge: "2 of 5",
      heading: "Radio licence",
      narration: "In many countries, someone aboard also needs a radio licence.",
      visual: { kind: "footage", footage: { q: "boat radio cockpit" } },
    },
    {
      badge: "3 of 5",
      heading: "Experience",
      narration: "Operators also ask about experience, with a list of the boats you have skippered. Some countries also want a second crew member with experience.",
      visual: { kind: "footage", footage: { q: "sailing yacht crew ropes" } },
    },
    {
      badge: "4 of 5",
      heading: "Originals",
      narration: "Bring the original certificates, as photos are often refused, plus passports for the crew list. And usually a credit card for the security deposit.",
      visual: { kind: "footage", footage: { q: "passport travel documents" } },
    },
    {
      badge: "5 of 5",
      heading: "No licence?",
      narration: "No licence in the group? Book a skipper, and just enjoy the week.",
      visual: { kind: "footage", footage: { q: "sailboat anchored bay sunset" } },
    },
    {
      narration: "Save this before you book. More guides at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "Bareboat charter checklist: a recognised licence such as the ICC or RYA Day Skipper, a radio licence where needed, experience, original documents and a card for the deposit. Rules vary by country and operator, so check yours.",
  hashtags: ["sailing", "bareboat", "yachtcharter", "sailinglicence", "learntosail", "sailingtips", "nauticalnomads"],
  sources: [
    "Nautical Nomads guide: Licences and paperwork for a bareboat charter (lib/cruising/howto.ts)",
    "RYA: ICC, evidence of competence abroad, https://www.rya.org.uk/knowledge/abroad/icc/evidence-of-competence-abroad",
    "12 Knots: Bareboat charter requirements, https://12knots.com/en/journal/bareboat-charter-things-know/",
    "Plain Sailing: Minimum qualifications for bareboat chartering, https://plainsailing.com/blog/minimum-qualifications-for-bareboat-chartering",
  ],
};
