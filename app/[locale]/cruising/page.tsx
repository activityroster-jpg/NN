import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowRight } from "@/components/Icons";
import { GUIDES, REGIONS, totalMiles } from "@/lib/cruising";
import { requireLocale } from "@/lib/request";

export const metadata: Metadata = {
  title: "Essential cruising destinations",
  description: "The world's best yacht charter areas, region by region: an ideal seven-day route, ports, water, power and fuel, navigation notes and weather, each with a narrated video.",
};

const LEVEL = { easy: "Easy sailing", intermediate: "Some experience", experienced: "Experienced crews" } as const;

export default async function CruisingIndex({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await requireLocale(params);
  const regions = REGIONS.map((r) => ({ ...r, guides: GUIDES.filter((g) => g.region === r.id) })).filter((r) => r.guides.length > 0);
  return (
    <div className="container-page py-14">
      <p className="text-sm font-semibold tracking-wider text-brand uppercase">Cruising guides</p>
      <h1 className="h-display mt-2 text-5xl">Essential cruising destinations</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink/80">
        The world&apos;s best yacht charter areas, region by region. Each guide has an ideal seven-day route, where to find water, power and fuel, navigation and mooring notes, and the winds to watch, with a short narrated video.
      </p>
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
