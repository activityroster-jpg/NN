import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowRight, IconInfo } from "@/components/Icons";
import { PrintButton } from "@/components/cruising/PrintButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { HOWTO, howToById, SERIES, seriesOf } from "@/lib/cruising/howto";
import { abs, breadcrumbLd, pageMeta, snippet } from "@/lib/seo";
import { requireLocale } from "@/lib/request";

type Props = { params: Promise<{ locale: string; id: string }> };

export function generateStaticParams() {
  return HOWTO.map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const g = howToById(id);
  if (!g) return {};
  return pageMeta({ locale, path: `/cruising/how-to/${g.id}`, englishOnly: true, type: "article", title: g.title, description: snippet(`${g.summary} ${g.intro}`) });
}

export default async function HowToPage({ params }: Props) {
  const { id } = await params;
  const locale = await requireLocale(params.then((p) => ({ locale: p.locale })));
  const g = howToById(id);
  if (!g) notFound();
  const series = SERIES.find((s) => s.id === g.series)!;
  const siblings = seriesOf(g.series).filter((x) => x.id !== g.id);
  return (
    <div className="container-page max-w-3xl py-12 print:py-0">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Nautical Nomads", path: `/${locale}` },
            { name: "Cruising guides", path: "/en/cruising" },
            { name: g.title, path: `/en/cruising/how-to/${g.id}` },
          ]),
          { "@context": "https://schema.org", "@type": "Article", headline: g.title, description: g.summary, url: abs(`/en/cruising/how-to/${g.id}`), publisher: { "@type": "Organization", name: "Nautical Nomads" } },
        ]}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-muted print:hidden">
        <Link href={`/${locale}/cruising`} className="hover:underline">Cruising guides</Link> <span aria-hidden="true">›</span> {series.title}
      </nav>
      <p className="mt-4 text-sm font-semibold tracking-wider text-brand uppercase">Charter know-how · {series.title}</p>
      <h1 className="h-display mt-1 text-4xl sm:text-5xl">{g.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
        <span>{g.minutes} min read</span>
        <PrintButton />
      </div>
      <p className="mt-6 text-lg text-ink/80">{g.intro}</p>

      {g.sections.map((s) => (
        <section key={s.heading} className="mt-10 break-inside-avoid">
          <h2 className="h-display text-2xl sm:text-3xl">{s.heading}</h2>
          {s.text?.map((t) => (
            <p key={t.slice(0, 40)} className="mt-3 text-ink/85">{t}</p>
          ))}
          {s.list && (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-ink/85">
              {s.list.map((t) => (
                <li key={t.slice(0, 40)}>{t}</li>
              ))}
            </ul>
          )}
          {s.checklist && (
            <ul className="mt-3 space-y-2">
              {s.checklist.map((t) => (
                <li key={t.slice(0, 40)}>
                  <label className="flex cursor-pointer items-start gap-3 text-ink/85">
                    <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-brand" />
                    <span>{t}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {s.table && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs tracking-wide text-muted uppercase">
                    {s.table.head.map((h) => (
                      <th key={h} className="py-2 pr-4 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.table.rows.map((r) => (
                    <tr key={r[0]} className="border-b border-line">
                      {r.map((c, i) => (
                        <td key={i} className={`py-2 pr-4 align-top ${i === 0 ? "font-medium" : "text-ink/80"}`}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {s.tip && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand-soft px-4 py-3 text-sm">
              <IconInfo className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>{s.tip}</span>
            </p>
          )}
        </section>
      ))}

      <p className="mt-10 text-xs text-muted">General guidance for charter crews. Your charter company&apos;s briefing, the boat&apos;s own manuals and local rules always come first.</p>

      <aside className="mt-10 grid gap-6 border-t border-line pt-8 sm:grid-cols-2 print:hidden">
        {g.related && g.related.length > 0 && (
          <div>
            <h2 className="font-semibold">Related</h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {g.related.map((r) => (
                <li key={r.path}>
                  <Link href={`/${locale}${r.path}`} className="text-brand hover:underline">{r.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {siblings.length > 0 && (
          <div>
            <h2 className="font-semibold">More in {series.title}</h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {siblings.map((x) => (
                <li key={x.id}>
                  <Link href={`/${locale}/cruising/how-to/${x.id}`} className="text-brand hover:underline">{x.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
      <p className="mt-10 print:hidden">
        <Link href={`/${locale}/plan`} className="btn-primary">Plan your charter <IconArrowRight className="h-4 w-4" /></Link>
      </p>
    </div>
  );
}
