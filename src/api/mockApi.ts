import { CATEGORY_IDS } from '../config/categories';
import { MOCK_NOW } from '../config/clock';
import { CASHBACK_POLICY } from '../config/policy';
import { monthCashback } from '../domain/cashback';
import { isWithin, monthOf } from '../domain/dates';
import type { MonthHistory } from '../domain/history';
import { sumCents } from '../domain/money';
import type { Card, Transaction } from '../domain/types';
import { consumeOutage, getScenarioState } from './scenario';
import { HISTORY_MONTHS, HISTORY_TRANSACTIONS } from './seed/history';
import { OCTOBER_CATEGORY_SUMMARY, OCTOBER_MONTH, OCTOBER_TRANSACTIONS } from './seed/october';
import { ServiceUnavailableError, type HistoryData, type RewardsApi, type RewardsOverview } from './types';

export const MOCK_CARD: Card = {
  id: 'card-365-1234',
  productName: 'OCBC 365 Credit Card',
  shortName: 'OCBC 365',
  last4: '1234',
  badge: '365',
};

const ALL_TRANSACTIONS: Transaction[] = [...HISTORY_TRANSACTIONS, ...OCTOBER_TRANSACTIONS];

let latencyMs = 350;

/** Tests set this to 0. */
export function setMockLatency(ms: number): void {
  latencyMs = ms;
}

function respond<T>(produce: () => T): Promise<T> {
  if (getScenarioState().scenario === 'loading') return new Promise<T>(() => {});
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(produce());
      } catch (error) {
        reject(error);
      }
    }, latencyMs);
  });
}

const clone = <T>(value: T): T => structuredClone(value);

export function buildMonthHistory(month: string, transactions: readonly Transaction[]): MonthHistory {
  const rows = transactions.filter((t) => monthOf(t.date) === month);
  return {
    month,
    totalSpendCents: sumCents(rows.map((t) => t.amountCents)),
    cashbackCents: monthCashback(month, rows, CASHBACK_POLICY).totalCents,
    categories: CATEGORY_IDS.map((categoryId) => ({
      categoryId,
      spendCents: sumCents(rows.filter((t) => t.categoryId === categoryId).map((t) => t.amountCents)),
    })),
  };
}

export const mockApi: RewardsApi = {
  getCard() {
    return respond(() => (getScenarioState().scenario === 'no-card' ? null : clone(MOCK_CARD)));
  },

  getOverview() {
    return respond<RewardsOverview>(() => {
      const { scenario } = getScenarioState();
      if (scenario === 'unavailable' && consumeOutage()) throw new ServiceUnavailableError();
      return {
        month: OCTOBER_MONTH,
        updatedAt: MOCK_NOW,
        transactions: clone(OCTOBER_TRANSACTIONS),
        categories: clone(OCTOBER_CATEGORY_SUMMARY),
      };
    });
  },

  getTransactions({ from, to }) {
    return respond(() =>
      getScenarioState().scenario === 'no-card'
        ? []
        : clone(ALL_TRANSACTIONS.filter((t) => isWithin(t.date, from, to))),
    );
  },

  getHistory() {
    return respond<HistoryData | null>(() => {
      const { scenario } = getScenarioState();
      if (scenario === 'no-history' || scenario === 'no-card') return null;
      return {
        months: HISTORY_MONTHS.map((m) => buildMonthHistory(m, HISTORY_TRANSACTIONS)),
        current: {
          month: OCTOBER_MONTH,
          categories: OCTOBER_CATEGORY_SUMMARY.map(({ categoryId, spendCents, usualCents }) => ({
            categoryId,
            spendCents,
            usualCents,
          })),
        },
      };
    });
  },
};
