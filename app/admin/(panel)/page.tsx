import Link from "next/link";
import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { Card, m, PageTitle, Stat, Status, Table, when } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { booking, enquiry, payment, payout } from "@/lib/db/schema";
import { addDays } from "@/lib/domain/dates";
import type { Yacht } from "@/lib/domain/types";
import { getEnvAsync } from "@/lib/env";
import { todayIso } from "@/lib/request";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const db = await getDb();
  const env = await getEnvAsync();
  const today = todayIso();
  const soon = addDays(today, 14);
  const [newEnq, holds, awaiting, toConfirm, paymentsDue, payoutsDue, recent] = await Promise.all([
    db.select().from(enquiry).where(eq(enquiry.status, "new")).all(),
    db.select().from(booking).where(eq(booking.status, "hold")).orderBy(asc(booking.holdExpiresAt)).all(),
    db.select().from(booking).where(eq(booking.status, "awaiting_payment")).all(),
    db.select().from(booking).where(eq(booking.status, "paid_deposit")).all(),
    db.select({ p: payment, b: booking }).from(payment).innerJoin(booking, eq(payment.bookingId, booking.id)).where(and(eq(payment.status, "pending"), lte(payment.dueDate, soon), inArray(booking.status, ["paid_deposit", "confirmed"]))).orderBy(asc(payment.dueDate)).all(),
    db.select().from(payout).where(and(eq(payout.status, "due"), lte(payout.dueDate, soon))).orderBy(asc(payout.dueDate)).all(),
    db.select().from(booking).where(gte(booking.createdAt, addDays(today, -30))).orderBy(desc(booking.createdAt)).limit(10).all(),
  ]);
  const live = !!(env.MMK_API_TOKEN || (env.NAUSYS_USERNAME && env.NAUSYS_PASSWORD)) && env.DEMO_FLEET !== "true";
  return (
    <div className="space-y-6">
      <PageTitle title="Dashboard" sub={live ? "Live booking-manager feeds are on." : "Demo fleet: no booking-manager credentials yet. Customers see a preview notice."} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="New enquiries" value={newEnq.length} href="/admin/enquiries?status=new" />
        <Stat label="Active holds" value={holds.length} href="/admin/bookings?status=hold" />
        <Stat label="Awaiting payment" value={awaiting.length} href="/admin/bookings?status=awaiting_payment" />
        <Stat label="Paid, confirm with operator" value={toConfirm.length} href="/admin/bookings?status=paid_deposit" />
        <Stat label="Customer payments due 14d" value={paymentsDue.length} />
        <Stat label="Payouts due 14d" value={payoutsDue.length} href="/admin/payouts" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Holds expiring first">
          <Table head={["Ref", "Guest", "Yacht", "Expires"]} empty={holds.length === 0}>
            {holds.slice(0, 8).map((b) => (
              <tr key={b.id}>
                <td><Link className="font-medium text-brand underline" href={`/admin/bookings/${b.id}`}>{b.ref}</Link></td>
                <td>{b.leadName}</td>
                <td>{(b.yachtSnapshot as Yacht).model}</td>
                <td>{when(b.holdExpiresAt)}</td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="Customer payments due">
          <Table head={["Ref", "Kind", "Due", "Amount"]} empty={paymentsDue.length === 0}>
            {paymentsDue.map(({ p, b }) => (
              <tr key={p.id}>
                <td><Link className="font-medium text-brand underline" href={`/admin/bookings/${b.id}`}>{b.ref}</Link></td>
                <td>{p.kind}</td>
                <td>{when(p.dueDate)}</td>
                <td>{m(p.amount, p.currency)}</td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
      <Card title="Latest bookings (30 days)">
        <Table head={["Ref", "Status", "Guest", "Destination", "Week", "Total", "Margin"]} empty={recent.length === 0}>
          {recent.map((b) => (
            <tr key={b.id}>
              <td><Link className="font-medium text-brand underline" href={`/admin/bookings/${b.id}`}>{b.ref}</Link></td>
              <td><Status value={b.status} /></td>
              <td>{b.leadName}</td>
              <td>{b.destinationId}</td>
              <td>{when(b.weekStart)}</td>
              <td>{m(b.total, b.currency)}</td>
              <td>{m(b.margin, b.currency)}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
