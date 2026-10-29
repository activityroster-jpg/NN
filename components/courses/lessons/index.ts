// Published lesson content, loaded by slug. Every lesson marked `published`
// in the outline must have an entry here (tested).

import type { LessonContent } from "@/lib/courses/types";

export const LESSON_CONTENT: Record<string, () => Promise<{ default: LessonContent }>> = {
  "navigating-on-a-charter": () => import("./navigating-on-a-charter"),
  "reading-the-chart": () => import("./reading-the-chart"),
  "distance-speed-and-time": () => import("./distance-speed-and-time"),
  "bearings-and-the-compass": () => import("./bearings-and-the-compass"),
  "pilotage-into-a-harbour": () => import("./pilotage-into-a-harbour"),
  "lateral-marks-a-and-b": () => import("./lateral-marks-a-and-b"),
  "cardinal-and-other-marks": () => import("./cardinal-and-other-marks"),
  "anchoring-and-mooring": () => import("./anchoring-and-mooring"),
  "weather-for-a-charter-week": () => import("./weather-for-a-charter-week"),
  "plotter-apps-and-the-plan": () => import("./plotter-apps-and-the-plan"),
  "charter-navigation-quiz": () => import("./charter-navigation-quiz"),
  "lights-at-night": () => import("./lights-at-night"),
  "rules-of-the-road": () => import("./rules-of-the-road"),
};
