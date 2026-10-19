import { STATUS_LABELS, type TransactionStatus } from '../domain/types';

const COLOUR: Record<TransactionStatus, string> = {
  eligible: 'text-eligible',
  pending: 'text-ink-muted',
  not_eligible: 'text-ink-muted',
};

/**
 * Status is always written out (Eligible / Pending / Not eligible),
 * so colour is never the only signal.
 */
export function StatusLabel({ status }: { status: TransactionStatus }) {
  return <span className={`font-semibold ${COLOUR[status]}`}>{STATUS_LABELS[status]}</span>;
}
