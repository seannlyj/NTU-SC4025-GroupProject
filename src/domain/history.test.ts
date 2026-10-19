import { describe, expect, it } from 'vitest';
import type { CategoryId } from '../config/categories';
import { buildCategoryBreakdown, buildMonthBars, buildMonthToDate, isAboveUsual, niceCeil } from './history';

describe('isAboveUsual', () => {
  it('flags spend strictly over the usual', () => {
    expect(isAboveUsual(62_600, 40_000)).toBe(true);
    expect(isAboveUsual(40_000, 40_000)).toBe(false);
    expect(isAboveUsual(9_900, 10_000)).toBe(false);
  });

  it('never flags a category with no usual yet', () => {
    expect(isAboveUsual(5_000, 0)).toBe(false);
  });
});

describe('niceCeil', () => {
  it.each([
    [62_600, 100_000],
    [45_500, 50_000],
    [100_000, 100_000],
    [12_000, 20_000],
    [0, 1],
  ])('%i -> %i', (value, expected) => {
    expect(niceCeil(value)).toBe(expected);
  });
});

describe('buildMonthToDate', () => {
  // October so far, with the usual markers read from the wireframe
  const spend = [455, 626, 300, 80, 400, 100, 40, 99];
  const usual = [600, 400, 350, 200, 250, 150, 100, 100];
  const view = buildMonthToDate(
    spend.map((s, i) => ({ categoryId: (i + 1) as CategoryId, spendCents: s * 100, usualCents: usual[i] * 100 })),
  );

  it('totals S$2,100.00 on a S$1,000 scale', () => {
    expect(view.totalCents).toBe(210_000);
    expect(view.scaleCents).toBe(100_000);
  });

  it('flags only Categories 2 and 5 as above usual', () => {
    expect(view.rows.filter((r) => r.aboveUsual).map((r) => r.categoryId)).toEqual([2, 5]);
  });

  it('positions bars and markers on the shared scale', () => {
    expect(view.rows[0].fraction).toBeCloseTo(0.455);
    expect(view.rows[0].usualFraction).toBeCloseTo(0.6);
  });
});

describe('six-month view', () => {
  it('scales bars to the tallest month', () => {
    const bars = buildMonthBars([
      { month: '2026-08', totalSpendCents: 100_000, cashbackCents: 0, categories: [] },
      { month: '2026-09', totalSpendCents: 200_000, cashbackCents: 0, categories: [] },
    ]);
    expect(bars.map((b) => [b.label, b.fraction])).toEqual([
      ['Aug', 0.5],
      ['Sep', 1],
    ]);
    expect(bars[1].longLabel).toBe('September 2026');
  });

  it('scales category bars to the largest category', () => {
    const rows = buildCategoryBreakdown([
      { categoryId: 1, spendCents: 84_000 },
      { categoryId: 2, spendCents: 42_000 },
    ]);
    expect(rows.map((r) => r.fraction)).toEqual([1, 0.5]);
  });
});
