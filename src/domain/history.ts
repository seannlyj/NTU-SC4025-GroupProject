import { categoryName, type CategoryId } from '../config/categories';
import { formatMonthAbbr, formatMonthLong, type MonthKey } from './dates';
import { sumCents } from './money';

export interface CategorySpend {
  categoryId: CategoryId;
  spendCents: number;
}

export interface CategoryMonthToDate extends CategorySpend {
  /** The cardholder's usual monthly spend in this category. */
  usualCents: number;
}

export interface MonthHistory {
  month: MonthKey;
  totalSpendCents: number;
  cashbackCents: number;
  categories: CategorySpend[];
}

/** "▲ Above your usual spending" shows when month-to-date spend is over the usual. */
export function isAboveUsual(spendCents: number, usualCents: number): boolean {
  return usualCents > 0 && spendCents > usualCents;
}

/** Smallest 1, 2 or 5 x 10^n that is >= value. Gives the "This month" bars a round scale. */
export function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 5, 10]) {
    if (step * magnitude >= value) return step * magnitude;
  }
  return 10 * magnitude;
}

export interface MonthToDateRow {
  categoryId: CategoryId;
  name: string;
  spendCents: number;
  usualCents: number;
  /** Bar length, 0..1 of the shared scale */
  fraction: number;
  /** "Your usual" marker position, 0..1 of the shared scale */
  usualFraction: number;
  aboveUsual: boolean;
}

export interface MonthToDateView {
  totalCents: number;
  scaleCents: number;
  rows: MonthToDateRow[];
}

/** Rows for History > This month. Bars and markers share one round scale. */
export function buildMonthToDate(categories: readonly CategoryMonthToDate[]): MonthToDateView {
  const largest = Math.max(0, ...categories.flatMap((c) => [c.spendCents, c.usualCents]));
  const scaleCents = niceCeil(largest);
  return {
    totalCents: sumCents(categories.map((c) => c.spendCents)),
    scaleCents,
    rows: categories.map((c) => ({
      categoryId: c.categoryId,
      name: categoryName(c.categoryId),
      spendCents: c.spendCents,
      usualCents: c.usualCents,
      fraction: c.spendCents / scaleCents,
      usualFraction: c.usualCents / scaleCents,
      aboveUsual: isAboveUsual(c.spendCents, c.usualCents),
    })),
  };
}

export interface MonthBar {
  month: MonthKey;
  label: string;
  longLabel: string;
  totalCents: number;
  /** Height relative to the tallest month, 0..1 */
  fraction: number;
}

export function buildMonthBars(months: readonly MonthHistory[]): MonthBar[] {
  const max = Math.max(0, ...months.map((m) => m.totalSpendCents));
  return months.map((m) => ({
    month: m.month,
    label: formatMonthAbbr(m.month),
    longLabel: formatMonthLong(m.month),
    totalCents: m.totalSpendCents,
    fraction: max > 0 ? m.totalSpendCents / max : 0,
  }));
}

export interface CategoryBreakdownRow {
  categoryId: CategoryId;
  name: string;
  spendCents: number;
  /** Bar length relative to the largest category, 0..1 */
  fraction: number;
}

/** Category bars for one past month (History > Last 6 months). */
export function buildCategoryBreakdown(categories: readonly CategorySpend[]): CategoryBreakdownRow[] {
  const max = Math.max(0, ...categories.map((c) => c.spendCents));
  return categories.map((c) => ({
    categoryId: c.categoryId,
    name: categoryName(c.categoryId),
    spendCents: c.spendCents,
    fraction: max > 0 ? c.spendCents / max : 0,
  }));
}
