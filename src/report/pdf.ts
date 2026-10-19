import type { jsPDF as JsPdf } from 'jspdf';
import { categoryName } from '../config/categories';
import { formatSGD } from '../domain/money';
import type { ReportModel } from '../domain/report';
import { CATEGORY_COLOURS, layoutCashbackChart, legendEntries } from './chart';

/**
 * Draws the cashback report as a real (vector, selectable-text) A4 PDF.
 * A4 in points is 595 wide, the same as the wireframe, so the layout numbers
 * match the HTML preview. jsPDF is loaded only when a report is generated.
 */

const M = 44;
const RIGHT = 595.28 - M;
const ROW = 32;
const INK = '#333333';
const MUTED = '#666666';
const FAINT = '#999999';
const RULE = '#eeeeee';
const BRAND = '#ed1c24';
const FOOTER = 'Prototype for NTU SC4025 coursework. Generated from mock data only.';

export async function createReportPdf(model: ReportModel): Promise<JsPdf> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  doc.setProperties({ title: `${model.title} ${model.from} to ${model.to}`, subject: model.subtitle, creator: 'Rewards Tracker prototype' });
  const pageH = doc.internal.pageSize.getHeight();
  const bottom = pageH - 56;
  let y = 0;

  const font = (size: number, weight: 'normal' | 'bold' = 'normal', colour = INK) => {
    doc.setFont('helvetica', weight);
    doc.setFontSize(size);
    doc.setTextColor(colour);
  };
  const rule = (at: number, colour: string) => {
    doc.setDrawColor(colour);
    doc.setLineWidth(colour === RULE ? 0.75 : 1);
    doc.line(M, at, RIGHT, at);
  };
  const newPage = () => {
    doc.addPage();
    y = 56;
  };
  const ensure = (space: number) => {
    if (y + space > bottom) newPage();
  };
  const heading = (text: string) => {
    font(15, 'bold');
    doc.text(text, M, y);
    rule(y + 10, FAINT);
    y += 10;
  };

  // Header: title, then "OCBC 365 · •••• 1234 · 01 Apr 2026 to 30 Sep 2026".
  // The built-in PDF fonts cannot be relied on for "·" and "•", so those are drawn as dots.
  font(22, 'bold', BRAND);
  doc.text(model.title, M, 62);
  font(13, 'normal', MUTED);
  doc.setFillColor(MUTED);
  let x = M;
  const dot = (r: number, advance: number) => {
    doc.circle(x + advance / 2, 79.8, r, 'F');
    x += advance;
  };
  model.subtitle.split(' · ').forEach((part, i) => {
    if (i > 0) {
      x += doc.getTextWidth(' ');
      dot(1.1, 3);
      x += doc.getTextWidth(' ');
    }
    const masked = part.startsWith('•••• ');
    if (masked) {
      for (let k = 0; k < 4; k++) dot(1.9, 6.2);
      x += doc.getTextWidth(' ');
    }
    const text = masked ? part.slice(5) : part;
    doc.text(text, x, 84);
    x += doc.getTextWidth(text);
  });

  y = 127;
  if (model.isEmpty) {
    font(15, 'bold');
    doc.text('No transactions in this period.', M, y);
  } else {
    heading('By month');
    for (const m of model.months) {
      ensure(ROW);
      font(13);
      doc.text(m.label, M, y + 20.5);
      doc.text(formatSGD(m.cashbackCents), RIGHT, y + 20.5, { align: 'right' });
      y += ROW;
      rule(y, RULE);
    }

    // By category: stacked columns, same geometry as the preview.
    y += 42;
    ensure(151 + 60);
    font(15, 'bold');
    doc.text('By category', M, y);
    const top = y + 14;
    const chart = layoutCashbackChart(model, 507, 151);
    for (const t of chart.ticks) {
      doc.setDrawColor(t.y === chart.baseline ? FAINT : RULE);
      doc.setLineWidth(t.y === chart.baseline ? 1 : 0.75);
      doc.line(M + chart.plot.x, top + t.y, M + chart.plot.x + chart.plot.w, top + t.y);
      font(9, 'normal', MUTED);
      doc.text(t.label, M + chart.plot.x - 6, top + t.y + 3, { align: 'right' });
    }
    for (const c of chart.columns) {
      for (const s of c.segments) {
        doc.setFillColor(CATEGORY_COLOURS[s.categoryId]);
        const sx = M + s.x;
        const sy = top + s.y;
        if (s.isTop && s.h > 4) {
          doc.roundedRect(sx, sy, s.w, Math.min(s.h, 8), 4, 4, 'F');
          doc.rect(sx, sy + 4, s.w, s.h - 4, 'F');
        } else {
          doc.rect(sx, sy, s.w, s.h, 'F');
        }
      }
      if (c.totalCents > 0) {
        font(9, 'normal', INK);
        doc.text(c.totalLabel, M + c.cx, top + c.top - 4, { align: 'center' });
      }
      font(10, 'normal', MUTED);
      doc.text(c.label, M + c.cx, top + chart.baseline + 15, { align: 'center' });
    }
    // Legend with per-category totals, so no value depends on colour alone.
    let lx = M;
    const ly = top + 151 + 14;
    for (const l of legendEntries(model)) {
      const label = `${categoryName(l.categoryId)} ${formatSGD(l.cents)}`;
      font(10, 'normal', MUTED);
      const w = 14 + doc.getTextWidth(label) + 16;
      if (lx + w > RIGHT) break;
      doc.setFillColor(CATEGORY_COLOURS[l.categoryId]);
      doc.roundedRect(lx, ly - 7.5, 8, 8, 1.5, 1.5, 'F');
      doc.text(label, lx + 12, ly);
      lx += w;
    }
    y = ly + 40;

    // Transactions, one table per month.
    for (const s of model.sections) {
      ensure(30 + ROW * 2);
      heading(s.title);
      for (const r of s.rows) {
        if (y + ROW > bottom) {
          newPage();
          heading(`${s.title} (continued)`);
        }
        font(13);
        doc.text(r.dateLabel, M, y + 20.5);
        doc.text(r.merchant, M + 68, y + 20.5);
        doc.text(formatSGD(r.amountCents), M + 411, y + 20.5, { align: 'right' });
        doc.text(r.cashbackLabel, RIGHT, y + 20.5, { align: 'right' });
        y += ROW;
        rule(y, RULE);
      }
      y += 40;
    }
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    font(9, 'normal', FAINT);
    doc.text(FOOTER, M, pageH - 24);
    doc.text(`Page ${p} of ${pages}`, RIGHT, pageH - 24, { align: 'right' });
  }
  return doc;
}

/** Builds the PDF and saves it as a file download (ASSUMPTIONS.md item 5). */
export async function downloadReportPdf(model: ReportModel): Promise<void> {
  const doc = await createReportPdf(model);
  doc.save(model.fileName);
}
