# Setting up Nautical Nomads on Cloudflare

Most steps are clicks in the Cloudflare dashboard of the account that holds
nauticalnomads.com; steps 2 to 4 are in GitHub.

## 1. Create the database

Storage & Databases → D1 → **Create**. Name `nautical-nomads`, location **Western Europe**.
Copy the **Database ID**.

## 2. Put the Database ID in the repo

GitHub → `wrangler.jsonc` → pencil icon → replace `00000000-0000-0000-0000-000000000000`
with the Database ID → commit.

## 3. Let GitHub deploy (tables are created automatically)

Do **not** paste the migration files into the D1 console: the deploy workflow
creates the tables and keeps track of which migrations have run.

1. **Cloudflare API token.** Cloudflare → My Profile → API Tokens → Create Token →
   "Edit Cloudflare Workers" template → add permission **Account → D1 → Edit** →
   Account resources: the account that holds nauticalnomads.com → Zone resources:
   nauticalnomads.com → Create. Copy the token.
2. **Account ID.** Cloudflare → Workers & Pages → right-hand column "Account ID". Copy it.
3. **GitHub secrets.** GitHub → NN → Settings → Secrets and variables → Actions →
   New repository secret: `CLOUDFLARE_API_TOKEN` (the token) and `CLOUDFLARE_ACCOUNT_ID`.

## 4. Make `main` the home of the new site

1. Merge the pull request with the new site into `main`.
2. GitHub → NN → Settings → General → **Default branch** → switch to `main`.
   (GitHub only shows a workflow's "Run workflow" button for workflows on the default branch.)
3. Cloudflare → Workers & Pages → `nn` → Settings → Build → **Disconnect** the Git
   repository. From now on only the GitHub workflow deploys, and it runs migrations
   first. Cloudflare's own build would deploy code without them.

To deploy: GitHub → NN → Actions → **Deploy production** → Run workflow → branch `main`
→ Run. The run summary shows the restore point, and a failed smoke test rolls the
site back automatically.

## 4b. Photo storage

Cloudflare → **R2** → Create bucket → name `nautical-nomads-photos`, location **Europe** (EU
jurisdiction). The Worker serves these photos at `/media/…`. Needed for uploading your own photos
in Admin → Photos and for Pixabay photos (which may not be shown from Pixabay's servers).

## 5. Secrets

Workers & Pages → `nn` → Settings → Variables and Secrets → Add, type **Secret**:

| Name | What |
|---|---|
| `ADMIN_EMAILS` | Comma-separated admin emails, e.g. `info@nauticalnomads.com,you@gmail.com` |
| `CRON_SECRET` | Any long random string (password manager → generate 40 characters) |
| `RESEND_API_KEY` | Resend → API Keys → create (sending access, domain nauticalnomads.com) |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → restricted key with Checkout Sessions write |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → add endpoint `https://nauticalnomads.com/api/stripe/webhook`, events `checkout.session.completed` and `checkout.session.async_payment_succeeded` → copy the signing secret |
| `UNSPLASH_ACCESS_KEY` or `PIXABAY_API_KEY` | Lets Admin → Photos search stock photos. Unsplash photos are shown from Unsplash; Pixabay photos are copied into the storage bucket. `PEXELS_API_KEY` works too if you have one |
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
