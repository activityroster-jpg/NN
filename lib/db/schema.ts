import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// One D1 database (EU). Money is stored as REAL in the booking's currency,
// rounded to cents in code. Timestamps are ISO strings (UTC).

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;

// ── Customers' enquiries (lead capture) ────────────────────────────────────
export const enquiry = sqliteTable(
  "enquiry",
  {
    id: text("id").primaryKey(),
    createdAt: text("created_at").notNull().default(now),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    destinationId: text("destination_id"),
    weekStart: text("week_start"),
    guests: integer("guests"),
    skipper: text("skipper"), // yes | no | unsure
    chef: integer("chef", { mode: "boolean" }),
    budget: text("budget"),
    message: text("message"),
    yachtKey: text("yacht_key"),
    locale: text("locale").notNull().default("en"),
    currency: text("currency").notNull().default("EUR"),
    sourcePath: text("source_path"),
    status: text("status").notNull().default("new"), // new | contacted | quoted | won | lost
    notes: text("notes"),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [index("enquiry_status_idx").on(t.status, t.createdAt)],
);

// ── Bookings and holds ─────────────────────────────────────────────────────
export const booking = sqliteTable(
  "booking",
  {
    id: text("id").primaryKey(),
    ref: text("ref").notNull(),
    /** sha-256 of the secret in the customer's booking link. */
    accessHash: text("access_hash").notNull(),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
    /**
     * hold        24-hour free option, nothing paid
     * awaiting_payment  customer chose to book, first payment pending
     * paid_deposit / paid_full  money received, awaiting operator confirmation
     * confirmed   operator confirmed; balance may still be due
     * completed | cancelled | expired
     */
    status: text("status").notNull(),
    provider: text("provider").notNull(),
    providerYachtId: text("provider_yacht_id").notNull(),
    providerOptionRef: text("provider_option_ref"),
    providerBookingRef: text("provider_booking_ref"),
    holdExpiresAt: text("hold_expires_at"),
    operatorId: text("operator_id").notNull(),
    operatorName: text("operator_name").notNull(),
    destinationId: text("destination_id").notNull(),
    yachtSnapshot: text("yacht_snapshot", { mode: "json" }).notNull(),
    quoteSnapshot: text("quote_snapshot", { mode: "json" }).notNull(),
    weekStart: text("week_start").notNull(),
    weekEnd: text("week_end").notNull(),
    guests: integer("guests").notNull(),
    skipper: text("skipper").notNull().default("none"), // none | operator | pool
    chef: text("chef").notNull().default("none"),
    hostess: text("hostess").notNull().default("none"),
    leadName: text("lead_name").notNull(),
    leadEmail: text("lead_email").notNull(),
    leadPhone: text("lead_phone").notNull(),
    leadCountry: text("lead_country").notNull(),
    sailingExperience: text("sailing_experience", { mode: "json" }),
    customerNotes: text("customer_notes"),
    currency: text("currency").notNull(),
    total: real("total").notNull(),
    bankTotal: real("bank_total").notNull(),
    paymentMethod: text("payment_method").notNull(), // bank | card
    payout: real("payout").notNull(),
    margin: real("margin").notNull(),
    locale: text("locale").notNull().default("en"),
    adminNotes: text("admin_notes"),
    crewMemberIds: text("crew_member_ids", { mode: "json" }),
  },
  (t) => [
    uniqueIndex("booking_ref_uq").on(t.ref),
    index("booking_status_idx").on(t.status, t.weekStart),
    index("booking_hold_idx").on(t.status, t.holdExpiresAt),
  ],
);

export const payment = sqliteTable(
  "payment",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "restrict" }),
    kind: text("kind").notNull(), // deposit | balance | full
    method: text("method").notNull(), // bank | card
    amount: real("amount").notNull(),
    currency: text("currency").notNull(),
    dueDate: text("due_date").notNull(),
    status: text("status").notNull().default("pending"), // pending | paid | refunded | void
    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntent: text("stripe_payment_intent"),
    paidAt: text("paid_at"),
    reminderSentAt: text("reminder_sent_at"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("payment_booking_idx").on(t.bookingId), index("payment_due_idx").on(t.status, t.dueDate)],
);

/** Money we owe operators (and our own crew) for confirmed bookings. */
export const payout = sqliteTable(
  "payout",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "restrict" }),
    payee: text("payee").notNull(), // operator name or crew member
    payeeKind: text("payee_kind").notNull(), // operator | crew
    amount: real("amount").notNull(),
    currency: text("currency").notNull(),
    dueDate: text("due_date").notNull(),
    status: text("status").notNull().default("due"), // due | paid | void
    paidAt: text("paid_at"),
    reference: text("reference"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("payout_due_idx").on(t.status, t.dueDate)],
);

