import type { Metadata } from "next";
import { pageMeta, snippet } from "@/lib/seo";
import { Planner, type PlannerModel } from "@/components/plan/Planner";
import { getDb } from "@/lib/db";
import { FLEET_CLASSES, feet, modelById } from "@/lib/fleet";
import { modelCovers } from "@/lib/photos/slots";
import { productOf } from "@/lib/pricing";
import { destinationViews } from "@/lib/services/destination-settings";
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
  const db = await getDb();
  // Same source as the home page: Admin's active/featured choices and hero photos.
  const [views, covers] = await Promise.all([destinationViews(db), modelCovers(db)]);
  const destinations = views
    .filter((d) => d.active)
    .map((d) => {
      const c = t.destinations[d.id as keyof Dictionary["destinations"]];
      return { id: d.id, name: c.name, region: c.region, featured: d.featured, seasonMonths: d.seasonMonths, peakMonths: d.peakMonths, gradient: d.heroGradient, image: d.heroImageUrl };
    });
  const g = Number(sp.g);
  // Every model we offer, smallest first within catamarans, then monohulls.
  const models: PlannerModel[] = FLEET_CLASSES.flatMap((c) => [...c.models, ...c.alternatives])
    .map(modelById)
    .filter((m) => !!m)
    .map((m) => ({ id: m!.id, name: m!.name, builder: m!.builder, kind: m!.kind, feet: feet(m!.lengthOverallM), cabins: m!.cabins.length ? `${Math.min(...m!.cabins)}${m!.cabins.length > 1 ? `–${Math.max(...m!.cabins)}` : ""} ${t.plan.cabinsWord}` : "", berthsMax: m!.berthsMax, cover: covers[m!.id] ?? null, crewed: productOf(m!.id) === "crewed" }));
  return (
    <div className="container-page py-10 sm:py-14">
      <Planner
        locale={locale}
        intlLocale={INTL_LOCALE[locale]}
        destinations={destinations}
        today={todayIso()}
        initial={{ d: sp.d, w: sp.w && isIsoDate(sp.w) ? sp.w : undefined, g: Number.isInteger(g) && g > 0 && g <= 12 ? g : undefined }}
        models={models}
        text={{ ...t.plan, back: t.common.back, next: t.common.next, monohull: t.common.monohull, catamaran: t.common.catamaran }}
      />
    </div>
  );
}
