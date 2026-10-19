import type { CategoryId } from '../config/categories';
import { monthOf, type MonthKey } from './dates';
import { applyRateBps, sumCents } from './money';
import type { Transaction } from './types';

/**
 * A cashback tier applies once the month's eligible spend reaches
 * `minMonthlyEligibleCents`. Today there is one tier (0.25% from S$0);
 * the tiers above the minimum are still undecided.
 */
export interface CashbackTier {
  minMonthlyEligibleCents: number;
  /** Default rate for the tier, in basis points (25 = 0.25%). */
  rateBps: number;
  /** Optional per-category rates that override `rateBps`. */
  categoryRateBps?: Partial<Record<CategoryId, number>>;
}

export interface CashbackPolicy {
  minSpendCents: number;
  capCents: number;
  /** Any order; the highest tier the month qualifies for is used. */
  tiers: readonly CashbackTier[];
}

export function tierFor(policy: CashbackPolicy, monthEligibleCents: number): CashbackTier | undefined {
  return [...policy.tiers]
    .sort((a, b) => b.minMonthlyEligibleCents - a.minMonthlyEligibleCents)
    .find((t) => monthEligibleCents >= t.minMonthlyEligibleCents);
}

export function rateFor(policy: CashbackPolicy, monthEligibleCents: number, categoryId: CategoryId): number {
  const tier = tierFor(policy, monthEligibleCents);
  if (!tier) return 0;
  return tier.categoryRateBps?.[categoryId] ?? tier.rateBps;
}

/** Eligible spend only. Pending and Not eligible never count. */
export function eligibleSpend(transactions: readonly Transaction[]): number {
  return sumCents(transactions.filter((t) => t.status === 'eligible').map((t) => t.amountCents));
}

export interface MonthCashback {
  month: MonthKey;
  eligibleCents: number;
  /** Cashback per transaction id, before the monthly cap. Non-eligible rows are 0. */
  byTransaction: Record<string, number>;
  uncappedCents: number;
  /** What the cardholder actually gets: the sum of rows, limited by the cap. */
  totalCents: number;
  capped: boolean;
}

/**
 * Cashback for one calendar month. Each eligible transaction earns its rate
 * (rounded half up to the cent); the rows are summed and then capped.
 * Summing rounded rows means the rows shown on screen always add up to the
 * monthly total.
 */
export function monthCashback(
  month: MonthKey,
  monthTransactions: readonly Transaction[],
  policy: CashbackPolicy,
): MonthCashback {
  const inMonth = monthTransactions.filter((t) => monthOf(t.date) === month);
  const eligibleCents = eligibleSpend(inMonth);
  const byTransaction: Record<string, number> = {};
  for (const t of inMonth) {
    byTransaction[t.id] =
      t.status === 'eligible' ? applyRateBps(t.amountCents, rateFor(policy, eligibleCents, t.categoryId)) : 0;
  }
  const uncappedCents = sumCents(Object.values(byTransaction));
  const totalCents = Math.min(uncappedCents, policy.capCents);
  return { month, eligibleCents, byTransaction, uncappedCents, totalCents, capped: uncappedCents > policy.capCents };
}

/** Cashback for every month that appears in `transactions`, oldest first. */
export function cashbackByMonth(transactions: readonly Transaction[], policy: CashbackPolicy): MonthCashback[] {
  const months = [...new Set(transactions.map((t) => monthOf(t.date)))].sort();
  return months.map((m) => monthCashback(m, transactions, policy));
}

/** Cashback per transaction id across any number of months. */
export function transactionCashbackMap(
  transactions: readonly Transaction[],
  policy: CashbackPolicy,
): Record<string, number> {
  return Object.assign({}, ...cashbackByMonth(transactions, policy).map((m) => m.byTransaction));
}
