import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock, TriangleAlert } from "lucide-react";
import { CourseStatusNote } from "@/components/courses/CourseStatusNote";
import { LessonTick } from "@/components/courses/CourseProgress";
import LevelBadge from "@/components/courses/LevelBadge";
import { LESSON_CONTENT } from "@/components/courses/lessons";
import { JsonLd } from "@/components/seo/JsonLd";
import { COURSE_SLUG, NAVIGATION_COURSE, allLessons, locateLesson } from "@/lib/courses/navigation/outline";
import { coursePath, lessonLd, lessonPath } from "@/lib/courses/navigation/seo";
import { breadcrumbLd, pageMeta, snippet } from "@/lib/seo";
import { requireLocale } from "@/lib/request";

const NAV_CARD = "rounded-card border border-line bg-card p-4 transition-colors hover:border-brand sm:p-5";

interface Props {
  params: Promise<{ locale: string; lesson: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lesson: slug } = await params;
  const locale = await requireLocale(params);
  const loc = locateLesson(slug);
  if (!loc || !loc.lesson.published) return { title: "Lesson not found" };
  return pageMeta({
    locale,
    path: `/learn/${COURSE_SLUG}/${slug}`,
    englishOnly: true,
    title: `${loc.lesson.title}: ${NAVIGATION_COURSE.title}, lesson ${loc.number}`,
    description: snippet(loc.lesson.summary),
  });
}

