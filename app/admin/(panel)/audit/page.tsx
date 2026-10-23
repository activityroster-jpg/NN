import { desc } from "drizzle-orm";
import { Card, PageTitle, Table, when } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";

export const metadata = { title: "Audit log" };

export default async function Audit() {
  const rows = await (await getDb()).select().from(auditLog).orderBy(desc(auditLog.id)).limit(300).all();
  return (
    <div>
      <PageTitle title="Audit log" sub="Every change, newest first. The database refuses edits or deletions to this log." />
      <Card>
        <Table head={["When", "Who", "Action", "Entity", "Detail"]} empty={rows.length === 0}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap">{when(r.at)}</td><td>{r.actor}</td><td>{r.action}</td><td>{r.entity}{r.entityId ? ` · ${r.entityId.slice(0, 12)}` : ""}</td>
              <td className="max-w-md truncate text-xs text-muted">{r.detail ? JSON.stringify(r.detail) : ""}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
