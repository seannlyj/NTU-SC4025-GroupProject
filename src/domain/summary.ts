import { monthCashback, type CashbackPolicy } from './cashback';
import type { MonthKey } from './dates';
import { sumCents } from './money';
import type { Transaction, TransactionStatus } from './types';

export interface SpendSplit {
  eligibleCents: number;
  pendingCents: number;
  notEligibleCents: number;
  /** eligible + pending + not eligible */
  totalCents: number;
}

export function splitByStatus(transactions: readonly Transaction[]): SpendSplit {
  const sumOf = (status: TransactionStatus) =>
    sumCents(transactions.filter((t) => t.status === status).map((t) => t.amountCents));
  const eligibleCents = sumOf('eligible');
  const pendingCents = sumOf('pending');
  const notEligibleCents = sumOf('not_eligible');
  return { eligibleCents, pendingCents, notEligibleCents, totalCents: eligibleCents + pendingCents + notEligibleCents };
}

export interface MonthSummary extends SpendSplit {
  month: MonthKey;
  minSpendCents: number;
  /** max(0, minimum - eligible) */
  toGoCents: number;
  minimumMet: boolean;
  /** Eligible progress towards the minimum, 0..1 */
  minimumProgress: number;
  cashbackCents: number;
  capCents: number;
  /** Cashback earned against the monthly cap, 0..1 */
  capProgress: number;
  cashbackByTransaction: Record<string, number>;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function summarizeMonth(
  month: MonthKey,
  monthTransactions: readonly Transaction[],
  policy: CashbackPolicy,
): MonthSummary {
  const split = splitByStatus(monthTransactions);
  const cashback = monthCashback(month, monthTransactions, policy);
  const toGoCents = Math.max(0, policy.minSpendCents - split.eligibleCents);
  return {
    month,
    ...split,
    minSpendCents: policy.minSpendCents,
    toGoCents,
    minimumMet: toGoCents === 0,
    minimumProgress: clamp01(split.eligibleCents / policy.minSpendCents),
    cashbackCents: cashback.totalCents,
    capCents: policy.capCents,
    capProgress: clamp01(cashback.totalCents / policy.capCents),
    cashbackByTransaction: cashback.byTransaction,
  };
}

export interface SplitSegment {
  status: TransactionStatus;
  cents: number;
  /** Share of total card spending, 0..1 */
  fraction: number;
}

/** Segments for the total-spend bar, in the order Eligible, Pending, Not eligible. */
export function splitSegments(split: SpendSplit): SplitSegment[] {
  const parts: [TransactionStatus, number][] = [
    ['eligible', split.eligibleCents],
    ['pending', split.pendingCents],
    ['not_eligible', split.notEligibleCents],
  ];
  return parts.map(([status, cents]) => ({
    status,
    cents,
    fraction: split.totalCents > 0 ? cents / split.totalCents : 0,
  }));
}

/** Newest first. Same-day rows keep their original order. */
export function sortNewestFirst(transactions: readonly Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function recentTransactions(transactions: readonly Transaction[], count = 3): Transaction[] {
  return sortNewestFirst(transactions).slice(0, count);
}
