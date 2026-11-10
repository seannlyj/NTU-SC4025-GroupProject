import { describe, expect, it } from 'vitest';
import { CREDIT_DAY_OF_MONTH, getExpectedCreditDate } from './creditDate';
import { formatWeekdayDayMonth, weekdayOf } from './dates';

describe('getExpectedCreditDate', () => {
  it('defaults to the 16th of the following month', () => {
    expect(CREDIT_DAY_OF_MONTH).toBe(16);
  });

  it('keeps a weekday as it is', () => {
    expect(getExpectedCreditDate('2026-10')).toBe('2026-11-16'); // Monday
    expect(getExpectedCreditDate('2026-11')).toBe('2026-12-16'); // Wednesday
    expect(getExpectedCreditDate('2026-09')).toBe('2026-10-16'); // Friday
  });

  it('moves a Saturday forward to the Monday', () => {
    expect(weekdayOf('2026-05-16')).toBe(6);
    expect(getExpectedCreditDate('2026-04')).toBe('2026-05-18');
  });

  it('moves a Sunday forward to the Monday', () => {
    expect(weekdayOf('2026-08-16')).toBe(0);
    expect(getExpectedCreditDate('2026-07')).toBe('2026-08-17');
  });

  it('crosses the year end: December cashback is credited in January', () => {
    // 16 Jan 2027 is a Saturday, so it also rolls to the Monday.
    expect(getExpectedCreditDate('2026-12')).toBe('2027-01-18');
  });

  it('rolls across a month end when the credit day is late in the month', () => {
    // 31 Jan 2027 is a Sunday -> Monday 1 Feb.
    expect(getExpectedCreditDate('2026-12', 31)).toBe('2027-02-01');
    // A day past the month's end means its last day: 30 Nov 2026 is a Monday.
    expect(getExpectedCreditDate('2026-10', 31)).toBe('2026-11-30');
  });

  it('always lands on a weekday', () => {
    for (let i = 0; i < 36; i++) {
      const month = `${2026 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;
      expect([1, 2, 3, 4, 5]).toContain(weekdayOf(getExpectedCreditDate(month)));
    }
  });
});

describe('formatWeekdayDayMonth', () => {
  it('shows the weekday, day and month, without the year', () => {
    expect(formatWeekdayDayMonth('2026-11-16')).toBe('Mon, 16 Nov');
    expect(formatWeekdayDayMonth('2027-02-01')).toBe('Mon, 01 Feb');
  });
});
