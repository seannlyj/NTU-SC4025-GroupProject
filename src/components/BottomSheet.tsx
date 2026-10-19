import { animate, motion, useMotionValue, useReducedMotion, type AnimationPlaybackControls } from 'motion/react';
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { dur, ease, spring } from '../motion/tokens';
import { releaseVelocity, settleSheet, type SheetRest } from './sheetGesture';

interface BottomSheetProps {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
/** Presses on these never start a drag, except on the handle itself. */
const INTERACTIVE = 'button, a, input, label, select, textarea';
const RADIUS = 24;
/** At its own height the sheet leaves a strip of the page showing above it. */
const NATURAL_MAX = 'calc(100dvh - 24px)';
/** Pointer travel (px) before a press counts as a drag rather than a tap. */
const TAP_SLOP = 6;

interface Drag {
  pointerId: number;
  startY: number;
  startTop: number;
  samples: { t: number; y: number }[];
  moved: boolean;
}

/**
 * Modal sheet over a dimmed page. Esc or a tap on the dimmed area closes it;
 * focus stays inside while it is open and goes back where it was afterwards.
 *
 * The handle (and anything marked `data-sheet-grab`, such as a title row) can
 * be dragged: up to cover the screen, down to shrink back or, past about a
 * third of the sheet, to close it. Flicks count. Tapping the handle, or
 * pressing Enter, Space or the arrow keys on it, switches between full screen
 * and the sheet's own height, so dragging is never the only way.
 */
export function BottomSheet({ titleId, onClose, children, footer }: BottomSheetProps) {
  const container = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const reduceMotion = useReducedMotion();

  const [full, setFull] = useState(false);
  const [dragging, setDragging] = useState(false);
  /** Where the sheet is resting or heading. */
  const rest = useRef<'full' | 'natural'>('natural');
  /** True while the sheet is held or moving, i.e. sized in px rather than by CSS. */
  const free = useRef(false);
  const geometry = useRef({ screen: 0, natural: 0 });
  /** The sheet's top edge, px from the top of the screen, while it is free. */
  const top = useRef(0);
  const drag = useRef<Drag | null>(null);
  const dragged = useRef(false);
  const moving = useRef<AnimationPlaybackControls | null>(null);
  /** Counts animations, so one that was interrupted can never move the sheet again. */
  const run = useRef(0);
  const detach = useRef<() => void>(() => {});

  const height = useMotionValue<number | string>('auto');
  const maxHeight = useMotionValue(NATURAL_MAX);
  const y = useMotionValue(0);
  const radius = useMotionValue(RADIUS);
  const dim = useMotionValue(1);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Focus the dialog itself: screen readers announce its title, Tab moves into it.
    panel.current?.focus();
    geometry.current.natural = panel.current?.offsetHeight ?? 0;

    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const [head, tail] = [items[0], items[items.length - 1]];
      if (document.activeElement === panel.current) {
        e.preventDefault();
        (e.shiftKey ? tail : head).focus();
      } else if (e.shiftKey && document.activeElement === head) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault();
        head.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      detach.current();
      moving.current?.stop();
      previouslyFocused?.focus?.();
    };
  }, []);

  /** Lays the sheet out for a top edge at `s`: taller above its own height, slid down below it. */
  const place = (s: number) => {
    const { screen, natural } = geometry.current;
    const visible = screen - s;
    top.current = s;
    height.set(Math.min(screen, Math.max(natural, visible)));
    y.set(Math.max(0, natural - visible));
    radius.set(Math.min(RADIUS, Math.max(0, s)));
    dim.set(natural > 0 ? 1 - Math.min(1, Math.max(0, (natural - visible) / natural)) : 1);
  };

  /** Takes the sheet over from CSS (measuring it first) so it can follow the pointer or an animation. */
  const hold = () => {
    run.current++;
    moving.current?.stop();
    const screen = container.current?.clientHeight ?? 0;
    if (!free.current && panel.current) {
      if (rest.current === 'natural') geometry.current.natural = panel.current.offsetHeight;
      top.current = screen - panel.current.offsetHeight;
      free.current = true;
      maxHeight.set('none');
    }
    geometry.current.screen = screen;
    return top.current;
  };

  /** Moves the sheet to a resting place, carrying the release speed. */
  const settle = (to: SheetRest, velocity = 0) => {
    const { screen, natural } = geometry.current;
    if (to !== 'close') {
      rest.current = to;
      setFull(to === 'full');
    }
    const target = to === 'full' ? 0 : to === 'natural' ? screen - natural : screen;
    const id = ++run.current;
    const step = (s: number) => {
      if (run.current === id) place(s);
    };
    const done = () => {
      if (run.current !== id) return;
      moving.current = null;
      if (to === 'close') {
        onCloseRef.current();
        return;
      }
      // Hand sizing back to CSS, so the sheet follows its content and the window.
      free.current = false;
      height.set(to === 'full' ? '100%' : 'auto');
      maxHeight.set(to === 'full' ? 'none' : NATURAL_MAX);
      y.set(0);
      radius.set(to === 'full' ? 0 : RADIUS);
      dim.set(1);
    };
    if (reduceMotion) {
      place(target);
      done();
      return;
    }
    if (to === 'close') {
      // Off the bottom: keep the flick's speed, or accelerate away like the close transition.
      const fast = velocity > 900;
      const distance = Math.max(0, target - top.current);
      moving.current = animate(top.current, target, {
        duration: fast ? Math.min(dur(0.25), Math.max(dur(0.08), distance / velocity)) : dur(0.24),
        ease: fast ? 'linear' : ease.in,
        onUpdate: step,
        onComplete: done,
      });
      return;
    }
    moving.current = animate(top.current, target, { ...spring.sheet, velocity, onUpdate: step, onComplete: done });
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || drag.current) return;
    const target = e.target as Element;
    if (!target.closest('[data-sheet-grab]')) return;
    if (target.closest(INTERACTIVE) && !target.closest('[data-sheet-handle]')) return;

    dragged.current = false;
    drag.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startTop: hold(),
      samples: [{ t: e.timeStamp, y: e.clientY }],
      moved: false,
    };
    setDragging(true);

    const onMove = (ev: globalThis.PointerEvent) => {
      const d = drag.current;
      if (!d || ev.pointerId !== d.pointerId) return;
      const dy = ev.clientY - d.startY;
      if (!d.moved && Math.abs(dy) < TAP_SLOP) return;
      d.moved = true;
      dragged.current = true;
      d.samples.push({ t: ev.timeStamp, y: ev.clientY });
      if (d.samples.length > 12) d.samples.shift();
      place(Math.max(0, d.startTop + dy));
    };
    const onUp = (ev: globalThis.PointerEvent) => {
      const d = drag.current;
      if (!d || ev.pointerId !== d.pointerId) return;
      detach.current();
      drag.current = null;
      setDragging(false);
      if (!d.moved) {
        // A tap: stay put (a tap on the handle then toggles through its click).
        settle(rest.current);
        return;
      }
      // Include the release itself, so holding still before letting go counts as no flick.
      const velocity = releaseVelocity([...d.samples, { t: ev.timeStamp, y: ev.clientY }]);
      const { screen, natural } = geometry.current;
      settle(settleSheet({ top: top.current, velocity, full: 0, natural: screen - natural, closed: screen }), velocity);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    detach.current = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      detach.current = () => {};
    };
  };

  const resizeTo = (to: 'full' | 'natural') => {
    hold();
    settle(to);
  };

  const onHandleClick = () => {
    // The click that ends a drag is not a tap.
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    resizeTo(rest.current === 'full' ? 'natural' : 'full');
  };

  const onHandleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      resizeTo(e.key === 'ArrowUp' ? 'full' : 'natural');
    }
  };

  return (
    <div ref={container} className="fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col justify-end">
      <motion.div
        className="vt-backdrop absolute inset-0 bg-overlay"
        style={{ opacity: dim }}
        onClick={onClose}
        aria-hidden="true"
        data-testid="sheet-backdrop"
      />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onPointerDown={onPointerDown}
        style={{ height, maxHeight, y, borderTopLeftRadius: radius, borderTopRightRadius: radius }}
        className="vt-sheet relative flex flex-col bg-page outline-none"
      >
        <button
          type="button"
          data-sheet-grab=""
          data-sheet-handle=""
          aria-label="Full screen"
          aria-pressed={full}
          title={full ? 'Drag down or tap to shrink' : 'Drag up or tap for full screen'}
          onClick={onHandleClick}
          onKeyDown={onHandleKeyDown}
          className={`group relative flex w-full touch-none justify-center rounded-t-[24px] pt-[10px] pb-[6px] select-none before:absolute before:inset-x-0 before:-top-3 before:-bottom-2 before:content-[''] focus-visible:outline-offset-[-3px] ${
            dragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <span
            className={`h-1 rounded-full transition-[width,background-color] duration-200 ${
              dragging ? 'w-12 bg-field-strong' : 'w-10 bg-field group-hover:bg-field-strong'
            }`}
          />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer && (
          <div className="border-t border-sheet-divider px-5 pt-3 pb-[max(24px,env(safe-area-inset-bottom))]">{footer}</div>
        )}
      </motion.div>
    </div>
  );
}
