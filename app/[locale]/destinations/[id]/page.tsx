import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowRight, IconCalendar, IconCheck, IconHelm, IconPin } from "@/components/Icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { abs, breadcrumbLd, charterTitle, pageMeta, snippet } from "@/lib/seo";
import { getDb } from "@/lib/db";
import { getEnvAsync } from "@/lib/env";
import { autofillInBackground } from "@/lib/photos/autofill";
import { galleryFor } from "@/lib/photos/slots";
import { GUIDES } from "@/lib/cruising";
import { saturdays } from "@/lib/domain/dates";
import { destinationById } from "@/lib/domain/destinations";
import { getDictionary, type Dictionary } from "@/lib/i18n";
import { dateShort, monthName } from "@/lib/i18n/format";
import { displayCurrency, requireLocale, todayIso } from "@/lib/request";
import { MODELS } from "@/lib/fleet";
import { getRates } from "@/lib/fx";
import { fmt, money } from "@/lib/i18n/format";
import { estimateIn, estimateRanges } from "@/lib/pricing";
import { destinationView } from "@/lib/services/destination-settings";

type Props = { params: Promise<{ locale: string; id: string }> };
type DestKey = keyof Dictionary["destinations"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: l, id } = await params;
  const locale = await requireLocale(Promise.resolve({ locale: l }));
  const t = getDictionary(locale);
  const c = t.destinations[id as DestKey];
  if (!c) return {};
  const view = await destinationView(await getDb(), id);
  return pageMeta({
    locale,
    path: `/destinations/${id}`,
    title: charterTitle(locale, c.name, c.region),
    description: snippet(`${c.tagline}. ${c.intro}`),
    image: view?.heroImageUrl ?? undefined,
  });
}

