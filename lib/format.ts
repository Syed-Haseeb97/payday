/** Formatting helpers. Every rupee amount in the app goes through formatINR. */

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** ₹1,25,000 (Indian grouping). Negative values render as -₹9,500. */
export function formatINR(value: number, opts: { signed?: boolean } = {}): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : opts.signed && rounded > 0 ? '+' : '';
  return `${sign}₹${inr.format(Math.abs(rounded))}`;
}

/** Compact for chart axes: ₹45K, ₹1.2L, ₹2.5Cr. */
export function formatINRCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_00_00_000) return `${sign}₹${trim(abs / 1_00_00_000)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${trim(abs / 1_00_000)}L`;
  if (abs >= 1_000) return `${sign}₹${trim(abs / 1_000)}K`;
  return `${sign}₹${abs}`;
}

function trim(n: number) {
  return n.toFixed(1).replace(/\.0$/, '');
}

/** Group digits for editable inputs: "125000" → "1,25,000". */
export function groupDigits(value: number | string): string {
  const n = typeof value === 'number' ? value : parseRupees(value);
  if (n === null) return '';
  return inr.format(n);
}

/** Parse user-entered rupees ("₹1,25,000", "125000") into an integer, or null. */
export function parseRupees(input: string): number | null {
  const digits = input.replace(/[^\d]/g, '');
  if (!digits) return null;
  return parseInt(digits, 10);
}

/* ---------- Dates (ISO YYYY-MM-DD, evaluated in UTC to avoid timezone drift) ---------- */

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

/** Whole days from a to b (b - a). */
export function diffDays(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);
}

const fmtShort = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fmtLong = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const fmtWeekday = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' });
const fmtDow = new Intl.DateTimeFormat('en-IN', { weekday: 'short', timeZone: 'UTC' });
const fmtMonth = new Intl.DateTimeFormat('en-IN', { month: 'short', timeZone: 'UTC' });

/** "14 Dec" */
export function formatDate(iso: string): string {
  return fmtShort.format(parseISO(iso));
}
/** "14 Dec 2026" */
export function formatDateLong(iso: string): string {
  return fmtLong.format(parseISO(iso));
}
/** "Sunday, 22 Nov" */
export function formatWeekday(iso: string): string {
  return fmtWeekday.format(parseISO(iso));
}
/** "Sun" */
export function formatDow(iso: string): string {
  return fmtDow.format(parseISO(iso));
}
/** "Dec" */
export function formatMonth(iso: string): string {
  return fmtMonth.format(parseISO(iso));
}

/** "in 10 days", "tomorrow", "today", "9 days overdue" */
export function formatDue(daysFromToday: number): string {
  if (daysFromToday === 0) return 'due today';
  if (daysFromToday === 1) return 'due tomorrow';
  if (daysFromToday > 1) return `due in ${daysFromToday} days`;
  const n = Math.abs(daysFromToday);
  return `${n} ${n === 1 ? 'day' : 'days'} overdue`;
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
