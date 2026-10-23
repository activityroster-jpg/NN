# Nautical Nomads

Yacht charter booking site (agent model) for **ActiveRoster Ltd t/a Nautical Nomads**.
Customers pick a destination and a week, choose a skipper or chef, compare real
yachts with full prices, then hold one free for 24 hours or book with a deposit.

- Next.js 16 on Cloudflare Workers (OpenNext), D1 database (EU), Tailwind 4.
- Six languages (en, de, fr, it, es, nl); prices shown in EUR, GBP or USD,
  always **charged in the operator's currency** (no exchange risk).
- Yachts come from booking managers through adapters in `lib/providers`
  (MMK Booking Manager, NauSYS). Until credentials exist, a clearly labelled
  demo fleet is used.
- Admin at `/admin` (email one-time code; allow-list in the `ADMIN_EMAILS` secret).

## Layout

```
app/[locale]/        public site: home, plan, charter (results), yacht, compare, book, booking, destinations, legal
app/admin/           admin: bookings & holds, enquiries, payouts, operators, pricing, crew, destinations, categories, settings, audit
app/api/             stripe webhook, hourly cron tick, health
lib/domain/          pure business rules: categories, pricing, payment schedule, Offering B pricing, dedupe
lib/providers/       booking-manager adapters + demo fleet
lib/services/        search & pricing, bookings & payments, cron
lib/i18n/            locales and dictionaries
migrations/          D1 migrations (drizzle-kit)
```

## Commands

```
npm run dev            # local site on :3000 (copy .dev.vars.example to .dev.vars first)
npm run db:migrate:local
npm test               # unit tests
npm run typecheck
npm run build          # Cloudflare Worker bundle
npm run db:generate    # after changing lib/db/schema.ts
```

Setup and go-live steps: `docs/setup.md`. Things to do before launch: `docs/launch-checklist.md`.
