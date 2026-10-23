import { DESTINATIONS, type DestinationDef } from "@/lib/domain/destinations";
import { monthOf } from "@/lib/domain/dates";
import type { Base, HullKind, OfferExtra, Yacht } from "@/lib/domain/types";
import { hashString, mulberry32, pick } from "./random";

// Demo fleet. Real yacht models with fictional names and fictional operators,
// clearly labelled as demo data in the UI. Replaced by live booking-manager
// feeds once agency credentials are issued.

interface ModelSpec {
  builder: string;
  model: string;
  kind: HullKind;
  lengthFt: number;
  cabins: number;
  berths: number;
  heads: number;
  crewCabins: number;
  /** Mid-season weekly price in EUR for a 2020 boat, operator brochure price. */
  basePrice: number;
  /** Probability the yacht has air conditioning. */
  acChance: number;
}

const MODELS: readonly ModelSpec[] = [
  { builder: "Bavaria", model: "Cruiser 41", kind: "monohull", lengthFt: 41, cabins: 3, berths: 8, heads: 2, crewCabins: 0, basePrice: 2900, acChance: 0.05 },
  { builder: "Jeanneau", model: "Sun Odyssey 410", kind: "monohull", lengthFt: 41, cabins: 3, berths: 8, heads: 2, crewCabins: 0, basePrice: 3100, acChance: 0.05 },
  { builder: "Beneteau", model: "Oceanis 46.1", kind: "monohull", lengthFt: 46, cabins: 4, berths: 10, heads: 3, crewCabins: 0, basePrice: 3900, acChance: 0.15 },
  { builder: "Dufour", model: "470", kind: "monohull", lengthFt: 47, cabins: 4, berths: 10, heads: 4, crewCabins: 0, basePrice: 4100, acChance: 0.15 },
  { builder: "Hanse", model: "460", kind: "monohull", lengthFt: 46, cabins: 4, berths: 10, heads: 2, crewCabins: 0, basePrice: 4000, acChance: 0.1 },
  { builder: "Bavaria", model: "C50", kind: "monohull", lengthFt: 50, cabins: 5, berths: 12, heads: 3, crewCabins: 0, basePrice: 5200, acChance: 0.8 },
  { builder: "Jeanneau", model: "Sun Odyssey 490", kind: "monohull", lengthFt: 49, cabins: 5, berths: 12, heads: 3, crewCabins: 0, basePrice: 4900, acChance: 0.3 },
  { builder: "Beneteau", model: "Oceanis 51.1", kind: "monohull", lengthFt: 51, cabins: 5, berths: 12, heads: 3, crewCabins: 0, basePrice: 5600, acChance: 0.85 },
  { builder: "Dufour", model: "530", kind: "monohull", lengthFt: 53, cabins: 5, berths: 12, heads: 4, crewCabins: 0, basePrice: 6100, acChance: 0.9 },
  { builder: "Hanse", model: "548", kind: "monohull", lengthFt: 55, cabins: 5, berths: 12, heads: 4, crewCabins: 1, basePrice: 7400, acChance: 0.95 },
  { builder: "Jeanneau", model: "Sun Odyssey 54", kind: "monohull", lengthFt: 54, cabins: 5, berths: 12, heads: 4, crewCabins: 1, basePrice: 7200, acChance: 0.95 },
  { builder: "Beneteau", model: "First Yacht 53", kind: "monohull", lengthFt: 53, cabins: 4, berths: 10, heads: 3, crewCabins: 0, basePrice: 6400, acChance: 0.7 },
  { builder: "Lagoon", model: "40", kind: "catamaran", lengthFt: 40, cabins: 4, berths: 10, heads: 4, crewCabins: 0, basePrice: 5200, acChance: 0.15 },
  { builder: "Fountaine Pajot", model: "Isla 40", kind: "catamaran", lengthFt: 40, cabins: 4, berths: 10, heads: 4, crewCabins: 0, basePrice: 5300, acChance: 0.15 },
  { builder: "Bali", model: "4.2", kind: "catamaran", lengthFt: 42, cabins: 4, berths: 10, heads: 4, crewCabins: 0, basePrice: 6000, acChance: 0.55 },
  { builder: "Lagoon", model: "42", kind: "catamaran", lengthFt: 42, cabins: 4, berths: 10, heads: 4, crewCabins: 1, basePrice: 6300, acChance: 0.6 },
  { builder: "Fountaine Pajot", model: "Elba 45", kind: "catamaran", lengthFt: 45, cabins: 4, berths: 10, heads: 4, crewCabins: 1, basePrice: 7600, acChance: 0.8 },
  { builder: "Lagoon", model: "46", kind: "catamaran", lengthFt: 46, cabins: 4, berths: 10, heads: 4, crewCabins: 1, basePrice: 8400, acChance: 0.85 },
  { builder: "Bali", model: "4.6", kind: "catamaran", lengthFt: 46, cabins: 5, berths: 12, heads: 5, crewCabins: 1, basePrice: 8600, acChance: 0.85 },
  { builder: "Leopard", model: "50", kind: "catamaran", lengthFt: 50, cabins: 5, berths: 12, heads: 5, crewCabins: 1, basePrice: 10900, acChance: 0.95 },
  { builder: "Lagoon", model: "51", kind: "catamaran", lengthFt: 51, cabins: 5, berths: 12, heads: 5, crewCabins: 1, basePrice: 11800, acChance: 0.95 },
  { builder: "Fountaine Pajot", model: "Tanna 47", kind: "catamaran", lengthFt: 47, cabins: 5, berths: 12, heads: 5, crewCabins: 1, basePrice: 9300, acChance: 0.9 },
];

