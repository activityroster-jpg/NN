import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { adminSignOut } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

const NAV = [
  ["/admin", "Dashboard"],
  ["/admin/bookings", "Bookings & holds"],
  ["/admin/enquiries", "Enquiries"],
  ["/admin/payouts", "Payouts"],
  ["/admin/operators", "Operators"],
  ["/admin/pricing", "Pricing"],
  ["/admin/crew", "Crew pool"],
  ["/admin/destinations", "Destinations"],
  ["/admin/photos", "Photos"],
  ["/admin/narration", "Narration"],
  ["/admin/categories", "Categories (B)"],
  ["/admin/settings", "Settings"],
  ["/admin/audit", "Audit log"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[230px_1fr]">
      <aside className="border-b border-line bg-surface-2/60 lg:min-h-dvh lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-4 lg:block">
          <Link href="/admin"><Logo className="text-[12px] tracking-[0.22em] sm:text-[12px]" /></Link>
          <p className="hidden text-xs text-muted lg:mt-1 lg:block">Admin</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-ink/80 hover:bg-ink/5 hover:text-ink">{label}</Link>
          ))}
          <Link href="/en" target="_blank" className="shrink-0 rounded-lg px-3 py-2 text-sm text-muted hover:bg-ink/5">View site ↗</Link>
        </nav>
        <div className="hidden px-5 py-4 text-xs text-muted lg:block">
          <p className="truncate">{email}</p>
          <form action={adminSignOut}><button className="mt-1 text-brand underline">Sign out</button></form>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-8">{children}</main>
    </div>
  );
}
