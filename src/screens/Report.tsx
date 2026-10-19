import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { useId, useState } from 'react';
import { useAppNavigate } from '../app/navigation';
import { TODAY } from '../config/clock';
import { firstDayOf, lastDayOf, monthOf, previousMonths, type IsoDate } from '../domain/dates';
import { validateReportRange } from '../domain/report';
import { Card } from '../components/Card';
import { DateField } from '../components/DateField';
import { SubPageHeader } from '../components/PageHeader';
import { Entrance, Rise } from '../motion/primitives';
import { dur, ease } from '../motion/tokens';

const lastSix = previousMonths(monthOf(TODAY), 6);

/** The wireframe default: the six full months before this one (01 Apr 2026 – 30 Sep 2026). */
export const DEFAULT_REPORT_RANGE = { from: firstDayOf(lastSix[0]), to: lastDayOf(lastSix[lastSix.length - 1]) };

/** The /report/error preset: the wireframe's swapped dates. */
export const BAD_REPORT_RANGE = { from: DEFAULT_REPORT_RANGE.to, to: DEFAULT_REPORT_RANGE.from };

export function reportPdfPath(from: IsoDate, to: IsoDate): string {
  return `/report/pdf?${new URLSearchParams({ from, to })}`;
}

/** /report and /report/error. Validates To >= From and blocks the PDF until it is fixed. */
export function ReportScreen({ preset = 'default' }: { preset?: 'default' | 'error' }) {
  const start = preset === 'error' ? BAD_REPORT_RANGE : DEFAULT_REPORT_RANGE;
  const [from, setFrom] = useState<IsoDate>(start.from);
  const [to, setTo] = useState<IsoDate>(start.to);
  const navigate = useAppNavigate();
  const errorId = useId();
  const [toWrapper, animateTo] = useAnimate<HTMLDivElement>();

  const validation = validateReportRange(from, to);
  const error = validation.valid ? null : validation;

  const getReport = () => {
    if (error) {
      // Point at the problem: a short shake of the field, then focus it.
      void animateTo(toWrapper.current, { x: [0, -7, 6, -4, 3, 0] }, { duration: dur(0.42), ease: 'easeInOut' });
      toWrapper.current?.querySelector<HTMLInputElement>('input')?.focus();
      return;
    }
    navigate(reportPdfPath(from, to), { state: { download: true } });
  };

  return (
    <Entrance>
      <SubPageHeader title="Cashback report" />
      <form
        className="px-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          getReport();
        }}
      >
        <Rise y={16} delay={dur(0.08)}>
        <Card className="mt-[15px] px-4 pt-[17px] pb-4">
          <fieldset>
            <legend className="sr-only">Report period</legend>
            <div className="grid grid-cols-2 gap-3">
              <DateField
                variant="form"
                label="From"
                value={from}
                onChange={setFrom}
                max={TODAY}
                invalid={error?.field === 'from'}
                describedBy={error?.field === 'from' ? errorId : undefined}
              />
              <div ref={toWrapper}>
                <DateField
                  variant="form"
                  label="To"
                  value={to}
                  onChange={setTo}
                  max={TODAY}
                  invalid={error?.field === 'to'}
                  describedBy={error?.field === 'to' ? errorId : undefined}
                />
              </div>
            </div>
          </fieldset>
          <AnimatePresence initial={false}>
            {error && (
              <motion.p
                key={error.message}
                id={errorId}
                role="alert"
                className="overflow-hidden text-[14px] leading-5 font-semibold text-ink"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: dur(0.28), ease: ease.out }}
              >
                {error.message}
              </motion.p>
            )}
          </AnimatePresence>
        </Card>
        </Rise>
        <Rise y={16} delay={dur(0.16)}>
          <motion.button
            layout="position"
            type="submit"
            aria-disabled={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="pressable mt-4 h-12 w-full rounded-[8px] bg-brand-strong text-[16px] font-semibold text-white"
            transition={{ layout: { duration: dur(0.28), ease: ease.out } }}
          >
            Get PDF report
          </motion.button>
        </Rise>
      </form>
    </Entrance>
  );
}
