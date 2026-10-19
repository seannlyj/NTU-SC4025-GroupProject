import { describe, expect, it } from 'vitest';
import { applyRateBps, dollars, formatSGD, sumCents } from './money';

describe('formatSGD', () => {
  it.each([
    [0, 'S$0.00'],
    [5, 'S$0.05'],
    [155, 'S$1.55'],
    [18_000, 'S$180.00'],
    [210_000, 'S$2,100.00'],
    [118_000, 'S$1,180.00'],
    [123_456_789, 'S$1,234,567.89'],
  ])('formats %i cents as %s', (cents, expected) => {
    expect(formatSGD(cents)).toBe(expected);
  });

  it('can show whole dollars for the eligibility summary tiles', () => {
    expect(formatSGD(80_000, { decimals: 0 })).toBe('S$800');
    expect(formatSGD(16_000, { decimals: 0 })).toBe('S$160');
    expect(formatSGD(123_450, { decimals: 0 })).toBe('S$1,235');
  });

  it('can prefix a plus sign for cashback earned', () => {
    expect(formatSGD(11, { signed: true })).toBe('+S$0.11');
    expect(formatSGD(0, { signed: true })).toBe('S$0.00');
  });

  it('puts the minus sign before the currency', () => {
    expect(formatSGD(-1_050)).toBe('-S$10.50');
  });
});

describe('applyRateBps', () => {
  it('rounds half up to the cent, matching the report wireframe', () => {
    expect(applyRateBps(dollars(42.5), 25)).toBe(11); // 10.625c
    expect(applyRateBps(dollars(18), 25)).toBe(5); // 4.5c
    expect(applyRateBps(dollars(44), 25)).toBe(11);
    expect(applyRateBps(dollars(620), 25)).toBe(155);
  });

  it('never returns cashback for zero or negative inputs', () => {
    expect(applyRateBps(0, 25)).toBe(0);
    expect(applyRateBps(-500, 25)).toBe(0);
    expect(applyRateBps(10_000, 0)).toBe(0);
  });
});

describe('helpers', () => {
  it('converts dollars to cents without float drift', () => {
    expect(dollars(0.1 + 0.2)).toBe(30);
    expect(dollars(2100)).toBe(210_000);
  });

  it('sums cents', () => {
    expect(sumCents([1, 2, 3])).toBe(6);
    expect(sumCents([])).toBe(0);
  });
});
