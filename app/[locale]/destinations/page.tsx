import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getDictionary, type Dictionary } from "@/lib/i18n";
import { monthName } from "@/lib/i18n/format";
import { requireLocale } from "@/lib/request";
import { destinationViews } from "@/lib/services/destination-settings";

type DestKey = keyof Dictionary["destinations"];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = getDictionary(await requireLocale(params));
  return { title: t.nav.destinations, alternates: { canonical: "destinations" } };
}

export default async function Destinations({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await requireLocale(params);
  const t = getDictionary(locale);
  const all = (await destinationViews(await getDb())).filter((d) => d.active);
  const featured = all.filter((d) => d.featured);
  const others = all.filter((d) => !d.featured);
  const card = (d: (typeof all)[number], big: boolean) => {
    const c = t.destinations[d.id as DestKey];
    return (
      <Link key={d.id} href={`/${locale}/destinations/${d.id}`} className="card group flex flex-col overflow-hidden transition hover:shadow-md">
        <div className={`relative ${big ? "aspect-[16/9]" : "aspect-[16/8]"}`} style={d.heroImageUrl ? { backgroundImage: `url(${d.heroImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: d.heroGradient }}>
          <span className="absolute bottom-3 left-3 rounded-full bg-black/25 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">{c.region}</span>
        </div>
        <div className="p-5">
          <h2 className={`h-display ${big ? "text-3xl" : "text-2xl"}`}>{c.name}</h2>
          <p className="mt-1 text-sm text-ink/70">{c.tagline}</p>
          <p className="mt-3 text-xs text-muted">{d.peakMonths.map((m) => monthName(m, locale, "short")).join(" · ")}</p>
        </div>
      </Link>
    );
  };
  return (
    <div className="container-page py-12">
      <h1 className="h-display text-5xl">{t.home.featuredTitle}</h1>
      <p className="mt-2 text-ink/70">{t.home.featuredSub}</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">{featured.map((d) => card(d, true))}</div>
      <h2 className="h-display mt-16 text-3xl">{t.home.moreDestinations}</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{others.map((d) => card(d, false))}</div>
    </div>
  );
}
