import { motion } from 'motion/react';
import { formatSGD } from '../domain/money';
import type { SplitSegment } from '../domain/summary';
import { STATUS_LABELS, type TransactionStatus } from '../domain/types';
import { Rise, useEntrance } from '../motion/primitives';
import { dur, ease } from '../motion/tokens';

const SEGMENT_CLASS: Record<TransactionStatus, string> = {
  eligible: 'bg-brand',
  pending: 'bg-seg-pending',
  not_eligible: 'bg-seg-not-eligible',
};

const DOT_CLASS: Record<TransactionStatus, string> = {
  eligible: 'bg-brand',
  pending: 'bg-seg-pending',
  not_eligible: 'bg-seg-not-eligible ring-1 ring-inset ring-seg-pending',
};

/**
 * Total card spending split into Eligible / Pending / Not eligible.
 * The legend names every segment, and the amounts are in the accessible label.
 * On entrance the segments fill one after another, then the legend follows.
 */
export function SplitBar({ segments, totalCents, delay = 0 }: { segments: SplitSegment[]; totalCents: number; delay?: number }) {
  const enter = useEntrance();
  const description = segments.map((s) => `${STATUS_LABELS[s.status]} ${formatSGD(s.cents)}`).join(', ');
  const visible = segments.filter((s) => s.fraction > 0);
  return (
    <div>
      <div
        role="img"
        aria-label={`Total card spending ${formatSGD(totalCents)}: ${description}`}
        className="flex h-2 gap-[3px] overflow-hidden rounded-full bg-track"
      >
        {visible.map((s, i) => (
          <motion.div
            key={s.status}
            data-testid={`segment-${s.status}`}
            className={`h-full origin-left ${SEGMENT_CLASS[s.status]}`}
            style={{ flexGrow: s.fraction, flexBasis: 0 }}
            initial={enter ? { scaleX: 0 } : false}
            animate={{ scaleX: 1 }}
            transition={{ duration: dur(0.6), ease: ease.out, delay: delay + i * dur(0.16) }}
          />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-[19px] gap-y-1 text-[12px] leading-4 text-ink-muted" aria-hidden="true">
        {segments.map((s, i) => (
          <Rise as="li" key={s.status} className="flex items-center gap-[6px]" y={4} delay={delay + dur(0.25) + i * dur(0.08)}>
            <span className={`inline-block size-2 rounded-full ${DOT_CLASS[s.status]}`} />
            {STATUS_LABELS[s.status]}
          </Rise>
        ))}
      </ul>
    </div>
  );
}
