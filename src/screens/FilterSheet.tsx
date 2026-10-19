import { AnimatePresence, motion } from 'motion/react';
import { useId, useMemo, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router';
import { useAppNavigate } from '../app/navigation';
import { DEFAULT_PERIOD, useMonthsTransactions } from '../app/queries';
import { CATEGORIES, type CategoryId } from '../config/categories';
import { TODAY } from '../config/clock';
import {
  STATUS_FILTERS,
  STATUS_FILTER_LABELS,
  applyFilters,
  commitSheetFilters,
  filtersToSearch,
  isDateRangeValid,
  type Period,
  type StatusFilter,
  type TransactionFilters,
} from '../domain/filters';
import { BottomSheet } from '../components/BottomSheet';
import { CheckboxTile } from '../components/CheckboxTile';
import { DateField } from '../components/DateField';
import { Entrance, Rise } from '../motion/primitives';
import { dur, ease, staggerDelay, timing } from '../motion/tokens';
import { FILTER_BUTTON_ID, returnToListWith } from './Transactions';

interface OutletContext {
  filters: TransactionFilters;
  period: Period;
}

const toggle = <T,>(list: T[], value: T, on: boolean) => (on ? [...new Set([...list, value])] : list.filter((x) => x !== value));

/** /transactions/filter: status, category and date range, with a live result count. */
export function FilterSheet() {
  const { filters, period } = useOutletContext<OutletContext>();
  const navigate = useAppNavigate();
  const goBack = useNavigate();
  const { pathname, state } = useLocation();
  /** Opened with the Filter button (not a deep link), so closing can step back in history. */
  const openedFromList = (state as { fromList?: boolean } | null)?.fromList === true;
  const titleId = useId();
  const errorId = useId();

  const [statuses, setStatuses] = useState<StatusFilter[]>(filters.statuses);
  const [categories, setCategories] = useState<CategoryId[]>(filters.categories);
  const [from, setFrom] = useState(period.from);
  const [to, setTo] = useState(period.to);

  const datesValid = isDateRangeValid(from, to);
  const draftRange = datesValid ? { from, to } : period;
  const query = useMonthsTransactions(draftRange);
  const count = useMemo(
    () => (query.data ? applyFilters(query.data, { statuses, categories, ...draftRange }).length : null),
    [query.data, statuses, categories, draftRange],
  );

  const close = () => {
    if (openedFromList) goBack(-1);
    else navigate({ pathname: '/transactions', search: filtersToSearch(filters) }, { replace: true, preventScrollReset: true });
    requestAnimationFrame(() => document.getElementById(FILTER_BUTTON_ID)?.focus());
  };

  const clearAll = () => {
    setStatuses([]);
    setCategories([]);
    setFrom(DEFAULT_PERIOD.from);
    setTo(DEFAULT_PERIOD.to);
  };

  const confirm = () => {
    if (!datesValid) return;
    const next = commitSheetFilters({ statuses, categories, from, to }, DEFAULT_PERIOD);
    const target = { pathname: count === 0 ? '/transactions/empty' : '/transactions', search: filtersToSearch(next) };
    // From the list: go back to its entry and update it there, so Back then leaves Transactions.
    if (openedFromList) returnToListWith(target, () => goBack(-1));
    else navigate(target, { replace: pathname.endsWith('/filter') });
  };


  return (
    <BottomSheet
      titleId={titleId}
      onClose={close}
      footer={
        <button
          type="button"
          onClick={confirm}
          aria-disabled={!datesValid}
          aria-describedby={!datesValid ? errorId : undefined}
          className={`pressable h-[52px] w-full rounded-full text-[16px] font-semibold text-white transition-colors duration-200 ${datesValid ? 'bg-brand-strong' : 'bg-brand-strong/50'}`}
        >
          Confirm
        </button>
      }
    >
      <Entrance>
        {/* The title row is a second handle for dragging the sheet. */}
        <Rise y={10} delay={dur(0.1)} data-sheet-grab="" className="mt-2 flex h-11 touch-none items-center justify-between select-none">
          <h2 id={titleId} className="text-[20px] leading-7 font-semibold text-ink">
            Filter
          </h2>
          <button type="button" onClick={clearAll} className="pressable -mr-2 min-h-11 px-2 text-[14px] font-semibold text-ink">
            Clear all
          </button>
        </Rise>

        <Rise y={14} delay={dur(0.16)}>
          <fieldset className="mt-[13px]">
            <legend className="text-[13px] leading-[18px] text-ink-label">Date</legend>
            <div className="mt-2 grid grid-cols-2 gap-[11px]">
              <DateField variant="sheet" label="From" value={from} onChange={setFrom} max={TODAY} invalid={!datesValid} />
              <DateField
                variant="sheet"
                label="To"
                value={to}
                onChange={setTo}
                max={TODAY}
                invalid={!datesValid}
                describedBy={!datesValid ? errorId : undefined}
              />
            </div>
            <AnimatePresence initial={false}>
              {!datesValid && (
                <motion.p
                  key="error"
                  id={errorId}
                  role="alert"
                  className="overflow-hidden text-[14px] font-semibold text-ink"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: dur(0.25), ease: ease.out }}
                >
                  End date can't be before the start date.
                </motion.p>
              )}
            </AnimatePresence>
          </fieldset>
        </Rise>

        <Rise y={14} delay={dur(0.21)}>
          <fieldset className="mt-[23px]">
            <legend className="text-[13px] leading-[18px] text-ink-label">Status</legend>
            <div className="mt-2 grid grid-cols-2 gap-[11px]">
              {STATUS_FILTERS.map((s) => (
                <CheckboxTile
                  key={s}
                  name="status"
                  value={s}
                  label={STATUS_FILTER_LABELS[s]}
                  checked={statuses.includes(s)}
                  onChange={(on) => setStatuses((list) => toggle(list, s, on))}
                />
              ))}
            </div>
          </fieldset>
        </Rise>

        <fieldset className="mt-[23px]">
          <Rise as="legend" y={8} delay={dur(0.26)} className="text-[13px] leading-[18px] text-ink-label">
            Category
          </Rise>
          <div className="mt-2 grid grid-cols-2 gap-[11px]">
            {CATEGORIES.map((c, i) => (
              <Rise key={c.id} y={12} scale={0.97} delay={staggerDelay(i, 0.28, dur(0.03))}>
                <CheckboxTile
                  name="category"
                  value={String(c.id)}
                  label={c.name}
                  checked={categories.includes(c.id)}
                  onChange={(on) => setCategories((list) => toggle(list, c.id, on))}
                />
              </Rise>
            ))}
          </div>
        </fieldset>

        <Rise as="p" y={6} delay={dur(0.5)} className="mt-[19px] text-center text-[13px] leading-[18px] text-ink-muted" aria-live="polite">
          <MatchCount count={count} />
        </Rise>
      </Entrance>
    </BottomSheet>
  );
}

/** "13 transactions match", with the number rolling like an odometer when it changes. */
function MatchCount({ count }: { count: number | null }) {
  if (count === null) return <>Counting transactions…</>;
  return (
    <>
      <span className="relative inline-flex overflow-hidden align-bottom tabular">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={count}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: timing.exit + dur(0.08), ease: ease.out }}
          >
            {count}
          </motion.span>
        </AnimatePresence>
      </span>
      {count === 1 ? ' transaction matches' : ' transactions match'}
    </>
  );
}
