import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GuideVideo from "@/components/cruising/GuideVideo";
import { guideById, REGIONS, totalMiles } from "@/lib/cruising";
import { voiceEnabled } from "@/lib/cruising/voice";
import { getEnvAsync } from "@/lib/env";
import { monthName } from "@/lib/i18n/format";
import { requireLocale } from "@/lib/request";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = guideById((await params).id);
  if (!g) return {};
  return { title: `${g.name} sailing guide: a week from ${g.baseMarina.name}`, description: g.intro.slice(0, 155) };
}

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const KIND = { marina: "Marina", "town quay": "Town quay", buoys: "Buoys", anchorage: "Anchorage" } as const;

function Tick({ ok }: { ok: boolean }) {
  return ok ? <span className="font-bold text-ok" aria-label="Yes">✓</span> : <span className="text-muted" aria-label="No">–</span>;
}

export default async function GuidePage({ params }: Props) {
  const { id } = await params;
  const locale = await requireLocale(params.then((p) => ({ locale: p.locale })));
  const g = guideById(id);
  if (!g) notFound();
  const region = REGIONS.find((r) => r.id === g.region)?.name;
  return (
    <div className="container-page py-12">
      <nav className="text-sm text-muted">
        <Link href={`/${locale}/cruising`} className="hover:underline">Cruising guides</Link> · {region}
      </nav>
      <h1 className="h-display mt-3 text-5xl">{g.name}</h1>
      <p className="mt-2 text-lg text-ink/80">{g.country} · a week from {g.baseMarina.name} · about {totalMiles(g)} nautical miles</p>

      <div className="mt-8">
        <GuideVideo guide={g} recorded={voiceEnabled(await getEnvAsync())} />
      </div>

      <div id="guide-notes" className="mt-12 grid gap-12 lg:grid-cols-[1fr_320px]">
        <div className="space-y-12">
          <section>
            <p className="text-lg leading-relaxed text-ink/85">{g.intro}</p>
          </section>

          <section>
            <h2 className="h-display text-3xl">Where the charter boats are</h2>
            <p className="mt-4 text-ink/85">{g.baseMarina.note}</p>
            <p className="mt-3 text-sm text-ink/75"><strong>Main bases:</strong> {g.baseMarina.name}{g.baseMarina.alsoMain ? ` and ${g.baseMarina.alsoMain.name}` : ""}. <strong>Marinas:</strong> {g.baseMarina.others.join(" · ")}</p>
          </section>

          <section>
            <h2 className="h-display text-3xl">When to go</h2>
            <div className="mt-5 grid grid-cols-12 gap-1" aria-hidden="true">
              {g.months.map((m, i) => (
                <div key={i} className="text-center">
                  <div className={`h-3 rounded-full ${m === "best" ? "bg-[#f2b49c]" : m === "peak" ? "bg-brand" : m === "shoulder" ? "bg-[#a7b9c7]" : "bg-line"}`} />
                  <span className="mt-1 block text-[11px] text-muted">{monthName(i + 1, locale, "short")}</span>
                </div>
              ))}
            </div>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-ink/85">{g.seasons.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>

          <section>
            <h2 className="h-display text-3xl">Weather</h2>
            <p className="mt-4 text-ink/85">{g.weather.summary}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {g.weather.winds.map((w) => (
                <div key={w.name} className="card p-4">
                  <p className="font-semibold">{w.name}</p>
                  <p className="text-xs text-muted">from the {w.from}</p>
                  <p className="mt-2 text-sm text-ink/80">{w.note}</p>
                </div>
              ))}
            </div>
            <h3 className="mt-6 font-semibold">Forecasts</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/80">
              {g.weather.forecasts.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <p className="mt-4 text-sm text-ink/80"><strong>Sea temperature:</strong> {g.weather.seaTemp}</p>
          </section>

          <section>
            <h2 className="h-display text-3xl">Where you moor</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {g.mooring.map((m) => (
                <div key={m.kind} className="card p-4">
                  <p className="font-semibold capitalize">{m.kind}</p>
                  <p className="mt-1 text-sm text-ink/80">{m.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="h-display text-3xl">Filling up: water, power and fuel</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs tracking-wider text-muted uppercase">
                  <tr className="border-b border-line">
                    <th className="py-2 pr-3">Port</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3 text-center">Water</th>
                    <th className="py-2 pr-3 text-center">Power</th>
                    <th className="py-2 pr-3 text-center">Fuel</th>
                    <th className="py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {g.ports.map((p) => (
                    <tr key={p.name} className="border-b border-line/70 align-top">
                      <td className="py-3 pr-3 font-semibold">{p.name}</td>
                      <td className="py-3 pr-3">{KIND[p.kind]}</td>
                      <td className="py-3 pr-3 text-center"><Tick ok={p.water} /></td>
                      <td className="py-3 pr-3 text-center"><Tick ok={p.power} /></td>
                      <td className="py-3 pr-3 text-center"><Tick ok={p.fuel} /></td>
                      <td className="py-3 text-ink/80">{p.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="h-display text-3xl">A sample week</h2>
            <p className="mt-4 text-ink/85"><strong>Saturday:</strong> {g.arrival}</p>
            <ol className="mt-5 space-y-4">
              {g.legs.map((l) => (
                <li key={l.day} className="card p-5">
                  <p className="text-xs font-semibold tracking-wider text-brand uppercase">{WEEKDAY[l.day - 1]} · about {l.nm} nm</p>
                  <h3 className="mt-1 text-xl font-semibold">{l.from} → {l.to}</h3>
                  <p className="mt-2 text-ink/85">{l.summary}</p>
                  {l.stop && <p className="mt-2 text-sm text-ink/75"><strong>On the way:</strong> {l.stop}</p>}
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink/85">{l.todo.map((x) => <li key={x}>{x}</li>)}</ul>
                  <p className="mt-2 text-sm text-ink/75"><strong>Overnight:</strong> {l.overnight}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-ink/85"><strong>Friday evening and Saturday:</strong> {g.departure}</p>
          </section>

          <section>
            <h2 className="h-display text-3xl">Navigation and mooring</h2>
            <ul className="mt-5 list-disc space-y-2 pl-5 text-ink/85">
              {g.navigation.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="h-display text-2xl">Provisioning</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink/80">{g.provisioning.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <div>
              <h2 className="h-display text-2xl">Rules and fees</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink/80">{g.rules.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          </section>

          <p className="rounded-xl bg-surface-2 p-4 text-xs text-muted">
            A planning guide, not a navigational publication. Maps are simplified and distances approximate. Always use official charts, the current pilot book, local notices and the latest forecast, and follow your charter company&apos;s briefing.
          </p>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <p className="text-xs font-semibold tracking-wider text-muted uppercase">Best months</p>
            <p className="mt-1">{g.bestMonths.map((m) => monthName(m, locale)).join(", ")}</p>
            <p className="mt-4 text-xs font-semibold tracking-wider text-muted uppercase">Distance</p>
            <p className="mt-1">About {totalMiles(g)} nm, Sunday to Friday</p>
            <p className="mt-4 text-xs font-semibold tracking-wider text-muted uppercase">Base</p>
            <p className="mt-1">{g.baseMarina.name}</p>
            {g.destinationId && (
              <Link href={`/${locale}/plan?d=${g.destinationId}`} className="btn-primary mt-5 w-full">Plan this week</Link>
            )}
            <Link href={`/${locale}/enquire${g.destinationId ? `?d=${g.destinationId}` : ""}`} className="btn-secondary mt-2 w-full">Ask us</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
