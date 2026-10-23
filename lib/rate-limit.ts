import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { rateLimit } from "@/lib/db/schema";

/** Fixed-window counter. Returns false once `limit` hits within `windowSec` for the key. */
export async function allow(db: Db, key: string, limit: number, windowSec: number): Promise<boolean> {
  const nowSec = Math.floor(Date.now() / 1000);
  const row = await db.select().from(rateLimit).where(eq(rateLimit.key, key)).get();
  if (!row || nowSec - row.windowStart >= windowSec) {
    await db
      .insert(rateLimit)
      .values({ key, windowStart: nowSec, count: 1 })
      .onConflictDoUpdate({ target: rateLimit.key, set: { windowStart: nowSec, count: 1 } });
    return true;
  }
  if (row.count >= limit) return false;
  await db.update(rateLimit).set({ count: row.count + 1 }).where(eq(rateLimit.key, key));
  return true;
}
