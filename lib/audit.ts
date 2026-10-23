import type { Db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";

/** Append a line to the audit log. The table refuses updates and deletes (migration 0001). */
export async function audit(
  db: Db,
  actor: string,
  action: string,
  entity: string,
  entityId: string | null,
  detail?: Record<string, unknown>,
): Promise<void> {
  await db.insert(auditLog).values({ actor, action, entity, entityId, detail: detail ?? null });
}
