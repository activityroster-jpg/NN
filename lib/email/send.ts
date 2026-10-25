import type { AppEnv } from "@/lib/env";
import { COMPANY } from "@/lib/brand";

// Transactional email through Resend's HTTP API (no SDK, Workers-friendly).
// Without RESEND_API_KEY (local dev) the message is printed instead of sent.

export interface Mail {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export async function sendMail(env: AppEnv, mail: Mail): Promise<boolean> {
  const from = env.MAIL_FROM ?? `Nautical Nomads <${COMPANY.email}>`;
  if (!env.RESEND_API_KEY) {
    console.log(`[email:dev] to=${String(mail.to)} subject=${mail.subject}\n${mail.text}`);
    return true;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text, reply_to: mail.replyTo ?? COMPANY.email }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error("resend failed", res.status, (await res.text()).slice(0, 300));
    return res.ok;
  } catch (e) {
    console.error("resend error", e);
    return false;
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Minimal branded HTML wrapper. Content lines are escaped; links are passed separately. */
export function layout(title: string, paragraphs: string[], cta?: { label: string; href: string }, footer?: string): { html: string; text: string } {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;line-height:1.55">${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  const button = cta
    ? `<p style="margin:22px 0"><a href="${esc(cta.href)}" style="background:#a8492e;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block">${esc(cta.label)}</a></p>`
    : "";
  const foot = footer ? `<p style="margin:28px 0 0;font-size:12px;color:#6b6258;line-height:1.5">${esc(footer)}</p>` : "";
  const html = `<!doctype html><html><body style="margin:0;background:#faf6ec;font-family:Helvetica,Arial,sans-serif;color:#2a2826">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<p style="letter-spacing:.32em;text-transform:uppercase;font-size:13px;margin:0 0 24px">Nautical&nbsp;&nbsp;Nomads</p>
<div style="background:#fffdf8;border:1px solid #e2d9c6;border-radius:16px;padding:24px">
<h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>${body}${button}</div>${foot}</div></body></html>`;
  const text = [title, "", ...paragraphs, ...(cta ? ["", `${cta.label}: ${cta.href}`] : []), ...(footer ? ["", footer] : [])].join("\n");
  return { html, text };
}

export const EMAIL_FOOTER =
  "Nautical Nomads is a trading name of ActiveRoster Ltd, registered in England & Wales, company number 17505500, 71-75 Shelton Street, London WC2H 9JQ. We act as booking agent for the charter company.";
