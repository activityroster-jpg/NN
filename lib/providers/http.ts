import type { ProviderId } from "@/lib/domain/types";
import { ProviderError } from "./types";

/** fetch with a hard timeout and JSON handling. Booking managers can be slow; never hang a page on them. */
export async function fetchJson(
  provider: ProviderId,
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 12_000);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { Accept: "application/json", "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    const text = await res.text();
    if (!res.ok) throw new ProviderError(provider, `HTTP ${res.status}: ${text.slice(0, 300)}`, res.status);
    return text ? (JSON.parse(text) as unknown) : null;
  } catch (e) {
    if (e instanceof ProviderError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    throw new ProviderError(provider, ctrl.signal.aborted ? "timed out" : msg);
  } finally {
    clearTimeout(timer);
  }
}

/** Small per-isolate cache for catalogue data (yachts, equipment) that changes rarely. */
export class TtlCache<V> {
  private store = new Map<string, { v: V; exp: number }>();
  constructor(private ttlMs: number) {}
  get(k: string): V | undefined {
    const hit = this.store.get(k);
    if (!hit) return undefined;
    if (hit.exp < Date.now()) {
      this.store.delete(k);
      return undefined;
    }
    return hit.v;
  }
  set(k: string, v: V): void {
    this.store.set(k, { v, exp: Date.now() + this.ttlMs });
  }
}

export const FT_PER_M = 3.28084;

export function guessAirCon(names: readonly string[]): boolean {
  return names.some((n) => /air.?con|a\/c|klima|climati/i.test(n));
}
