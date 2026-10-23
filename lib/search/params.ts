import { z } from "zod";
import { CATEGORY_IDS } from "@/lib/domain/categories";
import { isIsoDate } from "@/lib/domain/dates";
import { DESTINATION_IDS } from "@/lib/domain/destinations";

// The search lives in the URL so results can be shared, bookmarked and
// re-opened in another language. Every value is validated here.

const bool01 = z
  .enum(["0", "1"])
  .optional()
  .transform((v) => v === "1");
const intIn = (min: number, max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
    .pipe(z.number().int().min(min).max(max).optional());

export const SearchParamsSchema = z.object({
  d: z.string().refine((v) => DESTINATION_IDS.includes(v)),
  w: z.string().refine(isIsoDate),
  g: intIn(1, 12).transform((v) => v ?? 4),
  s: bool01,
  c: bool01,
  type: z.enum(["monohull", "catamaran"]).optional().catch(undefined),
  cat: z.enum(CATEGORY_IDS).optional().catch(undefined),
  ac: bool01.catch(false),
  cabins: intIn(1, 8).catch(undefined),
  len: intIn(20, 120).catch(undefined),
  year: intIn(1990, 2100).catch(undefined),
  max: intIn(100, 1_000_000).catch(undefined),
  sort: z.enum(["recommended", "price", "newest", "length"]).optional().catch(undefined),
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

export function parseSearch(raw: Record<string, string | string[] | undefined>): SearchParams | null {
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) if (typeof v === "string") flat[k] = v;
  const r = SearchParamsSchema.safeParse(flat);
  return r.success ? r.data : null;
}

/** The core trip parameters carried from page to page. */
export function tripQuery(p: Pick<SearchParams, "d" | "w" | "g" | "s" | "c">): URLSearchParams {
  return new URLSearchParams({ d: p.d, w: p.w, g: String(p.g), s: p.s ? "1" : "0", c: p.c ? "1" : "0" });
}
