import { FillBar } from '../motion/primitives';

interface ProgressBarProps {
  /** 0..1 */
  value: number;
  /** Accessible name, e.g. "Minimum spend progress" */
  label: string;
  /** Read out instead of a percentage, e.g. "S$620.00 of S$800.00" */
  valueText: string;
  height?: number;
  /** Keeps a small non-zero value visible, like the cashback stub in the wireframe. */
  minVisiblePx?: number;
  className?: string;
  /** Seconds before the fill starts growing when the screen enters. */
  delay?: number;
}

export function ProgressBar({
  value,
  label,
  valueText,
  height = 8,
  minVisiblePx = 0,
  className = '',
  delay = 0,
}: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 1000) / 10;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={valueText}
      className={`overflow-hidden rounded-full bg-track ${className}`}
      style={{ height }}
    >
      <FillBar fraction={pct / 100} minPx={minVisiblePx} delay={delay} className="h-full bg-brand" />
    </div>
  );
}
