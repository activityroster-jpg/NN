import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModelPhoto, PHOTO_NOTE } from "@/components/fleet/ModelPhoto";
import { IconArrowRight, IconBed, IconInfo, IconRuler, IconShower, IconUsers } from "@/components/Icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { getDb } from "@/lib/db";
import { DESTINATION_IDS } from "@/lib/domain/destinations";
import { classOf, feet, fleetPath, MODELS, modelById, modelPath, options, similarTo } from "@/lib/fleet";
import { getDictionary } from "@/lib/i18n";
import { modelCovers, modelPhotos } from "@/lib/photos/slots";
import { abs, breadcrumbLd, pageMeta, snippet } from "@/lib/seo";
import { requireLocale } from "@/lib/request";

type Props = { params: Promise<{ locale: string; id: string }> };

const m1 = (n: number | null, unit = "m") => (n == null ? "–" : `${n.toLocaleString("en-GB", { maximumFractionDigits: 2 })} ${unit}`);
const withFt = (n: number | null) => (n == null ? "–" : `${m1(n)} (${feet(n)} ft)`);

function intro(id: string): string {
  const m = modelById(id)!;
  const c = classOf(id);
  const kind = m.kind === "catamaran" ? "catamaran" : "sailing yacht";
  const size = feet(m.lengthOverallM);
  const parts = [`The ${m.name} is a ${size ? `${size}-foot ` : ""}${kind} from ${m.builder}${m.launched ? `, launched in ${m.launched}` : ""}.`];
  if (m.cabins.length) parts.push(`Charter boats come with ${options(m.cabins)} cabins${m.heads.length ? ` and ${options(m.heads)} heads` : ""}${m.berthsMax ? `, sleeping up to ${m.berthsMax}` : ""}.`);
  if (c) parts.push(c.blurb);
  return parts.join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: l, id } = await params;
  const locale = await requireLocale(Promise.resolve({ locale: l }));
  const m = modelById(id);
  if (!m) return {};
  return pageMeta({ locale, path: `/yachts/${id}`, englishOnly: true, title: `${m.name} charter: cabins, layout and specifications`, description: snippet(intro(id)) });
}

export function generateStaticParams() {
  return MODELS.map((m) => ({ id: m.id }));
}

