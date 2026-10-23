import Link from "next/link";
import type { Currency } from "@/lib/domain/types";
import { formatMoney } from "@/lib/domain/money";

export const m = (amount: number, currency: string, exact = false) => formatMoney(amount, currency as Currency, "en-GB", { exact });

export function PageTitle({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {actions}
    </div>
  );
}

const TONES: Record<string, string> = {
  hold: "bg-sea/15 text-sea",
  awaiting_payment: "bg-warn/15 text-warn",
  paid_deposit: "bg-brand-soft text-brand",
  confirmed: "bg-ok/15 text-ok",
  completed: "bg-ink/10 text-ink",
  cancelled: "bg-danger/10 text-danger",
  expired: "bg-ink/10 text-muted",
  new: "bg-brand-soft text-brand",
  contacted: "bg-sea/15 text-sea",
  quoted: "bg-warn/15 text-warn",
  won: "bg-ok/15 text-ok",
  lost: "bg-ink/10 text-muted",
  pending: "bg-warn/15 text-warn",
  paid: "bg-ok/15 text-ok",
  due: "bg-warn/15 text-warn",
  void: "bg-ink/10 text-muted",
};

export function Status({ value }: { value: string }) {
  return <span className={`badge ${TONES[value] ?? "bg-ink/10"}`}>{value.replace(/_/g, " ")}</span>;
}

export function Card({ title, children, actions }: { title?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="card p-5">
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Table({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="text-left text-xs tracking-wide text-muted uppercase">
            {head.map((h) => (
              <th key={h} className="border-b border-line py-2 pr-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:border-b [&_td]:border-line [&_td]:py-2.5 [&_td]:pr-3 [&_td]:align-top">{children}</tbody>
      </table>
      {empty && <p className="py-6 text-center text-sm text-muted">Nothing here yet.</p>}
    </div>
  );
}

export function Stat({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const body = (
    <>
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </>
  );
  return href ? <Link href={href} className="card block p-4 hover:shadow-sm">{body}</Link> : <div className="card p-4">{body}</div>;
}

export function Tabs({ items, current }: { items: { href: string; label: string; key: string }[]; current: string }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {items.map((i) => (
        <Link key={i.key} href={i.href} className={`chip ${current === i.key ? "chip-on" : ""}`}>{i.label}</Link>
      ))}
    </div>
  );
}

export function when(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: iso.length > 10 ? "short" : undefined, timeZone: "UTC" }).format(new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso));
}
