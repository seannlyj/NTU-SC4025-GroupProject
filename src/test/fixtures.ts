import type { CategoryId } from '../config/categories';
import { dollars } from '../domain/money';
import type { Transaction, TransactionStatus } from '../domain/types';

const STATUS: Record<'E' | 'P' | 'N', TransactionStatus> = { E: 'eligible', P: 'pending', N: 'not_eligible' };

/** Compact transaction builder for tests: tx('a', '2026-10-12', 82, 'P', 2) */
export function tx(
  id: string,
  date: string,
  amount: number,
  status: 'E' | 'P' | 'N',
  categoryId: CategoryId = 1,
  merchant = `Merchant ${id.toUpperCase()}`,
): Transaction {
  return { id, date, merchant, amountCents: dollars(amount), status: STATUS[status], categoryId };
}

/** The October table from the brief, independent of the app's seed module. */
export const OCTOBER_TABLE: Transaction[] = [
  tx('a', '2026-10-12', 82, 'P', 2),
  tx('b', '2026-10-11', 44, 'E', 1),
  tx('c', '2026-10-10', 120, 'N', 3),
  tx('d', '2026-10-10', 200, 'P', 1),
  tx('e', '2026-10-09', 18, 'P', 7),
  tx('f', '2026-10-08', 64, 'E', 3),
  tx('g', '2026-10-07', 32, 'E', 2),
  tx('h', '2026-10-06', 480, 'N', 5),
  tx('i', '2026-10-05', 120, 'E', 3),
  tx('j', '2026-10-04', 350, 'N', 2),
  tx('k', '2026-10-03', 200, 'E', 1),
  tx('l', '2026-10-02', 160, 'E', 2),
  tx('m', '2026-10-01', 230, 'N', 6),
];