const NAMES = [
  "Aurelia", "Blue Lagoon", "Calypso", "Dolce Vita", "Eos", "Fortuna", "Galene", "Halcyon", "Iris", "Jasmine",
  "Kalypso", "Luna", "Marlin", "Nerina", "Odyssey", "Pelagia", "Quiet Tide", "Rhapsody", "Selene", "Thalassa",
  "Ulysses", "Vela", "Wanderlust", "Xenia", "Yara", "Zephyr", "Amalfi", "Bonaire", "Corallo", "Delfino",
  "Esperanza", "Fiora", "Gaia", "Helios", "Isola", "Jolie", "Kairos", "Levante", "Maestrale", "Nautilus",
];

const OPERATOR_SUFFIX = ["Sailing (demo)", "Yachting (demo)", "Charter Co. (demo)"];

/** Fleet size per destination: generous for the featured four. */
function fleetSize(d: DestinationDef): number {
  return d.featured ? 48 : 14;
}

function baseFor(d: DestinationDef, i: number): Base {
  const name = d.bases[i % d.bases.length]!;
  return { id: `mock-${d.id}-${i % d.bases.length}`, name, destinationId: d.id, lat: d.center.lat, lng: d.center.lng };
}

export interface DemoYacht {
  yacht: Yacht;
  basePrice: number;
  extras: OfferExtra[];
  commissionPct: number;
  depositPct: number;
  balanceDaysBefore: number;
}

