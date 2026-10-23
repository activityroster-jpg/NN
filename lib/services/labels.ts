import type { Dictionary } from "@/lib/i18n";
import type { ExtraCode } from "@/lib/domain/types";

export function extraLabels(t: Dictionary): Partial<Record<ExtraCode | "charter", string>> {
  return {
    charter: t.extras.charter,
    skipper: t.extras.skipper,
    chef: t.extras.chef,
    hostess: t.extras.hostess,
    provisioning: t.extras.provisioning,
    transfer: t.extras.transfer,
    damage_waiver: t.extras.damage_waiver,
    cleaning: t.extras.cleaning,
  };
}

export function categoryName(t: Dictionary, id: string | null): string | null {
  if (!id) return null;
  return (t.categories as Record<string, { name: string; short: string }>)[id]?.short ?? null;
}

export function destinationName(t: Dictionary, id: string): string {
  return (t.destinations as Record<string, { name: string }>)[id]?.name ?? id;
}

export function enquiryText(t: Dictionary) {
  return { ...t.enquiry, yes: t.common.yes, no: t.common.no, notSure: t.common.notSure };
}

export function destinationOptions(t: Dictionary, ids: readonly string[]) {
  return ids.map((id) => ({ id, name: destinationName(t, id) }));
}
