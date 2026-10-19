import type { CategoryId } from '../config/categories';
import type { IsoDate } from './dates';

/** The three transaction statuses. Nothing else is a status. */
export type TransactionStatus = 'eligible' | 'pending' | 'not_eligible';

export const TRANSACTION_STATUSES: readonly TransactionStatus[] = ['eligible', 'pending', 'not_eligible'];

/** The only labels the UI may show for a status. */
export const STATUS_LABELS: Record<TransactionStatus, string> = {
  eligible: 'Eligible',
  pending: 'Pending',
  not_eligible: 'Not eligible',
};

export interface Transaction {
  id: string;
  date: IsoDate;
  merchant: string;
  /** Always a positive whole number of cents. */
  amountCents: number;
  status: TransactionStatus;
  categoryId: CategoryId;
  /** For "Not eligible" rows: which eligibility rule explains it. */
  ineligibleRuleId?: string;
}

export interface Card {
  id: string;
  productName: string;
  shortName: string;
  last4: string;
  /** Text inside the round card avatar. */
  badge: string;
}
