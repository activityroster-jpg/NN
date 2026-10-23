// Calendar helpers on ISO dates (YYYY-MM-DD), always in UTC so a date never
// shifts with the server's or visitor's timezone.

const DAY_MS = 86_400_000;

export function parseIsoDate(s: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(`Bad ISO date: ${s}`);
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || toIsoDate(d) !== s) throw new Error(`Bad ISO date: ${s}`);
  return d;
}

export function isIsoDate(s: string): boolean {
  try {
    parseIsoDate(s);
    return true;
  } catch {
    return false;
  }
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return toIsoDate(new Date(parseIsoDate(iso).getTime() + days * DAY_MS));
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseIsoDate(toIso).getTime() - parseIsoDate(fromIso).getTime()) / DAY_MS);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(iso: string): number {
  return parseIsoDate(iso).getUTCDay();
}

/** The Saturday on or after `iso`. Charter weeks in our core destinations run Saturday to Saturday. */
export function nextSaturday(iso: string): string {
  const wd = weekday(iso);
  return addDays(iso, (6 - wd + 7) % 7);
}

/** Saturdays from `fromIso` (inclusive, rounded up) for `count` weeks. */
export function saturdays(fromIso: string, count: number): string[] {
  const first = nextSaturday(fromIso);
  return Array.from({ length: count }, (_, i) => addDays(first, i * 7));
}

export function monthOf(iso: string): number {
  return parseIsoDate(iso).getUTCMonth() + 1;
}
