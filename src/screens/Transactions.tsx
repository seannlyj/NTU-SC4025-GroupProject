import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useEffect, useMemo, useRef } from 'react';
import { Outlet, useLocation, useNavigate, type To } from 'react-router';
import { AppLink } from '../app/navigation';
import { DEFAULT_PERIOD, useMonthsTransactions } from '../app/queries';
import { CASHBACK_POLICY } from '../config/policy';
import { transactionCashbackMap } from '../domain/cashback';
import { formatDayMonth } from '../domain/dates';
import {
  applyFilters,
  effectivePeriod,
  filterChips,
  filtersToSearch,
  groupByDate,
  hasActiveFilters,
  parseFilters,
  type TransactionFilters,
} from '../domain/filters';
import { FilterChip } from '../components/Chip';
import { LoadingRegion, Skeleton } from '../components/Feedback';
import { FilterIcon } from '../components/icons';
import { SubPageHeader } from '../components/PageHeader';
import { TransactionRow } from '../components/TransactionRow';
import { Entrance, Pop, useEntrance } from '../motion/primitives';
import { dur, ease, spring, staggerDelay, timing } from '../motion/tokens';

/**
 * The filter set /transactions/empty opens with when reached directly.
 * It mirrors the wireframe (Posted + two categories + 01 Oct – 12 Oct) but with
 * categories that really have no posted transactions in the seed.
 */
export const NO_MATCH_PRESET: TransactionFilters = {
  statuses: ['posted'],
  categories: [7, 8],
  ...DEFAULT_PERIOD,
};

export const FILTER_BUTTON_ID = 'transactions-filter-button';

/** Filters confirmed in the sheet, waiting for the list underneath to come back (see returnToListWith). */
let pendingFilters: To | null = null;

/**
 * Confirming the sheet: step back out of the sheet's history entry, then the
 * list rewrites its own entry with the new filters. Filtering never adds a
 * history step, so Back from a filtered list leaves Transactions.
 */
export function returnToListWith(target: To, stepBack: () => void) {
  pendingFilters = target;
  stepBack();
}

/**
 * /transactions, /transactions/filter (sheet on top) and /transactions/empty.
 * Filters live in the URL, so every state can be linked to. Changing them
 * updates the current history entry instead of adding one, so Back always
 * returns to the screen before Transactions.
 *
 * Motion: date groups rise in one after another; when filters change, chips pop
 * in and out, groups that leave fade away and the rest glide into place.
 */
export function TransactionsScreen(props: { emptyRoute?: boolean }) {
  return (
    <Entrance>
      <TransactionsContent {...props} />
    </Entrance>
  );
}

