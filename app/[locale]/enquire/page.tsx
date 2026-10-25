import type { Metadata } from "next";
import { pageMeta, snippet } from "@/lib/seo";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { DESTINATION_IDS } from "@/lib/domain/destinations";
import { isIsoDate } from "@/lib/domain/dates";
import { getDictionary } from "@/lib/i18n";
import { displayCurrency, requireLocale } from "@/lib/request";
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
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="h-display text-5xl">{t.enquiry.title}</h1>
      <p className="mt-3 mb-8 text-lg text-ink/75">{t.enquiry.sub}</p>
      <EnquiryForm
        text={enquiryText(t)}
        destinations={destinationOptions(t, DESTINATION_IDS)}
        locale={locale}
        currency={await displayCurrency()}
        defaults={{
          destinationId: sp.d && DESTINATION_IDS.includes(sp.d) ? sp.d : undefined,
          weekStart: sp.w && isIsoDate(sp.w) ? sp.w : undefined,
          sourcePath: `/${locale}/enquire`,
        }}
      />
    </div>
  );
}
