import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Card, m, PageTitle, Status, Table, Tabs, when } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { booking } from "@/lib/db/schema";
import type { Yacht } from "@/lib/domain/types";

export const metadata = { title: "Bookings" };
const STATUSES = ["all", "hold", "awaiting_payment", "paid_deposit", "confirmed", "completed", "cancelled", "expired"];

export default async function Bookings({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const db = await getDb();
  const q = db.select().from(booking);
  const rows = await (STATUSES.includes(status) && status !== "all" ? q.where(eq(booking.status, status)) : q).orderBy(desc(booking.createdAt)).limit(300).all();
  return (
    <div>
      <PageTitle title="Bookings & holds" sub="Holds are free 24-hour options. Bookings move to confirmed once the operator confirms after payment." />
      <Tabs current={status} items={STATUSES.map((s) => ({ key: s, label: s.replace(/_/g, " "), href: `/admin/bookings?status=${s}` }))} />
      <Card>
        <Table head={["Ref", "Status", "Created", "Guest", "Yacht", "Operator", "Week", "Total", "Pay"]} empty={rows.length === 0}>
          {rows.map((b) => (
            <tr key={b.id}>
              <td><Link className="font-medium text-brand underline" href={`/admin/bookings/${b.id}`}>{b.ref}</Link></td>
              <td><Status value={b.status} /></td>
              <td className="whitespace-nowrap">{when(b.createdAt)}</td>
              <td>{b.leadName}<div className="text-xs text-muted">{b.leadEmail}</div></td>
              <td>{(b.yachtSnapshot as Yacht).model}<div className="text-xs text-muted">{b.destinationId}</div></td>
              <td>{b.operatorName}</td>
              <td className="whitespace-nowrap">{when(b.weekStart)}</td>
              <td>{m(b.total, b.currency)}</td>
              <td>{b.paymentMethod}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
