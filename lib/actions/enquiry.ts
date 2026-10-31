"use server";

import { z } from "zod";
import { getDb } from "@/lib/db";
import { enquiry } from "@/lib/db/schema";
import { randomId } from "@/lib/crypto";
import { DESTINATION_IDS } from "@/lib/domain/destinations";
import { isIsoDate } from "@/lib/domain/dates";
import { EMAIL_FOOTER, layout, sendMail } from "@/lib/email/send";
import { getEnvAsync, siteUrl } from "@/lib/env";
import { isLocale } from "@/lib/i18n/config";
import { allow } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { audit } from "@/lib/audit";
import { modelById } from "@/lib/fleet";
import { COMPANY } from "@/lib/brand";

export interface EnquiryState {
  ok: boolean;
  errors?: Partial<Record<string, string>>;
  email?: string;
  formError?: "invalid" | "rate";
}

const optStr = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const Schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: optStr(40),
  destinationId: z
    .string()
    .optional()
    .transform((v) => (v && DESTINATION_IDS.includes(v) ? v : undefined)),
  weekStart: z
    .string()
    .optional()
    .transform((v) => (v && isIsoDate(v) ? v : undefined)),
  guests: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().int().min(1).max(30).optional()),
  skipper: z.enum(["yes", "no", "unsure"]).optional(),
  chef: z
    .string()
    .optional()
    .transform((v) => v === "1"),
  budget: optStr(60),
  message: optStr(3000),
  yachtKey: optStr(120),
  locale: z.string().transform((v) => (isLocale(v) ? v : "en")),
  currency: z.enum(["EUR", "GBP", "USD"]).catch("EUR"),
  sourcePath: optStr(300),
  // Honeypot: real people never see or fill this field.
  website: z.string().max(0).optional(),
});

export async function submitEnquiry(_prev: EnquiryState, form: FormData): Promise<EnquiryState> {
  const raw = Object.fromEntries([...form.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    if (raw.website) return { ok: true, email: String(raw.email ?? "") }; // silently drop bots
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] = "invalid";
    return { ok: false, errors, formError: "invalid" };
  }
  const v = parsed.data;
  const db = await getDb();
  const env = await getEnvAsync();
  const ip = await clientIp();
  if (!(await allow(db, `enquiry:${ip}`, 5, 3600))) return { ok: false, formError: "rate" };

  const id = randomId();
  await db.insert(enquiry).values({
    id,
    name: v.name,
    email: v.email,
    phone: v.phone ?? null,
    destinationId: v.destinationId ?? null,
    weekStart: v.weekStart ?? null,
    guests: v.guests ?? null,
    skipper: v.skipper ?? null,
    chef: v.chef,
    budget: v.budget ?? null,
    message: v.message ?? null,
    yachtKey: v.yachtKey ?? null,
    locale: v.locale,
    currency: v.currency,
    sourcePath: v.sourcePath ?? null,
  });
  await audit(db, "public", "create", "enquiry", id, { destinationId: v.destinationId ?? null });

  const lines = [
    `Name: ${v.name}`,
    `Email: ${v.email}`,
    `Phone: ${v.phone ?? "-"}`,
    `Destination: ${v.destinationId ?? "not sure"}`,
    `Week: ${v.weekStart ?? "-"}`,
    `Guests: ${v.guests ?? "-"}`,
    `Skipper: ${v.skipper ?? "-"}   Chef: ${v.chef ? "yes" : "no"}`,
    `Budget: ${v.budget ?? "-"}`,
    `Yachts: ${yachtNames(v.yachtKey)}`,
    `Language: ${v.locale}`,
    "",
    v.message ?? "",
  ];
  const internal = layout("New trip request", lines, { label: "Open in admin", href: `${siteUrl(env)}/admin/enquiries/${id}` });
  await sendMail(env, { to: COMPANY.email, subject: `Trip request: ${v.name}${v.destinationId ? ` · ${v.destinationId}` : ""}`, ...internal, replyTo: v.email });
  const confirm = layout(
    "Thanks, we've got your request",
    [
      `Hi ${v.name.split(" ")[0]},`,
      "Thank you for getting in touch. We'll come back to you within one working day with yachts that fit, real prices and honest advice.",
      "If you think of anything else, just reply to this email.",
      "Nautical Nomads",
    ],
    undefined,
    EMAIL_FOOTER,
  );
  await sendMail(env, { to: v.email, subject: "We've received your charter request", ...confirm });
  return { ok: true, email: v.email };
}

/** "models:lagoon-42,lagoon-43" or "model:x" as model names for the office email. */
function yachtNames(key: string | undefined): string {
  if (!key) return "-";
  const m = /^models?:(.+)$/.exec(key);
  if (!m) return key;
  return m[1]!.split(",").map((id) => modelById(id)?.name ?? id).join(", ");
}
