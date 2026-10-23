"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createBooking, type BookState } from "@/lib/actions/booking";

export interface BookText {
  yourDetails: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  experienceTitle: string;
  experienceHelp: string;
  licence: string;
  licenceNone: string;
  licenceIcc: string;
  licenceDayskipper: string;
  licenceYachtmaster: string;
  licenceOther: string;
  vhf: string;
  experience: string;
  notes: string;
  paymentTitle: string;
  payBank: string;
  payBankHelp: string;
  payCard: string;
  payCardHelp: string;
  agree: string;
  terms: string;
  submitHold: string;
  submitBook: string;
  holdNote: string;
  error: string;
  unavailable: string;
  tooMany: string;
  skipperRequired: string;
}

export function BookForm({
  text,
  mode,
  hidden,
  withSkipper,
  cardAvailable,
  termsHref,
  bankDiscount,
  bankPrice,
  cardPrice,
}: {
  text: BookText;
  mode: "hold" | "book";
  hidden: Record<string, string>;
  withSkipper: boolean;
  cardAvailable: boolean;
  termsHref: string;
  bankDiscount: number;
  bankPrice: string;
  cardPrice: string;
}) {
  const [state, action, pending] = useActionState<BookState, FormData>(createBooking, {});
  const [method, setMethod] = useState<"bank" | "card">("bank");
  const bad = (k: string) => (state.fields?.includes(k) ? "border-danger" : "");
  const [before, after] = text.agree.split("{terms}");
  return (
    <form action={action} className="space-y-6">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <input tabIndex={-1} autoComplete="off" name="website" />
      </div>
      {state.error && (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error === "unavailable" ? text.unavailable : state.error === "rate" ? text.tooMany : state.error === "skipper" ? text.skipperRequired : text.error}
        </p>
      )}

      <fieldset className="card space-y-4 p-5">
        <legend className="sr-only">{text.yourDetails}</legend>
        <h2 className="text-lg font-semibold">{text.yourDetails}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="field-label">{text.name} *</span><input name="name" required autoComplete="name" maxLength={120} className={`field ${bad("name")}`} /></label>
          <label className="block"><span className="field-label">{text.email} *</span><input name="email" type="email" required autoComplete="email" maxLength={200} className={`field ${bad("email")}`} /></label>
          <label className="block"><span className="field-label">{text.phone} *</span><input name="phone" type="tel" required autoComplete="tel" maxLength={40} className={`field ${bad("phone")}`} /></label>
          <label className="block"><span className="field-label">{text.country} *</span><input name="country" required autoComplete="country-name" maxLength={60} className={`field ${bad("country")}`} /></label>
        </div>
      </fieldset>

      <fieldset className="card space-y-4 p-5">
        <h2 className="text-lg font-semibold">{text.experienceTitle}</h2>
        <p className="-mt-2 text-sm text-muted">{text.experienceHelp}</p>
        <label className="block">
          <span className="field-label">{text.licence}{withSkipper ? "" : " *"}</span>
          <select name="licence" className={`field ${bad("licence")}`} defaultValue={withSkipper ? "none" : "icc"}>
            <option value="none">{text.licenceNone}</option>
            <option value="icc">{text.licenceIcc}</option>
            <option value="dayskipper">{text.licenceDayskipper}</option>
            <option value="yachtmaster">{text.licenceYachtmaster}</option>
            <option value="other">{text.licenceOther}</option>
          </select>
        </label>
        {!withSkipper && <p className="text-xs text-muted">{text.skipperRequired}</p>}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="vhf" value="1" className="h-4 w-4 accent-[var(--brand)]" />{text.vhf}</label>
        <label className="block"><span className="field-label">{text.experience}</span><textarea name="experience" rows={3} maxLength={2000} className="field" /></label>
        <label className="block"><span className="field-label">{text.notes}</span><textarea name="notes" rows={2} maxLength={2000} className="field" /></label>
      </fieldset>

      {mode === "book" ? (
        <fieldset className="card space-y-3 p-5">
          <h2 className="text-lg font-semibold">{text.paymentTitle}</h2>
          {(
            [
              ["bank", text.payBank, text.payBankHelp.replace("{discount}", String(bankDiscount)), bankPrice, true],
              ["card", text.payCard, text.payCardHelp, cardPrice, cardAvailable],
            ] as const
          ).map(([v, label, help, price, enabled]) =>
            enabled ? (
              <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${method === v ? "border-brand bg-brand-soft" : "border-line"}`}>
                <input type="radio" name="method" value={v} checked={method === v} onChange={() => setMethod(v)} className="mt-1 h-4 w-4 accent-[var(--brand)]" />
                <span className="flex-1">
                  <span className="flex justify-between gap-2 font-semibold">{label}<span>{price}</span></span>
                  <span className="block text-sm text-muted">{help}</span>
                </span>
              </label>
            ) : null,
          )}
        </fieldset>
      ) : (
        <p className="rounded-xl bg-surface-2/70 p-4 text-sm">{text.holdNote}</p>
      )}

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="agree" value="1" required className={`mt-0.5 h-4 w-4 accent-[var(--brand)] ${bad("agree")}`} />
        <span>
          {before}
          <Link href={termsHref} target="_blank" className="font-semibold text-brand underline">{text.terms}</Link>
          {after}
        </span>
      </label>
      <button type="submit" className="btn-primary w-full py-3.5 text-base sm:w-auto sm:px-10" disabled={pending}>
        {mode === "hold" ? text.submitHold : text.submitBook}
      </button>
    </form>
  );
}
