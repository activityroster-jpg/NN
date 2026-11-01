import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { abs, breadcrumbLd, pageMeta } from "@/lib/seo";
import Link from "next/link";
import { IconArrowRight } from "@/components/Icons";
import { GUIDES, REGIONS, totalMiles } from "@/lib/cruising";
import { SERIES, seriesOf } from "@/lib/cruising/howto";
import { requireLocale } from "@/lib/request";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await requireLocale(params);
  return pageMeta({
    locale,
    path: "/cruising",
    englishOnly: true,
    title: "Sailing guides: cruising destinations and charter know-how",
    description: "Yacht charter sailing guides, region by region: an ideal one-week route from the main charter base, ports, water, power and fuel, mooring, weather and winds, each with a narrated video.",
  });
}

const LEVEL = { easy: "Easy sailing", intermediate: "Some experience", experienced: "Experienced crews" } as const;

export default async function CruisingIndex({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await requireLocale(params);
  const regions = REGIONS.map((r) => ({ ...r, guides: GUIDES.filter((g) => g.region === r.id) })).filter((r) => r.guides.length > 0);
  return (
    <div className="container-page py-14">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Nautical Nomads", path: `/${locale}` },
            { name: "Cruising guides", path: "/en/cruising" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Essential cruising destinations",
            itemListElement: GUIDES.map((g, i) => ({ "@type": "ListItem", position: i + 1, name: g.name, url: abs(`/en/cruising/${g.id}`) })),
          },
        ]}
      />
      <p className="text-sm font-semibold tracking-wider text-brand uppercase">Cruising guides</p>
      <h1 className="h-display mt-2 text-5xl">Cruising guides</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink/80">
        Practical know-how for your charter week, and the world&apos;s best charter areas region by region: each destination guide has an ideal seven-day route, where to find water, power and fuel, navigation and mooring notes, and the winds to watch, with a short narrated video.
      </p>
      <section className="mt-12 rounded-2xl bg-surface-2 p-6 sm:p-8">
        <h2 className="h-display text-3xl">Charter know-how</h2>
        <p className="mt-2 max-w-2xl text-ink/80">Practical guides for the week: what to sort out before you go, how to take over and live on the boat, reading the weather, and looking after the yacht.</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {SERIES.map((s) => (
            <div key={s.id}>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted">{s.blurb}</p>
              <ul className="mt-2 space-y-1.5">
                {seriesOf(s.id).map((h) => (
                  <li key={h.id}>
                    <Link href={`/${locale}/cruising/how-to/${h.id}`} className="group flex items-start gap-2 text-sm hover:text-brand">
                      <IconArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-brand transition group-hover:translate-x-0.5" />
                      <span>
                        <span className="font-medium">{h.title.replace(/^(Weather|Yacht care) \d: (.)/, (_, _s, c: string) => c.toUpperCase())}</span>
                        <span className="text-muted"> · {h.minutes} min</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <h2 className="h-display mt-16 text-4xl">Destination guides</h2>
      {regions.map((r) => (
        <section key={r.id} className="mt-12">
          <h2 className="h-display text-3xl">{r.name}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {r.guides.map((g) => (
              <Link key={g.id} href={`/${locale}/cruising/${g.id}`} className="card group flex flex-col p-5 transition hover:border-ink/30">
                <span className="text-xs font-semibold tracking-wider text-muted uppercase">{g.country} · from {g.baseMarina.name}</span>
                <span className="h-display mt-1 text-2xl">{g.name}</span>
                <span className="mt-2 text-sm text-ink/80">{g.tagline}</span>
                <span className="mt-4 flex items-center justify-between text-sm text-muted">
                  <span>1 week · about {totalMiles(g)} nm · {LEVEL[g.level]}</span>
                  <IconArrowRight className="h-4 w-4 text-brand transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
