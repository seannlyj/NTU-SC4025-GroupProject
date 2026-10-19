import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState, type ReactNode } from 'react';
import { AppLink } from '../app/navigation';
import type { HistoryData } from '../api';
import { useHistory } from '../app/queries';
import { formatMonthName } from '../domain/dates';
import {
  buildCategoryBreakdown,
  buildMonthBars,
  buildMonthToDate,
  type MonthHistory,
} from '../domain/history';
import { formatSGD } from '../domain/money';
import { Card } from '../components/Card';
import { EmptyMessage, LoadingRegion, Skeleton } from '../components/Feedback';
import { SubPageHeader } from '../components/PageHeader';
import { AnimatedMoney, Entrance, FillBar, Rise, useEntrance } from '../motion/primitives';
import { dur, ease, spring, staggerDelay, timing } from '../motion/tokens';

type Tab = 'six-months' | 'month';

/**
 * /history (Last 6 months), /history/month (This month) and /history/empty.
 *
 * Motion: the red tab pill glides between tabs and the content swaps with a
 * crossfade. Month bars grow from the baseline one after another; picking a
 * month tweens its total, category amounts and bar lengths to the new values.
 * This month's bars fill in turn, then the "Your usual" markers drop in.
 */
export function HistoryScreen({ tab }: { tab: Tab }) {
  return (
    <Entrance>
      <HistoryContent tab={tab} />
    </Entrance>
  );
}

