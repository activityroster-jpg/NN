import { describe, expect, it } from "vitest";
import { HOWTO_SCRIPTS, howToNarrationId } from "@/lib/cruising/howto-scripts";
import { GUIDES } from "@/lib/cruising";
import { sentenceHash } from "@/lib/cruising/narration";
import { LESSON_SCRIPTS, lessonNarrationId } from "@/lib/courses/navigation/scripts";
import { narrationSources } from "@/lib/narration/sources";
import { SHORTS } from "@/lib/shorts";
import { shortSentences } from "@/lib/shorts/narration";
import { validateShort } from "@/lib/shorts/validate";

describe("shorts", () => {
  for (const s of SHORTS) {
    it(`${s.id}: passes the checks`, () => {
      expect(validateShort(s)).toEqual([]);
    });
  }
  it("ids are unique across shorts and guides", () => {
    const ids = [...GUIDES.map((g) => g.id), ...SHORTS.map((s) => s.id)];
    expect(new Set(ids).size).toBe(ids.length);
    const lessons = Object.values(LESSON_SCRIPTS).map((l) => lessonNarrationId(l.slug));
    const howtos = Object.values(HOWTO_SCRIPTS).map((h) => howToNarrationId(h.id));
    const all = narrationSources().map((x) => x.id);
    expect(all).toEqual([...ids, ...lessons, ...howtos]);
    expect(new Set(all).size).toBe(all.length);
  });
  it("sentence hashes are unique within a short", () => {
    for (const s of SHORTS) {
      const hashes = shortSentences(s).map(sentenceHash);
      expect(new Set(hashes).size).toBe(hashes.length);
    }
  });
});
