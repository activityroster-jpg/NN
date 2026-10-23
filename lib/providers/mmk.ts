// MMK Booking Manager adapter (REST API v2).
//
// UNVERIFIED: written from MMK's public product pages and an open-source client
// (github.com/avocatl/mmk) because the official manual is only issued after
// agency registration. Every response is parsed defensively; when the manual
// arrives, check each endpoint and field below against it before switching the
// adapter on in production. It is only active when MMK_API_TOKEN is set.

import { z } from "zod";
import { addDays } from "@/lib/domain/dates";
import { CURRENCIES, type Currency, type ExtraCode, type HullKind, type Offer, type OfferExtra, type Yacht } from "@/lib/domain/types";
import { FT_PER_M, fetchJson, guessAirCon, TtlCache } from "./http";
import type { CharterProvider, ClientDetails, OptionResult, SearchQuery } from "./types";
import { ProviderError } from "./types";

const BASE_URL = "https://www.booking-manager.com/api/v2/";

const OfferSchema = z
  .object({
    yachtId: z.coerce.string(),
    startBaseId: z.coerce.string().optional(),
    startBase: z.string().optional(),
    startPrice: z.number().optional(),
    price: z.number(),
    currency: z.string().default("EUR"),
    dateFrom: z.string(),
    dateTo: z.string(),
  })
  .passthrough();

const ExtraSchema = z
  .object({
    name: z.string(),
    obligatory: z.boolean().optional(),
    price: z.number().default(0),
    unit: z.string().optional(),
    payableInBase: z.boolean().optional(),
  })
  .passthrough();

const YachtSchema = z
  .object({
    id: z.coerce.string(),
    name: z.string().default(""),
    model: z.string().default(""),
    shipyard: z.string().optional(),
    kind: z.string().default(""),
    year: z.coerce.number().default(0),
    length: z.coerce.number().default(0),
    cabins: z.coerce.number().default(0),
    berths: z.coerce.number().default(0),
    wc: z.coerce.number().default(0),
    companyId: z.coerce.string().default(""),
    company: z.string().default(""),
    homeBaseId: z.coerce.string().optional(),
    homeBase: z.string().default(""),
    deposit: z.coerce.number().optional(),
    commissionPercentage: z.coerce.number().optional(),
    mainsailType: z.string().optional(),
    equipmentIds: z.array(z.coerce.number()).optional(),
    images: z.array(z.object({ url: z.string() }).passthrough()).optional(),
    products: z.array(z.object({ name: z.string().optional(), extras: z.array(ExtraSchema).optional() }).passthrough()).optional(),
  })
  .passthrough();

type MmkYacht = z.infer<typeof YachtSchema>;

const yachtCache = new TtlCache<MmkYacht>(6 * 3_600_000);
const equipmentCache = new TtlCache<Map<number, string>>(24 * 3_600_000);

function kindOf(k: string): HullKind {
  const s = k.toLowerCase();
  if (s.includes("cat")) return "catamaran";
  if (s.includes("gulet")) return "gulet";
  if (s.includes("motor") || s.includes("power")) return "power";
  return "monohull";
}

function extraCode(name: string): ExtraCode {
  const n = name.toLowerCase();
  if (/skipper/.test(n)) return "skipper";
  if (/\bcook\b|chef/.test(n)) return "chef";
  if (/hostess/.test(n)) return "hostess";
  if (/provision/.test(n)) return "provisioning";
  if (/transfer/.test(n)) return "transfer";
  if (/damage waiver|deposit waiver|insurance/.test(n)) return "damage_waiver";
  if (/clean/.test(n)) return "cleaning";
  return "other";
}

function extraUnit(u: string | undefined): OfferExtra["unit"] {
  const s = (u ?? "").toLowerCase();
  if (s.includes("person") && s.includes("day")) return "person_day";
  if (s.includes("person")) return "person";
  if (s.includes("day")) return "day";
  if (s.includes("week")) return "week";
  return "booking";
}

function currency(c: string): Currency {
  return (CURRENCIES as readonly string[]).includes(c) ? (c as Currency) : "EUR";
}

