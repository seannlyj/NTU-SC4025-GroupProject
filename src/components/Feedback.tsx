import type { CSSProperties, ReactNode } from 'react';
import { Rise } from '../motion/primitives';
import { dur } from '../motion/tokens';

/** Grey placeholder block shown while data loads; a soft highlight sweeps across it. */
export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

/** Wraps a loading region so screen readers hear one "Loading" message. */
export function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Centred one-line message for empty states; eases in when its screen enters. */
export function EmptyMessage({ children, className = '', delay = 0.12 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <Rise
      as="p"
      y={10}
      scale={0.98}
      delay={dur(delay)}
      className={`px-6 text-center text-[15px] leading-[22px] font-semibold text-ink ${className}`}
      role="status"
    >
      {children}
    </Rise>
  );
}

/** Small busy indicator for buttons. */
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-[18px] animate-spin ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
