import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getDictionary } from "@/lib/i18n";
import { LOCALES } from "@/lib/i18n/config";
import { displayCurrency, requireLocale } from "@/lib/request";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await requireLocale(params);
  const t = getDictionary(locale);
  return {
    title: { default: `${t.meta.siteName} · ${t.meta.tagline}`, template: `%s · ${t.meta.siteName}` },
    description: t.meta.description,
    openGraph: { siteName: t.meta.siteName, type: "website", locale },
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])) },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const locale = await requireLocale(params);
  const t = getDictionary(locale);
  const currency = await displayCurrency();
  return (
    <div className="flex min-h-dvh flex-col">
      <Header locale={locale} t={t} currency={currency} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer locale={locale} t={t} />
    </div>
  );
}
