import { motion } from 'motion/react';
import { dur, ease, spring } from '../motion/tokens';

interface CheckboxTileProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name: string;
  value: string;
}

/**
 * A full-width tappable checkbox, as in the filter sheet. Ticking it fills the
 * box, draws the check mark and tints the tile; the 2px selected border is an
 * inset ring so nothing shifts.
 */
export function CheckboxTile({ label, checked, onChange, name, value }: CheckboxTileProps) {
  return (
    <label
      className={`pressable flex h-[51px] cursor-pointer items-center gap-[14px] rounded-[14px] border px-[15px] text-[15px] text-ink transition-[background-color,border-color,box-shadow] duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-link ${
        checked
          ? 'border-brand-strong bg-brand-tint font-semibold shadow-[inset_0_0_0_1px_var(--color-brand-strong)]'
          : 'border-field bg-page'
      }`}
    >
      <input
        type="checkbox"
        className="sr-only"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <motion.span
        aria-hidden="true"
        className="grid size-5 shrink-0 place-items-center rounded-[3px] border-[1.5px]"
        initial={false}
        animate={{
          backgroundColor: checked ? 'var(--color-brand-strong)' : 'var(--color-page)',
          borderColor: checked ? 'var(--color-brand-strong)' : 'var(--color-checkbox)',
          scale: checked ? [0.8, 1] : 1,
        }}
        transition={{ duration: dur(0.2), ease: ease.out, scale: spring.pop }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" className="text-white">
          <motion.path
            d="m5 12.5 4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={{ duration: dur(checked ? 0.28 : 0.12), ease: ease.out, delay: checked ? dur(0.05) : 0 }}
          />
        </svg>
      </motion.span>
      {label}
    </label>
  );
}
