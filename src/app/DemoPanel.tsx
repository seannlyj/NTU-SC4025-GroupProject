import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useState } from 'react';
import { useLocation } from 'react-router';
import { SCENARIOS, type Scenario } from '../api/scenario';
import { CloseIcon } from '../components/icons';
import { spring, timing } from '../motion/tokens';
import { AppLink } from './navigation';
import { storeScenario, useScenario } from './scenario';

/**
 * A presenter's panel for the live demo: jump to any of the 13 screens and
 * switch the mock API into a demo state. Hidden unless demo mode is on:
 * open the app with ?demo=1 (remembered for the tab, ?demo=0 turns it off)
 * or press Shift+D.
 */
const DEMO_MODE_KEY = 'rewards-tracker:demo-mode';

const SCENARIO_LABELS: Record<Scenario, string> = {
  normal: 'Normal (seed data)',
  'no-card': 'No OCBC 365 card',
  unavailable: 'Service unavailable',
  'no-history': 'No history yet',
  loading: 'Loading (skeletons)',
};

export const SCREENS: { n: number; route: string; name: string }[] = [
  { n: 0, route: '/', name: 'Home (filler)' },
  { n: 1, route: '/rewards', name: 'Dashboard' },
  { n: 2, route: '/no-card', name: 'No card' },
  { n: 3, route: '/unavailable', name: 'Service unavailable' },
  { n: 4, route: '/transactions', name: 'Transactions' },
  { n: 5, route: '/transactions/filter', name: 'Filter sheet' },
  { n: 6, route: '/transactions/empty', name: 'No matching transactions' },
  { n: 7, route: '/eligibility', name: 'Eligibility' },
  { n: 8, route: '/history', name: 'History: last 6 months' },
  { n: 9, route: '/history/month', name: 'History: this month' },
  { n: 10, route: '/history/empty', name: 'No history yet' },
  { n: 11, route: '/report', name: 'Cashback report' },
  { n: 12, route: '/report/error', name: 'Report: bad dates' },
  { n: 13, route: '/report/pdf?from=2026-04-01&to=2026-09-30', name: 'PDF report' },
];

function readDemoMode(): boolean {
  try {
    return window.sessionStorage.getItem(DEMO_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeDemoMode(on: boolean): void {
  try {
    if (on) window.sessionStorage.setItem(DEMO_MODE_KEY, '1');
    else window.sessionStorage.removeItem(DEMO_MODE_KEY);
  } catch {
    // Without storage, demo mode lasts until the next reload.
  }
}

export function DemoPanel() {
  const { search } = useLocation();
  const [enabled, setEnabled] = useState(readDemoMode);
  const [open, setOpen] = useState(false);
  const { scenario } = useScenario();
  const titleId = useId();

  useEffect(() => {
    const flag = new URLSearchParams(search).get('demo');
    if (flag === '1' || flag === '0') {
      writeDemoMode(flag === '1');
      setEnabled(flag === '1');
    }
  }, [search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        setEnabled(true);
        writeDemoMode(true);
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  if (!enabled) return null;

  return (
    <div className="vt-demo no-print fixed bottom-[calc(80px+env(safe-area-inset-bottom))] left-2 z-[60] text-[13px]">
      <AnimatePresence mode="popLayout" initial={false}>
      {open ? (
        <motion.section
          key="panel"
          aria-labelledby={titleId}
          className="w-[264px] origin-bottom-left rounded-[16px] border border-divider bg-page p-3 text-ink shadow-float"
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 6, transition: { duration: timing.exit } }}
          transition={spring.soft}
        >
          <div className="flex items-center justify-between">
            <h2 id={titleId} className="text-[14px] font-semibold">
              Demo controls
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close demo controls"
              className="grid size-8 place-items-center rounded-full bg-back"
            >
              <CloseIcon size={16} />
            </button>
          </div>
          <fieldset className="mt-2">
            <legend className="text-[12px] text-ink-muted">Data state (this tab)</legend>
            {SCENARIOS.map((s) => (
              <label key={s} className="flex min-h-8 cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="demo-state"
                  checked={scenario === s}
                  onChange={() => storeScenario(s)}
                  className="accent-brand-strong"
                />
                {SCENARIO_LABELS[s]}
              </label>
            ))}
          </fieldset>
          <nav aria-label="All screens" className="mt-2">
            <p className="text-[12px] text-ink-muted">Screens</p>
            <ol className="mt-1 max-h-[38vh] space-y-0.5 overflow-y-auto">
              {SCREENS.map((s) => (
                <li key={s.n}>
                  <AppLink
                    to={s.route}
                    nav="fade"
                    onClick={() => storeScenario('normal')}
                    className="flex min-h-8 items-center gap-2 rounded-[8px] px-1 hover:bg-card"
                  >
                    <span className="w-5 text-right text-ink-muted tabular">{s.n || '·'}</span>
                    {s.name}
                  </AppLink>
                </li>
              ))}
            </ol>
          </nav>
          <p className="mt-2 text-[11px] text-ink-muted">Shift+D toggles this panel. ?demo=0 hides it.</p>
        </motion.section>
      ) : (
        <motion.button
          key="pill"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: timing.exit } }}
          transition={spring.pop}
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-8 items-center gap-1.5 rounded-full border border-divider bg-page/95 px-3 font-semibold text-ink shadow-float"
          aria-label={`Demo controls, state: ${SCENARIO_LABELS[scenario]}`}
        >
          Demo
          {scenario !== 'normal' && <span className="rounded-full bg-brand-strong px-1.5 text-[11px] text-white">{scenario}</span>}
        </motion.button>
      )}
      </AnimatePresence>
    </div>
  );
}
