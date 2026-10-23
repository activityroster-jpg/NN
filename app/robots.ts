import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.SITE_URL ?? "https://nauticalnomads.com";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/*/booking/", "/*/book/", "/*/brand-options"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
