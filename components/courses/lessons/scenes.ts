import type { Scene } from "@/components/cruising/GuidePlayer";
import { SCENES as anchoringAndMooring } from "./anchoring-and-mooring/client";
import { SCENES as bearingsAndTheCompass } from "./bearings-and-the-compass/client";
import { SCENES as cardinalAndOtherMarks } from "./cardinal-and-other-marks/client";
import { SCENES as charterNavigationQuiz } from "./charter-navigation-quiz/client";
import { SCENES as distanceSpeedAndTime } from "./distance-speed-and-time/client";
import { SCENES as lateralMarksAAndB } from "./lateral-marks-a-and-b/client";
import { SCENES as lightsAtNight } from "./lights-at-night/client";
import { SCENES as navigatingOnACharter } from "./navigating-on-a-charter/client";
import { SCENES as pilotageIntoAHarbour } from "./pilotage-into-a-harbour/client";
import { SCENES as plotterAppsAndThePlan } from "./plotter-apps-and-the-plan/client";
import { SCENES as readingTheChart } from "./reading-the-chart/client";
import { SCENES as rulesOfTheRoad } from "./rules-of-the-road/client";
import { SCENES as weatherForACharterWeek } from "./weather-for-a-charter-week/client";

// Every lesson's video scenes, for the MP4 renderer (/render/lesson/<slug>).
// Imported only by the render page, so lesson pages stay one lesson each.
export const LESSON_SCENES: Record<string, Scene[]> = {
  "navigating-on-a-charter": navigatingOnACharter,
  "reading-the-chart": readingTheChart,
  "distance-speed-and-time": distanceSpeedAndTime,
  "bearings-and-the-compass": bearingsAndTheCompass,
  "lateral-marks-a-and-b": lateralMarksAAndB,
  "cardinal-and-other-marks": cardinalAndOtherMarks,
  "lights-at-night": lightsAtNight,
  "pilotage-into-a-harbour": pilotageIntoAHarbour,
  "anchoring-and-mooring": anchoringAndMooring,
  "rules-of-the-road": rulesOfTheRoad,
  "weather-for-a-charter-week": weatherForACharterWeek,
  "plotter-apps-and-the-plan": plotterAppsAndThePlan,
  "charter-navigation-quiz": charterNavigationQuiz,
};
