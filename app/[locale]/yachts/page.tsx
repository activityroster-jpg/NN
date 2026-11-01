import type { Metadata } from "next";
import Link from "next/link";
import { ModelPhoto } from "@/components/fleet/ModelPhoto";
import { IconArrowRight } from "@/components/Icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { getDb } from "@/lib/db";
import { FLEET_CLASSES, feet, modelById, modelPath, options, type HullKind, type ModelSpecs } from "@/lib/fleet";
import { modelCovers } from "@/lib/photos/slots";
import { abs, breadcrumbLd, pageMeta } from "@/lib/seo";
import { displayCurrency, requireLocale, todayIso } from "@/lib/request";
import { getRates } from "@/lib/fx";
import { money } from "@/lib/i18n/format";
import { ESTIMATE_NOTE, estimateIn, estimateRanges, productOf } from "@/lib/pricing";
import { destinationViews } from "@/lib/services/destination-settings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await requireLocale(params);
  return pageMeta({
    locale,
    path: "/yachts",
    englishOnly: true,
    title: "Our yachts: the catamarans and sailing yachts we charter",
    description: "The catamarans and sailing yachts we offer, from the Lagoon 40 to 60-foot flagships: sizes, cabins and berths, and what each suits. Ask for a quote on any of them.",
  });
}

function Card({ m, cover, from }: { m: ModelSpecs; cover?: string; from: string | null }) {
  const ft = feet(m.lengthOverallM);
  return (
    <Link href={modelPath(m.id)} className="card group overflow-hidden transition hover:shadow-md">
      <ModelPhoto url={cover} id={m.id} alt={m.name} className="aspect-[16/10] w-full" />
      <div className="p-5">
        <p className="text-xs font-semibold tracking-wider text-muted uppercase">{m.builder}</p>
        <h3 className="mt-1 text-xl font-semibold">{m.name}</h3>
        <p className="mt-1 text-sm text-ink/75">
          {[ft ? `${ft} ft` : null, m.cabins.length ? `${options(m.cabins)} cabins` : null, m.berthsMax ? `up to ${m.berthsMax} guests` : null].filter(Boolean).join(" · ")}
        </p>
        {from && <p className="mt-2 text-sm"><span className="text-muted">Estimated from</span> <span className="font-semibold">{from}</span> <span className="text-muted">/ week{productOf(m.id) === "crewed" ? ", with crew" : ""}</span></p>}
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">See the {m.name} <IconArrowRight className="h-4 w-4" /></span>
      </div>
    </Link>
  );
}

const KIND_TITLE: Record<HullKind, string> = { catamaran: "Catamarans", monohull: "Sailing yachts (monohulls)" };

export default async function Yachts({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await requireLocale(params);
  const db = await getDb();
  const [covers, views, currency, rates] = await Promise.all([modelCovers(db), destinationViews(db), displayCurrency(), getRates(db)]);
  const ranges = await estimateRanges(db, todayIso(), views.filter((v) => v.active).map((v) => v.id));
  const from = (id: string) => {
    const r = ranges[id];
    return r ? money(estimateIn(r.min, currency, rates), currency, locale) : null;
  };
  const all = FLEET_CLASSES.flatMap((c) => [...c.models, ...c.alternatives]);
  return (
    <div className="container-page py-14">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Nautical Nomads", path: `/${locale}` },
            { name: "Our yachts", path: "/en/yachts" },
          ]),
          { "@context": "https://schema.org", "@type": "ItemList", name: "Yachts we charter", itemListElement: all.map((id, i) => ({ "@type": "ListItem", position: i + 1, name: modelById(id)?.name ?? id, url: abs(modelPath(id)) })) },
        ]}
      />
      <p className="text-sm font-semibold tracking-wider text-sea uppercase">Our yachts</p>
      <h1 className="h-display mt-1 text-5xl">The catamarans and sailing yachts we charter</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink/75">Pick the model that suits your crew and we&apos;ll find the best available yacht of that model, or a close equal, for your week and destination. Every quote comes with the actual boat&apos;s photos, layout and year.</p>
      <p className="mt-2 max-w-2xl text-sm text-muted">Photos show the model. The yacht you charter is a specific boat: its own photos, layout, year and equipment come with your official quote.</p>
      <p className="mt-2 max-w-2xl text-sm text-muted">{ESTIMATE_NOTE}</p>

      {(["catamaran", "monohull"] as const).map((kind) => (
        <section key={kind} className="mt-14">
          <h2 className="h-display text-4xl">{KIND_TITLE[kind]}</h2>
          {/* Smallest to largest, three to a row. */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {all
              .map((id) => modelById(id))
              .filter((m): m is ModelSpecs => !!m && m.kind === kind)
              .sort((a, b) => (a.lengthOverallM ?? 0) - (b.lengthOverallM ?? 0) || a.name.localeCompare(b.name))
              .map((m) => (
                <Card key={m.id} m={m} cover={covers[m.id]} from={from(m.id)} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
