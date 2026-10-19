import type { CategoryId } from '../../config/categories';
import { EXCLUSION_RULE_IDS } from '../../config/eligibilityRules';
import { dollars } from '../../domain/money';
import type { Transaction, TransactionStatus } from '../../domain/types';

/**
 * Mock transactions for the six full months before October.
 *
 * Built so that, with the real cashback rules, they produce the wireframe
 * figures (the seed test checks every one):
 * - monthly cashback Apr S$1.12, May S$1.48, Jun S$0.97, Jul S$1.30, Aug S$1.66, Sep S$1.21
 * - September total S$2,226.00 and its eight category totals
 * - the first three April rows shown in the PDF wireframe
 * Monthly totals for Apr-Aug are read from the bar heights in the wireframe.
 */
type Row = [day: string, merchant: string, amount: number, status: 'E' | 'N', category: CategoryId];

const MONTHS: Record<string, Row[]> = {
  '2026-04': [
    ['03', 'A', 42.5, 'E', 1],
    ['09', 'B', 18, 'E', 2],
    ['15', 'C', 120, 'N', 5],
    ['16', 'D', 120, 'E', 1],
    ['17', 'E', 257.5, 'N', 1],
    ['18', 'F', 104, 'E', 2],
    ['20', 'G', 178, 'N', 2],
    ['21', 'H', 80, 'E', 3],
    ['22', 'I', 130, 'N', 3],
    ['24', 'J', 80, 'E', 4],
    ['25', 'K', 60, 'N', 4],
    ['26', 'L', 80, 'N', 6],
    ['28', 'M', 60, 'N', 7],
    ['29', 'N', 40, 'N', 8],
  ],
  '2026-05': [
    ['02', 'A', 180, 'E', 1],
    ['04', 'B', 160, 'E', 2],
    ['05', 'C', 292, 'N', 1],
    ['07', 'D', 124, 'E', 3],
    ['09', 'E', 220, 'N', 2],
    ['11', 'F', 48, 'E', 1],
    ['13', 'G', 136, 'N', 3],
    ['15', 'H', 80, 'E', 4],
    ['17', 'I', 150, 'N', 5],
    ['19', 'J', 100, 'N', 4],
    ['22', 'K', 100, 'N', 6],
    ['25', 'L', 72, 'N', 7],
    ['28', 'M', 50, 'N', 8],
  ],
  '2026-06': [
    ['01', 'A', 140, 'E', 1],
    ['03', 'B', 184, 'N', 2],
    ['06', 'C', 96, 'E', 2],
    ['08', 'D', 220, 'N', 1],
    ['10', 'E', 112, 'E', 3],
    ['12', 'F', 78, 'N', 3],
    ['14', 'G', 40, 'E', 4],
    ['17', 'H', 90, 'N', 4],
    ['20', 'I', 99, 'N', 5],
    ['23', 'J', 70, 'N', 6],
    ['26', 'K', 40, 'N', 7],
    ['29', 'L', 30, 'N', 8],
  ],
  '2026-07': [
    ['02', 'A', 220, 'E', 1],
    ['04', 'B', 280, 'N', 2],
    ['06', 'C', 140, 'E', 2],
    ['08', 'D', 390, 'N', 1],
    ['11', 'E', 100, 'E', 3],
    ['13', 'F', 200, 'N', 3],
    ['16', 'G', 60, 'E', 4],
    ['18', 'H', 140, 'N', 4],
    ['21', 'I', 160, 'N', 5],
    ['24', 'J', 98, 'N', 6],
    ['27', 'K', 56, 'N', 7],
    ['30', 'L', 40, 'N', 8],
  ],
  '2026-08': [
    ['01', 'A', 240, 'E', 1],
    ['03', 'B', 190, 'N', 2],
    ['05', 'C', 160, 'E', 2],
    ['08', 'D', 240, 'N', 1],
    ['10', 'E', 144, 'E', 3],
    ['12', 'F', 106, 'N', 3],
    ['15', 'G', 120, 'E', 4],
    ['18', 'H', 50, 'N', 4],
    ['21', 'I', 130, 'N', 5],
    ['24', 'J', 81, 'N', 6],
    ['27', 'K', 50, 'N', 7],
    ['29', 'L', 30, 'N', 8],
  ],
  '2026-09': [
    ['01', 'A', 200, 'E', 1],
    ['03', 'B', 450, 'N', 2],
    ['05', 'C', 120, 'E', 2],
    ['07', 'D', 576, 'N', 1],
    ['09', 'E', 100, 'E', 3],
    ['12', 'F', 260, 'N', 3],
    ['15', 'G', 64, 'E', 1],
    ['18', 'H', 180, 'N', 4],
    ['21', 'I', 135, 'N', 5],
    ['24', 'J', 75, 'N', 6],
    ['26', 'K', 36, 'N', 7],
    ['29', 'L', 30, 'N', 8],
  ],
};

const STATUS: Record<Row[3], TransactionStatus> = { E: 'eligible', N: 'not_eligible' };
const RULES = EXCLUSION_RULE_IDS;

export const HISTORY_MONTHS = Object.keys(MONTHS).sort();

export const HISTORY_TRANSACTIONS: Transaction[] = Object.entries(MONTHS).flatMap(([month, rows]) =>
  rows.map(([day, merchant, amount, status, categoryId], i) => ({
    id: `${month}-${merchant}`,
    date: `${month}-${day}`,
    merchant: `Merchant ${merchant}`,
    amountCents: dollars(amount),
    status: STATUS[status],
    categoryId,
    ...(status === 'N' ? { ineligibleRuleId: RULES[i % RULES.length] } : {}),
  })),
);
