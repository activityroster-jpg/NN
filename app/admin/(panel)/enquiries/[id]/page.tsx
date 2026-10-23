import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Card, PageTitle, Status, when } from "@/components/admin/ui";
import { updateEnquiry } from "@/lib/admin/actions";
import { getDb } from "@/lib/db";
import { enquiry } from "@/lib/db/schema";

export const metadata = { title: "Enquiry" };

export default async function EnquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await (await getDb()).select().from(enquiry).where(eq(enquiry.id, id)).get();
  if (!e) notFound();
  const search = e.destinationId && e.weekStart ? `/${e.locale}/charter?d=${e.destinationId}&w=${e.weekStart}&g=${e.guests ?? 4}&s=${e.skipper === "no" ? 0 : 1}&c=${e.chef ? 1 : 0}` : null;
  return (
    <div className="space-y-6">
      <Link href="/admin/enquiries" className="text-sm text-brand underline">← Enquiries</Link>
      <PageTitle title={e.name} sub={`Received ${when(e.createdAt)} · ${e.locale} · prices in ${e.currency}`} actions={<Status value={e.status} />} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Request">
          <dl className="space-y-1 text-sm">
            <div><dt className="inline text-muted">Email: </dt><dd className="inline"><a className="text-brand underline" href={`mailto:${e.email}`}>{e.email}</a></dd></div>
            <div><dt className="inline text-muted">Phone: </dt><dd className="inline">{e.phone ?? "—"}</dd></div>
            <div><dt className="inline text-muted">Destination: </dt><dd className="inline">{e.destinationId ?? "not sure"}</dd></div>
            <div><dt className="inline text-muted">Week: </dt><dd className="inline">{when(e.weekStart)}</dd></div>
            <div><dt className="inline text-muted">Guests: </dt><dd className="inline">{e.guests ?? "—"}</dd></div>
            <div><dt className="inline text-muted">Skipper: </dt><dd className="inline">{e.skipper ?? "—"} · Chef: {e.chef ? "yes" : "no"}</dd></div>
            <div><dt className="inline text-muted">Budget: </dt><dd className="inline">{e.budget ?? "—"}</dd></div>
            <div><dt className="inline text-muted">Yacht: </dt><dd className="inline">{e.yachtKey ?? "—"}</dd></div>
            <div><dt className="inline text-muted">From page: </dt><dd className="inline">{e.sourcePath ?? "—"}</dd></div>
          </dl>
          {e.message && <p className="mt-3 rounded-lg bg-surface-2/70 p-3 text-sm whitespace-pre-wrap">{e.message}</p>}
          {search && <Link href={search} target="_blank" className="btn-secondary mt-4 px-4 py-2 text-sm">Open matching search ↗</Link>}
        </Card>
        <Card title="Follow-up">
          <form action={updateEnquiry} className="space-y-3">
            <input type="hidden" name="id" value={e.id} />
            <select name="status" defaultValue={e.status} className="field">
              {["new", "contacted", "quoted", "won", "lost"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <textarea name="notes" rows={6} defaultValue={e.notes ?? ""} className="field" placeholder="Notes: what you sent, next step…" />
            <button className="btn-primary px-4 py-2 text-sm">Save</button>
          </form>
        </Card>
      </div>
    </div>
  );
}
