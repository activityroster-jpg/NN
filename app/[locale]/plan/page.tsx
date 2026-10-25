import type { Metadata } from "next";
import { pageMeta, snippet } from "@/lib/seo";
import { Planner } from "@/components/plan/Planner";
import { DESTINATIONS } from "@/lib/domain/destinations";
import { isIsoDate } from "@/lib/domain/dates";
import { getDictionary, type Dictionary } from "@/lib/i18n";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { requireLocale, todayIso } from "@/lib/request";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await requireLocale(params);
  const t = getDictionary(locale);
  return pageMeta({ locale, path: "/plan", title: t.plan.title, description: snippet(t.home.heroSub) });
}

export default async function PlanPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const locale = await requireLocale(params);
  const sp = await searchParams;
  const t = getDictionary(locale);
  const destinations = DESTINATIONS.map((d) => {
    const c = t.destinations[d.id as keyof Dictionary["destinations"]];
    return { id: d.id, name: c.name, region: c.region, featured: d.featured, seasonMonths: d.seasonMonths, peakMonths: d.peakMonths, gradient: d.heroGradient };
  });
  const g = Number(sp.g);
  return (
    <div className="container-page py-10 sm:py-14">
      <Planner
        locale={locale}
        intlLocale={INTL_LOCALE[locale]}
        destinations={destinations}
        today={todayIso()}
        initial={{ d: sp.d, w: sp.w && isIsoDate(sp.w) ? sp.w : undefined, g: Number.isInteger(g) && g > 0 && g <= 12 ? g : undefined }}
        text={{ ...t.plan, back: t.common.back, next: t.common.next, monohull: t.common.monohull, catamaran: t.common.catamaran }}
      />
    </div>
  );
}
