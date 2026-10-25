import { howtoMedMooring } from "./items/howto-med-mooring";
import type { Short } from "./types";

export const SHORTS: Short[] = [howtoMedMooring];

export function shortById(id: string): Short | undefined {
  return SHORTS.find((s) => s.id === id);
}
