# Before launch

## Legal (owner)
- [ ] UK travel lawyer reviews `lib/legal/docs.ts` (booking conditions, privacy, cookies) and the
      agent model: we collect customer money on the operator's behalf without bonding.
- [ ] Confirm selling our own crew pool alongside an operator's yacht doesn't make us a package organiser.
- [ ] Professional indemnity insurance.
- [ ] Offering B (selling a category, we choose the yacht) stays off until the lawyer signs off:
      it makes us principal, which brings package-travel and insolvency-protection duties.
- [ ] ICO registration (data protection fee) for ActiveRoster Ltd if not already paid.

## Accounts (owner)
- [ ] MMK, NauSYS (and YachtSys) agency accounts and API credentials.
- [ ] Multi-currency business bank account (EUR, USD, GBP) so we never convert customer money.
- [ ] Stripe account for ActiveRoster Ltd t/a Nautical Nomads, webhook configured.
- [ ] Resend API key on the nauticalnomads.com domain.
- [ ] TikTok URL (the link is hidden until set in `lib/brand.ts`).

## Content (owner)
- [ ] Pick a colour direction at `/en/brand-options`.
- [ ] Destination hero photos (owned or licensed), set in Admin → Destinations.
- [ ] Native-speaker review of the de/fr/it/es/nl translations.
- [ ] Crew pool rates per destination.

## Technical (Claude)
- [ ] Verify MMK/NauSYS adapters against the manuals; map bases; test hold/cancel.
- [ ] Booking-manager extras (NauSYS services) once the manual confirms the shape.
- [ ] Upgrade path: hero images via R2 upload instead of URLs.
