import { Card, PageTitle } from "@/components/admin/ui";
import { saveBusinessSettings } from "@/lib/admin/actions";
import { getDb } from "@/lib/db";
import { adminEmails, getEnvAsync } from "@/lib/env";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Settings" };

export default async function Settings() {
  const env = await getEnvAsync();
  const s = await getSettings(await getDb());
  const status: [string, boolean, string][] = [
    ["MMK Booking Manager", !!env.MMK_API_TOKEN, "Secret MMK_API_TOKEN"],
    ["NauSYS", !!(env.NAUSYS_USERNAME && env.NAUSYS_PASSWORD), "Secrets NAUSYS_USERNAME and NAUSYS_PASSWORD"],
    ["Demo fleet forced", env.DEMO_FLEET === "true", "Variable DEMO_FLEET=true (staging only)"],
    ["Stripe card payments", !!env.STRIPE_SECRET_KEY && !!env.STRIPE_WEBHOOK_SECRET, "Secrets STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET"],
    ["Email (Resend)", !!env.RESEND_API_KEY, "Secret RESEND_API_KEY"],
    ["Hourly jobs", !!env.CRON_SECRET, "Secret CRON_SECRET"],
    ["Photo search", !!(env.UNSPLASH_ACCESS_KEY || env.PEXELS_API_KEY), "Secret UNSPLASH_ACCESS_KEY (or PEXELS_API_KEY)"],
  ];
  const f = (name: string, label: string, value: string) => (
    <label className="block"><span className="field-label">{label}</span><input name={name} defaultValue={value} className="field" /></label>
  );
  return (
    <div className="space-y-6">
      <PageTitle title="Settings" />
      <Card title="Connections">
        <ul className="space-y-1.5 text-sm">
          {status.map(([label, ok, how]) => (
            <li key={label} className="flex flex-wrap items-center gap-2">
              <span className={`badge ${ok ? "bg-ok/15 text-ok" : "bg-ink/10 text-muted"}`}>{ok ? "on" : "off"}</span>
              <span className="font-medium">{label}</span><span className="text-xs text-muted">{how}</span>
            </li>
          ))}
          <li className="pt-2 text-xs text-muted">Admins (ADMIN_EMAILS): {adminEmails(env).join(", ") || "none"}</li>
        </ul>
        <p className="mt-3 text-xs text-muted">Secrets are set in Cloudflare → Workers &amp; Pages → nn → Settings → Variables and Secrets, never here.</p>
      </Card>
      <Card title="Bank details shown to customers">
        <form action={saveBusinessSettings} className="grid gap-4 md:grid-cols-3">
          <input type="hidden" name="section" value="settings" />
          {f("accountName", "Account name", s.bank.accountName)}
          {f("bankName", "Bank", s.bank.bankName)}
          {f("iban", "IBAN", s.bank.iban)}
          {f("bic", "BIC / SWIFT", s.bank.bic)}
          {f("sortCode", "UK sort code", s.bank.sortCode)}
          {f("accountNumber", "UK account number", s.bank.accountNumber)}
          <h3 className="pt-2 font-semibold md:col-span-3">Contact</h3>
          {f("contactEmail", "Email", s.contact.email)}
          {f("contactPhone", "Phone (shown on Contact page)", s.contact.phone)}
          {f("whatsapp", "WhatsApp number", s.contact.whatsapp)}
          <div className="md:col-span-3"><button className="btn-primary px-5 py-2 text-sm">Save</button></div>
        </form>
      </Card>
    </div>
  );
}
