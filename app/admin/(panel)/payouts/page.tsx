import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { Card, m, PageTitle, Status, Table, Tabs, when } from "@/components/admin/ui";
import { markPayoutPaid } from "@/lib/admin/actions";
import { getDb } from "@/lib/db";
import { booking, payout } from "@/lib/db/schema";

export const metadata = { title: "Payouts" };

export default async function Payouts({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "due" } = await searchParams;
  const db = await getDb();
  const rows = await db
    .select({ p: payout, b: booking })
    .from(payout)
    .innerJoin(booking, eq(payout.bookingId, booking.id))
    .where(eq(payout.status, status === "paid" ? "paid" : "due"))
    .orderBy(status === "paid" ? desc(payout.paidAt) : asc(payout.dueDate))
    .limit(300)
    .all();
  const totals = new Map<string, number>();
  for (const { p } of rows) totals.set(p.currency, (totals.get(p.currency) ?? 0) + p.amount);
  return (
    <div>
      <PageTitle title="Payouts" sub={`What we owe operators and crew. ${[...totals].map(([c, v]) => m(v, c)).join(" + ") || ""}`} />
      <Tabs current={status} items={[{ key: "due", label: "due", href: "/admin/payouts?status=due" }, { key: "paid", label: "paid", href: "/admin/payouts?status=paid" }]} />
      <Card>
        <Table head={["Due", "Payee", "Booking", "Amount", "Status", ""]} empty={rows.length === 0}>
          {rows.map(({ p, b }) => (
            <tr key={p.id}>
              <td className="whitespace-nowrap">{when(p.dueDate)}</td>
              <td>{p.payee}<div className="text-xs text-muted">{p.payeeKind}</div></td>
              <td><Link className="text-brand underline" href={`/admin/bookings/${b.id}`}>{b.ref}</Link></td>
              <td>{m(p.amount, p.currency, true)}</td>
              <td><Status value={p.status} /></td>
              <td>
                {p.status === "due" ? (
                  <form action={markPayoutPaid} className="flex gap-2"><input type="hidden" name="id" value={p.id} /><input name="reference" placeholder="Bank ref" className="field w-32 py-1" /><button className="btn-secondary px-3 py-1 text-xs">Mark paid</button></form>
                ) : (
                  <span className="text-xs text-muted">{p.reference ?? ""} {when(p.paidAt)}</span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
