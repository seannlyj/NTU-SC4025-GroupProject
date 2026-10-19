/**
 * Calendar helpers that work on plain strings, so there are no time-zone
 * surprises: dates are 'YYYY-MM-DD', months are 'YYYY-MM' and a date-time is
 * 'YYYY-MM-DDTHH:mm' in Singapore time.
 */
export type IsoDate = string;
export type MonthKey = string;
export type IsoDateTime = string;

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string') return false;
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const [, y, mo, d] = m.map(Number);
  return mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(y, mo);
}

function parts(iso: IsoDate): [number, number, number] {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return [y, m, d];
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function monthOf(iso: IsoDate): MonthKey {
  return iso.slice(0, 7);
}

export function firstDayOf(month: MonthKey): IsoDate {
  return `${month}-01`;
}

export function lastDayOf(month: MonthKey): IsoDate {
  const [y, m] = month.split('-').map(Number);
  return `${month}-${pad(daysInMonth(y, m))}`;
}

export function addMonths(month: MonthKey, delta: number): MonthKey {
  const [y, m] = month.split('-').map(Number);
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}

/** The `count` full calendar months before `current`, oldest first. */
export function previousMonths(current: MonthKey, count: number): MonthKey[] {
  return Array.from({ length: count }, (_, i) => addMonths(current, i - count));
}

/** Every month touched by the inclusive range, oldest first. */
export function monthsBetween(from: IsoDate, to: IsoDate): MonthKey[] {
  const out: MonthKey[] = [];
  for (let m = monthOf(from); m <= monthOf(to); m = addMonths(m, 1)) out.push(m);
  return out;
}

/** Inclusive range check; a missing bound is open. */
export function isWithin(date: IsoDate, from?: IsoDate, to?: IsoDate): boolean {
  return (!from || date >= from) && (!to || date <= to);
}

/** '2026-10-12' -> '12 Oct' */
export function formatDayMonth(iso: IsoDate): string {
  const [, m, d] = parts(iso);
  return `${pad(d)} ${MONTHS_SHORT[m - 1]}`;
}

/** '2026-10-01' -> '01 Oct 2026' */
export function formatFullDate(iso: IsoDate): string {
  const [y, m, d] = parts(iso);
  return `${pad(d)} ${MONTHS_SHORT[m - 1]} ${y}`;
}

/** '2026-04' -> 'Apr 2026' */
export function formatMonthShort(month: MonthKey): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS_SHORT[m - 1]} ${y}`;
}

/** '2026-04' -> 'Apr' */
export function formatMonthAbbr(month: MonthKey): string {
  const m = Number(month.split('-')[1]);
  return MONTHS_SHORT[m - 1];
}

/** '2026-09' -> 'September 2026' */
export function formatMonthLong(month: MonthKey): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS_LONG[m - 1]} ${y}`;
}

/** '2026-10' -> 'October' */
export function formatMonthName(month: MonthKey): string {
  return MONTHS_LONG[Number(month.split('-')[1]) - 1];
}

/** '2026-10-12T22:10' -> '12 Oct, 22:10' */
export function formatUpdatedAt(dateTime: IsoDateTime): string {
  return `${formatDayMonth(dateTime.slice(0, 10))}, ${dateTime.slice(11, 16)}`;
}

/** ('2026-10-01', '2026-10-12') -> '01 Oct – 12 Oct' */
export function formatShortRange(from: IsoDate, to: IsoDate): string {
  return `${formatDayMonth(from)} – ${formatDayMonth(to)}`;
}
