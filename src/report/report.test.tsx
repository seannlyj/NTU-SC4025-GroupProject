import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MOCK_CARD, setMockLatency } from '../api/mockApi';
import { resetScenario } from '../api/scenario';
import { HISTORY_TRANSACTIONS } from '../api/seed/history';
import { OCTOBER_TRANSACTIONS } from '../api/seed/october';
import { CASHBACK_POLICY } from '../config/policy';
import { buildReportModel } from '../domain/report';
import { layoutCashbackChart, legendEntries } from './chart';
import { createReportPdf } from './pdf';
import { renderApp } from '../test/renderApp';

const model = buildReportModel({
  card: MOCK_CARD,
  from: '2026-04-01',
  to: '2026-09-30',
  transactions: [...HISTORY_TRANSACTIONS, ...OCTOBER_TRANSACTIONS],
  policy: CASHBACK_POLICY,
});

describe('report model from the seed (01 Apr – 30 Sep 2026)', () => {
  it('matches the PDF wireframe by-month figures', () => {
    expect(model.months.map((m) => [m.label, m.cashbackCents])).toEqual([
      ['Apr 2026', 112],
      ['May 2026', 148],
      ['Jun 2026', 97],
      ['Jul 2026', 130],
      ['Aug 2026', 166],
      ['Sep 2026', 121],
    ]);
    expect(model.subtitle).toBe('OCBC 365 · •••• 1234 · 01 Apr 2026 to 30 Sep 2026');
  });

  it('has a transaction table per month that adds up to the month', () => {
    expect(model.sections.map((s) => s.title)).toEqual([
      'Transactions: Apr 2026',
      'Transactions: May 2026',
      'Transactions: Jun 2026',
      'Transactions: Jul 2026',
      'Transactions: Aug 2026',
      'Transactions: Sep 2026',
    ]);
    for (const [i, s] of model.sections.entries()) {
      const earned = s.rows.filter((r) => r.earned).reduce((sum, r) => sum + Number(r.cashbackLabel.slice(2)) * 100, 0);
      expect(Math.round(earned)).toBe(model.months[i].cashbackCents);
    }
    expect(model.sections[0].rows.slice(0, 3).map((r) => r.cashbackLabel)).toEqual(['S$0.11', 'S$0.05', 'Not eligible']);
  });
});

describe('chart layout', () => {
  const chart = layoutCashbackChart(model, 507, 151);

  it('draws one stacked column per month, tallest where the total is largest', () => {
    expect(chart.columns).toHaveLength(6);
    const heights = chart.columns.map((c) => chart.baseline - c.top);
    const totals = chart.columns.map((c) => c.totalCents);
    expect(heights.indexOf(Math.max(...heights))).toBe(totals.indexOf(Math.max(...totals)));
  });

  it('keeps bars thin and inside the plot', () => {
    for (const c of chart.columns) {
      for (const s of c.segments) {
        expect(s.w).toBeLessThanOrEqual(24);
        expect(s.y).toBeGreaterThanOrEqual(chart.plot.y);
        expect(s.y + s.h).toBeLessThanOrEqual(chart.baseline + 0.001);
      }
      expect(c.segments.filter((s) => s.isTop)).toHaveLength(c.segments.length ? 1 : 0);
    }
  });

  it('legend totals add up to the report total', () => {
    const legend = legendEntries(model);
    expect(legend.map((l) => l.categoryId)).toEqual([1, 2, 3, 4]);
    expect(legend.reduce((a, l) => a + l.cents, 0)).toBe(model.totalCashbackCents);
  });
});

describe('PDF file', () => {
  it('is an A4 PDF with every month and the footer on each page', async () => {
    const doc = await createReportPdf(model);
    const pages = doc.getNumberOfPages();
    expect(pages).toBeGreaterThanOrEqual(2);
    expect(Math.round(doc.internal.pageSize.getWidth())).toBe(595);
    expect(Math.round(doc.internal.pageSize.getHeight())).toBe(842);
    const bytes = new Uint8Array(doc.output('arraybuffer'));
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-');
  });
});

describe('/report/pdf preview', () => {
  beforeEach(() => {
    setMockLatency(0);
    resetScenario();
  });

  it('renders the report layout for the chosen range', async () => {
    renderApp('/report/pdf?from=2026-04-01&to=2026-09-30');
    const doc = await screen.findByRole('article');
    expect(within(doc).getByRole('heading', { name: 'Cashback report' })).toBeInTheDocument();
    expect(within(doc).getByText('OCBC 365 · •••• 1234 · 01 Apr 2026 to 30 Sep 2026')).toBeInTheDocument();
    const byMonth = within(doc).getByRole('heading', { name: 'By month' }).closest('section')!;
    expect(within(byMonth).getAllByRole('row').map((r) => r.textContent)).toEqual([
      'Apr 2026S$1.12',
      'May 2026S$1.48',
      'Jun 2026S$0.97',
      'Jul 2026S$1.30',
      'Aug 2026S$1.66',
      'Sep 2026S$1.21',
    ]);
    expect(within(doc).getByRole('heading', { name: 'Transactions: Apr 2026' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeEnabled();
  });

  it('refuses a backwards range', async () => {
    renderApp('/report/pdf?from=2026-09-30&to=2026-04-01');
    expect(await screen.findByText("End date can't be before the start date.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeDisabled();
  });
});
