import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/cruising";
import { COURSE_SLUG, publishedLessons } from "@/lib/courses/navigation/outline";
import { DESTINATIONS } from "@/lib/domain/destinations";
import { LOCALES } from "@/lib/i18n/config";
import { LEGAL_DOCS } from "@/lib/legal/docs";

// Translated pages are listed once (English) with every language version as
// an alternate; English-only pages (cruising guides, legal) without them.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.SITE_URL ?? "https://nauticalnomads.com").replace(/\/$/, "");
  const now = new Date();
  const translated = ["", "/plan", "/destinations", "/how-it-works", "/about", "/contact", "/enquire", ...DESTINATIONS.map((d) => `/destinations/${d.id}`)];
  const englishOnly = ["/cruising", ...GUIDES.map((g) => `/cruising/${g.id}`), `/learn/${COURSE_SLUG}`, ...publishedLessons().map((l) => `/learn/${COURSE_SLUG}/${l.slug}`), ...Object.keys(LEGAL_DOCS).map((d) => `/legal/${d}`)];
  const priority = (p: string) => (p === "" ? 1 : p.startsWith("/destinations/") || p.startsWith("/cruising") || p.startsWith("/learn") ? 0.8 : p.startsWith("/legal") ? 0.2 : 0.6);
  return [
    ...translated.map((p) => ({
      url: `${base}/en${p}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: priority(p),
      alternates: { languages: { ...Object.fromEntries(LOCALES.map((l) => [l, `${base}/${l}${p}`])), "x-default": `${base}/en${p}` } },
    })),
    ...englishOnly.map((p) => ({ url: `${base}/en${p}`, lastModified: now, changeFrequency: "monthly" as const, priority: priority(p) })),
  ];
}
