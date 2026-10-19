import { AppLink } from '../app/navigation';
import { formatDayMonth } from '../domain/dates';
import { formatSGD } from '../domain/money';
import { STATUS_LABELS, type Transaction } from '../domain/types';
import { StatusLabel } from './StatusLabel';

/** "Merchant A" -> "A"; otherwise the first letter of the name. */
export function merchantInitial(name: string): string {
  const placeholder = /^Merchant\s+(\S)/.exec(name);
  return (placeholder ? placeholder[1] : name.trim().charAt(0)).toUpperCase();
}

export function MerchantAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-11 shrink-0 place-items-center rounded-full bg-peach text-[15px] text-ink-avatar"
    >
      {merchantInitial(name)}
    </span>
  );
}

interface TransactionRowProps {
  transaction: Transaction;
  cashbackCents: number;
  /** The Dashboard shows "12 Oct · Pending"; the full list groups by date instead. */
  showDate?: boolean;
}

export function TransactionRow({ transaction: t, cashbackCents, showDate = false }: TransactionRowProps) {
  const eligible = t.status === 'eligible';
  const why = t.ineligibleRuleId ? `/eligibility?rule=${t.ineligibleRuleId}` : '/eligibility';
  return (
    <div className="flex items-center gap-[14px] py-3" data-testid="transaction-row">
      <MerchantAvatar name={t.merchant} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] leading-5 font-semibold text-ink">{t.merchant}</p>
        <p className="mt-0.5 text-[13px] leading-[18px] text-ink-muted">
          {showDate && <>{formatDayMonth(t.date)} · </>}
          <StatusLabel status={t.status} />
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`tabular text-[15px] leading-5 font-semibold ${eligible ? 'text-ink' : 'text-ink-muted'}`}>
          {formatSGD(t.amountCents)}
        </p>
        {eligible && (
          <p className="tabular mt-0.5 text-[13px] leading-[18px] text-ink-muted">
            <span className="sr-only">Cashback </span>
            {formatSGD(cashbackCents, { signed: true })}
          </p>
        )}
        {t.status === 'not_eligible' && (
          <AppLink
            to={why}
            className="relative mt-0.5 ml-auto block w-fit text-[13px] leading-[18px] text-link before:absolute before:-inset-x-3 before:-inset-y-3 before:content-['']"
            aria-label={`Why is ${t.merchant} ${STATUS_LABELS.not_eligible.toLowerCase()}?`}
          >
            Why?
          </AppLink>
        )}
      </div>
    </div>
  );
}
