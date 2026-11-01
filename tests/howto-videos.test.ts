import { describe, expect, it } from "vitest";
import { HOWTO } from "@/lib/cruising/howto";
import { HOWTO_SCRIPTS, howToNarrationId, howToSentences } from "@/lib/cruising/howto-scripts";
import { splitSentences, spokenText } from "@/lib/cruising/narration";
import { TEXT_RULES } from "@/lib/cruising/validate";
import { narrationSource } from "@/lib/narration/sources";

// Words a speech voice commonly gets wrong, which must be handled by a speak entry.
const RISKY: [RegExp, string][] = [
  [/\bquays?\b/i, "quay: say it as key"],
  [/\bbows?\b(?!l)/i, "bow (of a boat) can be read like bow and arrow: add a phrase to speak"],
  [/\b(VHF|ICC|RYA|CV|ID|SRC|GPS)\b/, "abbreviation: spell it out in speak"],
  [/\b(meltemi|jugo|maestral|Rhône|Bonifacio|Ajaccio|libeccio)\b/i, "local name: add a pronunciation"],
];

describe("charter know-how videos", () => {
  it("has a script for every guide, and no stray scripts", () => {
    expect(Object.keys(HOWTO_SCRIPTS).sort()).toEqual(HOWTO.map((g) => g.id).sort());
    for (const [id, s] of Object.entries(HOWTO_SCRIPTS)) expect(s.id, id).toBe(id);
  });

  it("narration reads well and every tricky word has a pronunciation", () => {
    const problems: string[] = [];
    for (const s of Object.values(HOWTO_SCRIPTS)) {
      const sentences = howToSentences(s, splitSentences);
      for (const sentence of sentences) {
        const spoken = spokenText(s, sentence);
        for (const [re, why] of TEXT_RULES) if (re.test(spoken)) problems.push(`${s.id}: "${sentence.slice(0, 60)}": ${why}`);
        for (const [re, why] of RISKY) if (re.test(spoken)) problems.push(`${s.id}: "${sentence.slice(0, 60)}": ${why}`);
        if (/\//.test(spoken)) problems.push(`${s.id}: "${sentence.slice(0, 60)}": slash`);
        if (sentence.split(/\s+/).length < 3) problems.push(`${s.id}: fragment "${sentence}"`);
        if (sentence.length > 260) problems.push(`${s.id}: "${sentence.slice(0, 50)}…" too long`);
        if (!/[.!?]$/.test(sentence)) problems.push(`${s.id}: "${sentence.slice(0, 60)}" has no full stop`);
      }
      for (const key of Object.keys(s.speak ?? {})) if (!sentences.some((x) => x.includes(key))) problems.push(`${s.id}: speak entry "${key}" is not used`);
    }
    expect(problems).toEqual([]);
  });

  it("shows every point, step and table row with its own sentence", () => {
    const problems: string[] = [];
    for (const s of Object.values(HOWTO_SCRIPTS))
      for (const sc of s.scenes) {
        const v = sc.visual;
        if (v.kind === "title" || v.kind === "tip") continue;
        const n = v.kind === "points" ? v.points.length : v.kind === "steps" ? v.steps.length : v.rows.length;
        const count = splitSentences(sc.narration).length;
        if (n > 6) problems.push(`${s.id} / ${sc.title}: ${n} items is too many for the screen`);
        for (let k = 0; k < n; k++) {
          const at = v.at?.[k] ?? (v.lead ?? 1) + k;
          if (at >= count) problems.push(`${s.id} / ${sc.title}: item ${k + 1} waits for sentence ${at + 1} of ${count}`);
        }
      }
    expect(problems).toEqual([]);
  });

  it("is recorded through the narration sources", () => {
    for (const s of Object.values(HOWTO_SCRIPTS)) expect(narrationSource(howToNarrationId(s.id))?.sentences.length, s.id).toBeGreaterThan(3);
  });
});