export default async function DestinationPage({ params }: Props) {
  const { id } = await params;
  const locale = await requireLocale(params.then((p) => ({ locale: p.locale })));
  const t = getDictionary(locale);
  const def = destinationById(id);
  const db = await getDb();
  const d = def ? await destinationView(db, id) : undefined;
  if (!def || !d || !d.active) notFound();
  autofillInBackground(await getEnvAsync(), db);
  const [gallery, ranges, currency, rates] = await Promise.all([galleryFor(db, id), estimateRanges(db, todayIso(), [id]), displayCurrency(), getRates(db)]);
  // Lowest weekly estimate for each hull type here.
  const fromFor = (kind: "catamaran" | "monohull") => {
    const mins = MODELS.filter((m) => m.kind === kind).flatMap((m) => (ranges[m.id] ? [ranges[m.id]!.min] : []));
    return mins.length ? money(estimateIn(Math.min(...mins), currency, rates), currency, locale) : null;
  };
  const catsFrom = fromFor("catamaran");
  const monosFrom = fromFor("monohull");
  const c = t.destinations[id as DestKey];
  // Next few in-season Saturdays as quick starts.
  const quick = saturdays(todayIso(), 60).filter((s) => def.seasonMonths.includes(Number(s.slice(5, 7)))).slice(0, 6);
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: t.meta.siteName, path: `/${locale}` },
            { name: t.nav.destinations, path: `/${locale}/destinations` },
            { name: c.name, path: `/${locale}/destinations/${id}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "TouristDestination",
            name: c.name,
            description: c.intro,
            url: abs(`/${locale}/destinations/${id}`),
            ...(d.heroImageUrl ? { image: abs(d.heroImageUrl) } : {}),
            geo: { "@type": "GeoCoordinates", latitude: def.center.lat, longitude: def.center.lng },
            touristType: "Yacht charter",
          },
        ]}
      />
      <section className="relative overflow-hidden text-white" style={d.heroImageUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.35)),url(${d.heroImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: def.heroGradient }}>
        <div className="container-page py-20 sm:py-28">
          <p className="text-sm font-semibold tracking-wider uppercase opacity-85">{c.region}</p>
          <h1 className="h-display mt-2 text-5xl sm:text-6xl">{c.name}</h1>
          <p className="mt-3 max-w-xl text-lg opacity-95">{c.tagline}</p>
          <Link href={`/${locale}/plan?d=${id}`} className="btn mt-8 bg-white text-ink hover:bg-white/90">
            {t.nav.plan} <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {d.heroCredit && <p className="container-page pb-2 text-right text-[11px] opacity-70">{d.heroCredit}</p>}
      </section>
      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_340px]">
        <div>
          <p className="text-lg leading-relaxed text-ink/85">{c.intro}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {c.highlights.map((h) => (
              <li key={h} className="card flex items-center gap-3 p-4"><IconCheck className="h-5 w-5 shrink-0 text-ok" />{h}</li>
            ))}
          </ul>
          {gallery.length > 0 && (
            <div className={`mt-10 grid gap-3 ${gallery.length === 1 ? "" : gallery.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
              {gallery.map((g, i) => (
                <figure key={g.url} className={`relative overflow-hidden rounded-2xl ${i === 0 && gallery.length === 3 ? "sm:col-span-2 sm:row-span-2" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt={`${c.name} ${i + 1}`} loading="lazy" className="block aspect-[4/3] h-full w-full object-cover" />
                  {g.credit && <figcaption className="absolute right-2 bottom-1 text-[10px] text-white/80 drop-shadow">{g.credit}</figcaption>}
                </figure>
              ))}
            </div>
          )}
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <div className="card p-5">
              <h2 className="flex items-center gap-2 font-semibold"><IconCalendar className="h-5 w-5 text-sea" />{t.plan.whenTitle}</h2>
              <p className="mt-2 text-sm text-ink/80">{c.bestTime}</p>
              <p className="mt-2 text-xs text-muted">{def.seasonMonths.map((m) => monthName(m, locale, "short")).join(" · ")}</p>
            </div>
            <div className="card p-5">
              <h2 className="flex items-center gap-2 font-semibold"><IconHelm className="h-5 w-5 text-sea" />{t.common.skipper}</h2>
              <p className="mt-2 text-sm text-ink/80">{t.licence[def.licenceRule]}</p>
              <p className="mt-2 text-sm text-ink/80">{t.licence.noLicence}</p>
            </div>
          </div>
          {GUIDES.filter((x) => x.destinationId === id).map((x) => (
            <Link key={x.id} href={`/${locale}/cruising/${x.id}`} className="mt-6 card flex items-center justify-between p-5 hover:border-ink/30">
              <span>
                <span className="block text-xs font-semibold tracking-wider text-brand uppercase">Cruising guide · video</span>
                <span className="font-semibold">{x.name}: a week from {x.baseMarina.name}</span>
              </span>
              <IconArrowRight className="h-5 w-5 text-brand" />
            </Link>
          ))}
          <div className="mt-6 card p-5">
            <h2 className="flex items-center gap-2 font-semibold"><IconPin className="h-5 w-5 text-sea" />{t.common.base}</h2>
            <p className="mt-2 text-sm text-ink/80">{def.bases.join(" · ")}</p>
          </div>
          {(catsFrom || monosFrom) && (
            <div className="mt-6 card p-5">
              <h2 className="font-semibold">{t.plan.pricesTitle}</h2>
              <ul className="mt-2 space-y-1 text-sm text-ink/80">
                {catsFrom && <li>{fmt(t.plan.catsFrom, { price: catsFrom })}</li>}
                {monosFrom && <li>{fmt(t.plan.monosFrom, { price: monosFrom })}</li>}
              </ul>
              <p className="mt-2 text-xs text-muted">{t.plan.estimateNote}</p>
              <Link href={`/${locale}/yachts`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">{t.plan.seeYachts} <IconArrowRight className="h-4 w-4" /></Link>
            </div>
          )}
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="font-semibold">{t.plan.whenTitle}</h2>
            <div className="mt-3 grid gap-2">
              {quick.map((s) => (
                <Link key={s} href={`/${locale}/plan?d=${id}&w=${s}`} className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 text-sm hover:border-ink/30">
                  <span>{dateShort(s, locale)} · {monthName(Number(s.slice(5, 7)), locale)} {s.slice(0, 4)}</span>
                  <IconArrowRight className="h-4 w-4 text-muted" />
                </Link>
              ))}
            </div>
            <Link href={`/${locale}/enquire?d=${id}`} className="btn-secondary mt-4 w-full">{t.nav.enquire}</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
