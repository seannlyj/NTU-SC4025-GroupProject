import { addDays, addMonths, daysInMonth, weekdayOf, type IsoDate, type MonthKey } from './dates';

/**
 * Day of the following month on which a month's cashback is expected.
 * The real crediting rule is not decided; this is the default (ASSUMPTIONS.md).
 */
export const CREDIT_DAY_OF_MONTH = 16;

/**
 * When `month`'s cashback is expected to be credited: the CREDIT_DAY of the
 * following month, moved forward to the Monday when it falls on a weekend.
 * '2026-10' -> '2026-11-16' (a Monday); '2026-04' -> '2026-05-18' (16 May is a Saturday).
 */
export function getExpectedCreditDate(month: MonthKey, creditDay: number = CREDIT_DAY_OF_MONTH): IsoDate {
  const next = addMonths(month, 1);
  const [y, m] = next.split('-').map(Number);
  const day = Math.min(Math.max(1, creditDay), daysInMonth(y, m));
  const date = `${next}-${String(day).padStart(2, '0')}`;
  const weekday = weekdayOf(date);
  if (weekday === 6) return addDays(date, 2); // Saturday -> Monday
  if (weekday === 0) return addDays(date, 1); // Sunday -> Monday
  return date;
}
