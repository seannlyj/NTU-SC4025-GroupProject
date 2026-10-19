import {
  animate,
  motion,
  MotionGlobalConfig,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type HTMLMotionProps,
} from 'motion/react';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { formatSGD, type FormatOptions } from '../domain/money';
import { dur, ease, spring, timing } from './tokens';

/**
 * Should a screen play its entrance? Yes on first load, on forward
 * navigation and on crossfades; no when going back (the screen should simply
 * be there, like a native app) or when only the filters changed.
 */
export function shouldPlayEntrance(): boolean {
  if (typeof document === 'undefined' || MotionGlobalConfig.skipAnimations) return false;
  const kind = document.documentElement.dataset.nav;
  return kind !== 'back' && kind !== 'none' && kind !== 'sheet-close';
}

const EntranceContext = createContext(false);

/** Wrap a screen: decides once, when it mounts, whether its children animate in. */
export function Entrance({ children, force }: { children: ReactNode; force?: boolean }) {
  const reduced = useReducedMotion();
  const [play] = useState(() => (force ?? shouldPlayEntrance()) && !MotionGlobalConfig.skipAnimations);
  return <EntranceContext.Provider value={play && !reduced}>{children}</EntranceContext.Provider>;
}

export function useEntrance(): boolean {
  return useContext(EntranceContext);
}

type Tag = 'div' | 'section' | 'header' | 'li' | 'ul' | 'p' | 'nav' | 'span' | 'h2' | 'figure' | 'fieldset' | 'legend' | 'dl';

type RiseProps = Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'transition'> & {
  as?: Tag;
  /** Seconds before this element starts. */
  delay?: number;
  /** Starting offset in px: y for rise, x for slide. */
  y?: number;
  x?: number;
  scale?: number;
  duration?: number;
};

/** Fades and eases an element into place when its screen enters. */
export function Rise({ as = 'div', delay = 0, y = 14, x = 0, scale = 1, duration = timing.enter, ...rest }: RiseProps) {
  const enter = useEntrance();
  const Component = motion[as] as typeof motion.div;
  return (
    <Component
      initial={enter ? { opacity: 0, y, x, scale } : false}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={{ duration, ease: ease.out, delay }}
      {...rest}
    />
  );
}

/** A small element that springs in (chips, badges, the notification dot). */
export function Pop({ as = 'span', delay = 0, ...rest }: Omit<RiseProps, 'y' | 'x' | 'scale' | 'duration'>) {
  const enter = useEntrance();
  const Component = motion[as] as typeof motion.span;
  return (
    <Component
      initial={enter ? { opacity: 0, scale: 0.6 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...spring.pop, delay }}
      {...rest}
    />
  );
}

/**
 * Money that counts up from zero when its screen enters, and tweens from the
 * old value to the new one when it changes (e.g. picking another month).
 */
export function AnimatedMoney({
  cents,
  delay = 0,
  duration = timing.count,
  className,
  format,
}: {
  cents: number;
  delay?: number;
  duration?: number;
  className?: string;
  format?: FormatOptions;
}) {
  const enter = useEntrance();
  const reduced = useReducedMotion();
  const value = useMotionValue(enter ? 0 : cents);
  const text = useTransform(value, (v) => formatSGD(Math.round(v), format));
  const first = useRef(true);

  useEffect(() => {
    const isFirst = first.current;
    first.current = false;
    if (reduced || MotionGlobalConfig.skipAnimations || (isFirst && !enter)) {
      value.set(cents);
      return;
    }
    // The entrance counts up slowly after its delay; later changes follow the user at once.
    const controls = animate(value, cents, isFirst ? { duration, ease: ease.out, delay } : { duration: timing.update, ease: ease.out });
    return () => controls.stop();
  }, [cents, delay, duration, enter, reduced, value]);

  return <motion.span className={className}>{text}</motion.span>;
}

/**
 * A bar fill that grows to `fraction` (0..1). Grows from zero on entrance,
 * then animates between values when the data changes.
 */
export function FillBar({
  fraction,
  delay = 0,
  className = '',
  minPx = 0,
}: {
  fraction: number;
  delay?: number;
  className?: string;
  minPx?: number;
}) {
  const enter = useEntrance();
  const pct = `${Math.min(1, Math.max(0, fraction)) * 100}%`;
  const target = fraction > 0 && minPx > 0 ? `max(${minPx}px, ${pct})` : pct;
  // Only the first fill is slow and staggered; later changes follow the user at once.
  const firstRender = useRef(true);
  useEffect(() => {
    firstRender.current = false;
  }, []);
  return (
    <motion.div
      className={className}
      initial={enter ? { width: '0%' } : false}
      animate={{ width: target }}
      transition={
        firstRender.current ? { duration: timing.fill, ease: ease.out, delay: enter ? delay : 0 } : { duration: timing.update, ease: ease.out }
      }
    />
  );
}

/** Reveals its contents left to right (used for the split bar, whose segments have gaps). */
export function WipeIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const enter = useEntrance();
  return (
    <motion.div
      className={className}
      initial={enter ? { clipPath: 'inset(0 100% 0 0 round 999px)' } : false}
      animate={{ clipPath: 'inset(0 0% 0 0 round 999px)' }}
      transition={{ duration: timing.fill, ease: ease.out, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Gentle press feedback for tappable things: spread onto a motion element. */
export const press = {
  whileTap: { scale: 0.97, transition: spring.snappy },
} as const;

export { dur };
