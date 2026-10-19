import { categoryName, isCategoryId, type CategoryId } from '../config/categories';
import { formatShortRange, isIsoDate, isWithin, type IsoDate } from './dates';
import { sortNewestFirst } from './summary';
import type { Transaction, TransactionStatus } from './types';

/**
 * The filter sheet groups statuses the way the wireframe does:
 * "Pending" = pending, "Posted" = eligible + not eligible (both have settled).
 * These are filter options, not statuses; rows still show Eligible / Pending / Not eligible.
 */
export type StatusFilter = 'pending' | 'posted';

export const STATUS_FILTERS: readonly StatusFilter[] = ['pending', 'posted'];

export const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  pending: 'Pending',
  posted: 'Posted',
};

const STATUS_GROUPS: Record<StatusFilter, readonly TransactionStatus[]> = {
  pending: ['pending'],
  posted: ['eligible', 'not_eligible'],
};

export interface TransactionFilters {
  statuses: StatusFilter[];
  categories: CategoryId[];
  /** Both set, or both unset (the default period). */
  from?: IsoDate;
  to?: IsoDate;
}

export const NO_FILTERS: TransactionFilters = { statuses: [], categories: [] };

export interface Period {
  from: IsoDate;
  to: IsoDate;
}

/** No status or category ticked means "any". */
export function applyFilters(transactions: readonly Transaction[], filters: TransactionFilters): Transaction[] {
  const allowedStatuses = new Set(filters.statuses.flatMap((s) => STATUS_GROUPS[s]));
  return transactions.filter(
    (t) =>
      (allowedStatuses.size === 0 || allowedStatuses.has(t.status)) &&
      (filters.categories.length === 0 || filters.categories.includes(t.categoryId)) &&
      isWithin(t.date, filters.from, filters.to),
  );
}

export function hasActiveFilters(filters: TransactionFilters): boolean {
  return filters.statuses.length > 0 || filters.categories.length > 0 || Boolean(filters.from && filters.to);
}

/** The period the list covers: the chosen dates, else the default period. */
export function effectivePeriod(filters: TransactionFilters, defaultPeriod: Period): Period {
  return filters.from && filters.to ? { from: filters.from, to: filters.to } : defaultPeriod;
}

export function isDateRangeValid(from: IsoDate, to: IsoDate): boolean {
  return to >= from;
}

/**
 * What Confirm in the filter sheet commits. The dates are kept when they
 * differ from the default period, or when other filters are set (so the chip
 * row shows the period being filtered, as in the wireframe).
 */
export function commitSheetFilters(draft: Required<TransactionFilters>, defaultPeriod: Period): TransactionFilters {
  const base: TransactionFilters = { statuses: [...draft.statuses], categories: [...draft.categories] };
  const isDefaultRange = draft.from === defaultPeriod.from && draft.to === defaultPeriod.to;
  const keepDates = !isDefaultRange || base.statuses.length > 0 || base.categories.length > 0;
  return keepDates ? { ...base, from: draft.from, to: draft.to } : base;
}

export interface FilterChip {
  key: string;
  label: string;
  /** The filters with this chip removed. */
  without: TransactionFilters;
}

export function filterChips(filters: TransactionFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  for (const s of STATUS_FILTERS.filter((s) => filters.statuses.includes(s))) {
    chips.push({
      key: `status-${s}`,
      label: STATUS_FILTER_LABELS[s],
      without: { ...filters, statuses: filters.statuses.filter((x) => x !== s) },
    });
  }
  for (const c of [...filters.categories].sort((a, b) => a - b)) {
    chips.push({
      key: `category-${c}`,
      label: categoryName(c),
      without: { ...filters, categories: filters.categories.filter((x) => x !== c) },
    });
  }
  if (filters.from && filters.to) {
    chips.push({
      key: 'dates',
      label: formatShortRange(filters.from, filters.to),
      without: { statuses: filters.statuses, categories: filters.categories },
    });
  }
  return chips;
}

/* URL search params: ?status=posted&category=1,3&from=2026-10-01&to=2026-10-12 */

export function filtersToSearch(filters: TransactionFilters): string {
  const params = new URLSearchParams();
  if (filters.statuses.length) params.set('status', STATUS_FILTERS.filter((s) => filters.statuses.includes(s)).join(','));
  if (filters.categories.length) params.set('category', [...filters.categories].sort((a, b) => a - b).join(','));
  if (filters.from && filters.to) {
    params.set('from', filters.from);
    params.set('to', filters.to);
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function parseFilters(search: string | URLSearchParams): TransactionFilters {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const list = (key: string) => (params.get(key) ?? '').split(',').filter(Boolean);
  const statuses = STATUS_FILTERS.filter((s) => list('status').includes(s));
  const categories = [...new Set(list('category').map(Number).filter(isCategoryId))];
  const from = params.get('from');
  const to = params.get('to');
  const dates = isIsoDate(from) && isIsoDate(to) ? { from, to } : {};
  return { statuses, categories, ...dates };
}

export interface DateGroup {
  date: IsoDate;
  transactions: Transaction[];
}

/** Newest date first; one group per calendar day. */
export function groupByDate(transactions: readonly Transaction[]): DateGroup[] {
  const groups: DateGroup[] = [];
  for (const t of sortNewestFirst(transactions)) {
    const last = groups[groups.length - 1];
    if (last && last.date === t.date) last.transactions.push(t);
    else groups.push({ date: t.date, transactions: [t] });
  }
  return groups;
}
