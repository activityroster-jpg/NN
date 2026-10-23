import { asc } from "drizzle-orm";
import { Card, m, PageTitle, Table } from "@/components/admin/ui";
import { saveCrewMember, saveCrewRate } from "@/lib/admin/actions";
import { getDb } from "@/lib/db";
import { crewMember, crewRate } from "@/lib/db/schema";
import { DESTINATION_IDS } from "@/lib/domain/destinations";

export const metadata = { title: "Crew pool" };
const ROLES = ["skipper", "chef", "hostess"] as const;

export default async function Crew() {
  const db = await getDb();
  const [members, rates] = await Promise.all([db.select().from(crewMember).orderBy(asc(crewMember.name)).all(), db.select().from(crewRate).all()]);
  const rate = (d: string, r: string) => rates.find((x) => x.destinationId === d && x.role === r);
  return (
    <div className="space-y-6">
      <PageTitle title="Crew pool" sub="Your own skippers, chefs and hostesses. Customer prices per destination are set below; they're used when the operator offers no crew, or always if you prefer the pool on the Pricing page." />
      <Card title="Customer prices per week">
        <Table head={["Destination", ...ROLES]}>
          {DESTINATION_IDS.map((d) => (
            <tr key={d}>
              <td className="font-medium">{d}</td>
              {ROLES.map((r) => {
                const x = rate(d, r);
                return (
                  <td key={r}>
                    <form action={saveCrewRate} className="flex items-center gap-1">
                      <input type="hidden" name="destinationId" value={d} /><input type="hidden" name="role" value={r} />
                      <input name="weeklyPrice" defaultValue={x?.weeklyPrice ?? ""} placeholder="—" inputMode="decimal" className="field w-24 py-1" />
                      <select name="currency" defaultValue={x?.currency ?? (d === "bvi" ? "USD" : "EUR")} className="field w-20 py-1"><option>EUR</option><option>USD</option><option>GBP</option></select>
                      <button className="text-xs text-brand underline">Save</button>
                    </form>
                    {x && <span className="text-xs text-muted">{m(x.weeklyPrice, x.currency)}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </Table>
      </Card>
      <Card title="People">
        <div className="space-y-3">
          {[...members, null].map((c) => (
            <form key={c?.id ?? "new"} action={saveCrewMember} className="grid items-end gap-2 rounded-xl border border-line p-3 md:grid-cols-[1.2fr_0.8fr_1.2fr_1fr_0.7fr_0.6fr_auto_auto]">
              <input type="hidden" name="id" value={c?.id ?? ""} />
              <label><span className="field-label text-xs">{c ? "Name" : "Add a person"}</span><input name="name" required defaultValue={c?.name ?? ""} className="field py-1.5" /></label>
              <label><span className="field-label text-xs">Role</span><select name="role" defaultValue={c?.role ?? "skipper"} className="field py-1.5">{ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
              <label><span className="field-label text-xs">Email</span><input name="email" defaultValue={c?.email ?? ""} className="field py-1.5" /></label>
              <label><span className="field-label text-xs">Phone</span><input name="phone" defaultValue={c?.phone ?? ""} className="field py-1.5" /></label>
              <label><span className="field-label text-xs">Their weekly cost</span><input name="weeklyCost" defaultValue={c?.weeklyCost ?? ""} className="field py-1.5" /></label>
              <label><span className="field-label text-xs">Cur.</span><select name="currency" defaultValue={c?.currency ?? "EUR"} className="field py-1.5"><option>EUR</option><option>USD</option><option>GBP</option></select></label>
              {c ? <label className="flex items-center gap-1 pb-2 text-sm"><input type="checkbox" name="active" defaultChecked={c.active} />Active</label> : <span />}
              <button className="btn-secondary px-3 py-1.5 text-sm">{c ? "Save" : "Add"}</button>
              <div className="flex flex-wrap gap-1.5 md:col-span-8">
                {DESTINATION_IDS.map((d) => (
                  <label key={d} className="chip cursor-pointer py-1 text-xs"><input type="checkbox" name="destinations" value={d} defaultChecked={(c?.destinations ?? []).includes(d)} />{d}</label>
                ))}
              </div>
              <input name="notes" defaultValue={c?.notes ?? ""} placeholder="Notes: qualifications, languages, availability" className="field py-1.5 md:col-span-8" />
            </form>
          ))}
        </div>
      </Card>
    </div>
  );
}
