import { useId, useRef } from 'react';
import { formatFullDate, isIsoDate, type IsoDate } from '../domain/dates';
import { CalendarIcon } from './icons';

interface DateFieldProps {
  label: string;
  value: IsoDate;
  onChange: (value: IsoDate) => void;
  /** "sheet": label inside the box with a calendar icon (filter). "form": label above (report). */
  variant: 'sheet' | 'form';
  min?: IsoDate;
  max?: IsoDate;
  invalid?: boolean;
  describedBy?: string;
}

/**
 * Shows the date as "01 Oct 2026" like the wireframes, with the native date
 * picker underneath so it works with touch, keyboard and screen readers.
 */
export function DateField({ label, value, onChange, variant, min, max, invalid = false, describedBy }: DateFieldProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const openPicker = () => {
    try {
      input.current?.showPicker?.();
    } catch {
      // Some browsers only allow showPicker from certain gestures; focus is enough there.
    }
  };
  const nativeInput = (
    <input
      ref={input}
      id={id}
      type="date"
      value={value}
      min={min}
      max={max}
      required
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onChange={(e) => {
        if (isIsoDate(e.target.value)) onChange(e.target.value);
      }}
      onClick={openPicker}
      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
    />
  );
  const shown = isIsoDate(value) ? formatFullDate(value) : 'Select date';

  if (variant === 'sheet') {
    return (
      <div className="relative flex h-[57px] items-center rounded-[16px] border border-field bg-page pr-3 pl-[15px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-link">
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className="block text-[12px] leading-4 text-ink-label">
            {label}
          </label>
          <span className="block text-[15px] leading-5 font-semibold text-ink" aria-hidden="true">
            {shown}
          </span>
        </div>
        <CalendarIcon size={22} strokeWidth={1.6} className="text-ink-label" />
        {nativeInput}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="block text-[13px] leading-[18px] text-ink-muted">
        {label}
      </label>
      <div
        className={`relative mt-[4px] flex h-11 items-center rounded-[8px] border bg-page px-[13px] transition-[border-color,box-shadow] duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-link ${
          invalid ? 'border-ink-strong shadow-[inset_0_0_0_1px_var(--color-ink-strong)]' : 'border-field-strong'
        }`}
      >
        <span className="text-[15px] text-black" aria-hidden="true">
          {shown}
        </span>
        {nativeInput}
      </div>
    </div>
  );
}