function HistoryContent({ tab }: { tab: Tab }) {
  const history = useHistory();
  const [firstTab] = useState(tab);
  const switched = useRef(false);
  if (tab !== firstTab) switched.current = true;

  if (history.isSuccess && history.data === null) {
    return (
      <>
        <SubPageHeader title="Spending history" />
        <EmptyMessage className="mt-[110px]">No spending history yet.</EmptyMessage>
      </>
    );
  }

  return (
    <>
      <SubPageHeader title="Spending history" />
      <Rise as="nav" y={10} delay={dur(0.06)} aria-label="History period" className="isolate mt-[14px] flex gap-[9px] px-5">
        <TabLink to="/history" active={tab === 'six-months'}>
          Last 6 months
        </TabLink>
        <TabLink to="/history/month" active={tab === 'month'}>
          This month
        </TabLink>
      </Rise>
      {history.isPending ? (
        <HistorySkeleton />
      ) : history.isError ? (
        <EmptyMessage className="mt-20">Spending history is unavailable right now.</EmptyMessage>
      ) : (
        <AnimatePresence mode="popLayout">
          {/* No initial={false} here: it would also silence the entrance of everything inside. */}
          <motion.div key={tab} className="w-full" exit={{ opacity: 0, transition: { duration: timing.exit, ease: ease.in } }}>
            {/* After a tab switch the new tab plays its own entrance. */}
            <Entrance force={switched.current ? true : undefined}>
              {tab === 'six-months' ? <SixMonths months={history.data!.months} /> : <ThisMonth current={history.data!.current} />}
            </Entrance>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}

function TabLink({ to, active, children }: { to: string; active: boolean; children: ReactNode }) {
  return (
    <AppLink
      to={to}
      replace
      nav="none"
      preventScrollReset
      aria-current={active ? 'page' : undefined}
      className={`pressable relative flex h-[42px] items-center rounded-full border-[1.5px] px-[18px] text-[14px] whitespace-nowrap transition-colors duration-200 ${
        active ? 'border-transparent font-semibold text-white' : 'border-outline text-ink'
      }`}
    >
      {active && (
        <motion.span
          layoutId="history-tab-pill"
          className="absolute -inset-[1.5px] z-0 rounded-full bg-brand-strong"
          transition={spring.soft}
        />
      )}
      {/* Labels sit above both tabs' pill, so the gliding pill never covers the other label. */}
      <span className="relative z-10">{children}</span>
    </AppLink>
  );
}

const BAR_MAX_PX = 130;

function SixMonths({ months }: { months: MonthHistory[] }) {
  const enter = useEntrance();
  const [selected, setSelected] = useState(months[months.length - 1]?.month);
  // Once the user touches the chart, the bars drop their entrance timing and respond at once.
  const [touched, setTouched] = useState(false);
  const reveal = enter && !touched;
  // Tracked on the whole button (its hit area is wider than the bar), so a press anywhere shows at once.
  const [pressed, setPressed] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const bars = buildMonthBars(months);
  const month = months.find((m) => m.month === selected) ?? months[months.length - 1];
  const bar = bars.find((b) => b.month === month?.month);
  if (!month || !bar) return null;

  return (
    <>
      <Rise y={16} delay={dur(0.1)}>
        <Card className="mx-4 mt-3 px-4 pt-4 pb-2" aria-labelledby="by-month-title">
          <h2 id="by-month-title" className="text-[13px] leading-5 text-ink-muted">
            Total spending by month
          </h2>
          <div className="flex h-[164px] items-end justify-between border-b border-field-strong px-2">
            {bars.map((b, i) => {
              const isSelected = b.month === month.month;
              const isPressed = pressed === b.month;
              const release = () => setPressed((p) => (p === b.month ? null : p));
              return (
                <button
                  key={b.month}
                  type="button"
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    setTouched(true);
                    setPressed(b.month);
                  }}
                  onPointerUp={release}
                  onPointerCancel={release}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(b.month)}
                  onPointerLeave={() => {
                    release();
                    setHovered((h) => (h === b.month ? null : h));
                  }}
                  onClick={() => {
                    setTouched(true);
                    setSelected(b.month);
                  }}
                  aria-pressed={isSelected}
                  aria-label={`${b.longLabel}: ${formatSGD(b.totalCents)}`}
                  className="relative flex h-full w-7 touch-manipulation items-end before:absolute before:-inset-x-3 before:inset-y-0 before:content-['']"
                >
                  <motion.span
                    className="block w-full origin-bottom rounded-t-[3px]"
                    style={{ height: Math.max(2, Math.round(b.fraction * BAR_MAX_PX)) }}
                    initial={enter ? { scaleY: 0, backgroundColor: 'var(--color-bar-muted)' } : false}
                    animate={{
                      // Red the moment it is pressed, before the click lands.
                      scaleY: isPressed ? 0.95 : 1,
                      backgroundColor:
                        isSelected || isPressed
                          ? 'var(--color-brand)'
                          : hovered === b.month
                            ? 'var(--color-seg-pending)'
                            : 'var(--color-bar-muted)',
                    }}
                    transition={
                      reveal
                        ? {
                            scaleY: { duration: dur(0.7), ease: ease.out, delay: dur(0.22) + i * dur(0.06) },
                            backgroundColor: { duration: dur(0.25), delay: isSelected ? dur(0.7) : 0 },
                          }
                        : {
                            scaleY: isPressed ? { duration: timing.feedback, ease: ease.out } : spring.snappy,
                            backgroundColor: { duration: timing.feedback },
                          }
                    }
                  />
                </button>
              );
            })}
          </div>
          <div className="flex justify-between px-2 pt-1" aria-hidden="true">
            {bars.map((b) => (
              <span key={b.month} className="flex w-7 justify-center">
                <span
                  className={`text-[12px] leading-5 transition-colors duration-200 ${
                    b.month === month.month ? 'font-semibold text-ink-strong' : 'text-ink-muted'
                  }`}
                >
                  {b.label}
                </span>
              </span>
            ))}
          </div>
        </Card>
      </Rise>

      <section aria-labelledby="month-detail-title">
        <Rise y={10} delay={dur(0.18)} className="mt-5 flex items-center justify-between px-5 leading-6">
          <span id="month-detail-title" className="relative block overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.h2
                key={bar.month}
                className="text-[16px] font-semibold text-ink"
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: dur(0.3), ease: ease.out }}
              >
                {bar.longLabel}
              </motion.h2>
            </AnimatePresence>
          </span>
          <AnimatedMoney className="tabular text-[15px] font-semibold text-ink" cents={month.totalSpendCents} delay={dur(0.25)} />
        </Rise>
        <Rise y={16} delay={dur(0.22)}>
          <Card className="mx-4 mt-[7px] px-4">
            <ul className="divide-y divide-track">
              {buildCategoryBreakdown(month.categories).map((row, i) => (
                <Rise as="li" key={row.categoryId} y={8} delay={staggerDelay(i, 0.28, dur(0.04))} className="pt-[11px] pb-[9.5px]">
                  <div className="flex items-center justify-between text-[15px] leading-[22px]">
                    <span className="text-ink">{row.name}</span>
                    <AnimatedMoney className="tabular font-semibold text-ink" cents={row.spendCents} delay={staggerDelay(i, 0.32, dur(0.04))} />
                  </div>
                  <div className="mt-[5.5px] h-1.5 overflow-hidden rounded-full bg-track" aria-hidden="true">
                    <FillBar fraction={row.fraction} delay={staggerDelay(i, 0.36, dur(0.04))} className="h-full rounded-full bg-brand" />
                  </div>
                </Rise>
              ))}
            </ul>
          </Card>
        </Rise>
      </section>
    </>
  );
}

