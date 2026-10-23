import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { ACTIVE_THEME, THEME_INFO, THEMES } from "@/lib/brand";

export const metadata: Metadata = { title: "Brand options", robots: { index: false, follow: false } };

/** Three colour directions rendered side by side so the owner can choose. Not linked from the site. */
export default function BrandOptions() {
  return (
    <div className="container-page py-12">
      <h1 className="h-display text-5xl">Brand options</h1>
      <p className="mt-3 max-w-2xl text-ink/75">
        Same logo, layout and type, three colour directions. Active now: <strong>{THEME_INFO[ACTIVE_THEME].name}</strong>. To switch, tell Claude which one, or change ACTIVE_THEME in lib/brand.ts.
      </p>
      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {THEMES.map((th) => (
          <section key={th} data-theme={th} className="overflow-hidden rounded-3xl border border-line bg-surface text-ink shadow-sm">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Logo className="text-[13px]" />
              <span className="btn-primary px-3 py-1.5 text-xs">Plan my trip</span>
            </div>
            <div className="px-5 py-8" style={{ background: "radial-gradient(500px 220px at 90% 0%, color-mix(in srgb, var(--sea) 25%, transparent), transparent)" }}>
              <p className="h-display text-4xl leading-tight">Your own yacht for a week.</p>
              <p className="h-display text-3xl text-sea italic">No experience needed.</p>
              <div className="mt-5 flex gap-2">
                <span className="btn-primary px-4 py-2 text-sm">Plan my trip</span>
                <span className="btn-secondary px-4 py-2 text-sm">Destinations</span>
              </div>
            </div>
            <div className="space-y-3 px-5 pb-6">
              <div className="card p-4">
                <div className="flex gap-1.5">
                  <span className="badge bg-brand-soft text-ink">Premium Cat</span>
                  <span className="badge bg-sea text-white">AC</span>
                </div>
                <p className="mt-2 font-semibold">Lagoon 46 · “Selene”</p>
                <p className="text-sm text-muted">Split · 4 cabins · Built 2023</p>
                <p className="mt-2 text-2xl font-semibold">€12,480</p>
                <p className="text-xs text-ok">€12,231 if you pay by bank transfer</p>
              </div>
              <div className="flex gap-2">
                {["--surface", "--surface-2", "--ink", "--brand", "--accent", "--sea"].map((v) => (
                  <span key={v} title={v} className="h-8 flex-1 rounded-lg border border-line" style={{ background: `var(${v})` }} />
                ))}
              </div>
              <div>
                <h2 className="font-semibold">{THEME_INFO[th].name}</h2>
                <p className="text-sm text-muted">{THEME_INFO[th].description}</p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
