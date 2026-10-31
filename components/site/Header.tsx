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
    { href: `/${locale}/yachts`, label: t.nav.yachts },
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
      <div className="container-page relative flex h-16 items-center justify-between gap-4">
        {/* Centred on mobile (absolute), inline on desktop. */}
        <Link href={`/${locale}`} className="absolute left-1/2 shrink-0 -translate-x-1/2 text-ink lg:static lg:translate-x-0">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3 py-2 text-[15px] font-medium whitespace-nowrap text-ink/80 hover:bg-ink/5 hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {switchers}
          <Link href={`/${locale}/plan`} className="btn-primary ml-1 px-4 py-2 text-sm">
            {t.nav.plan}
          </Link>
        </div>
        <div className="ml-auto lg:hidden">
          <MobileMenu links={[...links, { href: `/${locale}/plan`, label: t.nav.plan }]} labels={{ menu: t.nav.menu, close: t.nav.close }}>
            {switchers}
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
