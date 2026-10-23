import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { dateLong } from "@/lib/i18n/format";
import { LEGAL_DOCS } from "@/lib/legal/docs";
import { requireLocale } from "@/lib/request";

type Props = { params: Promise<{ locale: string; doc: string }> };

export function generateStaticParams() {
  return Object.keys(LEGAL_DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { doc } = await params;
  const d = LEGAL_DOCS[doc as keyof typeof LEGAL_DOCS];
  return d ? { title: d.title } : {};
}

export default async function LegalPage({ params }: Props) {
  const { doc } = await params;
  const locale = await requireLocale(params.then((p) => ({ locale: p.locale })));
  const t = getDictionary(locale);
  const d = LEGAL_DOCS[doc as keyof typeof LEGAL_DOCS];
  if (!d) notFound();
  return (
    <article lang="en" className="container-page max-w-3xl py-12">
      <h1 className="h-display text-5xl">{d.title}</h1>
      <p className="mt-2 text-sm text-muted">{dateLong(d.updated, locale)}</p>
      {locale !== "en" && <p className="mt-4 rounded-xl bg-surface-2/70 p-3 text-sm">{t.legal.englishOnly}</p>}
      <div className="prose-nn mt-8">
        {d.sections.map((s, i) => (
          <section key={i}>
            {s.heading && <h2>{s.heading}</h2>}
            {s.paragraphs?.map((p, j) => <p key={j}>{p}</p>)}
            {s.bullets && <ul>{s.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
          </section>
        ))}
      </div>
    </article>
  );
}
