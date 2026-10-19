import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { AppLink } from '../app/navigation';
import { useCard, useMonthsTransactions } from '../app/queries';
import { CASHBACK_POLICY } from '../config/policy';
import { isIsoDate } from '../domain/dates';
import { buildReportModel, validateReportRange } from '../domain/report';
import { AnimatePresence, motion } from 'motion/react';
import { EmptyMessage, LoadingRegion, Skeleton, Spinner } from '../components/Feedback';
import { BackButton } from '../components/PageHeader';
import { CheckIcon, DownloadIcon } from '../components/icons';
import { Entrance, Rise } from '../motion/primitives';
import { dur, ease, spring } from '../motion/tokens';
import { PAGE_WIDTH, ReportDocument } from '../report/ReportDocument';
import { downloadReportPdf } from '../report/pdf';
import { DEFAULT_REPORT_RANGE } from './Report';

/** Scales the 595px page down to fit narrow screens, without horizontal scrolling. */
function useFitScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / PAGE_WIDTH));
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, scale };
}

/**
 * /report/pdf?from=&to= : the PDF layout as a page, with a Download button.
 * Arriving from "Get PDF report" downloads the file straight away.
 */
export function ReportPdfScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, pathname, search } = useLocation();
  const from = isIsoDate(params.get('from')) ? params.get('from')! : DEFAULT_REPORT_RANGE.from;
  const to = isIsoDate(params.get('to')) ? params.get('to')! : DEFAULT_REPORT_RANGE.to;
  const validation = validateReportRange(from, to);

  const card = useCard();
  const transactions = useMonthsTransactions(validation.valid ? { from, to } : { from, to: from });
  const model = useMemo(
    () =>
      validation.valid && card.data && transactions.data
        ? buildReportModel({ card: card.data, from, to, transactions: transactions.data, policy: CASHBACK_POLICY })
        : null,
    [validation.valid, card.data, transactions.data, from, to],
  );

  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'failed'>('idle');
  const download = async () => {
    if (!model) return;
    setStatus('working');
    try {
      await downloadReportPdf(model);
      setStatus('done');
    } catch {
      setStatus('failed');
    }
  };

  // One automatic download per "Get PDF report" tap; refreshing the page does not repeat it.
  const autoDownload = (state as { download?: boolean } | null)?.download === true;
  useEffect(() => {
    if (autoDownload && model) {
      navigate({ pathname, search }, { replace: true, state: null, preventScrollReset: true });
      void download();
    }
  }, [autoDownload, model]); // download() is recreated each render; it only reads the current model

  const { ref, scale } = useFitScale();
  const [docHeight, setDocHeight] = useState(0);
  const docRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (docRef.current) setDocHeight(docRef.current.offsetHeight);
  });

  const statusText =
    status === 'working'
      ? 'Preparing PDF…'
      : status === 'done'
        ? 'PDF downloaded'
        : status === 'failed'
          ? 'Download failed. Try again.'
          : 'Report preview';

  return (
    <Entrance>
    <div className="min-h-dvh bg-back">
      <header className="no-print sticky top-0 z-10 mx-auto flex max-w-[640px] items-center justify-between gap-3 bg-back/95 px-4 py-3 backdrop-blur">
        <BackButton fallback="/report" />
        <p className="relative min-w-0 flex-1 overflow-hidden text-[15px] font-semibold text-ink" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={statusText}
              className="block truncate"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: dur(0.28), ease: ease.out }}
            >
              {statusText}
            </motion.span>
          </AnimatePresence>
        </p>
        <Rise as="div" x={12} y={0} delay={dur(0.1)}>
          <button
            type="button"
            onClick={download}
            disabled={!model || status === 'working'}
            className="pressable flex h-11 items-center gap-2 rounded-full bg-brand-strong px-4 text-[15px] font-semibold text-white disabled:opacity-60"
          >
            <span className="grid size-5 place-items-center">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={status === 'working' ? 'busy' : status === 'done' ? 'done' : 'idle'}
                  className="grid place-items-center"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={spring.pop}
                >
                  {status === 'working' ? (
                    <Spinner />
                  ) : status === 'done' ? (
                    <CheckIcon size={20} strokeWidth={2.6} />
                  ) : (
                    <DownloadIcon size={20} strokeWidth={2.2} />
                  )}
                </motion.span>
              </AnimatePresence>
            </span>
            Download PDF
          </button>
        </Rise>
      </header>

      <main className="mx-auto max-w-[640px] px-4 pb-10">
        <div ref={ref} className="w-full">
        {!validation.valid ? (
          <div className="rounded-[20px] bg-page py-10">
            <EmptyMessage>{validation.message}</EmptyMessage>
            <p className="mt-4 text-center">
              <AppLink to="/report" nav="back" className="text-[15px] text-link">
                Change dates
              </AppLink>
            </p>
          </div>
        ) : !model ? (
          <LoadingRegion label="Building your report">
            <div className="rounded-[4px] bg-page p-8 shadow-float">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="mt-3 h-4 w-72 max-w-full" />
              <Skeleton className="mt-10 h-40 w-full" />
            </div>
          </LoadingRegion>
        ) : (
          <div style={{ height: docHeight ? docHeight * scale : undefined }}>
            <div
              ref={docRef}
              className="origin-top-left shadow-float"
              style={{ width: PAGE_WIDTH, transform: scale < 1 ? `scale(${scale})` : undefined }}
            >
              <Rise y={28} scale={0.985} delay={dur(0.08)} duration={dur(0.65)}>
                <ReportDocument model={model} />
              </Rise>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
    </Entrance>
  );
}
