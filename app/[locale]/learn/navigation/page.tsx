import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CircleCheck, CirclePlay, Ruler } from "lucide-react";
import { CourseStatusNote } from "@/components/courses/CourseStatusNote";
import LessonCard from "@/components/courses/LessonCard";
import { CourseResume, type LessonLink } from "@/components/courses/CourseProgress";
import PracticeChart from "@/components/courses/PracticeChart";
import { JsonLd } from "@/components/seo/JsonLd";
import { COURSE_SLUG, NAVIGATION_COURSE, allLessons, publishedLessons } from "@/lib/courses/navigation/outline";
import { viewAround } from "@/lib/courses/navigation/chart-geometry";
import { km } from "@/lib/courses/navigation/practice-chart";
import { courseLd, coursePath, lessonPath } from "@/lib/courses/navigation/seo";
import { faqPageLd, type FaqEntry } from "@/lib/courses/site";
import { breadcrumbLd, pageMeta } from "@/lib/seo";
import { requireLocale } from "@/lib/request";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await requireLocale(params);
  return pageMeta({
    locale,
    path: `/learn/${COURSE_SLUG}`,
    englishOnly: true,
    title: "Navigation for charter skippers: free interactive course",
    description: "Learn the navigation a charter skipper needs: the chart, buoyage in both regions, pilotage into harbours, anchoring, the rules of the road, weather and planning the week. Narrated videos, interactive charts and marked exercises. Free, no sign-up.",
  });
}

const FAQS: FaqEntry[] = [
  { q: "Is the course free?", a: "Yes. Every lesson, video and exercise is free, and you do not need an account. Your progress is saved in your browser." },
  { q: "Do I need sailing experience?", a: "No. It starts from what is on board a charter yacht and builds up, lesson by lesson, to planning a week. If you already hold a Day Skipper or ICC it works as a refresher before the charter." },
  { q: "Is this an RYA course? Will I get a certificate?", a: "No. This is independent training material and is not accredited by the RYA or any other body, so it does not lead to a qualification. Charter companies set their own requirements for bareboat skippers; a recognised training centre can get you certified." },
  { q: "Which waters does it cover?", a: "The Mediterranean, the Caribbean and the Indian Ocean, where our charters sail: both IALA buoyage regions, the local winds, Med mooring and anchoring over seagrass. The tidal waters of northern Europe are only touched on." },
  { q: "Can I use the practice chart for real navigation?", a: "No. The Isle of Kerran is a fictional practice area drawn for teaching. Always navigate with the current official charts on board." },
];

const HOW_IT_WORKS = [
  { icon: CirclePlay, title: "Watch", text: "A narrated, animated walkthrough at the top of every lesson, with captions and a transcript." },
  { icon: BookOpen, title: "Read", text: "Clear notes with diagrams, worked examples and the key terms, written for people who have never navigated." },
  { icon: Ruler, title: "Try", text: "Interactive charts and tools: zoom in, read positions, measure and plot." },
  { icon: CircleCheck, title: "Practise", text: "Exercises marked instantly with worked answers, plus fresh practice questions each time." },
];

export default async function NavigationCoursePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await requireLocale(params);
  const flat = allLessons();
  const links: LessonLink[] = flat.map((l, i) => ({ slug: l.slug, title: l.title, number: i + 1, minutes: l.minutes, published: l.published }));
  const published = publishedLessons();
  const minutes = published.reduce((n, l) => n + l.minutes, 0);
  return (
    <div className="bg-surface">
      <JsonLd
        data={[
          courseLd(),
          breadcrumbLd([
            { name: "Nautical Nomads", path: `/${locale}` },
            { name: NAVIGATION_COURSE.title, path: coursePath },
          ]),
          faqPageLd(FAQS),
        ]}
      />
      <section className="bg-ink text-white">
        <div className="container-page grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_26rem]">
          <div>
            <p className="text-eyebrow text-mist">Free interactive course</p>
            <h1 className="h-display mt-2 text-4xl sm:text-5xl">{NAVIGATION_COURSE.title}</h1>
            <p className="mt-3 max-w-2xl text-lg text-white/80">{NAVIGATION_COURSE.tagline}.</p>
            <p className="mt-4 max-w-2xl text-white/70">{NAVIGATION_COURSE.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <CourseResume courseSlug={COURSE_SLUG} lessons={links} />
              <span className="text-sm text-white/60">
                {published.length} of {flat.length} lessons published · {minutes} minutes of lessons so far
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 p-2">
            <PracticeChart view={viewAround(km(6.6, 11.5), 15)} />
            <p className="px-2 pt-2 pb-1 text-xs text-white/60">The Isle of Kerran: the course's fictional practice chart.</p>
          </div>
        </div>
      </section>

      <div className="container-page py-12">
        <CourseStatusNote />
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="How it works">
          {HOW_IT_WORKS.map((h) => (
            <div key={h.title} className="rounded-card border border-line bg-card p-5">
              <h.icon size={24} strokeWidth={1.5} className="text-brand" aria-hidden="true" />
              <h2 className="mt-3 text-h4 text-ink">{h.title}</h2>
              <p className="mt-1 text-sm text-muted">{h.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-14" aria-labelledby="syllabus-h">
          <h2 id="syllabus-h" className="h-display text-3xl text-ink">The syllabus</h2>
          <p className="mt-2 max-w-2xl text-muted">Twelve lessons and a final quiz, in the order a first-time skipper meets things. Lessons are published one by one; the rest show as coming soon.</p>
          <div className="mt-8 space-y-10">
            {NAVIGATION_COURSE.modules.map((m) => (
              <div key={m.slug}>
                <h3 className="text-h3 text-ink">{m.title}</h3>
                <p className="mt-1 text-sm text-muted">{m.description}</p>
                <div className="mt-4 space-y-3">
                  {m.lessons.map((l) => {
                    const n = flat.findIndex((x) => x.slug === l.slug) + 1;
                    return <LessonCard key={l.slug} href={lessonPath(l.slug)} courseSlug={COURSE_SLUG} lessonSlug={l.slug} number={n} title={l.title} summary={l.summary} minutes={l.minutes} level={l.level} published={l.published} />;
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14" aria-labelledby="faq-h">
          <h2 id="faq-h" className="h-display text-3xl text-ink">Questions</h2>
          <dl className="mt-6 grid gap-6 md:grid-cols-2">
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-card border border-line bg-card p-5">
                <dt className="font-semibold text-ink">{f.q}</dt>
                <dd className="mt-2 text-sm text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-sm text-muted">
            Ready to go further? Our sister site Boaty Jobs has a 40-lesson course up to Yachtmaster-level theory:{" "}
            <a href="https://boatyjobs.com/courses/navigation-for-yachts" className="underline" target="_blank" rel="noreferrer">Navigation for Yachts</a>. And the <Link href={`/${locale}/cruising`} className="underline">cruising guides</Link> show where to put it all to use.
          </p>
        </section>
      </div>
    </div>
  );
}
