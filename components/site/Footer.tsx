import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SocialIcon } from "@/components/Icons";
import { COMPANY, SOCIAL_LINKS } from "@/lib/brand";
import { DESTINATIONS } from "@/lib/domain/destinations";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";

export function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const featured = DESTINATIONS.filter((d) => d.featured);
  const social = SOCIAL_LINKS.filter((s) => s.href);
  return (
    <footer className="mt-24 border-t border-line bg-surface-2/60">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">{t.meta.tagline}</p>
          <p className="mt-6 mb-2 text-xs font-semibold tracking-wider text-muted uppercase">{t.footer.follow}</p>
          <div className="flex gap-2">
            {social.map((s) => (
              <a key={s.label} href={s.href!} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="rounded-full border border-line bg-card p-2 text-ink/80 hover:text-ink">
                <SocialIcon name={s.icon} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold tracking-wider text-muted uppercase">{t.footer.explore}</p>
          <ul className="space-y-2 text-sm">
            {featured.map((d) => (
              <li key={d.id}>
                <Link href={`/${locale}/destinations/${d.id}`} className="hover:underline">
                  {t.destinations[d.id as keyof Dictionary["destinations"]].name}
                </Link>
              </li>
            ))}
            <li>
              <Link href={`/${locale}/destinations`} className="hover:underline">
                {t.home.moreDestinations}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold tracking-wider text-muted uppercase">{t.footer.company}</p>
          <ul className="space-y-2 text-sm">
            <li><Link href={`/${locale}/how-it-works`} className="hover:underline">{t.nav.howItWorks}</Link></li>
            <li><Link href={`/${locale}/about`} className="hover:underline">{t.nav.about}</Link></li>
            <li><Link href={`/${locale}/contact`} className="hover:underline">{t.nav.contact}</Link></li>
            <li><a href={`mailto:${COMPANY.email}`} className="hover:underline">{COMPANY.email}</a></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold tracking-wider text-muted uppercase">{t.footer.legal}</p>
          <ul className="space-y-2 text-sm">
            <li><Link href={`/${locale}/legal/booking-conditions`} className="hover:underline">{t.footer.terms}</Link></li>
            <li><Link href={`/${locale}/legal/privacy`} className="hover:underline">{t.footer.privacy}</Link></li>
            <li><Link href={`/${locale}/legal/cookies`} className="hover:underline">{t.footer.cookies}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page space-y-2 py-6 text-xs leading-relaxed text-muted">
          <p>{t.footer.agentNote}</p>
          <p>{t.footer.companyLine}</p>
          <p>© {new Date().getUTCFullYear()} {COMPANY.legalName}</p>
        </div>
      </div>
    </footer>
  );
}
