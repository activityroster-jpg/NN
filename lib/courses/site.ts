// Everything that ties the course engine (ported from the Boaty Jobs
// navigation course) to this website. Plain values live in site-config.ts
// so browser code can import them without the page helpers.

export { SITE_URL, abs as absUrl, breadcrumbLd } from "@/lib/seo";
export { JsonLd } from "@/components/seo/JsonLd";
export { SITE_NAME, STORAGE_PREFIX } from "./site-config";

export interface FaqEntry {
  q: string;
  a: string;
}

export function faqPageLd(faqs: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
