import type { ReactNode } from 'react';

/** A control that belongs to the surrounding banking app but not to this prototype. */
export function InertButton({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-disabled="true"
      title={`${label} is not part of this prototype`}
      aria-label={typeof children === 'string' ? undefined : label}
      className={`grid place-items-center ${className}`}
    >
      {children}
    </button>
  );
}
