import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Card, PageTitle, Status, Table, Tabs, when } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { enquiry } from "@/lib/db/schema";

export const metadata = { title: "Enquiries" };
const STATUSES = ["all", "new", "contacted", "quoted", "won", "lost"];

export default async function Enquiries({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const db = await getDb();
  const q = db.select().from(enquiry);
  const rows = await (STATUSES.includes(status) && status !== "all" ? q.where(eq(enquiry.status, status)) : q).orderBy(desc(enquiry.createdAt)).limit(300).all();
  return (
    <div>
      <PageTitle title="Enquiries" sub="Trip requests from the site. Reply within one working day." />
      <Tabs current={status} items={STATUSES.map((s) => ({ key: s, label: s, href: `/admin/enquiries?status=${s}` }))} />
      <Card>
        <Table head={["Received", "Status", "Name", "Destination", "Week", "Guests", "Skipper/Chef", "Lang"]} empty={rows.length === 0}>
          {rows.map((e) => (
            <tr key={e.id}>
              <td className="whitespace-nowrap"><Link className="text-brand underline" href={`/admin/enquiries/${e.id}`}>{when(e.createdAt)}</Link></td>
              <td><Status value={e.status} /></td>
              <td>{e.name}<div className="text-xs text-muted">{e.email}</div></td>
              <td>{e.destinationId ?? "—"}</td>
              <td>{when(e.weekStart)}</td>
              <td>{e.guests ?? "—"}</td>
              <td>{e.skipper ?? "—"} / {e.chef ? "yes" : "no"}</td>
              <td>{e.locale}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
