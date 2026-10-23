import type { AppEnv } from "@/lib/env";
import type { Db } from "@/lib/db";
import { providerBase } from "@/lib/db/schema";
import { createMmkProvider } from "./mmk";
import { mockProvider } from "./mock/provider";
import { createNausysProvider } from "./nausys";
import type { CharterProvider } from "./types";

export interface ProviderSet {
  providers: CharterProvider[];
  /** True when only the demo fleet is active: the UI labels prices as examples. */
  demo: boolean;
  /** `${provider}:${externalBaseId}` → destination id. */
  baseMap: Map<string, string>;
}

export async function loadProviders(env: AppEnv, db: Db): Promise<ProviderSet> {
  const rows = await db.select().from(providerBase).all();
  const baseMap = new Map<string, string>();
  for (const r of rows) if (r.destinationId) baseMap.set(`${r.provider}:${r.externalId}`, r.destinationId);

  const forceDemo = env.DEMO_FLEET === "true";
  const live: CharterProvider[] = [];
  if (!forceDemo && env.MMK_API_TOKEN) {
    live.push(createMmkProvider(env.MMK_API_TOKEN, (id) => baseMap.get(`mmk:${id}`) ?? null));
  }
  if (!forceDemo && env.NAUSYS_USERNAME && env.NAUSYS_PASSWORD) {
    live.push(createNausysProvider(env.NAUSYS_USERNAME, env.NAUSYS_PASSWORD, (id) => baseMap.get(`nausys:${id}`) ?? null));
  }
  if (live.length === 0) return { providers: [mockProvider], demo: true, baseMap };
  return { providers: live, demo: false, baseMap };
}

export function baseIdsFor(set: ProviderSet, providerId: string, destinationId: string): string[] {
  const out: string[] = [];
  for (const [key, dest] of set.baseMap) {
    if (dest !== destinationId) continue;
    const [p, ...rest] = key.split(":");
    if (p === providerId) out.push(rest.join(":"));
  }
  return out;
}
