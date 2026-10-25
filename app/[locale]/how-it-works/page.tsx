import type { Metadata } from "next";
import { pageMeta, snippet } from "@/lib/seo";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { DESTINATIONS } from "@/lib/domain/destinations";
import { getDictionary } from "@/lib/i18n";
import { requireLocale } from "@/lib/request";
import { destinationName } from "@/lib/services/labels";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await requireLocale(params);
  const t = getDictionary(locale);
  return pageMeta({ locale, path: "/how-it-works", title: t.how.title, description: snippet(`${t.how.sub} ${t.how.s1Text}`) });
}

export default async function HowItWorks({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await requireLocale(params);
  const t = getDictionary(locale);
  const sections = [
    [t.how.s1Title, t.how.s1Text],
    [t.how.s2Title, t.how.s2Text],
    [t.how.s3Title, t.how.s3Text],
    [t.how.s4Title, t.how.s4Text],
    [t.how.s5Title, t.how.s5Text],
    [t.how.s6Title, t.how.s6Text],
  ];
  return (
    <div className="container-page max-w-3xl py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: locale,
          mainEntity: sections.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
        }}
      />
      <h1 className="h-display text-5xl">{t.how.title}</h1>
      <p className="mt-3 text-lg text-ink/75">{t.how.sub}</p>
      <div className="mt-10 space-y-8">
        {sections.map(([title, text], i) => (
          <section key={i} className="flex gap-5">
            <span className="h-display mt-1 text-3xl text-accent">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-2 leading-relaxed text-ink/85">{text}</p>
            </div>
          </section>
        ))}
      </div>
      <section className="mt-14">
        <h2 className="h-display text-3xl">{t.how.licenceTitle}</h2>
        <dl className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
          {DESTINATIONS.filter((d) => d.featured).map((d) => (
            <div key={d.id} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
              <dt className="font-semibold">{destinationName(t, d.id)}</dt>
              <dd className="text-sm text-ink/80">{t.licence[d.licenceRule]}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-ink/75">{t.licence.noLicence}</p>
      </section>
      <section className="mt-14">
        <h2 className="h-display text-3xl">{t.how.faqTitle}</h2>
        <div className="mt-4 space-y-3">
          {t.how.faq.map((f) => (
            <details key={f.q} className="card group p-4">
              <summary className="cursor-pointer list-none font-semibold">{f.q}</summary>
              <p className="mt-2 text-ink/80">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      <div className="mt-12 flex flex-wrap gap-3">
        <Link href={`/${locale}/plan`} className="btn-primary">{t.nav.plan}</Link>
        <Link href={`/${locale}/enquire`} className="btn-secondary">{t.nav.enquire}</Link>
      </div>
    </div>
  );
}
