import Link from "next/link";
import { Logo } from "@/components/Logo";
import type { Currency } from "@/lib/domain/types";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { MobileMenu } from "./MobileMenu";
import { CurrencySwitcher, LocaleSwitcher } from "./Switchers";

export function Header({ locale, t, currency }: { locale: Locale; t: Dictionary; currency: Currency }) {
  const links = [
    { href: `/${locale}/destinations`, label: t.nav.destinations },
    { href: `/${locale}/how-it-works`, label: t.nav.howItWorks },
    { href: `/${locale}/about`, label: t.nav.about },
    { href: `/${locale}/enquire`, label: t.nav.enquire },
  ];
  const switchers = (
    <>
      <LocaleSwitcher locale={locale} label={t.language.label} />
      <CurrencySwitcher currency={currency} label={t.currency.label} />
    </>
  );
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-surface/90 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-card focus:px-3 focus:py-2">
        {t.nav.skipToContent}
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href={`/${locale}`} className="shrink-0 text-ink">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3 py-2 text-[15px] font-medium text-ink/80 hover:bg-ink/5 hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {switchers}
          <Link href={`/${locale}/plan`} className="btn-primary ml-1 px-4 py-2 text-sm">
            {t.nav.plan}
          </Link>
        </div>
        <MobileMenu links={[...links, { href: `/${locale}/plan`, label: t.nav.plan }]} labels={{ menu: t.nav.menu, close: t.nav.close }}>
          {switchers}
        </MobileMenu>
      </div>
    </header>
  );
}
