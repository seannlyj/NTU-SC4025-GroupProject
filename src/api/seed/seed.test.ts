/**
 * Proves the seed data tallies exactly with the brief and the wireframes.
 * If any of these fail, a number on screen is wrong.
 */
import { describe, expect, it } from 'vitest';
import { ELIGIBILITY_RULES, EXCLUSION_RULE_IDS } from '../../config/eligibilityRules';
import { CASHBACK_POLICY } from '../../config/policy';
import { monthCashback } from '../../domain/cashback';
import { buildMonthToDate } from '../../domain/history';
import { formatSGD, sumCents } from '../../domain/money';
import { summarizeMonth } from '../../domain/summary';
import { STATUS_LABELS } from '../../domain/types';
import { buildMonthHistory } from '../mockApi';
import { HISTORY_MONTHS, HISTORY_TRANSACTIONS } from './history';
import { OCTOBER_CATEGORY_SUMMARY, OCTOBER_MONTH, OCTOBER_TRANSACTIONS } from './october';

const money = (cents: number) => formatSGD(cents);

describe('October seed (brief table)', () => {
  const summary = summarizeMonth(OCTOBER_MONTH, OCTOBER_TRANSACTIONS, CASHBACK_POLICY);

  it('has the 13 rows in the brief, in order', () => {
    expect(
      OCTOBER_TRANSACTIONS.map((t) => [
        t.date.slice(8),
        t.merchant.replace('Merchant ', ''),
        STATUS_LABELS[t.status],
        money(t.amountCents),
        t.status === 'eligible' ? money(summary.cashbackByTransaction[t.id]) : '–',
      ]),
    ).toEqual([
      ['12', 'A', 'Pending', 'S$82.00', '–'],
      ['11', 'B', 'Eligible', 'S$44.00', 'S$0.11'],
      ['10', 'C', 'Not eligible', 'S$120.00', '–'],
      ['10', 'D', 'Pending', 'S$200.00', '–'],
      ['09', 'E', 'Pending', 'S$18.00', '–'],
      ['08', 'F', 'Eligible', 'S$64.00', 'S$0.16'],
      ['07', 'G', 'Eligible', 'S$32.00', 'S$0.08'],
      ['06', 'H', 'Not eligible', 'S$480.00', '–'],
      ['05', 'I', 'Eligible', 'S$120.00', 'S$0.30'],
      ['04', 'J', 'Not eligible', 'S$350.00', '–'],
      ['03', 'K', 'Eligible', 'S$200.00', 'S$0.50'],
      ['02', 'L', 'Eligible', 'S$160.00', 'S$0.40'],
      ['01', 'M', 'Not eligible', 'S$230.00', '–'],
    ]);
  });

  it('tallies: S$2,100.00 = S$620.00 + S$300.00 + S$1,180.00', () => {
    expect(money(summary.totalCents)).toBe('S$2,100.00');
    expect(money(summary.eligibleCents)).toBe('S$620.00');
    expect(money(summary.pendingCents)).toBe('S$300.00');
    expect(money(summary.notEligibleCents)).toBe('S$1,180.00');
  });

  it('shows S$620.00 / S$800.00 with S$180.00 to go and S$1.55 cashback', () => {
    expect(money(summary.minSpendCents)).toBe('S$800.00');
    expect(money(summary.toGoCents)).toBe('S$180.00');
    expect(money(summary.cashbackCents)).toBe('S$1.55');
    expect(money(summary.capCents)).toBe('S$160.00');
  });

  it('gives every Not eligible row a rule for its "Why?" link', () => {
    const notEligible = OCTOBER_TRANSACTIONS.filter((t) => t.status === 'not_eligible');
    expect(notEligible.every((t) => t.ineligibleRuleId)).toBe(true);
  });
});

