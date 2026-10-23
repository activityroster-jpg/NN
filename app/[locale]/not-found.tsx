import Link from "next/link";
import { headers } from "next/headers";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";

export default async function NotFound() {
  const l = (await headers()).get("x-nn-locale");
  const locale = isLocale(l) ? l : DEFAULT_LOCALE;
  const t = getDictionary(locale);
  return (
    <div className="container-page py-24 text-center">
      <h1 className="h-display text-4xl">{t.errors.notFoundTitle}</h1>
      <p className="mt-3 text-ink/75">{t.errors.notFoundText}</p>
      <Link href={`/${locale}`} className="btn-primary mt-8">{t.errors.home}</Link>
    </div>
  );
}
