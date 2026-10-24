import Link from "next/link";
import { IconAnchor, IconArrowRight, IconCalendar, IconChat, IconCheck, IconClock, IconHelm, IconShield } from "@/components/Icons";
import { getDictionary } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n";
import { requireLocale } from "@/lib/request";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { destinationViews } from "@/lib/services/destination-settings";

type DestKey = keyof Dictionary["destinations"];

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await requireLocale(params);
  const t = getDictionary(locale);
  const db = await getDb();
  const [settings, views] = await Promise.all([getSettings(db), destinationViews(db)]);
  const active = views.filter((d) => d.active);
  const featured = active.filter((d) => d.featured);
  const others = active.filter((d) => !d.featured);
  const bg = (d: (typeof views)[number]) =>
    d.heroImageUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,.15),rgba(0,0,0,.35)), url(${d.heroImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: d.heroGradient };

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden text-white">
        <picture className="absolute inset-0 -z-10 block">
          <source media="(max-width: 640px)" srcSet="/photos/home-hero-sm.jpg" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/photos/home-hero.jpg" alt="" className="h-full w-full object-cover object-[60%_center]" fetchPriority="high" />
        </picture>
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-black/65 via-black/35 to-black/10" />
        <div className="container-page grid items-end gap-10 pt-24 pb-16 md:grid-cols-[1.1fr_0.9fr] md:pt-36 md:pb-20">
          <div>
            <h1 className="h-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
              {t.home.heroTitle}
              <span className="mt-2 block italic text-white/90">{t.home.heroTitleAccent}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/90">{t.home.heroSub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${locale}/plan`} className="btn bg-white px-7 py-3.5 text-base text-ink hover:bg-white/90">
                {t.home.heroCta} <IconArrowRight className="h-4 w-4" />
              </Link>
              <Link href={`/${locale}/destinations`} className="btn border border-white/60 px-7 py-3.5 text-base text-white hover:bg-white/10">
                {t.home.heroSecondary}
              </Link>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-white/90 sm:grid-cols-3">
              {[t.home.trust1, t.home.trust2, t.home.trust3].map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden md:block">
            <div className="grid grid-cols-2 gap-3">
              {featured.map((d) => (
                <Link
                  key={d.id}
                  href={`/${locale}/plan?d=${d.id}`}
                  className="group flex items-center justify-between rounded-2xl border border-white/30 bg-white/10 px-4 py-3 backdrop-blur transition hover:bg-white/20"
                >
                  <span>
                    <span className="block text-[11px] font-semibold tracking-wider uppercase opacity-80">{t.destinations[d.id as DestKey].region}</span>
                    <span className="h-display text-xl leading-tight">{t.destinations[d.id as DestKey].name}</span>
                  </span>
                  <IconArrowRight className="h-5 w-5 opacity-70 transition group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured destinations */}
      <section className="container-page py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="h-display text-4xl">{t.home.featuredTitle}</h2>
            <p className="mt-2 text-ink/70">{t.home.featuredSub}</p>
          </div>
          <Link href={`/${locale}/destinations`} className="text-sm font-semibold text-brand hover:underline">
            {t.home.moreDestinations} →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((d) => {
            const c = t.destinations[d.id as DestKey];
            return (
              <article key={d.id} className="card group flex flex-col overflow-hidden">
                <div className="relative aspect-[4/3]" style={bg(d)}>
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/25 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">{c.region}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="h-display text-2xl">{c.name}</h3>
                  <p className="mt-1 flex-1 text-sm text-ink/70">{c.tagline}</p>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/${locale}/plan?d=${d.id}`} className="btn-primary flex-1 px-4 py-2 text-sm">
                      {t.nav.plan}
                    </Link>
                    <Link href={`/${locale}/destinations/${d.id}`} className="btn-secondary px-4 py-2 text-sm">
                      {t.common.readMore}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {others.map((d) => (
            <Link key={d.id} href={`/${locale}/destinations/${d.id}`} className="chip">
              {t.destinations[d.id as DestKey].name}
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface-2/60 py-16">
        <div className="container-page">
          <h2 className="h-display text-4xl">{t.home.howTitle}</h2>
          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [IconAnchor, t.home.how1Title, t.home.how1Text],
              [IconHelm, t.home.how2Title, t.home.how2Text],
              [IconCalendar, t.home.how3Title, t.home.how3Text],
              [IconClock, t.home.how4Title, t.home.how4Text],
            ].map(([Icon, title, text], i) => {
              const I = Icon as typeof IconAnchor;
              return (
                <li key={i} className="card p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                      <I />
                    </span>
                    <span className="text-sm font-semibold text-muted">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{title as string}</h3>
                  <p className="mt-1.5 text-sm text-ink/75">{text as string}</p>
                </li>
              );
            })}
          </ol>
          <div className="mt-8">
            <Link href={`/${locale}/plan`} className="btn-primary">
              {t.home.heroCta} <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Monohull vs catamaran */}
      <section className="container-page py-16">
        <h2 className="h-display text-4xl">{t.home.typesTitle}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {(
            [
              ["monohull", t.home.monoTitle, t.home.monoText, settings.images.monohull],
              ["catamaran", t.home.catTitle, t.home.catText, settings.images.catamaran],
            ] as const
          ).map(([kind, title, text, img]) => (
            <div key={kind} className="card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img?.url ?? `/demo/${kind}-2.svg`} alt="" loading="lazy" className="aspect-[16/7] w-full object-cover" />
              {img?.credit && <p className="px-6 pt-2 text-[11px] text-muted">{img.credit}</p>}
              <div className="p-6">
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-ink/75">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="container-page py-8">
        <h2 className="h-display text-4xl">{t.home.whyTitle}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            [IconShield, t.home.why1Title, t.home.why1Text],
            [IconAnchor, t.home.why2Title, t.home.why2Text],
            [IconChat, t.home.why3Title, t.home.why3Text],
          ].map(([Icon, title, text], i) => {
            const I = Icon as typeof IconAnchor;
            return (
              <div key={i} className="p-2">
                <I className="h-7 w-7 text-sea" />
                <h3 className="mt-3 text-lg font-semibold">{title as string}</h3>
                <p className="mt-1.5 text-ink/75">{text as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pt-12">
        <div className="card flex flex-col items-start gap-5 bg-brand-soft p-8 sm:flex-row sm:items-center sm:justify-between md:p-10">
          <div>
            <h2 className="h-display text-3xl">{t.home.ctaTitle}</h2>
            <p className="mt-2 max-w-xl text-ink/80">{t.home.ctaText}</p>
          </div>
          <Link href={`/${locale}/enquire`} className="btn-primary shrink-0">
            {t.home.ctaButton}
          </Link>
        </div>
      </section>
    </>
  );
}