export default async function LessonPage({ params }: Props) {
  const { lesson: slug } = await params;
  const locale = await requireLocale(params);
  const loc = locateLesson(slug);
  const load = LESSON_CONTENT[slug];
  if (!loc || !loc.lesson.published || !load) notFound();
  const { default: content } = await load();
  const { lesson, module, number, previous, next } = loc;
  const flat = allLessons();
  const { Body, Video, Exercises } = content;

  return (
    <div className="bg-surface">
      <JsonLd
        data={[
          lessonLd(lesson, module, content.objectives),
          breadcrumbLd([
            { name: "Nautical Nomads", path: `/${locale}` },
            { name: NAVIGATION_COURSE.title, path: coursePath },
            { name: lesson.title, path: lessonPath(slug) },
          ]),
        ]}
      />
      <div className="container-page py-8 sm:py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href={coursePath} className="hover:underline">{NAVIGATION_COURSE.title}</Link> <span aria-hidden="true">›</span> {module.title.replace(/^Module \d+ — /, "")}
        </nav>
        <header className="mt-4 mb-6">
          <p className="text-eyebrow text-brand">
            <span className="tabular-nums">Lesson {number} of {flat.length}</span> · {module.title}
          </p>
          <h1 className="h-display mt-2 text-4xl text-ink sm:text-5xl">{lesson.title}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted">{lesson.summary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
            <LevelBadge level={lesson.level} />
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Clock size={16} strokeWidth={1.5} aria-hidden="true" />
              {lesson.minutes} min
            </span>
            <span aria-hidden="true">·</span>
            <span>Video · Notes · Interactive · Exercises</span>
          </div>
        </header>

        <Video />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <article className="min-w-0">
            <section className="rounded-card border border-line bg-card p-5 sm:p-6" aria-labelledby="objectives-h">
              <h2 id="objectives-h" className="text-eyebrow text-muted">In this lesson you will learn</h2>
              <ul className="mt-3 space-y-2">
                {content.objectives.map((o) => (
                  <li key={o} className="flex gap-2.5 text-base leading-snug text-ink">
                    <Check size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div id="lesson-notes" className="lesson-body mt-10 scroll-mt-24">
              <Body />
            </div>

            {content.keyTerms.length > 0 && (
              <section className="mt-12 rounded-card border border-line bg-card p-5 sm:p-6" aria-labelledby="terms-h">
                <h2 id="terms-h" className="text-h3 text-ink">Key terms</h2>
                <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  {content.keyTerms.map((t) => (
                    <div key={t.term}>
                      <dt className="font-semibold text-ink">{t.term}</dt>
                      <dd className="mt-0.5 text-[15px] leading-snug text-muted">{t.definition}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <section id="exercises" className="mt-14 scroll-mt-24" aria-labelledby="exercises-h">
              <h2 id="exercises-h" className="text-h2 text-ink">Exercises</h2>
              <p className="mt-2 mb-5 text-muted">Check your understanding. You get a second try at each question, then the worked answer. Score 70% or more to complete the lesson; your progress is saved in this browser.</p>
              <Exercises courseSlug={COURSE_SLUG} lessonSlug={slug} />
            </section>

            <nav className="mt-14 grid gap-3 sm:grid-cols-2" aria-label="Lesson navigation">
              <Link href={previous ? lessonPath(previous.slug) : coursePath} className={NAV_CARD}>
                <span className="inline-flex items-center gap-1.5 text-eyebrow text-muted">
                  <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
                  {previous ? "Previous" : "Course"}
                </span>
                <span className="mt-1.5 block font-semibold text-ink">{previous ? previous.title : "Course overview"}</span>
              </Link>
              {next ? (
                <Link href={lessonPath(next.slug)} className="rounded-card border border-brand bg-brand p-4 text-brand-ink transition-colors hover:bg-accent sm:p-5 sm:text-right">
                  <span className="inline-flex items-center gap-1.5 text-eyebrow text-brand-ink/80">
                    Next lesson
                    <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <span className="mt-1.5 block font-semibold">{next.title}</span>
                </Link>
              ) : (
                <Link href={coursePath} className={`${NAV_CARD} sm:text-right`}>
                  <span className="text-eyebrow text-muted">Up next</span>
                  <span className="mt-1.5 block font-semibold text-ink">More lessons are on the way: see the syllabus</span>
                </Link>
              )}
            </nav>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <nav className="rounded-card border border-line bg-card p-4" aria-label={module.title}>
              <p className="px-2 text-eyebrow text-muted">{module.title}</p>
              <ol className="mt-3 space-y-0.5">
                {module.lessons.map((l) => {
                  const n = flat.findIndex((x) => x.slug === l.slug) + 1;
                  const current = l.slug === slug;
                  const row = (
                    <span className="flex items-start gap-2">
                      <span className={`w-5 shrink-0 text-right text-xs leading-5 font-semibold tabular-nums ${current ? "text-brand" : "text-muted"}`}>{n}</span>
                      <span className="flex-1 leading-snug">{l.title}</span>
                      {l.published && <LessonTick courseSlug={COURSE_SLUG} lessonSlug={l.slug} />}
                    </span>
                  );
                  return (
                    <li key={l.slug}>
                      {l.published && !current ? (
                        <Link href={lessonPath(l.slug)} className="block rounded-control px-2 py-2 text-sm text-ink transition-colors hover:bg-brand-soft/60">{row}</Link>
                      ) : (
                        <span className={`block rounded-control px-2 py-2 text-sm ${current ? "bg-brand-soft font-semibold text-brand" : "text-muted"}`} aria-current={current ? "page" : undefined}>{row}</span>
                      )}
                    </li>
                  );
                })}
              </ol>
              <Link href={coursePath} className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 text-sm font-semibold text-brand hover:underline">
                Full syllabus
                <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </Link>
            </nav>
            <p className="flex items-start gap-2.5 rounded-card border border-line bg-card p-4 text-xs leading-relaxed text-muted">
              <TriangleAlert size={16} strokeWidth={1.5} className="mt-px shrink-0 text-warn" aria-hidden="true" />
              <span>Training material only. The Isle of Kerran practice chart is fictional and must never be used for navigation.</span>
            </p>
          </aside>
        </div>

        <div className="mt-14">
          <CourseStatusNote />
        </div>
      </div>
    </div>
  );
}