function buildFleet(): DemoYacht[] {
  const out: DemoYacht[] = [];
  for (const d of DESTINATIONS) {
    const rnd = mulberry32(hashString(`fleet:${d.id}`));
    const operators = OPERATOR_SUFFIX.map((suffix, i) => ({
      id: `mock-op-${d.id}-${i}`,
      name: `${d.bases[i % d.bases.length]!.split(" ")[0]} ${suffix}`,
    }));
    const n = fleetSize(d);
    for (let i = 0; i < n; i++) {
      const cats = MODELS.filter((m) => m.kind === "catamaran");
      const spec = d.featured && i % 3 === 0 ? cats[Math.floor(rnd() * cats.length)]! : MODELS[(i * 7 + Math.floor(rnd() * MODELS.length)) % MODELS.length]!;
      const year = 2016 + Math.floor(rnd() * 10);
      const op = operators[i % operators.length]!;
      const airCon = rnd() < spec.acChance;
      const id = `${d.id}-${i + 1}`;
      const kindSlug = spec.kind === "catamaran" ? "catamaran" : "monohull";
      const yacht: Yacht = {
        key: `mock:${id}`,
        provider: "mock",
        providerYachtId: id,
        operatorId: op.id,
        operatorName: op.name,
        name: NAMES[(hashString(id) + i) % NAMES.length]!,
        model: `${spec.builder} ${spec.model}`,
        builder: spec.builder,
        kind: spec.kind,
        lengthFt: spec.lengthFt,
        year,
        cabins: spec.cabins,
        berths: spec.berths,
        heads: spec.heads,
        crewCabins: spec.crewCabins,
        airCon,
        watermaker: spec.lengthFt >= 46 && rnd() < 0.6,
        generator: airCon || (spec.lengthFt >= 45 && rnd() < 0.5),
        mainsail: rnd() < 0.7 ? "furling" : "classic",
        base: baseFor(d, i),
        images: [`/demo/${kindSlug}-${(i % 3) + 1}.svg`],
        equipment: [
          "Autopilot",
          "Bimini",
          "Dinghy with outboard",
          "Chartplotter in cockpit",
          ...(rnd() < 0.6 ? ["Bow thruster"] : []),
          ...(rnd() < 0.5 ? ["Solar panels"] : []),
          ...(rnd() < 0.4 ? ["Wi-Fi on board"] : []),
          ...(spec.kind === "catamaran" ? ["Paddle board", "Snorkelling gear"] : []),
        ],
        securityDeposit: spec.kind === "catamaran" ? 4000 : spec.lengthFt >= 50 ? 3500 : 2500,
      };
      const ageFactor = 1 + (year - 2020) * 0.035;
      const basePrice = Math.round((spec.basePrice * ageFactor * (0.92 + rnd() * 0.16) * (d.currency === "USD" ? 1.25 : 1)) / 10) * 10;
      const skipperWeek = d.currency === "USD" ? 1600 : 1300;
      const extras: OfferExtra[] = [
        { code: "skipper", name: "Skipper", price: skipperWeek, unit: "week", mandatory: false, payableAtBase: false },
        { code: "hostess", name: "Hostess", price: d.currency === "USD" ? 1400 : 1100, unit: "week", mandatory: false, payableAtBase: false },
        { code: "cleaning", name: "Final cleaning", price: spec.kind === "catamaran" ? 250 : 180, unit: "booking", mandatory: true, payableAtBase: true },
        { code: "other", name: "Transit log and check-in pack", price: spec.kind === "catamaran" ? 300 : 220, unit: "booking", mandatory: true, payableAtBase: true },
        { code: "provisioning", name: "Starter provisioning pack", price: 45, unit: "person", mandatory: false, payableAtBase: false },
      ];
      if (rnd() < 0.7) {
        extras.push({ code: "damage_waiver", name: "Damage waiver (non-refundable)", price: spec.kind === "catamaran" ? 520 : 380, unit: "booking", mandatory: false, payableAtBase: false });
      }
      if (spec.lengthFt >= 45 && rnd() < 0.5) {
        extras.push({ code: "chef", name: "Cook", price: d.currency === "USD" ? 1700 : 1400, unit: "week", mandatory: false, payableAtBase: false });
      }
      out.push({
        yacht,
        basePrice,
        extras,
        commissionPct: pick(rnd, [15, 15, 18, 20]),
        depositPct: pick(rnd, [30, 40, 50]),
        balanceDaysBefore: pick(rnd, [30, 45, 60]),
      });
    }
  }
  return out;
}

export const DEMO_FLEET: readonly DemoYacht[] = buildFleet();

/** Seasonal price factor by month, Mediterranean pattern (Caribbean is flipped). */
export function seasonFactor(destinationId: string, weekStart: string): number {
  const m = monthOf(weekStart);
  const caribbean = destinationId === "bvi";
  if (caribbean) {
    if ([12, 1, 2, 3].includes(m)) return 1.25;
    if ([4, 11].includes(m)) return 1.0;
    return 0.75;
  }
  if ([7, 8].includes(m)) return 1.45;
  if ([6, 9].includes(m)) return 1.15;
  if ([5, 10].includes(m)) return 0.9;
  return 0.75;
}

/** Whether a demo yacht is free on a given week (stable pseudo-random, busier in peak). */
export function demoAvailable(yachtKey: string, weekStart: string, destinationId: string): boolean {
  const r = mulberry32(hashString(`avail:${yachtKey}:${weekStart}`))();
  const busy = seasonFactor(destinationId, weekStart) >= 1.4 ? 0.45 : 0.25;
  return r >= busy;
}

/** Last-minute style discount some operators publish. */
export function demoDiscountPct(yachtKey: string, weekStart: string): number {
  const r = mulberry32(hashString(`disc:${yachtKey}:${weekStart}`))();
  if (r < 0.55) return 0;
  if (r < 0.85) return 5;
  return 10;
}
