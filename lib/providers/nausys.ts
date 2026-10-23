// NauSYS adapter (CBMS external REST API v6).
//
// UNVERIFIED: written from an open-source client (github.com/avocatl/nausys)
// because NauSYS issues its documentation with the agency credentials. Check
// every endpoint and field against the official manual before switching it on
// in production. It is only active when NAUSYS_USERNAME and NAUSYS_PASSWORD are set.
//
// NauSYS has no "search a base" call: you list the yachts of each charter
// company, pick the ones at the mapped bases, then ask which are free.

import { z } from "zod";
import { addDays, parseIsoDate } from "@/lib/domain/dates";
import { CURRENCIES, type Currency, type HullKind, type Offer, type Yacht } from "@/lib/domain/types";
import { FT_PER_M, fetchJson, guessAirCon, TtlCache } from "./http";
import type { CharterProvider, ClientDetails, OptionResult, SearchQuery } from "./types";
import { ProviderError } from "./types";

const BASE_URL = "https://ws.nausys.com/CBMS-external/rest/";

/** NauSYS dates are dd.MM.yyyy. */
function nsDate(iso: string): string {
  const d = parseIsoDate(iso);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getUTCFullYear()}`;
}

const num = z.union([z.number(), z.string()]).transform((v) => Number(v) || 0);

const NsYacht = z
  .object({
    id: z.coerce.string(),
    name: z.string().default(""),
    companyId: z.coerce.string(),
    locationId: z.coerce.string().optional(),
    yachtModelId: z.coerce.string().optional(),
    cabins: num.default(0),
    cabinCrew: num.default(0),
    berthsTotal: num.default(0),
    wc: num.default(0),
    buildYear: num.optional(),
    commission: num.optional(),
    deposit: num.optional(),
    mainPictureUrl: z.string().optional(),
    picturesUrl: z.array(z.string()).optional(),
    standardYachtEquipment: z.array(z.object({ name: z.string().optional() }).passthrough()).optional(),
  })
  .passthrough();
type NsYachtT = z.infer<typeof NsYacht>;

const NsModel = z
  .object({ id: z.coerce.string(), name: z.string().default(""), loa: num.optional(), yachtCategoryId: z.coerce.string().optional() })
  .passthrough();

const FreeYacht = z
  .object({
    yachtId: z.coerce.string(),
    locationFromId: z.coerce.string().optional(),
    price: z
      .object({
        priceListPrice: num.optional(),
        clientPrice: num,
        currency: z.string().default("EUR"),
      })
      .passthrough(),
  })
  .passthrough();

export function createNausysProvider(
  username: string,
  password: string,
  resolveDestination: (baseId: string) => string | null,
): CharterProvider {
  const credentials = { username, password };
  const post = (path: string, body: object) =>
    fetchJson("nausys", BASE_URL + path, { method: "POST", body: JSON.stringify({ credentials, ...body }) });

  const companyYachts = new TtlCache<NsYachtT[]>(6 * 3_600_000);
  const models = new TtlCache<Map<string, z.infer<typeof NsModel>>>(24 * 3_600_000);
  const companyNames = new TtlCache<Map<string, string>>(24 * 3_600_000);

  async function companies(): Promise<Map<string, string>> {
    const hit = companyNames.get("all");
    if (hit) return hit;
    const raw = z
      .object({ companies: z.array(z.object({ id: z.coerce.string(), name: z.string() }).passthrough()).default([]) })
      .passthrough()
      .safeParse(await post("catalogue/v6/charterCompanies", {}));
    const map = new Map(raw.success ? raw.data.companies.map((c) => [c.id, c.name] as const) : []);
    companyNames.set("all", map);
    return map;
  }

  async function modelMap() {
    const hit = models.get("all");
    if (hit) return hit;
    const raw = z
      .object({ models: z.array(NsModel).default([]) })
      .passthrough()
      .safeParse(await post("catalogue/v6/yachtModels", {}));
    const map = new Map(raw.success ? raw.data.models.map((m) => [m.id, m] as const) : []);
    models.set("all", map);
    return map;
  }

  async function yachtsOf(companyId: string): Promise<NsYachtT[]> {
    const hit = companyYachts.get(companyId);
    if (hit) return hit;
    const raw = z
      .object({ yachts: z.array(NsYacht).default([]) })
      .passthrough()
      .safeParse(await post(`catalogue/v6/yachts/${encodeURIComponent(companyId)}`, {}));
    const list = raw.success ? raw.data.yachts : [];
    companyYachts.set(companyId, list);
    return list;
  }

  async function yachtsAtBases(baseIds: string[]): Promise<NsYachtT[]> {
    const wanted = new Set(baseIds);
    const out: NsYachtT[] = [];
    for (const companyId of (await companies()).keys()) {
      for (const y of await yachtsOf(companyId)) if (y.locationId && wanted.has(y.locationId)) out.push(y);
    }
    return out;
  }

  async function toYacht(y: NsYachtT, baseId: string, destinationId: string): Promise<Yacht> {
    const model = (await modelMap()).get(y.yachtModelId ?? "");
    const companyName = (await companies()).get(y.companyId) ?? "";
    const equipment = (y.standardYachtEquipment ?? []).map((e) => e.name ?? "").filter(Boolean);
    const modelName = model?.name ?? "";
    const kind: HullKind = /cat/i.test(modelName) || model?.yachtCategoryId === "2" ? "catamaran" : "monohull";
    return {
      key: `nausys:${y.id}`,
      provider: "nausys",
      providerYachtId: y.id,
      operatorId: `nausys:${y.companyId}`,
      operatorName: companyName,
      name: y.name,
      model: modelName,
      builder: modelName.split(" ")[0] ?? "",
      kind,
      lengthFt: Math.round((model?.loa ?? 0) * FT_PER_M),
      year: y.buildYear ?? 0,
      cabins: y.cabins,
      berths: y.berthsTotal,
      heads: y.wc,
      crewCabins: y.cabinCrew,
      airCon: guessAirCon(equipment),
      watermaker: equipment.some((n) => /water ?maker|desalin/i.test(n)),
      generator: equipment.some((n) => /generator/i.test(n)),
      mainsail: "unknown",
      base: { id: baseId, name: "", destinationId },
      images: [y.mainPictureUrl, ...(y.picturesUrl ?? [])].filter((u): u is string => !!u),
      equipment,
      securityDeposit: y.deposit ?? null,
    };
  }

  async function free(yachts: NsYachtT[], weekStart: string, nights: number): Promise<Offer[]> {
    if (yachts.length === 0) return [];
    const raw = await post("yachtReservation/v6/freeYachts", {
      periodFrom: nsDate(weekStart),
      periodTo: nsDate(addDays(weekStart, nights)),
      yachts: yachts.map((y) => Number(y.id)),
    });
    const parsed = z.object({ status: z.string().optional(), freeYachts: z.array(z.unknown()).default([]) }).passthrough().safeParse(raw);
    if (!parsed.success) throw new ProviderError("nausys", "freeYachts: unexpected response shape");
    if (parsed.data.status && parsed.data.status !== "OK") throw new ProviderError("nausys", `freeYachts: status ${parsed.data.status}`);
    const byId = new Map(yachts.map((y) => [y.id, y] as const));
    const out: Offer[] = [];
    for (const item of parsed.data.freeYachts) {
      const f = FreeYacht.safeParse(item);
      if (!f.success) continue;
      const y = byId.get(f.data.yachtId);
      if (!y) continue;
      const baseId = f.data.locationFromId ?? y.locationId ?? "";
      const destinationId = resolveDestination(baseId);
      if (!destinationId) continue;
      const cur = (CURRENCIES as readonly string[]).includes(f.data.price.currency) ? (f.data.price.currency as Currency) : "EUR";
      out.push({
        yacht: await toYacht(y, baseId, destinationId),
        weekStart,
        weekEnd: addDays(weekStart, nights),
        currency: cur,
        listPrice: f.data.price.priceListPrice ?? f.data.price.clientPrice,
        price: f.data.price.clientPrice,
        commissionPct: y.commission ?? null,
        // NauSYS extras ("services") need a separate catalogue call; added once the manual confirms the shape.
        extras: [],
        depositPct: null,
        balanceDaysBefore: null,
        ref: `${y.id}|${weekStart}|${nights}`,
      });
    }
    return out;
  }

  return {
    id: "nausys",
    label: "NauSYS",
    async search(q: SearchQuery) {
      if (q.baseIds.length === 0) return [];
      return free(await yachtsAtBases(q.baseIds), q.weekStart, q.nights);
    },
    async getOffer(providerYachtId, weekStart, nights) {
      for (const companyId of (await companies()).keys()) {
        const y = (await yachtsOf(companyId)).find((x) => x.id === providerYachtId);
        if (y) return (await free([y], weekStart, nights))[0] ?? null;
      }
      return null;
    },
    async createOption(offer: Offer, client: ClientDetails, _holdHours: number): Promise<OptionResult> {
      const [yachtId, weekStart, nights] = offer.ref.split("|");
      const [first, ...rest] = client.name.trim().split(/\s+/);
      const info = z
        .object({ id: z.coerce.string(), uuid: z.string(), status: z.string().optional() })
        .passthrough()
        .safeParse(
          await post("booking/v6/createInfo", {
            client: { name: first ?? client.name, surname: rest.join(" ") || "-", email: client.email, phone: client.phone },
            yachtID: Number(yachtId),
            periodFrom: nsDate(weekStart!),
            periodTo: nsDate(addDays(weekStart!, Number(nights))),
          }),
        );
      if (!info.success) throw new ProviderError("nausys", "createInfo: unexpected response shape");
      const opt = z
        .object({ id: z.coerce.string(), uuid: z.string(), optionExpirationDate: z.string().optional() })
        .passthrough()
        .safeParse(await post("booking/v6/createOption", { id: Number(info.data.id), uuid: info.data.uuid }));
      if (!opt.success) throw new ProviderError("nausys", "createOption: unexpected response shape");
      return {
        optionRef: `${opt.data.id}|${opt.data.uuid}`,
        expiresAt: opt.data.optionExpirationDate ?? new Date(Date.now() + 24 * 3_600_000).toISOString(),
      };
    },
    async confirm(optionRef) {
      const [id, uuid] = optionRef.split("|");
      await post("booking/v6/createBooking", { id: Number(id), uuid });
      return { bookingRef: id ?? optionRef };
    },
    async cancel(optionRef) {
      const [id, uuid] = optionRef.split("|");
      await post("booking/v6/cancelReservation", { id: Number(id), uuid });
    },
  };
}
