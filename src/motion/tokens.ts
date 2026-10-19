/**
 * Motion tokens: every duration, easing and spring in the app comes from here.
 *
 * Dev-only slow motion for reviewing animations: open any page with
 * `?slowmo=8` (8x slower; remembered for the tab, `?slowmo=1` resets).
 */
function readSlowmo(): number {
  if (!import.meta.env.DEV || typeof window === 'undefined') return 1;
  try {
    const param = new URLSearchParams(window.location.search).get('slowmo');
    if (param) window.sessionStorage.setItem('slowmo', param);
    const value = Number(param ?? window.sessionStorage.getItem('slowmo') ?? 1);
    return Number.isFinite(value) && value >= 1 && value <= 20 ? value : 1;
  } catch {
    return 1;
  }
}

export const SLOWMO = readSlowmo();

if (typeof document !== 'undefined') {
  // The CSS view-transition timings read the same factor.
  document.documentElement.style.setProperty('--slowmo', String(SLOWMO));
}

/** Seconds, scaled by slow motion. */
export const dur = (seconds: number): number => seconds * SLOWMO;

type Bezier = [number, number, number, number];

export const ease = {
  /** Emphasised deceleration: fast start, long gentle settle. For things arriving. */
  out: [0.16, 1, 0.3, 1] as Bezier,
  /** Standard ease for things changing in place. */
  inOut: [0.65, 0, 0.35, 1] as Bezier,
  /** Accelerating exit for things leaving. */
  in: [0.4, 0, 1, 1] as Bezier,
};

export const spring = {
  /** Interactive feedback: quick, barely any overshoot. */
  snappy: { type: 'spring' as const, visualDuration: dur(0.32), bounce: 0.15 },
  /** Small things popping in (chips, badges, the notification dot). */
  pop: { type: 'spring' as const, visualDuration: dur(0.42), bounce: 0.38 },
  /** Larger surfaces settling. */
  soft: { type: 'spring' as const, visualDuration: dur(0.5), bounce: 0.12 },
  /** A bottom sheet let go of, settling at full screen or its own height. */
  sheet: { type: 'spring' as const, visualDuration: dur(0.38), bounce: 0.1 },
};

export const timing = {
  /** How long an element takes to rise into place. */
  enter: dur(0.55),
  /** Gap between staggered siblings. */
  step: dur(0.045),
  /** Bars and fills. */
  fill: dur(0.9),
  /** Numbers counting up. */
  count: dur(0.9),
  /** Numbers and bars following something the user just did (e.g. picking a month): quick, no delay. */
  update: dur(0.4),
  /** Instant-feeling feedback on press or selection. */
  feedback: dur(0.1),
  exit: dur(0.18),
};

/** Delay for the n-th item of a staggered group, capped so long lists never feel slow. */
export function staggerDelay(index: number, start = 0, step = timing.step, maxItems = 10): number {
  return dur(start) + Math.min(index, maxItems) * step;
}
