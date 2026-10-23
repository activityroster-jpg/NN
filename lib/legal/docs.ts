// Legal documents, English only (the English version applies in every language).
// DRAFTS written for an agent business model: have them reviewed by a UK travel
// lawyer before launch (see docs/launch-checklist.md).

import { COMPANY } from "@/lib/brand";

export interface LegalDoc {
  title: string;
  updated: string;
  sections: { heading?: string; paragraphs?: string[]; bullets?: string[] }[];
}

const who = `${COMPANY.tradingName} is a trading name of ${COMPANY.legalName}, a company registered in ${COMPANY.jurisdiction} (company number ${COMPANY.number}), registered office ${COMPANY.address}. Email: ${COMPANY.email}.`;

export const LEGAL_DOCS: Record<"booking-conditions" | "privacy" | "cookies", LegalDoc> = {
  "booking-conditions": {
    title: "Booking conditions",
    updated: "2026-10-23",
    sections: [
      { heading: "1. Who we are and our role", paragraphs: [who, "We act as a booking agent for independent yacht charter companies (\"the Operator\"). When you book a yacht through us, your charter contract is made directly with the Operator named in your booking. We arrange the booking, collect payments on the Operator's behalf and pass them on, and support you before and during your trip. We do not own or operate any yacht."] },
      { heading: "2. The Operator's terms", paragraphs: ["Your charter is subject to the Operator's own charter agreement, which covers check-in and check-out, the security deposit, damage, insurance, cancellation by the Operator, cruising limits and the skipper's responsibilities. We will send it to you before your balance is due, and you can ask for it at any time. Where these booking conditions and the Operator's terms differ on the charter itself, the Operator's terms apply."] },
      { heading: "3. Holds", paragraphs: ["A hold (\"option\") asks the Operator to reserve a yacht for you for a limited time, normally 24 hours, at no cost. If you do not book before the hold ends, the yacht is released automatically."] },
      { heading: "4. Prices", paragraphs: ["Prices are for the whole yacht for the stated period and include the crew and extras you selected. Charges marked \"paid at the base\" are paid by you directly to the Operator on arrival. Fuel, marina and mooring fees, food and drink, and the crew's meals are not included unless stated. Prices are charged in the Operator's currency; amounts shown in other currencies are approximate and for information only.", "Paying by bank transfer is cheaper than paying by card because it costs us less to receive. We do not add a surcharge to card payments."] },
      { heading: "5. Payment", paragraphs: ["To book, you pay a deposit; the balance is due on the date shown in your booking. If you book close to departure the full price is due at once. Your booking is confirmed when the Operator confirms it after your payment arrives. If the Operator cannot confirm, we will refund what you paid in full.", "If the balance is not paid on time, the Operator may cancel the charter and apply its cancellation charges."] },
      { heading: "6. Cancellation by you", paragraphs: ["Tell us in writing. Cancellation charges are those of the Operator's charter agreement and usually increase as the departure date approaches; we will tell you the amount before you cancel. We strongly recommend cancellation and travel insurance."] },
      { heading: "7. Changes and cancellation by the Operator", paragraphs: ["If the Operator cannot provide the yacht, it will normally offer a similar or better yacht. If you do not accept the alternative, you are entitled to a full refund of the money paid."] },
      { heading: "8. Skipper, licences and crew", paragraphs: ["For a charter without a skipper, the person in charge must hold the licences required in the cruising area and have the experience to handle the yacht. The Operator checks documents at the base and may require you to take a skipper (at your cost) if they are not satisfied.", "Skippers, chefs and hostesses are provided either by the Operator or by independent professionals we arrange; your booking states which. They are responsible for the safe operation of the yacht and their own service."] },
      { heading: "9. Security deposit and damage", paragraphs: ["The Operator takes a refundable security deposit at check-in, usually on a credit card. A damage waiver, where offered, reduces it. Claims against the deposit are a matter between you and the Operator."] },
      { heading: "10. Our liability", paragraphs: ["We are responsible for arranging your booking with reasonable care and skill. We are not responsible for the performance of the charter itself, which is the Operator's responsibility. Nothing in these conditions limits liability for death or personal injury caused by our negligence, for fraud, or any other liability that cannot be limited by law."] },
      { heading: "11. Complaints", paragraphs: ["If something goes wrong during the charter, tell the Operator's base and us straight away so it can be put right. Send any complaint to us in writing within 28 days of your return and we will help you resolve it with the Operator."] },
      { heading: "12. Law", paragraphs: ["These conditions are governed by the law of England and Wales. If you live elsewhere in the UK or in the EU you keep the protection of the mandatory rules of your country of residence."] },
    ],
  },
  privacy: {
    title: "Privacy notice",
    updated: "2026-10-23",
    sections: [
      { heading: "Who we are", paragraphs: [who, `${COMPANY.legalName} is the controller of the personal data described here. Contact us at ${COMPANY.email} about anything in this notice.`] },
      { heading: "What we collect", bullets: ["Trip requests: your name, email, phone (optional), destination, dates, group size and anything you tell us.", "Bookings: the lead guest's name, email, phone, country, sailing licence and experience, and booking and payment records.", "Card payments are processed by Stripe; we never see or store your card number.", "Technical data needed to run the site securely, such as your IP address for rate limiting, kept briefly."] },
      { heading: "Why we use it", bullets: ["To answer your request and arrange your charter (contract or steps before a contract).", "To pass the details the charter company needs to hold and confirm your yacht (contract).", "To keep accounting and tax records (legal obligation; kept for six years).", "To keep the site secure and prevent abuse (legitimate interests)."] },
      { heading: "Who we share it with", bullets: ["The charter company that owns your yacht, and through it the booking system it uses (such as MMK Booking Manager or NauSYS). The charter company is a separate controller of your data.", "Your skipper or chef, if we arrange one: only what they need for the trip.", "Service providers acting for us: Cloudflare (hosting, database, EU), Resend (email), Stripe (card payments)."] },
      { heading: "International transfers", paragraphs: ["Some providers and charter companies are outside the UK. Where data leaves the UK we rely on adequacy regulations or standard contractual clauses. Charter companies in non-EU destinations (for example the British Virgin Islands) receive the details needed to deliver your charter, which is necessary for your contract."] },
      { heading: "How long we keep it", paragraphs: ["Trip requests that do not lead to a booking: two years. Booking and payment records: six years after the trip, for tax and accounting. You can ask us to delete data we no longer need."] },
      { heading: "Your rights", paragraphs: ["You can ask for access to, correction or deletion of your data, object to or restrict its use, and ask for a copy in a portable format. Contact us; we reply within one month. You can also complain to the Information Commissioner's Office (ico.org.uk)."] },
      { heading: "No marketing without consent", paragraphs: ["We only email you about your request or booking. We do not send marketing unless you ask us to."] },
    ],
  },
  cookies: {
    title: "Cookies",
    updated: "2026-10-23",
    sections: [
      { paragraphs: ["We use only what the site needs to work. There are no advertising or tracking cookies, so we do not ask for consent."] },
      { bullets: ["nn_ccy: remembers the currency you chose for displaying prices (one year).", "nn_admin: keeps our own staff signed in to the admin area (seven days). Visitors never receive it.", "Your comparison list is stored in your browser's local storage on your device only."] },
      { paragraphs: ["Our hosting provider, Cloudflare, may set strictly necessary security cookies to protect the site from attacks."] },
    ],
  },
};
