import type { MetadataRoute } from "next";
import { DESTINATIONS } from "@/lib/domain/destinations";
import { LOCALES } from "@/lib/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL ?? "https://nauticalnomads.com";
  const paths = ["", "/plan", "/destinations", "/how-it-works", "/about", "/contact", "/enquire", ...DESTINATIONS.map((d) => `/destinations/${d.id}`)];
  return paths.map((p) => ({
    url: `${base}/en${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : p.startsWith("/destinations/") ? 0.8 : 0.6,
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `${base}/${l}${p}`])) },
  }));
}