function TransactionsContent({ emptyRoute = false }: { emptyRoute?: boolean }) {
  const enter = useEntrance();
  const { search, pathname } = useLocation();
  const navigate = useNavigate();
  const filters = useMemo(() => parseFilters(search), [search]);
  const period = useMemo(() => effectivePeriod(filters, DEFAULT_PERIOD), [filters]);
  const query = useMonthsTransactions(period);

  const { results, cashback } = useMemo(() => {
    const all = query.data ?? [];
    return {
      results: applyFilters(all, { ...filters, ...period }),
      cashback: transactionCashbackMap(all, CASHBACK_POLICY),
    };
  }, [query.data, filters, period]);

  const empty = query.isSuccess && results.length === 0;
  const openingDirectly = emptyRoute && !hasActiveFilters(filters);
  const pending = query.isPending || openingDirectly;
  const groups = useMemo(() => groupByDate(results), [results]);

  // Only the first appearance of the list is staggered; later changes animate at once.
  const listShown = useRef(false);
  const staggerList = !listShown.current;
  useEffect(() => {
    if (!pending && !empty) listShown.current = true;
  });

  // The sheet has closed: show the filters it confirmed in this same history entry.
  useEffect(() => {
    if (!pendingFilters || pathname.endsWith('/filter')) return;
    const target = pendingFilters;
    pendingFilters = null;
    // No view transition of its own: the sheet's slide-down is still playing over the list.
    navigate(target, { replace: true, preventScrollReset: true, state: { nav: 'sheet-close' } });
  }, [pathname, navigate]);

  useEffect(() => {
    if (openingDirectly) {
      navigate({ pathname: '/transactions/empty', search: filtersToSearch(NO_MATCH_PRESET) }, { replace: true });
    } else if (query.isSuccess && emptyRoute !== empty && !pathname.endsWith('/filter')) {
      // Keep the URL honest: no results live at /transactions/empty, results at /transactions.
      navigate({ pathname: empty ? '/transactions/empty' : '/transactions', search }, { replace: true });
    }
  }, [openingDirectly, query.isSuccess, empty, emptyRoute, navigate, pathname, search]);

  const applyAndGo = (next: TransactionFilters) =>
    navigate({ pathname: emptyRoute ? '/transactions/empty' : '/transactions', search: filtersToSearch(next) }, { replace: true });

  const chips = filterChips(filters);

  return (
    <>
      <SubPageHeader title="Transactions" />

      <AnimatePresence initial={false}>
        {chips.length > 0 && (
          <motion.section
            key="chips"
            aria-label="Active filters"
            className="mt-[13px] px-5"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: timing.exit } }}
            transition={{ duration: timing.enter, ease: ease.out }}
          >
            <ul className="flex flex-wrap gap-2">
              <AnimatePresence initial={enter} mode="popLayout">
                {chips.map((chip, i) => (
                  <motion.li
                    key={chip.key}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: timing.exit } }}
                    transition={{ ...spring.pop, delay: enter ? dur(0.14) + i * dur(0.05) : 0, layout: spring.soft }}
                  >
                    <FilterChip label={chip.label} onRemove={() => applyAndGo(chip.without)} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <motion.button
              layout="position"
              type="button"
              onClick={() => navigate({ pathname: '/transactions', search: '' }, { replace: true })}
              className="pressable mt-2 flex min-h-11 items-center px-1.5 text-[15px] text-link"
              transition={{ layout: spring.soft }}
            >
              Clear all
            </motion.button>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.div layout="position" className="relative" transition={{ layout: spring.soft }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {pending ? (
            <motion.div key="skeleton" className="w-full" exit={{ opacity: 0, transition: { duration: timing.exit } }}>
              <ListSkeleton />
            </motion.div>
          ) : query.isError || empty ? (
            <motion.p
              key="empty"
              role="status"
              className={`px-6 text-center text-[15px] leading-[22px] font-semibold text-ink ${
                query.isError ? 'mt-20' : chips.length ? 'mt-[76px]' : 'mt-24'
              }`}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: timing.exit } }}
              transition={{ duration: timing.enter, ease: ease.out, delay: enter ? dur(0.12) : 0 }}
            >
              {query.isError ? 'Transactions are unavailable right now.' : 'No transactions match your filters.'}
            </motion.p>
          ) : (
            <motion.div key="list" className="relative mt-4 px-5 pb-3" exit={{ opacity: 0, transition: { duration: timing.exit } }}>
              <p className="sr-only" role="status">
                {results.length} transactions
              </p>
              <LayoutGroup>
                <AnimatePresence initial={enter || staggerList} mode="popLayout">
                  {groups.map((group, gi) => (
                    <motion.section
                      key={group.date}
                      layout="position"
                      aria-labelledby={`day-${group.date}`}
                      className="mb-3"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, transition: { duration: timing.exit } }}
                      transition={{
                        duration: timing.enter,
                        ease: ease.out,
                        delay: staggerList ? staggerDelay(gi, 0.1, dur(0.05), 8) : 0,
                        layout: spring.soft,
                      }}
                    >
                      <h2 id={`day-${group.date}`} className="text-[13px] leading-[18px] text-ink-muted">
                        {formatDayMonth(group.date)}
                      </h2>
                      <ul className="divide-y divide-divider-soft">
                        {group.transactions.map((t) => (
                          <li key={t.id} className="[&:not(:first-child)>div]:pt-[10px] [&:not(:last-child)>div]:pb-[10px]">
                            <TransactionRow transaction={t} cashbackCents={cashback[t.id] ?? 0} />
                          </li>
                        ))}
                      </ul>
                    </motion.section>
                  ))}
                </AnimatePresence>
              </LayoutGroup>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="filter-fab no-print fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2">
        <Pop as="div" delay={dur(0.35)}>
          <AppLink
            id={FILTER_BUTTON_ID}
            to={{ pathname: '/transactions/filter', search }}
            state={{ fromList: true }}
            preventScrollReset
            className="pressable flex h-12 items-center gap-[10px] rounded-full bg-brand-strong px-[24px] text-[16px] font-semibold text-white shadow-fab"
            aria-haspopup="dialog"
          >
            <FilterIcon size={22} strokeWidth={2.2} />
            Filter
          </AppLink>
        </Pop>
      </div>

      <Outlet context={{ filters, period }} />
    </>
  );
}

function ListSkeleton() {
  return (
    <LoadingRegion label="Loading transactions">
      <div className="mt-[14px] space-y-4 px-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i}>
            <Skeleton className="h-3 w-12" />
            <div className="mt-3 flex items-center gap-[14px]">
              <Skeleton className="size-11 rounded-full!" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3.5 w-16" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
