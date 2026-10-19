import { describe, expect, it } from 'vitest';
import { CASHBACK_POLICY } from '../config/policy';
import { OCTOBER_TABLE, tx } from '../test/fixtures';
import { recentTransactions, splitByStatus, splitSegments, summarizeMonth } from './summary';

describe('summarizeMonth with the October table', () => {
  const s = summarizeMonth('2026-10', OCTOBER_TABLE, CASHBACK_POLICY);

  it('splits total card spending by status', () => {
    expect(s.totalCents).toBe(210_000);
    expect(s.eligibleCents).toBe(62_000);
    expect(s.pendingCents).toBe(30_000);
    expect(s.notEligibleCents).toBe(118_000);
    expect(s.eligibleCents + s.pendingCents + s.notEligibleCents).toBe(s.totalCents);
  });

  it('measures progress with eligible spend only', () => {
    expect(s.minSpendCents).toBe(80_000);
    expect(s.toGoCents).toBe(18_000);
    expect(s.minimumProgress).toBeCloseTo(0.775);
    expect(s.minimumMet).toBe(false);
  });

  it('reports cashback against the cap', () => {
    expect(s.cashbackCents).toBe(155);
    expect(s.capCents).toBe(16_000);
    expect(s.capProgress).toBeCloseTo(155 / 16_000);
  });
});

describe('to go', () => {
  it('is never negative once the minimum is met', () => {
    const rows = [tx('a', '2026-10-01', 900, 'E')];
    const s = summarizeMonth('2026-10', rows, CASHBACK_POLICY);
    expect(s.toGoCents).toBe(0);
    expect(s.minimumMet).toBe(true);
    expect(s.minimumProgress).toBe(1);
  });

  it('does not count pending spend until it clears', () => {
    const rows = [tx('a', '2026-10-01', 700, 'E'), tx('b', '2026-10-02', 300, 'P')];
    expect(summarizeMonth('2026-10', rows, CASHBACK_POLICY).toGoCents).toBe(10_000);
  });
});

describe('splitSegments', () => {
  it('orders Eligible, Pending, Not eligible and sums to 1', () => {
    const segments = splitSegments(splitByStatus(OCTOBER_TABLE));
    expect(segments.map((x) => x.status)).toEqual(['eligible', 'pending', 'not_eligible']);
    expect(segments.map((x) => x.cents)).toEqual([62_000, 30_000, 118_000]);
    expect(segments.reduce((a, x) => a + x.fraction, 0)).toBeCloseTo(1);
  });

  it('handles a month with no spending', () => {
    expect(splitSegments(splitByStatus([])).every((x) => x.fraction === 0)).toBe(true);
  });
});

describe('recentTransactions', () => {
  it('returns the three newest rows, keeping same-day order', () => {
    expect(recentTransactions(OCTOBER_TABLE).map((t) => t.id)).toEqual(['a', 'b', 'c']);
    const shuffled = [...OCTOBER_TABLE].reverse();
    expect(recentTransactions(shuffled, 4).map((t) => t.id)).toEqual(['a', 'b', 'd', 'c']);
  });
});
