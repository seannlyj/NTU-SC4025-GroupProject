import type { IsoDate, IsoDateTime, MonthKey } from '../domain/dates';
import type { CategoryMonthToDate, MonthHistory } from '../domain/history';
import type { Card, Transaction } from '../domain/types';

export interface CategoryStat extends CategoryMonthToDate {
  cashbackCents: number;
}

/** Everything the Dashboard needs for the current month. */
export interface RewardsOverview {
  month: MonthKey;
  updatedAt: IsoDateTime;
  /** When this month's cashback is expected to be credited (always a weekday). */
  expectedCreditDate: IsoDate;
  /** All transactions in the current month so far. */
  transactions: Transaction[];
  /** Category summary from the categorisation service, in category order. */
  categories: CategoryStat[];
}

export interface HistoryData {
  /** The six full months before the current one, oldest first. */
  months: MonthHistory[];
  current: {
    month: MonthKey;
    categories: CategoryMonthToDate[];
  };
}

export interface DateRange {
  from: IsoDate;
  to: IsoDate;
}

/**
 * The data the app needs. The mock implements it today; a real backend
 * client can implement the same interface later (see src/api/index.ts).
 */
export interface RewardsApi {
  /** null when the customer has no eligible OCBC 365 card. */
  getCard(): Promise<Card | null>;
  /** Rejects with ServiceUnavailableError when the rewards service is down. */
  getOverview(): Promise<RewardsOverview>;
  getTransactions(range: DateRange): Promise<Transaction[]>;
  /** null when there is no spending history yet. */
  getHistory(): Promise<HistoryData | null>;
}

export class ServiceUnavailableError extends Error {
  constructor(message = 'Rewards data is unavailable right now.') {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}
