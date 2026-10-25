import { describe, expect, it } from "vitest";
import { GUIDES } from "@/lib/cruising";
import { DESTINATIONS } from "@/lib/domain/destinations";
import { guideSentences, sentenceHash } from "@/lib/cruising/narration";
import { validateGuide } from "@/lib/cruising/validate";

describe("cruising guides", () => {
  for (const g of GUIDES) {
    it(`${g.id}: passes the guide checks`, () => {
      expect(validateGuide(g)).toEqual([]);
    });
    it(`${g.id}: links to a real destination`, () => {
      if (g.destinationId) expect(DESTINATIONS.some((d) => d.id === g.destinationId)).toBe(true);
    });
  }
  it("guide ids and sentence hashes are unique", () => {
    expect(new Set(GUIDES.map((g) => g.id)).size).toBe(GUIDES.length);
    for (const g of GUIDES) {
      const hashes = guideSentences(g).map(sentenceHash);
      expect(new Set(hashes).size).toBe(hashes.length);
    }
  });
});
