import type { Metadata } from "next";
import { COMPANY } from "@/lib/brand";
import { getDictionary } from "@/lib/i18n";
import { requireLocale } from "@/lib/request";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = getDictionary(await requireLocale(params));
  return { title: t.about.title };
}

export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const t = getDictionary(await requireLocale(params));
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="h-display text-5xl">{t.about.title}</h1>
      <p className="mt-6 text-lg leading-relaxed text-ink/85">{t.about.text1}</p>
      <p className="mt-4 text-lg leading-relaxed text-ink/85">{t.about.text2}</p>
      <section className="card mt-10 p-6">
        <h2 className="font-semibold">{t.about.companyTitle}</h2>
        <p className="mt-2 text-sm text-ink/80">
          {COMPANY.tradingName} · {COMPANY.legalName}
          <br />
          {COMPANY.jurisdiction} · No. {COMPANY.number}
          <br />
          {COMPANY.address}
          <br />
          <a className="text-brand underline" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        </p>
      </section>
    </div>
  );
}
