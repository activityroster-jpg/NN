// Structured data for the course (schema.org Course and LearningResource),
// so search engines can show it as a free course.

import { SITE_NAME, SITE_URL, absUrl } from "../site";
import type { LessonMeta, ModuleMeta } from "../types";
import { COURSE_SLUG, NAVIGATION_COURSE, publishedLessons } from "./outline";

const PROVIDER = { "@type": "Organization", name: SITE_NAME, sameAs: SITE_URL };

/** English-only pages live under /en, like the cruising guides. */
export const coursePath = `/en/learn/${COURSE_SLUG}`;
export const lessonPath = (slug: string) => `${coursePath}/${slug}`;

export function courseLd() {
  const lessons = publishedLessons();
  const minutes = lessons.reduce((n, l) => n + l.minutes, 0);
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: NAVIGATION_COURSE.title,
    description: NAVIGATION_COURSE.description,
    url: absUrl(coursePath),
    provider: PROVIDER,
    inLanguage: "en-GB",
    isAccessibleForFree: true,
    educationalLevel: "Beginner to intermediate",
    teaches: ["Chart reading", "Distance, speed and time", "Bearings and the compass", "IALA buoyage, Regions A and B", "Lights at night", "Pilotage", "Anchoring", "Collision regulations", "Marine weather", "Passage planning"],
    offers: { "@type": "Offer", category: "Free", price: 0, priceCurrency: "GBP" },
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: `PT${minutes}M` },
    hasPart: lessons.map((l) => ({ "@type": "LearningResource", name: l.title, url: absUrl(lessonPath(l.slug)) })),
  };
}

export function lessonLd(lesson: LessonMeta, module: ModuleMeta, objectives: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title,
    description: lesson.summary,
    url: absUrl(lessonPath(lesson.slug)),
    learningResourceType: ["Lesson", "Video", "Interactive exercise"],
    educationalLevel: lesson.level,
    timeRequired: `PT${lesson.minutes}M`,
    inLanguage: "en-GB",
    isAccessibleForFree: true,
    teaches: objectives,
    provider: PROVIDER,
    isPartOf: { "@type": "Course", name: NAVIGATION_COURSE.title, url: absUrl(coursePath) },
    about: module.title,
  };
}
