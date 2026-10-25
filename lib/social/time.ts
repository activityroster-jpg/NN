// Wall-clock times in the business time zone (settings.social.timezone)
// without a date library: Intl tells us the zone's offset at any instant.

function partsIn(at: Date, tz: string): Record<string, number> {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(at);
  const out: Record<string, number> = {};
  for (const p of parts) if (p.type !== "literal") out[p.type] = Number(p.value);
  return out;
}

/** Offset of the zone at that instant, in milliseconds (positive east of UTC). */
function offsetMs(at: Date, tz: string): number {
  const p = partsIn(at, tz);
  const asUtc = Date.UTC(p.year!, p.month! - 1, p.day!, p.hour!, p.minute!, p.second!);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** The instant for a local date ("2026-06-01") and time ("18:00") in the zone. */
export function zonedToUtc(date: string, time: string, tz: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y!, m! - 1, d!, hh!, mm!);
  let utc = guess - offsetMs(new Date(guess), tz);
  const again = guess - offsetMs(new Date(utc), tz); // across a clock change the first guess is off by an hour
  if (again !== utc) utc = again;
  return new Date(utc);
}

const two = (n: number) => String(n).padStart(2, "0");

/** "2026-06-01" for an instant, in the zone. */
export function localDate(at: Date, tz: string): string {
  const p = partsIn(at, tz);
  return `${p.year}-${two(p.month!)}-${two(p.day!)}`;
}

/** "18:00" for an instant, in the zone. */
export function localTime(at: Date, tz: string): string {
  const p = partsIn(at, tz);
  return `${two(p.hour!)}:${two(p.minute!)}`;
}

/** The local date `days` days after a local date. */
export function addLocalDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y!, m! - 1, d! + days));
  return `${t.getUTCFullYear()}-${two(t.getUTCMonth() + 1)}-${two(t.getUTCDate())}`;
}

/** "Sat 25 Oct" for a local date. */
export function dateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

/** Every half hour of the day, "00:00" … "23:30". */
export const HALF_HOURS = Array.from({ length: 48 }, (_, i) => `${two(Math.floor(i / 2))}:${i % 2 ? "30" : "00"}`);
