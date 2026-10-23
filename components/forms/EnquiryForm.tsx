"use client";

import { useActionState } from "react";
import { submitEnquiry, type EnquiryState } from "@/lib/actions/enquiry";
import { IconCheck } from "@/components/Icons";

export interface EnquiryText {
  destination: string;
  anyDestination: string;
  week: string;
  guests: string;
  skipper: string;
  chef: string;
  budget: string;
  message: string;
  name: string;
  email: string;
  phone: string;
  submit: string;
  successTitle: string;
  successText: string;
  error: string;
  privacy: string;
  yes: string;
  no: string;
  notSure: string;
  rate: string;
}

export function EnquiryForm({
  text,
  destinations,
  locale,
  currency,
  defaults = {},
  compact = false,
}: {
  text: EnquiryText;
  destinations: { id: string; name: string }[];
  locale: string;
  currency: string;
  defaults?: { destinationId?: string; weekStart?: string; guests?: number; skipper?: "yes" | "no" | "unsure"; chef?: boolean; yachtKey?: string; sourcePath?: string };
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(submitEnquiry, { ok: false });
  if (state.ok) {
    return (
      <div className="card p-8 text-center" role="status">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ok/15 text-ok">
          <IconCheck className="h-6 w-6" />
        </span>
        <h2 className="h-display mt-4 text-3xl">{text.successTitle}</h2>
        <p className="mt-2 text-ink/75">{text.successText.replace("{email}", state.email ?? "")}</p>
      </div>
    );
  }
  const err = (k: string) => (state.errors?.[k] ? "border-danger" : "");
  return (
    <form action={action} className="card space-y-4 p-5 sm:p-7" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="yachtKey" value={defaults.yachtKey ?? ""} />
      <input type="hidden" name="sourcePath" value={defaults.sourcePath ?? ""} />
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input tabIndex={-1} autoComplete="off" name="website" />
        </label>
      </div>
      {state.formError && (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.formError === "rate" ? text.rate : text.error}
        </p>
      )}
      <div className={`grid gap-4 ${compact ? "" : "sm:grid-cols-3"}`}>
        <label className="block">
          <span className="field-label">{text.destination}</span>
          <select name="destinationId" className="field" defaultValue={defaults.destinationId ?? ""}>
            <option value="">{text.anyDestination}</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="field-label">{text.week}</span>
          <input type="date" name="weekStart" className="field" defaultValue={defaults.weekStart ?? ""} />
        </label>
        <label className="block">
          <span className="field-label">{text.guests}</span>
          <input type="number" name="guests" min={1} max={30} className={`field ${err("guests")}`} defaultValue={defaults.guests ?? 4} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">{text.skipper}</span>
          <select name="skipper" className="field" defaultValue={defaults.skipper ?? "unsure"}>
            <option value="yes">{text.yes}</option>
            <option value="no">{text.no}</option>
            <option value="unsure">{text.notSure}</option>
          </select>
        </label>
        <label className="block">
          <span className="field-label">{text.chef}</span>
          <select name="chef" className="field" defaultValue={defaults.chef ? "1" : "0"}>
            <option value="1">{text.yes}</option>
            <option value="0">{text.no}</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="field-label">{text.budget}</span>
        <input name="budget" maxLength={60} className="field" />
      </label>
      <label className="block">
        <span className="field-label">{text.message}</span>
        <textarea name="message" rows={compact ? 3 : 4} maxLength={3000} className="field" />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="field-label">{text.name} *</span>
          <input name="name" required minLength={2} maxLength={120} autoComplete="name" className={`field ${err("name")}`} />
        </label>
        <label className="block">
          <span className="field-label">{text.email} *</span>
          <input name="email" type="email" required maxLength={200} autoComplete="email" className={`field ${err("email")}`} />
        </label>
        <label className="block">
          <span className="field-label">{text.phone}</span>
          <input name="phone" type="tel" maxLength={40} autoComplete="tel" className="field" />
        </label>
      </div>
      <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs text-muted">{text.privacy}</p>
        <button type="submit" className="btn-primary" disabled={pending}>
          {text.submit}
        </button>
      </div>
    </form>
  );
}