// ── Configuration (deactivate, never delete) ───────────────────────────────
export const operator = sqliteTable("operator", {
  /** `${provider}:${externalId}` as used in Yacht.operatorId. */
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  parityEnforced: integer("parity_enforced", { mode: "boolean" }).notNull().default(false),
  commissionPct: real("commission_pct"),
  depositPct: real("deposit_pct"),
  balanceDaysBefore: integer("balance_days_before"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  notes: text("notes"),
  updatedAt: text("updated_at").notNull().default(now),
});

export const pricingRule = sqliteTable("pricing_rule", {
  id: text("id").primaryKey(),
  operatorId: text("operator_id"),
  destinationId: text("destination_id"),
  categoryId: text("category_id"),
  markupPct: real("markup_pct").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(now),
});

export const crewMember = sqliteTable("crew_member", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(), // skipper | chef | hostess
  email: text("email"),
  phone: text("phone"),
  destinations: text("destinations", { mode: "json" }).$type<string[]>().notNull(),
  weeklyCost: real("weekly_cost"),
  currency: text("currency").notNull().default("EUR"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  notes: text("notes"),
});

/** What we charge customers for our own crew, per destination and role, per week. */
export const crewRate = sqliteTable(
  "crew_rate",
  {
    id: text("id").primaryKey(),
    destinationId: text("destination_id").notNull(),
    role: text("role").notNull(),
    weeklyPrice: real("weekly_price").notNull(),
    currency: text("currency").notNull().default("EUR"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [uniqueIndex("crew_rate_uq").on(t.destinationId, t.role)],
);

/** Admin overrides on the destination catalogue in code. */
export const destinationSetting = sqliteTable("destination_setting", {
  id: text("id").primaryKey(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  featured: integer("featured", { mode: "boolean" }),
  sortOrder: integer("sort_order"),
  heroImageUrl: text("hero_image_url"),
  /** Photographer credit shown under the hero, e.g. "Name / Pexels". */
  heroCredit: text("hero_credit"),
  /** "live" uses the feeds; "enquiry" shows the planner but sends an enquiry instead of results. */
  mode: text("mode").notNull().default("live"),
});

/** Booking-manager bases mapped to our destinations. */
export const providerBase = sqliteTable(
  "provider_base",
  {
    id: text("id").primaryKey(), // `${provider}:${externalId}`
    provider: text("provider").notNull(),
    externalId: text("external_id").notNull(),
    name: text("name").notNull(),
    country: text("country"),
    destinationId: text("destination_id"),
  },
  (t) => [index("provider_base_dest_idx").on(t.destinationId)],
);

export const setting = sqliteTable("setting", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
  updatedAt: text("updated_at").notNull().default(now),
});

export const fxRate = sqliteTable("fx_rate", {
  currency: text("currency").primaryKey(),
  perEur: real("per_eur").notNull(),
  fetchedAt: text("fetched_at").notNull(),
});

// ── Admin auth ─────────────────────────────────────────────────────────────
export const adminOtp = sqliteTable(
  "admin_otp",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    attempts: integer("attempts").notNull().default(0),
    usedAt: text("used_at"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("admin_otp_email_idx").on(t.email, t.createdAt)],
);

export const adminSession = sqliteTable("admin_session", {
  tokenHash: text("token_hash").primaryKey(),
  email: text("email").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(now),
});

// ── Infrastructure ─────────────────────────────────────────────────────────
export const auditLog = sqliteTable(
  "audit_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    at: text("at").notNull().default(now),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    detail: text("detail", { mode: "json" }),
  },
  (t) => [index("audit_entity_idx").on(t.entity, t.entityId)],
);

export const webhookEvent = sqliteTable("webhook_event", {
  id: text("id").primaryKey(), // Stripe event id
  type: text("type").notNull(),
  receivedAt: text("received_at").notNull().default(now),
});

/** Stock-photo search results, kept 24 hours (Pixabay asks for caching and limits calls). */
export const photoCache = sqliteTable("photo_cache", {
  query: text("query").primaryKey(),
  hits: text("hits", { mode: "json" }).notNull(),
  fetchedAt: text("fetched_at").notNull(),
});

export const rateLimit = sqliteTable("rate_limit", {
  key: text("key").primaryKey(),
  windowStart: integer("window_start").notNull(),
  count: integer("count").notNull(),
});

// ── Social posting (Instagram) ─────────────────────────────────────────────
/** The connected Instagram professional account and its long-lived token. */
export const socialAccount = sqliteTable("social_account", {
  provider: text("provider").primaryKey(), // "instagram"
  userId: text("user_id").notNull(), // Instagram professional account id (used to publish)
  username: text("username").notNull(),
  accessToken: text("access_token").notNull(),
  expiresAt: text("expires_at").notNull(),
  refreshedAt: text("refreshed_at"),
  connectedAt: text("connected_at").notNull().default(now),
  connectedBy: text("connected_by").notNull(),
});

/** A photo queued for Instagram: one a day by default, or whenever it is set to. */
export const socialPost = sqliteTable(
  "social_post",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull().default("instagram"),
    imageKey: text("image_key").notNull(), // R2 key under social/
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    caption: text("caption").notNull().default(""),
    note: text("note"), // what the caption writer was told about the photo
    captionSource: text("caption_source"), // claude | workers-ai | template | edited
    status: text("status").notNull().default("scheduled"), // scheduled | posting | posted | failed
    scheduledAt: text("scheduled_at").notNull(),
    postedAt: text("posted_at"),
    remoteId: text("remote_id"),
    permalink: text("permalink"),
    error: text("error"),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
    createdBy: text("created_by").notNull(),
  },
  (t) => [index("social_post_due_idx").on(t.status, t.scheduledAt)],
);
