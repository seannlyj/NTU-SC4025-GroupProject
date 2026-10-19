import { describe, expect, it } from 'vitest';
import {
  addMonths,
  formatDayMonth,
  formatFullDate,
  formatMonthLong,
  formatMonthShort,
  formatShortRange,
  formatUpdatedAt,
  isIsoDate,
  isWithin,
  lastDayOf,
  monthsBetween,
  previousMonths,
} from './dates';

describe('formatting', () => {
  it('matches the wireframe date formats', () => {
    expect(formatDayMonth('2026-10-01')).toBe('01 Oct');
    expect(formatFullDate('2026-04-01')).toBe('01 Apr 2026');
    expect(formatMonthShort('2026-04')).toBe('Apr 2026');
    expect(formatMonthLong('2026-09')).toBe('September 2026');
    expect(formatUpdatedAt('2026-10-12T22:10')).toBe('12 Oct, 22:10');
    expect(formatShortRange('2026-10-01', '2026-10-12')).toBe('01 Oct – 12 Oct');
  });
});

describe('month arithmetic', () => {
  it('adds months across year boundaries', () => {
    expect(addMonths('2026-10', 3)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });

  it('lists the six full months before October', () => {
    expect(previousMonths('2026-10', 6)).toEqual(['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']);
  });

  it('knows month lengths, including leap years', () => {
    expect(lastDayOf('2026-09')).toBe('2026-09-30');
    expect(lastDayOf('2028-02')).toBe('2028-02-29');
    expect(lastDayOf('2026-02')).toBe('2026-02-28');
  });

  it('lists every month a range touches', () => {
    expect(monthsBetween('2026-04-15', '2026-06-01')).toEqual(['2026-04', '2026-05', '2026-06']);
    expect(monthsBetween('2026-10-01', '2026-10-12')).toEqual(['2026-10']);
  });
});

describe('validation and ranges', () => {
  it('accepts only real calendar dates', () => {
    expect(isIsoDate('2026-10-12')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('12 Oct 2026')).toBe(false);
    expect(isIsoDate(null)).toBe(false);
  });

  it('treats ranges as inclusive, with open bounds when missing', () => {
    expect(isWithin('2026-10-01', '2026-10-01', '2026-10-12')).toBe(true);
    expect(isWithin('2026-10-12', '2026-10-01', '2026-10-12')).toBe(true);
    expect(isWithin('2026-10-13', '2026-10-01', '2026-10-12')).toBe(false);
    expect(isWithin('2020-01-01')).toBe(true);
  });
});
