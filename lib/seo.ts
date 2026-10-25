import type { Metadata } from "next";
import { COMPANY, SOCIAL_LINKS } from "@/lib/brand";
import { LOCALES } from "@/lib/i18n/config";

// One place for search metadata: the page's own canonical address, its
// language versions (hreflang, with English as x-default), social share
// cards, and the site-wide structured data.

export const SITE_URL = (process.env.SITE_URL ?? "https://nauticalnomads.com").replace(/\/$/, "");
export const DEFAULT_SHARE_IMAGE = "/og/default.jpg";

export interface PageMetaInput {
  locale: string;
  /** Path after the locale, starting with "/" ("" for the home page). */
  path: string;
  title?: string;
  /** Use the title exactly, without the " · Nautical Nomads" suffix. */
  absoluteTitle?: boolean;
  description?: string;
  /** Absolute or site-relative image for share cards (1200×630 ideally). */
  image?: string;
  /** Content only exists in English: every language version points to /en. */
  englishOnly?: boolean;
  noindex?: boolean;
  type?: "website" | "article";
}

export function pageMeta(p: PageMetaInput): Metadata {
  const canonical = p.englishOnly ? `/en${p.path}` : `/${p.locale}${p.path}`;
  const languages = p.englishOnly
    ? { en: `/en${p.path}`, "x-default": `/en${p.path}` }
    : { ...Object.fromEntries(LOCALES.map((l) => [l, `/${l}${p.path}`])), "x-default": `/en${p.path}` };
  const images = [{ url: p.image ?? DEFAULT_SHARE_IMAGE, width: 1200, height: 630 }];
  return {
    ...(p.title ? { title: p.absoluteTitle ? { absolute: p.title } : p.title } : {}),
    ...(p.description ? { description: p.description } : {}),
    alternates: { canonical, languages },
    openGraph: {
      siteName: COMPANY.tradingName,
      type: p.type ?? "website",
      locale: p.locale,
      url: canonical,
      ...(p.title ? { title: p.title } : {}),
      ...(p.description ? { description: p.description } : {}),
      images,
    },
    twitter: { card: "summary_large_image", ...(p.title ? { title: p.title } : {}), ...(p.description ? { description: p.description } : {}), images: images.map((i) => i.url) },
    ...(p.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** "Yacht charter <place>" in each language, the way people search for it. */
export function charterTitle(locale: string, place: string, region: string): string {
  switch (locale) {
    case "de": return `Yachtcharter ${place}: ${region}`;
    case "fr": return `Location de voilier ${place} : ${region}`;
    case "it": return `Noleggio barche a vela ${place}: ${region}`;
    case "es": return `Alquiler de veleros en ${place}: ${region}`;
    case "nl": return `Zeilboot huren ${place}: ${region}`;
    default: return `${place} yacht charter: ${region}`;
  }
}

/** Trim to a search-snippet length on a word boundary. */
export function snippet(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);

/** The business, on every page. */
export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${SITE_URL}/#organization`,
    name: COMPANY.tradingName,
    legalName: COMPANY.legalName,
    url: SITE_URL,
    logo: abs("/icon.svg"),
    image: abs(DEFAULT_SHARE_IMAGE),
    email: COMPANY.email,
    address: { "@type": "PostalAddress", streetAddress: "71-75 Shelton Street", addressLocality: "London", postalCode: "WC2H 9JQ", addressCountry: "GB" },
    sameAs: SOCIAL_LINKS.map((s) => s.href).filter(Boolean),
    description: "Yacht charter agency: sailing yachts and catamarans in Croatia, Greece, Italy, the British Virgin Islands and beyond, with or without a skipper.",
  };
}

export function websiteLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: COMPANY.tradingName,
    inLanguage: locale,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}