export function createMmkProvider(token: string, resolveDestination: (baseId: string) => string | null): CharterProvider {
  const auth = { Authorization: `Bearer ${token}` };
  const get = (path: string) => fetchJson("mmk", BASE_URL + path, { headers: auth });

  async function equipmentNames(): Promise<Map<number, string>> {
    const hit = equipmentCache.get("all");
    if (hit) return hit;
    const raw = z.array(z.object({ id: z.number(), name: z.string() }).passthrough()).safeParse(await get("equipment"));
    const map = new Map<number, string>(raw.success ? raw.data.map((e) => [e.id, e.name]) : []);
    equipmentCache.set("all", map);
    return map;
  }

  async function yacht(id: string): Promise<MmkYacht | null> {
    const hit = yachtCache.get(id);
    if (hit) return hit;
    const parsed = YachtSchema.safeParse(await get(`yacht/${encodeURIComponent(id)}`));
    if (!parsed.success) return null;
    yachtCache.set(id, parsed.data);
    return parsed.data;
  }

  async function toOffer(o: z.infer<typeof OfferSchema>, weekStart: string, nights: number): Promise<Offer | null> {
    const y = await yacht(o.yachtId);
    if (!y) return null;
    const baseId = o.startBaseId ?? y.homeBaseId ?? "";
    const destinationId = resolveDestination(baseId);
    if (!destinationId) return null;
    const equip = await equipmentNames();
    const equipment = (y.equipmentIds ?? []).map((id) => equip.get(id)).filter((n): n is string => !!n);
    const extras: OfferExtra[] = (y.products?.[0]?.extras ?? []).map((e) => ({
      code: extraCode(e.name),
      name: e.name,
      price: e.price,
      unit: extraUnit(e.unit),
      mandatory: !!e.obligatory,
      payableAtBase: !!e.payableInBase,
    }));
    const lengthFt = Math.round(y.length * FT_PER_M);
    const yachtOut: Yacht = {
      key: `mmk:${y.id}`,
      provider: "mmk",
      providerYachtId: y.id,
      operatorId: `mmk:${y.companyId}`,
      operatorName: y.company,
      name: y.name,
      model: y.model,
      builder: y.shipyard ?? y.model.split(" ")[0] ?? "",
      kind: kindOf(y.kind),
      lengthFt,
      year: y.year,
      cabins: y.cabins,
      berths: y.berths,
      heads: y.wc,
      crewCabins: 0,
      airCon: guessAirCon(equipment),
      watermaker: equipment.some((n) => /water ?maker|desalin/i.test(n)),
      generator: equipment.some((n) => /generator/i.test(n)),
      mainsail: /furl|roll/i.test(y.mainsailType ?? "") ? "furling" : y.mainsailType ? "classic" : "unknown",
      base: { id: baseId, name: o.startBase ?? y.homeBase, destinationId },
      images: (y.images ?? []).map((i) => i.url).filter(Boolean),
      equipment,
      securityDeposit: y.deposit ?? null,
    };
    return {
      yacht: yachtOut,
      weekStart,
      weekEnd: addDays(weekStart, nights),
      currency: currency(o.currency),
      listPrice: o.startPrice ?? o.price,
      price: o.price,
      commissionPct: y.commissionPercentage ?? null,
      extras,
      depositPct: null,
      balanceDaysBefore: null,
      ref: `${y.id}|${baseId}|${o.dateFrom}|${o.dateTo}`,
    };
  }

  async function offers(params: URLSearchParams, weekStart: string, nights: number): Promise<Offer[]> {
    const raw = await get(`offers?${params.toString()}`);
    const list = z.array(z.unknown()).safeParse(raw);
    if (!list.success) throw new ProviderError("mmk", "offers: unexpected response shape");
    const out: Offer[] = [];
    for (const item of list.data) {
      const o = OfferSchema.safeParse(item);
      if (!o.success) continue;
      const offer = await toOffer(o.data, weekStart, nights);
      if (offer) out.push(offer);
    }
    return out;
  }

  const dt = (iso: string) => `${iso}T00:00:00`;

  return {
    id: "mmk",
    label: "MMK Booking Manager",
    async search(q: SearchQuery) {
      if (q.baseIds.length === 0) return [];
      const p = new URLSearchParams({ dateFrom: dt(q.weekStart), dateTo: dt(addDays(q.weekStart, q.nights)) });
      for (const b of q.baseIds) p.append("baseFromId", b);
      return offers(p, q.weekStart, q.nights);
    },
    async getOffer(providerYachtId, weekStart, nights) {
      const p = new URLSearchParams({ dateFrom: dt(weekStart), dateTo: dt(addDays(weekStart, nights)), yachtId: providerYachtId });
      const list = await offers(p, weekStart, nights);
      return list[0] ?? null;
    },
    async createOption(offer: Offer, client: ClientDetails, _holdHours: number): Promise<OptionResult> {
      const [yachtId, baseId, dateFrom, dateTo] = offer.ref.split("|");
      const raw = await fetchJson("mmk", BASE_URL + "reservation", {
        method: "POST",
        headers: auth,
        body: JSON.stringify({ yachtId, baseFromId: baseId, baseToId: baseId, dateFrom, dateTo, clientName: client.name, currency: offer.currency }),
      });
      const r = z.object({ id: z.coerce.string(), expirationDate: z.string().optional() }).passthrough().safeParse(raw);
      if (!r.success) throw new ProviderError("mmk", "reservation: unexpected response shape");
      return { optionRef: r.data.id, expiresAt: r.data.expirationDate ?? new Date(Date.now() + 24 * 3_600_000).toISOString() };
    },
    async confirm(optionRef) {
      await fetchJson("mmk", BASE_URL + `reservation/${encodeURIComponent(optionRef)}`, { method: "PUT", headers: auth });
      return { bookingRef: optionRef };
    },
    async cancel(optionRef) {
      await fetchJson("mmk", BASE_URL + `reservation/${encodeURIComponent(optionRef)}`, { method: "DELETE", headers: auth });
    },
  };
}
