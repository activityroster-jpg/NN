# Setting up Nautical Nomads on Cloudflare

Everything is done in the Cloudflare dashboard of the account that holds
nauticalnomads.com, except step 2 (one line in GitHub).

## 1. Create the database

Storage & Databases → D1 → **Create**. Name `nautical-nomads`, location **Western Europe**.
Copy the **Database ID**.

## 2. Put the Database ID in the repo

GitHub → `wrangler.jsonc` → pencil icon → replace `00000000-0000-0000-0000-000000000000`
with the Database ID → commit.

## 3. Create the tables

D1 → `nautical-nomads` → **Console**. Paste and run, in order, the contents of:

1. `migrations/0000_init.sql`
2. `migrations/0001_audit_append_only.sql`

(Later migrations: the same, one file at a time, in number order.)

## 4. Point the Worker build at this code

Workers & Pages → `nn` → Settings → Build:

- **Production branch**: the branch this code lives on (merge it into `main`, then use `main`).
- **Build command**: `npm run build`
- **Deploy command**: `npx wrangler deploy`

## 5. Secrets

Workers & Pages → `nn` → Settings → Variables and Secrets → Add, type **Secret**:

| Name | What |
|---|---|
| `ADMIN_EMAILS` | Comma-separated admin emails, e.g. `info@nauticalnomads.com,you@gmail.com` |
| `CRON_SECRET` | Any long random string (password manager → generate 40 characters) |
| `RESEND_API_KEY` | Resend → API Keys → create (sending access, domain nauticalnomads.com) |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → restricted key with Checkout Sessions write |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → add endpoint `https://nauticalnomads.com/api/stripe/webhook`, events `checkout.session.completed` and `checkout.session.async_payment_succeeded` → copy the signing secret |
| `MMK_API_TOKEN` | When MMK issues API access |
| `NAUSYS_USERNAME`, `NAUSYS_PASSWORD` | When NauSYS issues API credentials |

Without the booking-manager secrets the site runs on the demo fleet and tells visitors so.
Without Stripe, card payment is hidden and customers pay by bank transfer.

## 6. Domain

Workers & Pages → `nn` → Domains → add custom domains `nauticalnomads.com` and
`www.nauticalnomads.com`. Email Routing for info@ is unaffected.

## 7. First sign-in and settings

Go to `https://nauticalnomads.com/admin`, enter an `ADMIN_EMAILS` address, type the code from the email.
Then:

- **Settings**: bank details customers see, contact phone/WhatsApp.
- **Pricing**: markup (default 10%), bank transfer discount (default 2%), deposit and balance terms.
- **Crew pool**: your skippers and chefs and the weekly price per destination.
- **Destinations**: when live feeds arrive, map each MMK/NauSYS base to a destination.
  Set BVI to "Enquiry only" if the feeds have too few BVI yachts.

## 8. When booking-manager credentials arrive

1. Add the secrets (step 5).
2. Check `lib/providers/mmk.ts` / `nausys.ts` against the official API manual (they were written
   before the manuals were available and are marked UNVERIFIED).
3. Map bases in Admin → Destinations.
4. Run a test hold and cancel it, with the operator's knowledge.
