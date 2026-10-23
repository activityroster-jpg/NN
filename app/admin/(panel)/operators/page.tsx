import { asc } from "drizzle-orm";
import { Card, PageTitle } from "@/components/admin/ui";
import { saveOperator } from "@/lib/admin/actions";
import { getDb } from "@/lib/db";
import { operator } from "@/lib/db/schema";

export const metadata = { title: "Operators" };

export default async function Operators() {
  const rows = await (await getDb()).select().from(operator).orderBy(asc(operator.name)).all();
  return (
    <div>
      <PageTitle title="Operators" sub="Charter companies appear here automatically the first time their yachts show in a search. Empty fields use the feed or your defaults." />
      {rows.length === 0 && <Card><p className="text-sm text-muted">No operators yet. Run a search on the site and they will appear.</p></Card>}
      <div className="space-y-3">
        {rows.map((o) => (
          <form key={o.id} action={saveOperator} className="card grid items-end gap-3 p-4 md:grid-cols-[1.4fr_repeat(3,0.7fr)_auto_auto_1.2fr_auto]">
            <input type="hidden" name="id" value={o.id} />
            <div><p className="font-semibold">{o.name}</p><p className="text-xs text-muted">{o.provider} · {o.id}</p></div>
            <label><span className="field-label text-xs">Commission %</span><input name="commissionPct" defaultValue={o.commissionPct ?? ""} className="field py-1.5" inputMode="decimal" /></label>
            <label><span className="field-label text-xs">Their deposit %</span><input name="depositPct" defaultValue={o.depositPct ?? ""} className="field py-1.5" inputMode="decimal" /></label>
            <label><span className="field-label text-xs">Balance days before</span><input name="balanceDaysBefore" defaultValue={o.balanceDaysBefore ?? ""} className="field py-1.5" inputMode="numeric" /></label>
            <label className="flex items-center gap-1.5 pb-2 text-sm"><input type="checkbox" name="parityEnforced" defaultChecked={o.parityEnforced} />Price parity</label>
            <label className="flex items-center gap-1.5 pb-2 text-sm"><input type="checkbox" name="active" defaultChecked={o.active} />Active</label>
            <label><span className="field-label text-xs">Notes</span><input name="notes" defaultValue={o.notes ?? ""} className="field py-1.5" /></label>
            <button className="btn-secondary px-3 py-1.5 text-sm">Save</button>
          </form>
        ))}
      </div>
    </div>
  );
}
