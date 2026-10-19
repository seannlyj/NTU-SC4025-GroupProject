import type { CategoryId } from '../../config/categories';
import type { CategoryMonthToDate } from '../../domain/history';
import { dollars } from '../../domain/money';
import type { Transaction, TransactionStatus } from '../../domain/types';

/**
 * October 2026 seed, exactly as in the brief.
 * Total S$2,100.00 = Eligible S$620.00 + Pending S$300.00 + Not eligible S$1,180.00.
 *
 * Categories per row are our own choice (the brief does not give them).
 * They only drive the Transactions filter; see the category summary below.
 */
type Row = [day: string, merchant: string, amount: number, status: TransactionStatus, category: CategoryId, rule?: string];

const ROWS: Row[] = [
  ['12', 'A', 82, 'pending', 2],
  ['11', 'B', 44, 'eligible', 1],
  ['10', 'C', 120, 'not_eligible', 3, 'payments-and-top-ups'], // e.g. a bill paid through AXS
  ['10', 'D', 200, 'pending', 1],
  ['09', 'E', 18, 'pending', 7],
  ['08', 'F', 64, 'eligible', 3],
  ['07', 'G', 32, 'eligible', 2],
  ['06', 'H', 480, 'not_eligible', 5, 'insurance-education-health'], // e.g. an insurance premium
  ['05', 'I', 120, 'eligible', 3],
  ['04', 'J', 350, 'not_eligible', 2, 'government-and-other'], // e.g. a tax payment
  ['03', 'K', 200, 'eligible', 1],
  ['02', 'L', 160, 'eligible', 2],
  ['01', 'M', 230, 'not_eligible', 6, 'fees-and-instalments'], // e.g. an instalment plan
];

export const OCTOBER_MONTH = '2026-10';

export const OCTOBER_TRANSACTIONS: Transaction[] = ROWS.map(([day, merchant, amount, status, categoryId, rule]) => ({
  id: `2026-10-${merchant}`,
  date: `2026-10-${day}`,
  merchant: `Merchant ${merchant}`,
  amountCents: dollars(amount),
  status,
  categoryId,
  ...(rule ? { ineligibleRuleId: rule } : {}),
}));

/**
 * Category summary for October, as the bank's categorisation service would
 * send it (decision B in ASSUMPTIONS.md). These are the wireframe figures.
 * They reconcile with the transactions at the total level (S$2,100.00 spend,
 * S$1.55 cashback) but cannot be rebuilt row by row from the 13 transactions.
 *
 * `usualCents` is the "Your usual" marker, read from the wireframe positions.
 */
const SUMMARY: [CategoryId, spend: number, cashback: number, usual: number][] = [
  [1, 455, 0.62, 600],
  [2, 626, 0.48, 400],
  [3, 300, 0.45, 350],
  [4, 80, 0, 200],
  [5, 400, 0, 250],
  [6, 100, 0, 150],
  [7, 40, 0, 100],
  [8, 99, 0, 100],
];

export interface OctoberCategoryStat extends CategoryMonthToDate {
  cashbackCents: number;
}

export const OCTOBER_CATEGORY_SUMMARY: OctoberCategoryStat[] = SUMMARY.map(([categoryId, spend, cashback, usual]) => ({
  categoryId,
  spendCents: dollars(spend),
  cashbackCents: dollars(cashback),
  usualCents: dollars(usual),
}));