export default async function ModelPage({ params }: Props) {
  const { locale: l, id } = await params;
  const locale = await requireLocale(Promise.resolve({ locale: l }));
  const m = modelById(id);
  if (!m) notFound();
  const t = getDictionary(locale);
  const db = await getDb();
  const [photos, covers] = await Promise.all([modelPhotos(db, id), modelCovers(db)]);
  const similar = similarTo(id);
  const c = classOf(id);
  const isAlternative = !!c?.alternatives.includes(id);
  const ft = feet(m.lengthOverallM);
  const rows: [string, string][] = [
    ["Length overall", withFt(m.lengthOverallM)],
    ["Hull length", withFt(m.hullLengthM)],
    ["Beam", withFt(m.beamM)],
    ["Draft", m1(m.draftM)],
    ["Displacement", m.displacementKg == null ? "–" : `${Math.round(m.displacementKg).toLocaleString("en-GB")} kg`],
    ["Engine", m.engineHp == null ? "–" : `${m.engines && m.engines > 1 ? `${m.engines} × ` : ""}${m.engineHp} hp`],
    ["Fuel", m1(m.fuelL, "litres")],
    ["Water", m1(m.waterL, "litres")],
    ["Cabins", m.cabins.length ? options(m.cabins) : "–"],
    ["Heads (bathrooms)", m.heads.length ? options(m.heads) : "–"],
    ["Berths, up to", m.berthsMax == null ? "–" : String(m.berthsMax)],
    ["Designer", m.designer ?? "–"],
  ];

  return (
    <div className="container-page py-12">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Nautical Nomads", path: `/${locale}` },
            { name: "Our yachts", path: fleetPath },
            { name: m.name, path: modelPath(id) },
          ]),
          { "@context": "https://schema.org", "@type": "Product", name: m.name, brand: { "@type": "Brand", name: m.builder }, category: m.kind === "catamaran" ? "Sailing catamaran charter" : "Sailing yacht charter", description: intro(id), url: abs(modelPath(id)), ...(photos[0] ? { image: abs(photos[0].url) } : {}) },
        ]}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href={fleetPath} className="hover:underline">Our yachts</Link> <span aria-hidden="true">›</span> {c?.title ?? m.builder}
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div>
          {photos.length > 0 ? (
            <div className="grid gap-2">
              <ModelPhoto url={photos[0]!.url} kind={m.kind} alt={`${m.name}, builder's photo`} className="aspect-[16/10] w-full rounded-2xl" />
              {photos.length > 1 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.slice(1).map((p) => (
                    <ModelPhoto key={p.url} url={p.url} kind={m.kind} alt={`${m.name}, builder's photo`} className="aspect-[4/3] w-full rounded-xl" />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl bg-surface-2">
              <ModelPhoto kind={m.kind} alt="" className="aspect-[16/10] w-full" />
              <p className="absolute right-3 bottom-3 left-3 rounded-lg bg-card/90 px-3 py-2 text-sm text-ink/80">The builder&apos;s photos of the {m.name} are on their way. Ask us and we&apos;ll send photos of the actual yacht with your quote.</p>
            </div>
          )}
          <p className="mt-3 flex items-start gap-2 text-sm text-muted">
            <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{PHOTO_NOTE}{photos.some((p) => p.credit) ? ` Photos: ${[...new Set(photos.map((p) => p.credit).filter(Boolean))].join(", ")}.` : ""}</span>
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold tracking-wider text-sea uppercase">{m.builder} · {m.kind === "catamaran" ? "Catamaran" : "Sailing yacht"}</p>
          <h1 className="h-display mt-1 text-5xl">{m.name}</h1>
          <ul className="mt-5 grid grid-cols-2 gap-3 text-sm">
            {ft && <li className="flex items-center gap-2"><IconRuler className="h-5 w-5 text-sea" /> {ft} ft</li>}
            {m.cabins.length > 0 && <li className="flex items-center gap-2"><IconBed className="h-5 w-5 text-sea" /> {options(m.cabins)} cabins</li>}
            {m.heads.length > 0 && <li className="flex items-center gap-2"><IconShower className="h-5 w-5 text-sea" /> {options(m.heads)} heads</li>}
            {m.berthsMax && <li className="flex items-center gap-2"><IconUsers className="h-5 w-5 text-sea" /> up to {m.berthsMax} guests</li>}
          </ul>
          <p className="mt-5 text-ink/80">{intro(id)}</p>
          {isAlternative && <p className="mt-3 text-sm text-muted">We offer the {m.name} as an equal to the {c!.models.map((x) => modelById(x)?.name ?? x).join(" or ")} when those are taken.</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/${locale}/enquire?model=${id}`} className="btn-primary">Ask for a quote <IconArrowRight className="h-4 w-4" /></Link>
            {m.builderUrl && <a href={m.builderUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">{m.builder}&apos;s page</a>}
          </div>
          <p className="mt-3 text-xs text-muted">Free and without obligation. We reply within a day with available yachts, their photos and layouts, and the full price.</p>
        </div>
      </div>

      <section className="mt-14 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="h-display text-3xl">Specifications</h2>
          <table className="mt-4 w-full text-left text-sm">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k} className="border-t border-line">
                  <th className="py-2 pr-4 font-medium text-muted">{k}</th>
                  <td className="py-2">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">Builder&apos;s figures. Charter yachts differ by year and layout{m.notes ? `; ${m.notes.replace(/\.$/, "")}` : ""}. The quote gives the exact yacht&apos;s details.</p>
        </div>
        <div>
          <h2 className="h-display text-3xl">Where to sail it</h2>
          <p className="mt-2 text-ink/75">We charter this model, or its equal, in all our destinations, subject to availability:</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {DESTINATION_IDS.map((d) => (
              <li key={d}>
                <Link href={`/${locale}/destinations/${d}`} className="inline-block rounded-full border border-line bg-card px-3 py-1.5 text-sm hover:border-brand">{t.destinations[d as keyof typeof t.destinations]?.name ?? d}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="h-display text-3xl">Similar yachts</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <Link key={s.id} href={modelPath(s.id)} className="card overflow-hidden transition hover:shadow-md">
                <ModelPhoto url={covers[s.id]} kind={s.kind} alt={s.name} className="aspect-[16/10] w-full" />
                <div className="p-4">
                  <p className="text-xs font-semibold tracking-wider text-muted uppercase">{s.builder}</p>
                  <p className="font-semibold">{s.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="mt-14 text-sm">
        <Link href={fleetPath} className="font-semibold text-brand hover:underline">All our yachts</Link>
      </p>
    </div>
  );
}
