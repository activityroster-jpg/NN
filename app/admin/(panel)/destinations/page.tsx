import { asc } from "drizzle-orm";
import { Card, PageTitle, Table } from "@/components/admin/ui";
import { saveDestination, saveProviderBase } from "@/lib/admin/actions";
import { getDb } from "@/lib/db";
import { providerBase } from "@/lib/db/schema";
import { DESTINATION_IDS } from "@/lib/domain/destinations";
import { destinationViews } from "@/lib/services/destination-settings";

export const metadata = { title: "Destinations" };

export default async function Destinations() {
  const db = await getDb();
  const [views, bases] = await Promise.all([destinationViews(db), db.select().from(providerBase).orderBy(asc(providerBase.provider), asc(providerBase.name)).all()]);
  return (
    <div className="space-y-6">
      <PageTitle title="Destinations" sub="Featured destinations lead the site. Live mode shows yachts from the feeds; enquiry mode shows a request form instead (useful for BVI until feeds cover it)." />
      <Card>
        <div className="space-y-2">
          {views.map((d) => (
            <form key={d.id} action={saveDestination} className="grid items-center gap-2 rounded-xl border border-line p-3 md:grid-cols-[160px_auto_auto_140px_90px_1fr_auto]">
              <input type="hidden" name="id" value={d.id} />
              <span className="font-semibold">{d.id}</span>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="active" defaultChecked={d.active} />Active</label>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="featured" defaultChecked={d.featured} />Featured</label>
              <select name="mode" defaultValue={d.mode} className="field py-1.5"><option value="live">Live yachts</option><option value="enquiry">Enquiry only</option></select>
              <input name="sortOrder" defaultValue={d.sortOrder} className="field py-1.5" title="Order" />
              <input name="heroImageUrl" defaultValue={d.heroImageUrl ?? ""} placeholder="Hero photo URL (https://…)" className="field py-1.5" />
              <button className="btn-secondary px-3 py-1.5 text-sm">Save</button>
            </form>
          ))}
        </div>
      </Card>
      <Card title="Booking-manager bases">
        <p className="mb-3 text-sm text-muted">Each MMK or NauSYS base (marina) must be mapped to a destination before its yachts appear. Base ids come from the provider&apos;s base list once credentials are active.</p>
        <form action={saveProviderBase} className="mb-4 grid gap-2 md:grid-cols-[120px_140px_1fr_200px_auto]">
          <select name="provider" className="field py-1.5"><option value="mmk">MMK</option><option value="nausys">NauSYS</option></select>
          <input name="externalId" placeholder="Base id" required className="field py-1.5" />
          <input name="name" placeholder="Base name, e.g. ACI Marina Split" required className="field py-1.5" />
          <select name="destinationId" className="field py-1.5"><option value="">Not mapped</option>{DESTINATION_IDS.map((d) => <option key={d}>{d}</option>)}</select>
          <button className="btn-secondary px-3 py-1.5 text-sm">Save base</button>
        </form>
        <Table head={["Provider", "Base id", "Name", "Destination"]} empty={bases.length === 0}>
          {bases.map((b) => (
            <tr key={b.id}><td>{b.provider}</td><td>{b.externalId}</td><td>{b.name}</td><td>{b.destinationId ?? <span className="text-warn">not mapped</span>}</td></tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
