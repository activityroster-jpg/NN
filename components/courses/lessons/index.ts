// Published lesson content, loaded by slug. Every lesson marked `published`
// in the outline must have an entry here (tested).

import type { LessonContent } from "@/lib/courses/types";

export const LESSON_CONTENT: Record<string, () => Promise<{ default: LessonContent }>> = {
  "navigating-on-a-charter": () => import("./navigating-on-a-charter"),
  "anchoring-and-mooring": () => import("./anchoring-and-mooring"),
  "weather-for-a-charter-week": () => import("./weather-for-a-charter-week"),
};
