// "Navigation for charter skippers": what you need to get a charter yacht
// safely round a week's cruise, in the order a first-time skipper meets it.
// Lessons are published one by one; unpublished ones show as "coming soon".

import type { CourseMeta, LessonMeta, ModuleMeta } from "../types";

export const COURSE_SLUG = "navigation";

function lesson(slug: string, title: string, summary: string, level: LessonMeta["level"], minutes: number, published = false): LessonMeta {
  return { slug, title, summary, level, minutes, published };
}

const MODULES: ModuleMeta[] = [
  {
    slug: "before-you-go",
    title: "Module 1 — Before you cast off",
    description: "What a charter skipper actually navigates with, how to read the chart, and how long a day's sail really takes.",
    lessons: [
      lesson("navigating-on-a-charter", "Navigating on a charter: what the skipper does", "The plotter, the paper chart and the pilot book on a charter yacht, who does what on board, and the five-minute plan that keeps a day simple.", "Foundations", 12, true),
      lesson("reading-the-chart", "Reading the chart", "Depths, contours, rocks and the compass rose; latitude and longitude; what the chart tells you about a bay before you arrive.", "Foundations", 18),
      lesson("distance-speed-and-time", "Distance, speed and time", "Nautical miles and knots, the 60D = ST rule, and how to size a day so you arrive with the sun still up.", "Foundations", 15),
    ],
  },
  {
    slug: "finding-your-way",
    title: "Module 2 — Finding your way",
    description: "Bearings, the two buoyage regions, and what the marks and lights mean.",
    lessons: [
      lesson("bearings-and-the-compass", "Bearings and the compass", "True and magnetic, the hand-bearing compass, transits, and a quick fix when the plotter and your eyes disagree.", "Day Skipper", 18),
      lesson("lateral-marks-a-and-b", "Lateral marks: Region A and Region B", "Red to port in the Mediterranean, red to starboard in the Caribbean: the one rule that catches charter skippers out, with shapes, lights and preferred channels.", "Day Skipper", 18, true),
      lesson("cardinal-and-other-marks", "Cardinal, danger and safe-water marks", "Yellow and black marks that say which side the danger is, plus isolated dangers, safe water, the yellow buoys round swimming areas and fish farms, and the wreck marking buoy.", "Day Skipper", 18, true),
      lesson("lights-at-night", "Lights at night", "Light characteristics, what a harbour looks like after dark, and why charter companies say arrive by daylight.", "Day Skipper", 15),
    ],
  },
  {
    slug: "close-to-land",
    title: "Module 3 — Close to land",
    description: "Pilotage into harbours and bays, anchoring, and the rules of the road.",
    lessons: [
      lesson("pilotage-into-a-harbour", "Pilotage into a harbour or bay", "Planning the approach, clearing bearings and leading lines, and the last mile into a marina stern-to.", "Day Skipper", 18),
      lesson("anchoring-and-mooring", "Anchoring and mooring buoys", "Choosing the spot, depth and scope, swinging room, seagrass, lazy lines and the anchor watch.", "Day Skipper", 18),
      lesson("rules-of-the-road", "Rules of the road for charter skippers", "Who gives way, ferries and fishing boats, narrow channels and the sound signals you will actually hear.", "Day Skipper", 18),
    ],
  },
  {
    slug: "the-week",
    title: "Module 4 — The week",
    description: "Weather windows, the plotter and apps, and planning seven days that work.",
    lessons: [
      lesson("weather-for-a-charter-week", "Weather for a charter week", "Reading a forecast, the local winds (meltemi, bora, mistral, trade winds), and knowing when to stay put.", "Coastal Skipper", 18),
      lesson("plotter-apps-and-the-plan", "The plotter, the apps and the week's plan", "Chartplotters and phone apps, their limits, waypoints and tracks, VHF basics, and a passage plan for seven days.", "Coastal Skipper", 20),
      lesson("charter-navigation-quiz", "Final check: the charter navigation quiz", "Forty questions across the course, marked instantly, to see whether you are ready for the briefing.", "Coastal Skipper", 30),
    ],
  },
];

export const NAVIGATION_COURSE: CourseMeta = {
  slug: COURSE_SLUG,
  title: "Navigation for charter skippers",
  tagline: "Everything you need to take a charter yacht round a week's cruise",
  description:
    "A free, interactive navigation course for people who charter yachts: the chart, buoyage in both regions, pilotage into harbours, anchoring, the rules of the road, weather and the week's plan. Narrated video, clear notes, interactive charts and marked exercises.",
  modules: MODULES,
};

export interface LessonLocation {
  lesson: LessonMeta;
  module: ModuleMeta;
  /** 1-based number across the whole course. */
  number: number;
  previous: LessonMeta | null;
  next: LessonMeta | null;
}

export function allLessons(): LessonMeta[] {
  return MODULES.flatMap((m) => m.lessons);
}

export function publishedLessons(): LessonMeta[] {
  return allLessons().filter((l) => l.published);
}

export function locateLesson(slug: string): LessonLocation | null {
  const flat = allLessons();
  const index = flat.findIndex((l) => l.slug === slug);
  if (index === -1) return null;
  const parent = MODULES.find((m) => m.lessons.some((l) => l.slug === slug))!;
  const published = (l: LessonMeta | undefined) => (l && l.published ? l : null);
  return { lesson: flat[index]!, module: parent, number: index + 1, previous: published(flat[index - 1]), next: published(flat[index + 1]) };
}
