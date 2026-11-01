import specsFile from "./specs.json";

// The yachts we offer, by model. There is no live booking-manager feed: these
// pages describe each model with the builder's figures, and the exact yacht
// (its year, layout, photos and equipment) comes with the official quote.
// Specifications live in specs.json (researched from builder figures quoted
// by dealers and the yachting press, sources kept with each model).

export type HullKind = "catamaran" | "monohull";

export interface ModelSpecs {
  id: string;
  name: string;
  builder: string;
  kind: HullKind;
  launched: number | null;
  lengthOverallM: number | null;
  hullLengthM: number | null;
  beamM: number | null;
  draftM: number | null;
  displacementKg: number | null;
  engineHp: number | null;
  engines: number | null;
  fuelL: number | null;
  waterL: number | null;
  cabins: number[];
  heads: number[];
  berthsMax: number | null;
  designer: string | null;
  builderUrl: string | null;
  /** Research caveats for us; never shown on the site. */
  notes: string | null;
  sources: string[];
}

/** A size class: the models we offer for it, and those we may offer instead. */
export interface FleetClass {
  id: string;
  kind: HullKind;
  title: string;
  /** Models we quote first. */
  models: string[];
  /** Comparable models we may offer when the first choice is taken. */
  alternatives: string[];
  blurb: string;
}

export const FLEET_CLASSES: FleetClass[] = [
  { id: "cat-40", kind: "catamaran", title: "40-foot catamaran", models: ["lagoon-40"], alternatives: [], blurb: "The easy first catamaran: big enough for two families, small enough to handle and berth without fuss." },
  { id: "cat-42", kind: "catamaran", title: "42 to 43-foot catamaran", models: ["lagoon-42", "lagoon-43"], alternatives: [], blurb: "The charter fleets' favourite size: four double cabins, room to spread out, still simple to sail." },
  { id: "cat-46", kind: "catamaran", title: "46-foot catamaran", models: ["lagoon-46"], alternatives: [], blurb: "More space in every cabin and on deck, for groups who want a little luxury." },
  { id: "cat-fp", kind: "catamaran", title: "Fountaine Pajot 45 to 47", models: ["fp-elba-45", "fp-tanna-47"], alternatives: [], blurb: "French-built catamarans with a sporty feel, bright saloons and big flybridge or cockpit lounging." },
  { id: "cat-large", kind: "catamaran", title: "Large catamaran", models: ["lagoon-51", "lagoon-55"], alternatives: ["bali-5-4"], blurb: "Big catamarans for groups, crewed charters and long weeks aboard: space, comfort and a crew cabin." },
  { id: "mono-44", kind: "monohull", title: "44-foot sailing yacht", models: ["sun-odyssey-440"], alternatives: [], blurb: "A modern, easy-to-sail cruiser with a walk-around deck: a lovely boat for couples and small groups." },
  { id: "mono-46-bavaria", kind: "monohull", title: "46-foot sailing yacht", models: ["bavaria-cruiser-46"], alternatives: [], blurb: "The proven charter workhorse: solid, roomy below and good value." },
  { id: "mono-45-elan", kind: "monohull", title: "45-foot sailing yacht", models: ["elan-impression-45-1"], alternatives: [], blurb: "A comfortable, well-mannered cruiser with generous volume for its length." },
  { id: "mono-46-hanse", kind: "monohull", title: "46-foot performance cruiser", models: ["hanse-458"], alternatives: [], blurb: "Self-tacking jib and a clean deck: easy to sail short-handed, quick when the wind fills in." },
  { id: "mono-48", kind: "monohull", title: "48-foot sailing yacht", models: ["oceanis-48"], alternatives: [], blurb: "A spacious Beneteau with room for a bigger group and a good turn of speed." },
  { id: "mono-51", kind: "monohull", title: "51-foot sailing yacht", models: ["oceanis-51-1", "sun-odyssey-519"], alternatives: [], blurb: "Five-cabin charter favourites: big crews, big cockpits, still friendly to sail." },
  { id: "mono-53", kind: "monohull", title: "50 to 53-foot sailing yacht", models: ["dufour-530"], alternatives: ["hanse-508", "elan-impression-50-1"], blurb: "Large modern cruisers with fold-down swim platforms and generous owner-style cabins." },
  { id: "mono-60", kind: "monohull", title: "60-foot sailing yacht", models: ["oceanis-yacht-60"], alternatives: ["hanse-588"], blurb: "Flagship cruisers, usually with a skipper: superyacht comfort on a sailing boat." },
];

export const MODELS: ModelSpecs[] = (specsFile as { models: ModelSpecs[] }).models;

/**
 * Models no longer offered: their pages redirect to the replacement, and old
 * enquiries still show their name.
 */
export const RETIRED_MODELS: Record<string, { name: string; replacedBy: string }> = {
  "fp-saona-47": { name: "Fountaine Pajot Saona 47", replacedBy: "fp-tanna-47" },
  "jeanneau-yachts-60": { name: "Jeanneau Yachts 60", replacedBy: "oceanis-yacht-60" },
};

export function modelById(id: string): ModelSpecs | undefined {
  return MODELS.find((m) => m.id === id);
}

export function classOf(id: string): FleetClass | undefined {
  return FLEET_CLASSES.find((c) => c.models.includes(id) || c.alternatives.includes(id));
}

/** Other models in the same class, the primary ones first. */
export function similarTo(id: string): ModelSpecs[] {
  const c = classOf(id);
  if (!c) return [];
  return [...c.models, ...c.alternatives].filter((x) => x !== id).map(modelById).filter((m): m is ModelSpecs => !!m);
}

const FT_PER_M = 3.28084;
export const feet = (m: number | null) => (m == null ? null : Math.round(m * FT_PER_M));

/** "3 or 4", "4" */
export function options(xs: number[]): string {
  const u = [...new Set(xs)].sort((a, b) => a - b);
  return u.length < 2 ? String(u[0] ?? "") : `${u.slice(0, -1).join(", ")} or ${u[u.length - 1]}`;
}

export const modelPath = (id: string) => `/en/yachts/${id}`;
export const fleetPath = "/en/yachts";
