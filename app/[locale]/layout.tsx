import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getDictionary } from "@/lib/i18n";
import { JsonLd } from "@/components/seo/JsonLd";
import { DEFAULT_SHARE_IMAGE, organizationLd, websiteLd } from "@/lib/seo";
import { displayCurrency, requireLocale } from "@/lib/request";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await requireLocale(params);
  const t = getDictionary(locale);
  return {
    title: { default: `${t.meta.siteName} · ${t.meta.tagline}`, template: `%s · ${t.meta.siteName}` },
    description: t.meta.description,
    // Each page sets its own canonical address and language versions (lib/seo.ts).
    openGraph: { siteName: t.meta.siteName, type: "website", locale, images: [{ url: DEFAULT_SHARE_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [DEFAULT_SHARE_IMAGE] },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const locale = await requireLocale(params);
  const t = getDictionary(locale);
  const currency = await displayCurrency();
  return (
    <div className="flex min-h-dvh flex-col">
      <JsonLd data={[organizationLd(), websiteLd(locale)]} />
      <Header locale={locale} t={t} currency={currency} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer locale={locale} t={t} />
    </div>
  );
}
