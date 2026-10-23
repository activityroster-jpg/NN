import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowRight, IconCalendar, IconCheck, IconHelm, IconPin } from "@/components/Icons";
import { getDb } from "@/lib/db";
import { saturdays } from "@/lib/domain/dates";
import { destinationById } from "@/lib/domain/destinations";
import { getDictionary, type Dictionary } from "@/lib/i18n";
import { dateShort, monthName } from "@/lib/i18n/format";
import { requireLocale, todayIso } from "@/lib/request";
import { destinationView } from "@/lib/services/destination-settings";

type Props = { params: Promise<{ locale: string; id: string }> };
type DestKey = keyof Dictionary["destinations"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: l, id } = await params;
  const t = getDictionary(await requireLocale(Promise.resolve({ locale: l })));
  const c = t.destinations[id as DestKey];
  if (!c) return {};
  return { title: `${c.name} yacht charter`, description: c.intro.slice(0, 155) };
}

export default async function DestinationPage({ params }: Props) {
  const { id } = await params;
  const locale = await requireLocale(params.then((p) => ({ locale: p.locale })));
  const t = getDictionary(locale);
  const def = destinationById(id);
  const d = def ? await destinationView(await getDb(), id) : undefined;
  if (!def || !d || !d.active) notFound();
  const c = t.destinations[id as DestKey];
  // Next few in-season Saturdays as quick starts.
  const quick = saturdays(todayIso(), 60).filter((s) => def.seasonMonths.includes(Number(s.slice(5, 7)))).slice(0, 6);
  return (
    <>
      <section className="relative overflow-hidden text-white" style={d.heroImageUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.35)),url(${d.heroImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: def.heroGradient }}>
        <div className="container-page py-20 sm:py-28">
          <p className="text-sm font-semibold tracking-wider uppercase opacity-85">{c.region}</p>
          <h1 className="h-display mt-2 text-5xl sm:text-6xl">{c.name}</h1>
          <p className="mt-3 max-w-xl text-lg opacity-95">{c.tagline}</p>
          <Link href={`/${locale}/plan?d=${id}`} className="btn mt-8 bg-white text-ink hover:bg-white/90">
            {t.nav.plan} <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_340px]">
        <div>
          <p className="text-lg leading-relaxed text-ink/85">{c.intro}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {c.highlights.map((h) => (
              <li key={h} className="card flex items-center gap-3 p-4"><IconCheck className="h-5 w-5 shrink-0 text-ok" />{h}</li>
            ))}
          </ul>
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
          <div className="mt-6 card p-5">
            <h2 className="flex items-center gap-2 font-semibold"><IconPin className="h-5 w-5 text-sea" />{t.common.base}</h2>
            <p className="mt-2 text-sm text-ink/80">{def.bases.join(" · ")}</p>
          </div>
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
