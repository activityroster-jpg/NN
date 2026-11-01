import { describe, expect, it } from "vitest";
import { COURSE_SLUG, publishedLessons } from "@/lib/courses/navigation/outline";
import { HOWTO, SERIES } from "@/lib/cruising/howto";

const lessons = new Set(publishedLessons().map((l) => l.slug));
const guides = new Set(HOWTO.map((g) => g.id));

describe("charter know-how guides", () => {
  it("have unique ids, a known series and content in every section", () => {
    expect(guides.size).toBe(HOWTO.length);
    const series = new Set(SERIES.map((s) => s.id));
    for (const g of HOWTO) {
      expect(series.has(g.series), g.id).toBe(true);
      expect(g.sections.length, g.id).toBeGreaterThan(0);
      for (const s of g.sections) expect(!!(s.text?.length || s.list?.length || s.checklist?.length || s.table), `${g.id}: ${s.heading}`).toBe(true);
    }
    for (const s of SERIES) expect(HOWTO.some((g) => g.series === s.id), s.id).toBe(true);
  });

  it("only link to pages that exist", () => {
    for (const g of HOWTO)
      for (const r of g.related ?? []) {
        const how = /^\/cruising\/how-to\/([a-z0-9-]+)$/.exec(r.path);
        const lesson = new RegExp(`^/learn/${COURSE_SLUG}(?:/([a-z0-9-]+))?$`).exec(r.path);
        expect(!!how || !!lesson, `${g.id} → ${r.path}`).toBe(true);
        if (how) expect(guides.has(how[1]!), `${g.id} → ${r.path}`).toBe(true);
        if (lesson?.[1]) expect(lessons.has(lesson[1]), `${g.id} → ${r.path}`).toBe(true);
      }
  });
});