describe('October category summary (decision B)', () => {
  it('matches the Dashboard tiles: 0.62 / 0.48 / 0.45 / 0.00 x5', () => {
    expect(OCTOBER_CATEGORY_SUMMARY.map((c) => money(c.cashbackCents))).toEqual([
      'S$0.62',
      'S$0.48',
      'S$0.45',
      'S$0.00',
      'S$0.00',
      'S$0.00',
      'S$0.00',
      'S$0.00',
    ]);
  });

  it('matches History > This month and sums to the S$2,100.00 total', () => {
    expect(OCTOBER_CATEGORY_SUMMARY.map((c) => c.spendCents / 100)).toEqual([455, 626, 300, 80, 400, 100, 40, 99]);
    expect(sumCents(OCTOBER_CATEGORY_SUMMARY.map((c) => c.spendCents))).toBe(
      sumCents(OCTOBER_TRANSACTIONS.map((t) => t.amountCents)),
    );
  });

  it('reconciles with the transactions: category cashback sums to S$1.55', () => {
    expect(sumCents(OCTOBER_CATEGORY_SUMMARY.map((c) => c.cashbackCents))).toBe(
      monthCashback(OCTOBER_MONTH, OCTOBER_TRANSACTIONS, CASHBACK_POLICY).totalCents,
    );
  });

  it('flags only Categories 2 and 5 as above usual', () => {
    const view = buildMonthToDate(OCTOBER_CATEGORY_SUMMARY);
    expect(view.rows.filter((r) => r.aboveUsual).map((r) => r.categoryId)).toEqual([2, 5]);
  });

  it('documents the known gap: categories cannot be rebuilt from the 13 rows', () => {
    // Every October amount is a whole even dollar figure, so no subset can make S$455 or S$99.
    expect(OCTOBER_TRANSACTIONS.every((t) => t.amountCents % 200 === 0)).toBe(true);
    expect([45_500, 9_900].every((c) => c % 200 !== 0)).toBe(true);
  });
});

describe('History seed (Apr-Sep)', () => {
  const months = HISTORY_MONTHS.map((m) => buildMonthHistory(m, HISTORY_TRANSACTIONS));

  it('covers the six full months before October', () => {
    expect(HISTORY_MONTHS).toEqual(['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']);
  });

  it('earns the report wireframe cashback each month', () => {
    expect(months.map((m) => money(m.cashbackCents))).toEqual([
      'S$1.12',
      'S$1.48',
      'S$0.97',
      'S$1.30',
      'S$1.66',
      'S$1.21',
    ]);
  });

  it('has month totals in the proportions of the wireframe bars (160/200/140/220/180/260 px)', () => {
    const totals = months.map((m) => m.totalSpendCents / 100);
    expect(totals).toEqual([1370, 1712, 1199, 1884, 1541, 2226]);
    const heights = [160, 200, 140, 220, 180, 260];
    totals.forEach((t, i) => expect(Math.abs((t / 2226) * 260 - heights[i])).toBeLessThan(1));
  });

  it('matches September 2026: S$2,226.00 and its category list', () => {
    const sep = months[5];
    expect(money(sep.totalSpendCents)).toBe('S$2,226.00');
    expect(sep.categories.map((c) => c.spendCents / 100)).toEqual([840, 570, 360, 180, 135, 75, 36, 30]);
  });

  it('starts April with the three PDF wireframe rows', () => {
    const april = HISTORY_TRANSACTIONS.filter((t) => t.date.startsWith('2026-04')).slice(0, 3);
    const { byTransaction } = monthCashback('2026-04', HISTORY_TRANSACTIONS, CASHBACK_POLICY);
    expect(
      april.map((t) => [
        t.date,
        t.merchant,
        money(t.amountCents),
        t.status === 'eligible' ? money(byTransaction[t.id]) : STATUS_LABELS[t.status],
      ]),
    ).toEqual([
      ['2026-04-03', 'Merchant A', 'S$42.50', 'S$0.11'],
      ['2026-04-09', 'Merchant B', 'S$18.00', 'S$0.05'],
      ['2026-04-15', 'Merchant C', 'S$120.00', 'Not eligible'],
    ]);
  });

  it('has unique transaction ids across all seed data', () => {
    const ids = [...HISTORY_TRANSACTIONS, ...OCTOBER_TRANSACTIONS].map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Seed against the OCBC 365 terms', () => {
  const all = [...HISTORY_TRANSACTIONS, ...OCTOBER_TRANSACTIONS];

  it('points every Not eligible transaction, and only those, at an exclusion rule', () => {
    const exclusions = new Set<string>(EXCLUSION_RULE_IDS);
    expect(EXCLUSION_RULE_IDS.every((id) => ELIGIBILITY_RULES.some((r) => r.id === id))).toBe(true);
    for (const t of all) {
      if (t.status === 'not_eligible') expect(exclusions.has(t.ineligibleRuleId ?? '')).toBe(true);
      else expect(t.ineligibleRuleId).toBeUndefined();
    }
  });

  it('never reaches the S$800 minimum in a month, so the flat 0.25% base rate is what the terms pay', () => {
    for (const month of [...HISTORY_MONTHS, OCTOBER_MONTH]) {
      const eligible = sumCents(all.filter((t) => t.date.startsWith(month) && t.status === 'eligible').map((t) => t.amountCents));
      expect(eligible).toBeLessThan(CASHBACK_POLICY.minSpendCents);
    }
  });
});
