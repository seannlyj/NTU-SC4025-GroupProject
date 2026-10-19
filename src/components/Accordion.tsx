import { motion } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { dur, ease, spring } from '../motion/tokens';
import { ChevronRightIcon } from './icons';

interface AccordionItemProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** One expandable row. The panel eases open to its height and the chevron turns to point down. */
export function AccordionItem({ title, open, onToggle, children }: AccordionItemProps) {
  const id = useId();
  return (
    <div className="border-b border-divider-soft">
      <h2>
        <button
          type="button"
          id={`${id}-button`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="flex min-h-14 w-full items-center justify-between gap-3 text-left text-[15px] font-semibold text-ink"
        >
          {title}
          <motion.span
            className="-mr-0.5 shrink-0 text-ink-muted"
            initial={false}
            animate={{ rotate: open ? 90 : 0 }}
            transition={spring.snappy}
          >
            <ChevronRightIcon size={22} strokeWidth={2} />
          </motion.span>
        </button>
      </h2>
      <motion.div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-button`}
        aria-hidden={!open}
        inert={!open}
        className="overflow-hidden"
        initial={false}
        animate={open ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ height: { duration: dur(0.38), ease: ease.out }, opacity: { duration: dur(open ? 0.3 : 0.15) } }}
      >
        <motion.div
          className="pb-4 text-[15px] leading-[22px] text-ink-body"
          initial={false}
          animate={{ y: open ? 0 : -6 }}
          transition={{ duration: dur(0.38), ease: ease.out }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
