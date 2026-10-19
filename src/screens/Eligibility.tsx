import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { ELIGIBILITY_RULES, RULE_SOURCES } from '../config/eligibilityRules';
import { CASHBACK_POLICY } from '../config/policy';
import { AccordionItem } from '../components/Accordion';
import { SubPageHeader } from '../components/PageHeader';
import { AnimatedMoney, Entrance, Rise } from '../motion/primitives';
import { dur, staggerDelay } from '../motion/tokens';

const TILES = [
  { label: 'Minimum spend', cents: CASHBACK_POLICY.minSpendCents },
  { label: 'Monthly cap', cents: CASHBACK_POLICY.capCents },
];

/**
 * /eligibility, reached from "Why?" on Not eligible rows (?rule= opens that rule).
 * Motion: the two figures rise and count up, then the rules cascade in.
 */
export function EligibilityScreen() {
  const [params] = useSearchParams();
  const requested = params.get('rule');
  const initial = ELIGIBILITY_RULES.some((r) => r.id === requested) ? requested! : ELIGIBILITY_RULES[0]?.id;
  const [open, setOpen] = useState<Set<string>>(() => new Set(initial ? [initial] : []));

  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Entrance>
      <SubPageHeader title="Eligibility" />
      <dl className="mt-4 grid grid-cols-2 gap-[11px] px-4">
        {TILES.map((tile, i) => (
          <Rise key={tile.label} y={14} scale={0.96} delay={dur(0.08) + i * dur(0.06)} className="rounded-[16px] bg-card px-4 pt-[14px] pb-[11px]">
            <dt className="text-[13px] leading-[18px] text-ink-muted">{tile.label}</dt>
            <dd className="text-[20px] leading-7 font-semibold text-ink">
              <AnimatedMoney cents={tile.cents} format={{ decimals: 0 }} delay={dur(0.18) + i * dur(0.06)} />
            </dd>
          </Rise>
        ))}
      </dl>
      <div className="mt-[15px] px-5">
        {ELIGIBILITY_RULES.map((rule, i) => (
          <Rise key={rule.id} y={12} delay={staggerDelay(i, 0.2, dur(0.06))}>
            <AccordionItem title={rule.title} open={open.has(rule.id)} onToggle={() => toggle(rule.id)}>
              <p>{rule.body}</p>
              {rule.points && (
                <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-ink-muted">
                  {rule.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
              {/* Word joiners keep ranges such as 8211–8299 on one line. */}
              <p className="mt-2 text-[13px] leading-[18px] text-ink-muted">{rule.source.replaceAll('–', '⁠–⁠')}</p>
            </AccordionItem>
          </Rise>
        ))}
        <Rise as="p" y={8} delay={staggerDelay(ELIGIBILITY_RULES.length, 0.2, dur(0.06))} className="mt-4 pb-6 text-[13px] leading-[18px] text-ink-muted">
          Summarised from the <SourceLink source={RULE_SOURCES.terms} /> ({RULE_SOURCES.terms.version}) and the{' '}
          <SourceLink source={RULE_SOURCES.exclusions} /> ({RULE_SOURCES.exclusions.version}). Where they differ, OCBC’s
          documents apply.
        </Rise>
      </div>
    </Entrance>
  );
}

function SourceLink({ source }: { source: { title: string; url: string } }) {
  return (
    <a href={source.url} target="_blank" rel="noreferrer" className="text-link underline underline-offset-2">
      {source.title}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
