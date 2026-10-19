import { describe, expect, it } from 'vitest';
import { CASHBACK_POLICY } from '../config/policy';
import { OCTOBER_TABLE, tx } from '../test/fixtures';
import { cashbackByMonth, eligibleSpend, monthCashback, rateFor, tierFor, type CashbackPolicy } from './cashback';

const TIERED: CashbackPolicy = {
  minSpendCents: 80_000,
  capCents: 16_000,
  tiers: [
    { minMonthlyEligibleCents: 0, rateBps: 25 },
    { minMonthlyEligibleCents: 80_000, rateBps: 300, categoryRateBps: { 1: 500 } },
  ],
};

describe('policy config', () => {
  it('is S$800 minimum, S$160 cap and a flat 0.25%', () => {
    expect(CASHBACK_POLICY.minSpendCents).toBe(80_000);
    expect(CASHBACK_POLICY.capCents).toBe(16_000);
    expect(rateFor(CASHBACK_POLICY, 0, 1)).toBe(25);
    expect(rateFor(CASHBACK_POLICY, 1_000_000, 8)).toBe(25);
  });
});

describe('tiers', () => {
  it('uses the highest tier the month qualifies for, in any order', () => {
    const reversed: CashbackPolicy = { ...TIERED, tiers: [...TIERED.tiers].reverse() };
    expect(tierFor(reversed, 79_999)?.rateBps).toBe(25);
    expect(tierFor(reversed, 80_000)?.rateBps).toBe(300);
  });

  it('lets a tier override the rate for one category', () => {
    expect(rateFor(TIERED, 90_000, 1)).toBe(500);
    expect(rateFor(TIERED, 90_000, 2)).toBe(300);
  });

  it('switches every eligible row to the new tier once the minimum is reached', () => {
    const rows = [tx('a', '2026-10-01', 500, 'E', 2), tx('b', '2026-10-02', 300, 'E', 2)];
    expect(monthCashback('2026-10', rows, TIERED).totalCents).toBe(1_500 + 900);
  });
});

describe('monthCashback', () => {
  it('earns 0.25% on eligible spend only: S$1.55 on S$620', () => {
    const result = monthCashback('2026-10', OCTOBER_TABLE, CASHBACK_POLICY);
    expect(result.eligibleCents).toBe(62_000);
    expect(result.totalCents).toBe(155);
    expect(result.capped).toBe(false);
  });

  it('gives Pending and Not eligible rows nothing', () => {
    const { byTransaction } = monthCashback('2026-10', OCTOBER_TABLE, CASHBACK_POLICY);
    expect(byTransaction.a).toBe(0); // pending
    expect(byTransaction.c).toBe(0); // not eligible
    expect(byTransaction.b).toBe(11);
    expect(byTransaction.k).toBe(50);
  });

  it('applies the monthly cap after summing rows', () => {
    const rows = [tx('a', '2026-10-01', 4_000, 'E', 2), tx('b', '2026-10-02', 2_000, 'E', 2)];
    const result = monthCashback('2026-10', rows, TIERED);
    expect(result.uncappedCents).toBe(18_000);
    expect(result.totalCents).toBe(16_000);
    expect(result.capped).toBe(true);
  });

  it('ignores rows from other months', () => {
    const rows = [...OCTOBER_TABLE, tx('z', '2026-09-30', 4_000, 'E')];
    expect(monthCashback('2026-10', rows, CASHBACK_POLICY).totalCents).toBe(155);
  });
});

describe('cashbackByMonth', () => {
  it('works out each month separately, oldest first', () => {
    const rows = [tx('a', '2026-10-01', 400, 'E'), tx('b', '2026-09-01', 800, 'E')];
    expect(cashbackByMonth(rows, CASHBACK_POLICY).map((m) => [m.month, m.totalCents])).toEqual([
      ['2026-09', 200],
      ['2026-10', 100],
    ]);
  });

  it('counts eligible spend only', () => {
    expect(eligibleSpend(OCTOBER_TABLE)).toBe(62_000);
  });
});
