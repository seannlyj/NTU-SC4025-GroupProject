import type { CategoryId } from '../config/categories';
import { niceCeil } from '../domain/history';
import { formatSGD } from '../domain/money';
import type { ReportModel } from '../domain/report';

/**
 * Category colours for the report chart. Fixed per category (colour follows
 * the category, never its rank), in the validated order of the reference
 * categorical palette: adjacent pairs pass the colour-blind checks.
 */
export const CATEGORY_COLOURS: Record<CategoryId, string> = {
  1: '#2a78d6',
  2: '#eb6834',
  3: '#1baf7a',
  4: '#eda100',
  5: '#e87ba4',
  6: '#008300',
  7: '#6250d6',
  8: '#e34948',
};

export interface Segment {
  categoryId: CategoryId;
  cents: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** The top segment gets the rounded data-end. */
  isTop: boolean;
}

export interface Column {
  month: string;
  label: string;
  totalCents: number;
  totalLabel: string;
  /** Centre of the column. */
  cx: number;
  /** Top of the stack, for the total label. */
  top: number;
  segments: Segment[];
}

export interface Tick {
  y: number;
  label: string;
}

export interface ChartLayout {
  width: number;
  height: number;
  plot: { x: number; y: number; w: number; h: number };
  baseline: number;
  columns: Column[];
  ticks: Tick[];
}

const GAP = 2;
const MAX_BAR = 24;

/**
 * Geometry for "cashback per category, per month" as stacked columns.
 * Shared by the HTML preview (SVG) and the PDF so both draw the same chart.
 */
export function layoutCashbackChart(model: ReportModel, width: number, height: number): ChartLayout {
  const plot = { x: 46, y: 16, w: width - 46 - 4, h: height - 16 - 22 };
  const baseline = plot.y + plot.h;
  const maxTotal = Math.max(0, ...model.categoryMonths.map((m) => m.totalCents));
  const scaleMax = maxTotal > 0 ? niceCeil(maxTotal) : 100;
  const toPx = (cents: number) => (cents / scaleMax) * plot.h;
  const slot = plot.w / Math.max(1, model.categoryMonths.length);
  const barW = Math.min(MAX_BAR, slot * 0.5);

  const columns: Column[] = model.categoryMonths.map((m, i) => {
    const cx = plot.x + slot * (i + 0.5);
    const present = model.activeCategories.filter((id) => m.byCategory[id] > 0);
    let y = baseline;
    const segments: Segment[] = present.map((categoryId, k) => {
      const h = toPx(m.byCategory[categoryId]);
      const top = y - h;
      const isTop = k === present.length - 1;
      const seg: Segment = {
        categoryId,
        cents: m.byCategory[categoryId],
        x: cx - barW / 2,
        y: top + (isTop ? 0 : GAP),
        w: barW,
        h: Math.max(0.5, h - (isTop ? 0 : GAP)),
        isTop,
      };
      y = top;
      return seg;
    });
    return { month: m.month, label: m.label, totalCents: m.totalCents, totalLabel: formatSGD(m.totalCents), cx, top: y, segments };
  });

  const ticks: Tick[] = [0, 0.5, 1].map((f) => ({ y: baseline - f * plot.h, label: formatSGD(Math.round(scaleMax * f)) }));
  return { width, height, plot, baseline, columns, ticks };
}

/** Per-category totals for the legend (the visible-label relief for the lighter hues). */
export function legendEntries(model: ReportModel): { categoryId: CategoryId; cents: number }[] {
  return model.activeCategories.map((categoryId) => ({
    categoryId,
    cents: model.categoryMonths.reduce((sum, m) => sum + m.byCategory[categoryId], 0),
  }));
}
