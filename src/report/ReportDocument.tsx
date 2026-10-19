import { motion } from 'motion/react';
import { categoryName } from '../config/categories';
import { formatSGD } from '../domain/money';
import type { ReportModel } from '../domain/report';
import { Rise, useEntrance } from '../motion/primitives';
import { dur, ease } from '../motion/tokens';
import { CATEGORY_COLOURS, layoutCashbackChart, legendEntries } from './chart';

export const PAGE_WIDTH = 595;
const CHART_W = 507;
const CHART_H = 151;

/** Rounded-top rectangle path: 4px data-end, square at the baseline. */
function columnPath(x: number, y: number, w: number, h: number, round: boolean): string {
  const r = round ? Math.min(4, h, w / 2) : 0;
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function CategoryChart({ model }: { model: ReportModel }) {
  const enter = useEntrance();
  const chart = layoutCashbackChart(model, CHART_W, CHART_H);
  const legend = legendEntries(model);
  return (
    <figure className="m-0">
      <svg
        width={CHART_W}
        height={CHART_H}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        role="img"
        aria-label="Cashback per category, per month. Values are in the table that follows."
        className="block"
      >
        {chart.ticks.map((t) => (
          <g key={t.label}>
            <line x1={chart.plot.x} x2={chart.plot.x + chart.plot.w} y1={t.y} y2={t.y} stroke={t.y === chart.baseline ? '#999999' : '#eeeeee'} strokeWidth={1} />
            <text x={chart.plot.x - 6} y={t.y + 3.5} textAnchor="end" fontSize={10} fill="#666666">
              {t.label}
            </text>
          </g>
        ))}
        {chart.columns.map((c, i) => (
          <g key={c.month}>
            <motion.g
              style={{ transformBox: 'view-box', originX: 0, originY: chart.baseline / CHART_H }}
              initial={enter ? { scaleY: 0 } : false}
              animate={{ scaleY: 1 }}
              transition={{ duration: dur(0.7), ease: ease.out, delay: dur(0.45) + i * dur(0.07) }}
            >
            {c.segments.map((s) => (
              <path key={s.categoryId} d={columnPath(s.x, s.y, s.w, s.h, s.isTop)} fill={CATEGORY_COLOURS[s.categoryId]}>
                <title>{`${c.label}, ${categoryName(s.categoryId)}: ${formatSGD(s.cents)}`}</title>
              </path>
            ))}
            </motion.g>
            {c.totalCents > 0 && (
              <text x={c.cx} y={c.top - 4} textAnchor="middle" fontSize={10} fill="#333333">
                {c.totalLabel}
              </text>
            )}
            <text x={c.cx} y={chart.baseline + 15} textAnchor="middle" fontSize={11} fill="#666666">
              {c.label}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#666666]">
        {legend.map((l) => (
          <span key={l.categoryId} className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-[2px]" style={{ background: CATEGORY_COLOURS[l.categoryId] }} />
            {categoryName(l.categoryId)} <span className="text-[#333333]">{formatSGD(l.cents)}</span>
          </span>
        ))}
      </figcaption>
      <table className="sr-only">
        <caption>Cashback per category, per month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            {legend.map((l) => (
              <th key={l.categoryId} scope="col">
                {categoryName(l.categoryId)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.categoryMonths.map((m) => (
            <tr key={m.month}>
              <th scope="row">{m.label}</th>
              {legend.map((l) => (
                <td key={l.categoryId}>{formatSGD(m.byCategory[l.categoryId])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/**
 * The PDF layout as an HTML page (595px wide, like A4 at 72dpi), used by the
 * /report/pdf preview. The downloadable file is drawn from the same model.
 */
export function ReportDocument({ model }: { model: ReportModel }) {
  return (
    <article
      className="bg-white px-[44px] pt-[40px] pb-[44px] text-[13px] text-[#333333]"
      style={{ width: PAGE_WIDTH, fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
      aria-label={`${model.title}, ${model.subtitle}`}
    >
      <Rise y={8} delay={dur(0.2)}>
        <h1 className="text-[22px] leading-7 font-semibold text-brand">{model.title}</h1>
        <p className="mt-[6px] text-[13px] text-[#666666]">{model.subtitle}</p>
      </Rise>

      {model.isEmpty ? (
        <p className="mt-10 text-[15px] font-semibold">No transactions in this period.</p>
      ) : (
        <>
          <Rise as="section" y={12} delay={dur(0.28)} className="mt-[27px]">
            <h2 className="border-b border-[#999999] pb-[9px] text-[15px] font-semibold">By month</h2>
            <table className="w-full border-collapse">
              <tbody>
                {model.months.map((m) => (
                  <tr key={m.month} className="h-8 border-b border-[#eeeeee]">
                    <th scope="row" className="text-left font-normal">
                      {m.label}
                    </th>
                    <td className="tabular text-right">{formatSGD(m.cashbackCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Rise>

          <Rise as="section" y={12} delay={dur(0.36)} className="mt-[30px]">
            <h2 className="mb-[14px] text-[15px] font-semibold">By category</h2>
            <CategoryChart model={model} />
          </Rise>

          {model.sections.map((s, i) => (
            <Rise as="section" key={s.month} y={12} delay={dur(0.44) + Math.min(i, 3) * dur(0.06)} className="mt-[30px]">
              <h2 className="border-b border-[#999999] pb-[9px] text-[15px] font-semibold">{s.title}</h2>
              <table className="w-full border-collapse">
                <thead className="sr-only">
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Merchant</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Cashback</th>
                  </tr>
                </thead>
                <tbody>
                  {s.rows.map((r) => (
                    <tr key={r.id} className="h-8 border-b border-[#eeeeee]">
                      <td className="w-[68px]">{r.dateLabel}</td>
                      <td>{r.merchant}</td>
                      <td className="tabular w-[110px] text-right">{formatSGD(r.amountCents)}</td>
                      <td className="tabular w-[98px] text-right">{r.cashbackLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Rise>
          ))}
        </>
      )}
      <p className="mt-8 text-[10px] text-[#999999]">Prototype for NTU SC4025 coursework. Generated from mock data only.</p>
    </article>
  );
}
