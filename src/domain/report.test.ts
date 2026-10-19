import { describe, expect, it } from 'vitest';
import { CASHBACK_POLICY } from '../config/policy';
import { OCTOBER_TABLE, tx } from '../test/fixtures';
import { REPORT_RANGE_ERROR, buildReportModel, validateReportRange } from './report';
import type { Card } from './types';

const CARD: Card = { id: 'c', productName: 'OCBC 365 Credit Card', shortName: 'OCBC 365', last4: '1234', badge: '365' };

describe('validateReportRange', () => {
  it('accepts To on or after From', () => {
    expect(validateReportRange('2026-04-01', '2026-09-30')).toEqual({ valid: true });
    expect(validateReportRange('2026-04-01', '2026-04-01')).toEqual({ valid: true });
  });

  it('rejects To before From with the wireframe message', () => {
    expect(validateReportRange('2026-09-30', '2026-04-01')).toEqual({
      valid: false,
      field: 'to',
      message: "End date can't be before the start date.",
    });
    expect(REPORT_RANGE_ERROR).toBe("End date can't be before the start date.");
  });

  it('asks for missing dates', () => {
    expect(validateReportRange(undefined, '2026-04-01')).toMatchObject({ valid: false, field: 'from' });
    expect(validateReportRange('2026-04-01', '')).toMatchObject({ valid: false, field: 'to' });
  });
});

describe('buildReportModel', () => {
  const april = [
    tx('a', '2026-04-03', 42.5, 'E', 1, 'Merchant A'),
    tx('b', '2026-04-09', 18, 'E', 2, 'Merchant B'),
    tx('c', '2026-04-15', 120, 'N', 5, 'Merchant C'),
  ];

  it('builds the wireframe header and April rows', () => {
    const model = buildReportModel({
      card: CARD,
      from: '2026-04-01',
      to: '2026-09-30',
      transactions: april,
      policy: CASHBACK_POLICY,
    });
    expect(model.title).toBe('Cashback report');
    expect(model.subtitle).toBe('OCBC 365 · •••• 1234 · 01 Apr 2026 to 30 Sep 2026');
    expect(model.sections[0].title).toBe('Transactions: Apr 2026');
    expect(model.sections[0].rows.map((r) => [r.dateLabel, r.merchant, r.cashbackLabel])).toEqual([
      ['03 Apr', 'Merchant A', 'S$0.11'],
      ['09 Apr', 'Merchant B', 'S$0.05'],
      ['15 Apr', 'Merchant C', 'Not eligible'],
    ]);
    expect(model.months).toEqual([{ month: '2026-04', label: 'Apr 2026', cashbackCents: 16 }]);
    expect(model.fileName).toBe('cashback-report_2026-04-01_to_2026-09-30.pdf');
  });

  it('only includes transactions inside the range, and labels pending rows', () => {
    const model = buildReportModel({
      card: CARD,
      from: '2026-10-10',
      to: '2026-10-12',
      transactions: OCTOBER_TABLE,
      policy: CASHBACK_POLICY,
    });
    const rows = model.sections.flatMap((s) => s.rows);
    expect(rows.map((r) => r.merchant)).toEqual(['Merchant C', 'Merchant D', 'Merchant B', 'Merchant A']);
    expect(rows.find((r) => r.merchant === 'Merchant A')?.cashbackLabel).toBe('Pending');
    expect(model.totalCashbackCents).toBe(11);
  });

  it('adds up cashback per category per month', () => {
    const model = buildReportModel({
      card: CARD,
      from: '2026-10-01',
      to: '2026-10-31',
      transactions: OCTOBER_TABLE,
      policy: CASHBACK_POLICY,
    });
    const [oct] = model.categoryMonths;
    expect(oct.totalCents).toBe(155);
    expect(oct.byCategory[1] + oct.byCategory[2] + oct.byCategory[3]).toBe(155);
    expect(model.activeCategories).toEqual([1, 2, 3]);
  });

  it('is empty when nothing falls in the range', () => {
    const model = buildReportModel({
      card: CARD,
      from: '2025-01-01',
      to: '2025-01-31',
      transactions: OCTOBER_TABLE,
      policy: CASHBACK_POLICY,
    });
    expect(model.isEmpty).toBe(true);
    expect(model.months).toEqual([]);
  });
});
