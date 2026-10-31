import { modelById } from "@/lib/fleet";
import type { Metadata } from "next";
import { pageMeta, snippet } from "@/lib/seo";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { DESTINATION_IDS } from "@/lib/domain/destinations";
import { isIsoDate } from "@/lib/domain/dates";
import { getDictionary } from "@/lib/i18n";
import { displayCurrency, requireLocale } from "@/lib/request";
import { getDb } from "@/lib/db";
import { getRates } from "@/lib/fx";
import { fmt, money } from "@/lib/i18n/format";
import { estimateIn, estimatesForWeek, isSaturday } from "@/lib/pricing";
import { destinationOptions, enquiryText } from "@/lib/services/labels";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await requireLocale(params);
  const t = getDictionary(locale);
  return pageMeta({ locale, path: "/enquire", title: t.enquiry.title, description: snippet(t.enquiry.sub) });
}

export default async function Enquire({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const locale = await requireLocale(params);
  const sp = await searchParams;
  const t = getDictionary(locale);
  // From a model page (?model=) or the planner (?models=a,b,c).
  const picked = [...new Set([sp.model, ...(sp.models ?? "").split(",")].filter((x): x is string => !!x))]
    .map((id) => modelById(id))
    .filter((m) => !!m)
    .slice(0, 3);
  const g = Number(sp.g);
  const currency = await displayCurrency();
  // Estimates for the chosen yachts when the planner passed a destination and week.
  let estimates: { name: string; price: string | null }[] = [];
  if (picked.length && sp.d && DESTINATION_IDS.includes(sp.d) && sp.w && isSaturday(sp.w)) {
    const db = await getDb();
    const [eur, rates] = await Promise.all([estimatesForWeek(db, sp.d, sp.w), getRates(db)]);
    estimates = picked.map((m) => ({ name: m!.name, price: eur[m!.id] == null ? null : money(estimateIn(eur[m!.id]!, currency, rates), currency, locale) }));
  }
  const priced = estimates.filter((e) => e.price);
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="h-display text-5xl">{t.enquiry.title}</h1>
      <p className="mt-3 mb-8 text-lg text-ink/75">{t.enquiry.sub}</p>
      {picked.length > 0 && (
        <p className="-mt-4 mb-8 rounded-xl border border-line bg-card px-4 py-3 text-sm">
          {t.enquiry.yachtsChosen}: <strong>{picked.map((m) => m!.name).join(", ")}</strong>
        </p>
      )}
      {priced.length > 0 && (
        <div className="-mt-4 mb-8 rounded-xl bg-brand-soft px-4 py-3 text-sm">
          <p className="font-semibold">{t.enquiry.estimateTitle}</p>
          <ul className="mt-1 space-y-0.5">
            {priced.map((e) => (
              <li key={e.name}>
                {e.name}: <strong>{fmt(t.enquiry.estimatePerWeek, { price: e.price! })}</strong>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">{t.enquiry.estimateNote}</p>
        </div>
      )}
      <EnquiryForm
        text={enquiryText(t)}
        destinations={destinationOptions(t, DESTINATION_IDS)}
        locale={locale}
        currency={currency}
        defaults={{
          destinationId: sp.d && DESTINATION_IDS.includes(sp.d) ? sp.d : undefined,
          weekStart: sp.w && isIsoDate(sp.w) ? sp.w : undefined,
          yachtKey: picked.length ? `models:${picked.map((m) => m!.id).join(",")}` : undefined,
          guests: Number.isInteger(g) && g > 0 && g <= 30 ? g : undefined,
          skipper: sp.s === "yes" || sp.s === "no" || sp.s === "unsure" ? sp.s : undefined,
          chef: sp.c === "1",
          sourcePath: `/${locale}/enquire`,
        }}
      />
    </div>
  );
}
