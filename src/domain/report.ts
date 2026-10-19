import { CATEGORIES, type CategoryId } from '../config/categories';
import { cashbackByMonth, type CashbackPolicy } from './cashback';
import {
  formatDayMonth,
  formatFullDate,
  formatMonthAbbr,
  formatMonthShort,
  isWithin,
  monthOf,
  type IsoDate,
  type MonthKey,
} from './dates';
import { formatSGD, sumCents } from './money';
import type { Card, Transaction } from './types';
import { STATUS_LABELS } from './types';

export const REPORT_RANGE_ERROR = "End date can't be before the start date.";

export type RangeValidation =
  | { valid: true }
  | { valid: false; field: 'from' | 'to'; message: string };

export function validateReportRange(from: IsoDate | undefined, to: IsoDate | undefined): RangeValidation {
  if (!from) return { valid: false, field: 'from', message: 'Choose a start date.' };
  if (!to) return { valid: false, field: 'to', message: 'Choose an end date.' };
  if (to < from) return { valid: false, field: 'to', message: REPORT_RANGE_ERROR };
  return { valid: true };
}

export interface ReportMonthRow {
  month: MonthKey;
  label: string;
  cashbackCents: number;
}

export interface ReportCategoryMonth {
  month: MonthKey;
  label: string;
  /** Cashback per category id for this month. */
  byCategory: Record<CategoryId, number>;
  totalCents: number;
}

export interface ReportTransactionRow {
  id: string;
  dateLabel: string;
  merchant: string;
  amountCents: number;
  /** "S$0.11", or the status label when the row earned nothing. */
  cashbackLabel: string;
  earned: boolean;
}

export interface ReportSection {
  month: MonthKey;
  title: string;
  rows: ReportTransactionRow[];
}

export interface ReportModel {
  title: string;
  subtitle: string;
  from: IsoDate;
  to: IsoDate;
  months: ReportMonthRow[];
  categoryMonths: ReportCategoryMonth[];
  /** Categories with any cashback in the range, for the chart legend. */
  activeCategories: CategoryId[];
  sections: ReportSection[];
  totalCashbackCents: number;
  isEmpty: boolean;
  fileName: string;
}

const emptyByCategory = () =>
  Object.fromEntries(CATEGORIES.map((c) => [c.id, 0])) as Record<CategoryId, number>;

/**
 * Everything the PDF shows, worked out from the transactions in the range.
 * Rows are oldest first within each month, like a statement.
 */
export function buildReportModel(input: {
  card: Card;
  from: IsoDate;
  to: IsoDate;
  transactions: readonly Transaction[];
  policy: CashbackPolicy;
}): ReportModel {
  const { card, from, to, policy } = input;
  const inRange = input.transactions
    .filter((t) => isWithin(t.date, from, to))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.merchant.localeCompare(b.merchant)));

  const perMonth = cashbackByMonth(inRange, policy);

  const months: ReportMonthRow[] = perMonth.map((m) => ({
    month: m.month,
    label: formatMonthShort(m.month),
    cashbackCents: m.totalCents,
  }));

  const categoryMonths: ReportCategoryMonth[] = perMonth.map((m) => {
    const byCategory = emptyByCategory();
    for (const t of inRange) {
      if (monthOf(t.date) === m.month) byCategory[t.categoryId] += m.byTransaction[t.id] ?? 0;
    }
    return { month: m.month, label: formatMonthAbbr(m.month), byCategory, totalCents: m.uncappedCents };
  });

  const activeCategories = CATEGORIES.map((c) => c.id).filter((id) =>
    categoryMonths.some((m) => m.byCategory[id] > 0),
  );

  const sections: ReportSection[] = perMonth.map((m) => ({
    month: m.month,
    title: `Transactions: ${formatMonthShort(m.month)}`,
    rows: inRange
      .filter((t) => monthOf(t.date) === m.month)
      .map((t) => {
        const earned = t.status === 'eligible';
        return {
          id: t.id,
          dateLabel: formatDayMonth(t.date),
          merchant: t.merchant,
          amountCents: t.amountCents,
          cashbackLabel: earned ? formatSGD(m.byTransaction[t.id] ?? 0) : STATUS_LABELS[t.status],
          earned,
        };
      }),
  }));

  return {
    title: 'Cashback report',
    subtitle: `${card.shortName} · •••• ${card.last4} · ${formatFullDate(from)} to ${formatFullDate(to)}`,
    from,
    to,
    months,
    categoryMonths,
    activeCategories,
    sections,
    totalCashbackCents: sumCents(months.map((m) => m.cashbackCents)),
    isEmpty: inRange.length === 0,
    fileName: `cashback-report_${from}_to_${to}.pdf`,
  };
}
