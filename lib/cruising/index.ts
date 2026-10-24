import { croatiaSplit } from "./guides/croatia-split";
import type { CruisingGuide, RegionId } from "./types";

export type { CruisingGuide, RegionId } from "./types";

export const GUIDES: readonly CruisingGuide[] = [croatiaSplit];

export const REGIONS: { id: RegionId; name: string }[] = [
  { id: "mediterranean", name: "Mediterranean" },
  { id: "caribbean", name: "Caribbean" },
  { id: "northern-europe", name: "Northern Europe" },
  { id: "atlantic-islands", name: "Atlantic islands" },
  { id: "indian-ocean", name: "Indian Ocean" },
  { id: "asia", name: "Asia" },
  { id: "south-pacific", name: "South Pacific" },
  { id: "americas", name: "The Americas" },
];

export function guideById(id: string): CruisingGuide | undefined {
  return GUIDES.find((g) => g.id === id);
}

export function totalMiles(g: CruisingGuide): number {
  return g.legs.reduce((n, l) => n + l.nm, 0);
}
