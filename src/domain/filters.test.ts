import { describe, expect, it } from 'vitest';
import { OCTOBER_TABLE } from '../test/fixtures';
import {
  NO_FILTERS,
  applyFilters,
  commitSheetFilters,
  effectivePeriod,
  filterChips,
  filtersToSearch,
  groupByDate,
  hasActiveFilters,
  parseFilters,
  type TransactionFilters,
} from './filters';

const ids = (f: TransactionFilters) => applyFilters(OCTOBER_TABLE, f).map((t) => t.id);
const OCT = { from: '2026-10-01', to: '2026-10-12' };

describe('applyFilters', () => {
  it('returns everything when nothing is ticked', () => {
    expect(ids(NO_FILTERS)).toHaveLength(13);
  });

  it('treats Posted as Eligible + Not eligible', () => {
    const posted = applyFilters(OCTOBER_TABLE, { ...NO_FILTERS, statuses: ['posted'] });
    expect(posted).toHaveLength(10);
    expect(posted.every((t) => t.status !== 'pending')).toBe(true);
  });

  it('filters Pending', () => {
    expect(ids({ ...NO_FILTERS, statuses: ['pending'] })).toEqual(['a', 'd', 'e']);
  });

  it('ORs within a group and ANDs across groups', () => {
    expect(ids({ statuses: ['pending'], categories: [1, 2] })).toEqual(['a', 'd']);
    expect(ids({ statuses: ['pending', 'posted'], categories: [7] })).toEqual(['e']);
  });

  it('filters by an inclusive date range', () => {
    expect(ids({ ...NO_FILTERS, from: '2026-10-10', to: '2026-10-12' })).toEqual(['a', 'b', 'c', 'd']);
  });

  it('can return no matches', () => {
    expect(ids({ statuses: ['posted'], categories: [7, 8], ...OCT })).toEqual([]);
  });
});

describe('chips', () => {
  it('lists status, categories, then the date range, as in the wireframe', () => {
    const chips = filterChips({ statuses: ['posted'], categories: [3, 1], ...OCT });
    expect(chips.map((c) => c.label)).toEqual(['Posted', 'Category 1', 'Category 3', '01 Oct – 12 Oct']);
  });

  it('removes just one filter', () => {
    const [, cat1, , dates] = filterChips({ statuses: ['posted'], categories: [1, 3], ...OCT });
    expect(cat1.without).toEqual({ statuses: ['posted'], categories: [3], ...OCT });
    expect(dates.without).toEqual({ statuses: ['posted'], categories: [1, 3] });
  });
});

describe('URL round trip', () => {
  it('serialises and parses filters', () => {
    const f: TransactionFilters = { statuses: ['posted'], categories: [1, 3], ...OCT };
    const search = filtersToSearch(f);
    expect(search).toBe('?status=posted&category=1%2C3&from=2026-10-01&to=2026-10-12');
    expect(parseFilters(search)).toEqual(f);
  });

  it('ignores junk in the URL', () => {
    expect(parseFilters('?status=nope,pending&category=0,2,9,x&from=2026-02-30&to=2026-03-01')).toEqual({
      statuses: ['pending'],
      categories: [2],
    });
    expect(filtersToSearch(NO_FILTERS)).toBe('');
  });
});

describe('sheet commit and default period', () => {
  it('drops an untouched default date range when nothing else is set', () => {
    expect(commitSheetFilters({ statuses: [], categories: [], ...OCT }, OCT)).toEqual(NO_FILTERS);
  });

  it('keeps the dates when other filters are set or the range changed', () => {
    expect(commitSheetFilters({ statuses: ['posted'], categories: [], ...OCT }, OCT)).toEqual({
      statuses: ['posted'],
      categories: [],
      ...OCT,
    });
    expect(commitSheetFilters({ statuses: [], categories: [], from: '2026-10-05', to: '2026-10-12' }, OCT).from).toBe(
      '2026-10-05',
    );
  });

  it('falls back to the default period', () => {
    expect(effectivePeriod(NO_FILTERS, OCT)).toEqual(OCT);
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...NO_FILTERS, ...OCT })).toBe(true);
  });
});

describe('groupByDate', () => {
  it('makes one group per day, newest first', () => {
    const groups = groupByDate(OCTOBER_TABLE);
    expect(groups).toHaveLength(12);
    expect(groups[0].date).toBe('2026-10-12');
    expect(groups[2]).toMatchObject({ date: '2026-10-10' });
    expect(groups[2].transactions.map((t) => t.id)).toEqual(['c', 'd']);
  });
});