function ThisMonth({ current }: { current: HistoryData['current'] }) {
  const enter = useEntrance();
  const view = buildMonthToDate(current.categories);
  return (
    <section aria-labelledby="month-to-date-title">
      <Rise y={10} delay={dur(0.1)} className="mt-5 flex items-center justify-between px-5 leading-6">
        <h2 id="month-to-date-title" className="text-[16px] font-semibold text-ink">
          {formatMonthName(current.month)} so far
        </h2>
        <AnimatedMoney className="tabular text-[15px] font-semibold text-ink" cents={view.totalCents} delay={dur(0.18)} />
      </Rise>
      <Rise y={8} delay={dur(0.14)} className="mt-3.5 flex items-center gap-[34px] px-5 text-[13px] leading-5 text-ink-muted" aria-hidden="true">
        <span className="flex items-center gap-[10px]">
          <span className="h-2 w-4 rounded-full bg-brand" />
          Month to date
        </span>
        <span className="flex items-center gap-[10px]">
          <span className="h-[14px] w-0.5 bg-ink-strong" />
          Your usual
        </span>
      </Rise>
      <Rise y={16} delay={dur(0.18)}>
        <Card className="mx-4 mt-1.5 px-4">
          <ul className="divide-y divide-track">
            {view.rows.map((row, i) => (
              <Rise as="li" key={row.categoryId} y={8} delay={staggerDelay(i, 0.22, dur(0.045))} className="pt-[13px] pb-[8px]">
                <div className="flex items-center justify-between text-[15px] leading-[22px]">
                  <span className="text-ink">{row.name}</span>
                  <AnimatedMoney className="tabular font-semibold text-ink" cents={row.spendCents} delay={staggerDelay(i, 0.3, dur(0.045))} />
                </div>
                {row.aboveUsual && (
                  <Rise as="p" x={-8} y={0} delay={staggerDelay(i, 0.75, dur(0.05))} className="text-[13px] leading-[18px] font-semibold text-brand-deep">
                    <span aria-hidden="true">▲ </span>Above your usual spending
                  </Rise>
                )}
                <p className="sr-only">Your usual is {formatSGD(row.usualCents)}.</p>
                <div className={`relative h-4 ${row.aboveUsual ? 'mt-[3px]' : 'mt-[5px]'}`} aria-hidden="true">
                  <div className="absolute inset-x-0 top-[3px] h-2.5 overflow-hidden rounded-full bg-track">
                    <FillBar fraction={row.fraction} delay={staggerDelay(i, 0.34, dur(0.05))} className="h-full rounded-full bg-brand" />
                  </div>
                  <motion.span
                    className="absolute top-0 h-4 w-0.5 -translate-x-1/2 origin-center bg-ink-strong"
                    style={{ left: `${row.usualFraction * 100}%` }}
                    data-testid={`usual-${row.categoryId}`}
                    initial={enter ? { scaleY: 0, opacity: 0 } : false}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{ ...spring.pop, delay: enter ? staggerDelay(i, 0.8, dur(0.05)) : 0 }}
                  />
                </div>
              </Rise>
            ))}
          </ul>
        </Card>
      </Rise>
    </section>
  );
}

function HistorySkeleton() {
  return (
    <LoadingRegion label="Loading spending history">
      <div className="mx-4 mt-3 rounded-[20px] bg-card p-4">
        <Skeleton className="h-4 w-44" />
        <div className="mt-8 flex h-[130px] items-end justify-between px-2">
          {[80, 100, 70, 110, 90, 130].map((h, i) => (
            <Skeleton key={i} className="w-7 rounded-b-none!" style={{ height: h }} />
          ))}
        </div>
      </div>
      <div className="mx-4 mt-5 space-y-4 rounded-[20px] bg-card p-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-1.5 w-full" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
