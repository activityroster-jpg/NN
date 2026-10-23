import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { Card, m, PageTitle, Status, Table, when } from "@/components/admin/ui";
import { cancelBooking, extendHold, markConfirmedManually, markPaymentReceived, resendCustomerLink, retryConfirm, saveBookingNotes } from "@/lib/admin/actions";
import { getDb } from "@/lib/db";
import { auditLog, booking, crewMember, payout } from "@/lib/db/schema";
import type { Quote } from "@/lib/domain/pricing";
import type { Yacht } from "@/lib/domain/types";
import { paymentsFor } from "@/lib/services/bookings";

export const metadata = { title: "Booking" };

export default async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const b = await db.select().from(booking).where(eq(booking.id, id)).get();
  if (!b) notFound();
  const [payments, payouts, log, crew] = await Promise.all([
    paymentsFor(db, id),
    db.select().from(payout).where(eq(payout.bookingId, id)).all(),
    db.select().from(auditLog).where(and(eq(auditLog.entity, "booking"), eq(auditLog.entityId, id))).orderBy(desc(auditLog.id)).all(),
    db.select().from(crewMember).where(eq(crewMember.active, true)).all(),
  ]);
  const y = b.yachtSnapshot as Yacht;
  const q = b.quoteSnapshot as Quote;
  const exp = (b.sailingExperience ?? {}) as { licence?: string; vhf?: boolean; experience?: string };
  const assigned = new Set((b.crewMemberIds as string[] | null) ?? []);
  const open = ["hold", "awaiting_payment", "paid_deposit", "confirmed"].includes(b.status);
  const hidden = <input type="hidden" name="bookingId" value={b.id} />;

  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="text-sm text-brand underline">← Bookings</Link>
      <PageTitle title={`${b.ref} · ${y.model} “${y.name}”`} sub={`${b.destinationId} · ${y.base.name} · ${b.weekStart} → ${b.weekEnd} · ${b.guests} guests`} actions={<Status value={b.status} />} />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Guest">
          <dl className="space-y-1 text-sm">
            <div><dt className="inline text-muted">Name: </dt><dd className="inline">{b.leadName}</dd></div>
            <div><dt className="inline text-muted">Email: </dt><dd className="inline"><a className="text-brand underline" href={`mailto:${b.leadEmail}`}>{b.leadEmail}</a></dd></div>
            <div><dt className="inline text-muted">Phone: </dt><dd className="inline">{b.leadPhone}</dd></div>
            <div><dt className="inline text-muted">Country: </dt><dd className="inline">{b.leadCountry} · {b.locale}</dd></div>
            <div><dt className="inline text-muted">Licence: </dt><dd className="inline">{exp.licence ?? "—"}{exp.vhf ? " + VHF" : ""}</dd></div>
            {exp.experience && <div className="text-muted">{exp.experience}</div>}
            {b.customerNotes && <div className="mt-2 rounded-lg bg-surface-2/70 p-2">{b.customerNotes}</div>}
          </dl>
          <form action={resendCustomerLink} className="mt-3">{hidden}<button className="text-sm text-brand underline">Email the guest a fresh booking link</button></form>
        </Card>
        <Card title="Operator">
          <dl className="space-y-1 text-sm">
            <div><dt className="inline text-muted">Operator: </dt><dd className="inline">{b.operatorName}</dd></div>
            <div><dt className="inline text-muted">Provider: </dt><dd className="inline">{b.provider} · yacht {b.providerYachtId}</dd></div>
            <div><dt className="inline text-muted">Option ref: </dt><dd className="inline">{b.providerOptionRef ?? "—"}</dd></div>
            <div><dt className="inline text-muted">Booking ref: </dt><dd className="inline">{b.providerBookingRef ?? "—"}</dd></div>
            <div><dt className="inline text-muted">Hold until: </dt><dd className="inline">{when(b.holdExpiresAt)}</dd></div>
            <div><dt className="inline text-muted">Crew: </dt><dd className="inline">skipper {b.skipper} · chef {b.chef} · hostess {b.hostess}</dd></div>
          </dl>
          {open && (
            <div className="mt-4 space-y-3 border-t border-line pt-3">
              {(b.status === "hold" || b.status === "awaiting_payment") && (
                <form action={extendHold} className="flex items-center gap-2">{hidden}<input name="hours" defaultValue={48} className="field w-20 py-1.5" /><button className="btn-secondary px-3 py-1.5 text-sm">Extend hold (h)</button></form>
              )}
              {b.status === "paid_deposit" && (
                <>
                  <form action={retryConfirm}>{hidden}<button className="btn-primary px-3 py-1.5 text-sm">Confirm with operator via API</button></form>
                  <form action={markConfirmedManually} className="flex items-center gap-2">{hidden}<input name="operatorRef" placeholder="Operator ref" className="field py-1.5" /><button className="btn-secondary px-3 py-1.5 text-sm">Mark confirmed</button></form>
                </>
              )}
            </div>
          )}
        </Card>
        <Card title="Money">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Total (card)</dt><dd>{m(b.total, b.currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Total (bank)</dt><dd>{m(b.bankTotal, b.currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Owed to operator</dt><dd>{m(b.payout, b.currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Margin (markup + commission)</dt><dd className="font-semibold">{m(b.margin, b.currency)}</dd></div>
            {q.poolCrew > 0 && <div className="flex justify-between"><dt className="text-muted">Pool crew (we pay crew)</dt><dd>{m(q.poolCrew, b.currency)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted">Markup used</dt><dd>{q.markupPct}%</dd></div>
          </dl>
          <ul className="mt-3 border-t border-line pt-2 text-xs text-muted">
            {q.lines.map((l, i) => <li key={i} className="flex justify-between"><span>{l.label} ({l.source})</span><span>{m(l.amount, b.currency)}</span></li>)}
            {q.payAtBase.map((l, i) => <li key={`b${i}`} className="flex justify-between"><span>{l.label} (at base)</span><span>{m(l.amount, b.currency)}</span></li>)}
          </ul>
        </Card>
      </div>

      <Card title="Customer payments">
        <Table head={["Kind", "Method", "Due", "Amount", "Status", "Paid", ""]} empty={payments.length === 0}>
          {payments.map((p) => (
            <tr key={p.id}>
              <td>{p.kind}</td>
              <td>{p.method}</td>
              <td>{when(p.dueDate)}</td>
              <td>{m(p.amount, p.currency, true)}</td>
              <td><Status value={p.status} /></td>
              <td>{when(p.paidAt)}</td>
              <td>
                {p.status === "pending" && (
                  <form action={markPaymentReceived}><input type="hidden" name="paymentId" value={p.id} /><button className="btn-secondary px-3 py-1 text-xs">Bank transfer received</button></form>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Payouts we owe">
        <Table head={["Payee", "Due", "Amount", "Status", "Reference"]} empty={payouts.length === 0}>
          {payouts.map((p) => (
            <tr key={p.id}><td>{p.payee}</td><td>{when(p.dueDate)}</td><td>{m(p.amount, p.currency, true)}</td><td><Status value={p.status} /></td><td>{p.reference ?? "—"}</td></tr>
          ))}
        </Table>
      </Card>

      <Card title="Notes and crew">
        <form action={saveBookingNotes} className="space-y-3">
          {hidden}
          <textarea name="notes" rows={4} defaultValue={b.adminNotes ?? ""} className="field" placeholder="Internal notes (never shown to the guest)" />
          {crew.length > 0 && (
            <fieldset>
              <legend className="field-label">Assign crew from the pool</legend>
              <div className="flex flex-wrap gap-2">
                {crew.map((c) => (
                  <label key={c.id} className="chip cursor-pointer"><input type="checkbox" name="crew" value={c.id} defaultChecked={assigned.has(c.id)} />{c.name} · {c.role}</label>
                ))}
              </div>
            </fieldset>
          )}
          <button className="btn-primary px-4 py-2 text-sm">Save</button>
        </form>
      </Card>

      {open && (
        <Card title="Cancel">
          <form action={cancelBooking} className="flex flex-wrap items-center gap-2">
            {hidden}
            <input name="reason" placeholder="Reason (internal)" className="field max-w-md py-1.5" />
            <button className="btn px-3 py-1.5 text-sm text-danger ring-1 ring-danger/40">Cancel booking</button>
          </form>
          <p className="mt-2 text-xs text-muted">Releases an unpaid option with the operator. For paid bookings, agree refunds and operator cancellation charges first; refunds are made in Stripe or by bank.</p>
        </Card>
      )}

      <Card title="History">
        <ul className="space-y-1 text-sm">
          {log.map((l) => (
            <li key={l.id}><span className="text-muted">{when(l.at)}</span> · {l.actor} · {l.action}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
