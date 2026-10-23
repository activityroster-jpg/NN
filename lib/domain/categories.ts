import type { HullKind, Yacht } from "./types";

// Yacht categories, used for filtering and comparison today and for selling a
// category (Offering B: "a Premium Catamaran in Croatia, we pick the yacht") later.
// Rules agreed with the owner, October 2026:
//   Standard Mono  under 50 ft, no AC     Standard Cat  under 42 ft, no AC
//   Premium Mono   50 ft and over, AC     Premium Cat   42 ft and over, AC
//   Luxury Mono    54 ft and over, AC     Luxury Cat    48 ft and over, AC
// A yacht that misses the AC requirement for its length falls back to Standard.

export const CATEGORY_IDS = [
  "standard-mono",
  "premium-mono",
  "luxury-mono",
  "standard-cat",
  "premium-cat",
  "luxury-cat",
] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface CategoryDef {
  id: CategoryId;
  kind: Extract<HullKind, "monohull" | "catamaran">;
  tier: "standard" | "premium" | "luxury";
  /** Minimum length in feet for this tier (0 for standard). */
  minLengthFt: number;
  airConRequired: boolean;
}

export const CATEGORIES: readonly CategoryDef[] = [
  { id: "standard-mono", kind: "monohull", tier: "standard", minLengthFt: 0, airConRequired: false },
  { id: "premium-mono", kind: "monohull", tier: "premium", minLengthFt: 50, airConRequired: true },
  { id: "luxury-mono", kind: "monohull", tier: "luxury", minLengthFt: 54, airConRequired: true },
  { id: "standard-cat", kind: "catamaran", tier: "standard", minLengthFt: 0, airConRequired: false },
  { id: "premium-cat", kind: "catamaran", tier: "premium", minLengthFt: 42, airConRequired: true },
  { id: "luxury-cat", kind: "catamaran", tier: "luxury", minLengthFt: 48, airConRequired: true },
];

export function categoryDef(id: CategoryId): CategoryDef {
  const def = CATEGORIES.find((c) => c.id === id);
  if (!def) throw new Error(`Unknown category ${id}`);
  return def;
}

/** The single category a yacht belongs to, or null for hull types we do not categorise (power, gulet). */
export function categorise(y: Pick<Yacht, "kind" | "lengthFt" | "airCon">): CategoryId | null {
  if (y.kind !== "monohull" && y.kind !== "catamaran") return null;
  // Highest tier first: the first tier the yacht qualifies for wins.
  const tiers = CATEGORIES.filter((c) => c.kind === y.kind).sort((a, b) => b.minLengthFt - a.minLengthFt);
  for (const t of tiers) {
    if (y.lengthFt >= t.minLengthFt && (!t.airConRequired || y.airCon)) return t.id;
  }
  return y.kind === "monohull" ? "standard-mono" : "standard-cat";
}
