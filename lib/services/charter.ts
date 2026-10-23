import { and, eq } from "drizzle-orm";
import { categorise, type CategoryId } from "@/lib/domain/categories";
import { convert, ceilUnit, type FxRates } from "@/lib/domain/money";
import { dedupeOffers } from "@/lib/domain/offers";
import {
  markupFor,
  quote,
  type CrewPoolRates,
  type MarkupRule,
  type Quote,
  type QuoteSelections,
} from "@/lib/domain/pricing";
import type { Currency, ExtraCode, Offer, ProviderId } from "@/lib/domain/types";
import type { Db } from "@/lib/db";
import { crewRate, operator, pricingRule } from "@/lib/db/schema";
import type { AppEnv } from "@/lib/env";
import { getRates } from "@/lib/fx";
import { baseIdsFor, loadProviders, type ProviderSet } from "@/lib/providers/registry";
import type { CharterProvider } from "@/lib/providers/types";
import { getSettings, type Settings } from "@/lib/settings";

export interface PricingContext {
  settings: Settings;
  rules: MarkupRule[];
  operators: Map<string, { parityEnforced: boolean; commissionPct: number | null; depositPct: number | null; balanceDaysBefore: number | null; active: boolean }>;
  crewRates: Map<string, { role: string; weeklyPrice: number; currency: Currency }[]>;
  rates: FxRates;
}

export async function loadPricingContext(db: Db): Promise<PricingContext> {
  const [settings, rules, ops, crew, rates] = await Promise.all([
    getSettings(db),
    db.select().from(pricingRule).where(eq(pricingRule.active, true)).all(),
    db.select().from(operator).all(),
    db.select().from(crewRate).where(eq(crewRate.active, true)).all(),
    getRates(db),
  ]);
  const crewRates = new Map<string, { role: string; weeklyPrice: number; currency: Currency }[]>();
  for (const c of crew) {
    const list = crewRates.get(c.destinationId) ?? [];
    list.push({ role: c.role, weeklyPrice: c.weeklyPrice, currency: c.currency as Currency });
    crewRates.set(c.destinationId, list);
  }
  return {
    settings,
    rules: rules.map((r) => ({
      operatorId: r.operatorId,
      destinationId: r.destinationId,
      categoryId: (r.categoryId as CategoryId | null) ?? null,
      markupPct: r.markupPct,
    })),
    operators: new Map(
      ops.map((o) => [
        o.id,
        { parityEnforced: o.parityEnforced, commissionPct: o.commissionPct, depositPct: o.depositPct, balanceDaysBefore: o.balanceDaysBefore, active: o.active },
      ]),
    ),
    crewRates,
    rates,
  };
}

function crewPoolFor(ctx: PricingContext, destinationId: string, currency: Currency): CrewPoolRates {
  const out: CrewPoolRates = {};
  for (const r of ctx.crewRates.get(destinationId) ?? []) {
    if (r.role !== "skipper" && r.role !== "chef" && r.role !== "hostess") continue;
    out[r.role] = ceilUnit(convert(r.weeklyPrice, r.currency, currency, ctx.rates));
  }
  return out;
}

/** Apply operator overrides from the admin (commission, payment plan) on top of the feed. */
function withOperatorTerms(offer: Offer, ctx: PricingContext): Offer {
  const op = ctx.operators.get(offer.yacht.operatorId);
  if (!op) return offer;
  return {
    ...offer,
    commissionPct: op.commissionPct ?? offer.commissionPct,
    depositPct: op.depositPct ?? offer.depositPct,
    balanceDaysBefore: op.balanceDaysBefore ?? offer.balanceDaysBefore,
  };
}

export function priceOffer(
  offer: Offer,
  ctx: PricingContext,
  selections: QuoteSelections,
  today: string,
  labels?: Partial<Record<ExtraCode | "charter", string>>,
): Quote {
  const o = withOperatorTerms(offer, ctx);
  const op = ctx.operators.get(o.yacht.operatorId);
  const s = ctx.settings;
  const markupPct = markupFor(
    ctx.rules,
    { operatorId: o.yacht.operatorId, destinationId: o.yacht.base.destinationId, categoryId: categorise(o.yacht) },
    s.markupPct,
  );
  return quote({
    offer: o,
    selections,
    markupPct,
    parityEnforced: op?.parityEnforced ?? false,
    defaultCommissionPct: s.defaultCommissionPct,
    crewPool: crewPoolFor(ctx, o.yacht.base.destinationId, o.currency),
    crewPreference: s.crewPreference,
    bankDiscountPct: s.bankDiscountPct,
    policy: { depositPct: s.depositPct, balanceDaysBefore: s.balanceDaysBefore, bufferDays: s.bufferDays },
    today,
    labels,
  });
}

export interface SearchResult {
  offers: Offer[];
  demo: boolean;
  /** Providers that failed; results may be incomplete. */
  failed: ProviderId[];
}

async function searchProvider(p: CharterProvider, set: ProviderSet, destinationId: string, weekStart: string): Promise<Offer[]> {
  return p.search({ destinationId, weekStart, nights: 7, baseIds: p.id === "mock" ? [] : baseIdsFor(set, p.id, destinationId) });
}

export async function searchOffers(env: AppEnv, db: Db, ctx: PricingContext, destinationId: string, weekStart: string): Promise<SearchResult> {
  const set = await loadProviders(env, db);
  const settled = await Promise.allSettled(set.providers.map((p) => searchProvider(p, set, destinationId, weekStart)));
  const offers: Offer[] = [];
  const failed: ProviderId[] = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") offers.push(...r.value);
    else {
      failed.push(set.providers[i]!.id);
      console.error("provider search failed", set.providers[i]!.id, r.reason);
    }
  });
  // Operators switched off in the admin are hidden.
  const visible = offers.filter((o) => ctx.operators.get(o.yacht.operatorId)?.active !== false);
  return { offers: dedupeOffers(visible), demo: set.demo, failed };
}

export async function findOffer(env: AppEnv, db: Db, yachtKey: string, weekStart: string): Promise<{ offer: Offer | null; demo: boolean }> {
  const [providerId, ...rest] = yachtKey.split(":");
  const providerYachtId = rest.join(":");
  const set = await loadProviders(env, db);
  const p = set.providers.find((x) => x.id === providerId);
  if (!p || !providerYachtId) return { offer: null, demo: set.demo };
  try {
    return { offer: await p.getOffer(providerYachtId, weekStart, 7), demo: set.demo };
  } catch (e) {
    console.error("provider getOffer failed", providerId, e);
    return { offer: null, demo: set.demo };
  }
}

export async function providerFor(env: AppEnv, db: Db, providerId: string): Promise<CharterProvider | null> {
  const set = await loadProviders(env, db);
  return set.providers.find((p) => p.id === providerId) ?? null;
}

/** Ensure every operator seen in the feeds has a row the admin can configure. */
export async function registerOperators(db: Db, offers: readonly Offer[]): Promise<void> {
  const seen = new Map<string, { name: string; provider: string }>();
  for (const o of offers) seen.set(o.yacht.operatorId, { name: o.yacht.operatorName, provider: o.yacht.provider });
  for (const [id, v] of seen) {
    await db.insert(operator).values({ id, name: v.name, provider: v.provider }).onConflictDoNothing();
  }
}

export async function operatorRow(db: Db, id: string) {
  return db.select().from(operator).where(and(eq(operator.id, id))).get();
}
