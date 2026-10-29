import { describe, expect, it } from "vitest";
import { LESSON_CONTENT } from "@/components/courses/lessons";
import { LESSON_SCRIPTS, lessonSentences, validateScript } from "@/lib/courses/navigation/scripts";
import { allLessons, publishedLessons } from "@/lib/courses/navigation/outline";
import { sentenceHash } from "@/lib/cruising/narration";

describe("navigation course", () => {
  it("every published lesson has content and a script", () => {
    for (const l of publishedLessons()) {
      expect(LESSON_CONTENT[l.slug], l.slug).toBeDefined();
      expect(LESSON_SCRIPTS[l.slug], l.slug).toBeDefined();
    }
  });
  it("lesson slugs are unique", () => {
    const slugs = allLessons().map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  for (const s of Object.values(LESSON_SCRIPTS)) {
    it(`${s.slug}: the narration reads well`, () => {
      expect(validateScript(s)).toEqual([]);
      const hashes = lessonSentences(s).map(sentenceHash);
      expect(new Set(hashes).size).toBe(hashes.length);
    });
  }
});

// The narration speaks figures from the practice chart; if the chart data
// changes, these catch a video that would say the wrong bearing.
import { WORKED } from "@/components/courses/lessons/bearings-and-the-compass/lines";
import { LEAD_BRG, LEGS, SPIRE_CLEAR, SPIRE_CLEAR_MAG, SPEED, toMagnetic } from "@/components/courses/lessons/pilotage-into-a-harbour/data";

describe("narrated figures match the practice chart", () => {
  it("bearings and the compass", () => {
    expect([WORKED.magnetic, WORKED.trueBrg]).toEqual([336, 333]);
  });
  it("pilotage into a harbour", () => {
    expect([LEAD_BRG, toMagnetic(LEAD_BRG), SPIRE_CLEAR, SPIRE_CLEAR_MAG]).toEqual([0, 3, 27, 30]);
    expect([LEGS[0]!.distance.toFixed(1), LEGS[0]!.minutes, SPEED]).toEqual(["1.6", 19, 5]);
  });
});

describe("final check", () => {
  it("every question belongs to exactly one topic, forty in all", async () => {
    const { TOPICS, QUESTION_COUNT } = await import("@/components/courses/lessons/charter-navigation-quiz/data");
    const { QUESTION_IDS, QUESTIONS } = await import("@/components/courses/lessons/charter-navigation-quiz/client");
    const topicIds = TOPICS.flatMap((t) => t.ids);
    expect(new Set(topicIds).size).toBe(topicIds.length);
    expect([...topicIds].sort()).toEqual([...QUESTION_IDS].sort());
    expect(QUESTIONS.length).toBe(QUESTION_COUNT);
    expect(QUESTION_COUNT).toBe(40);
  });
});
