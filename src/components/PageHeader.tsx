import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useAppNavigate } from '../app/navigation';
import { Pop, Rise } from '../motion/primitives';
import { dur } from '../motion/tokens';
import { ChevronLeftIcon } from './icons';

/** Goes back in history when there is somewhere to go, otherwise to `fallback` (Rewards Tracker by default). */
export function BackButton({ fallback = '/rewards' }: { fallback?: string }) {
  const navigate = useNavigate();
  const appNavigate = useAppNavigate();
  const onClick = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    // Going back replays the forward transition in reverse.
    if (idx > 0) navigate(-1);
    else appNavigate(fallback, { replace: true, nav: 'back' });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      className="pressable grid size-11 place-items-center rounded-full bg-back text-ink"
    >
      <ChevronLeftIcon size={24} strokeWidth={2} />
    </button>
  );
}

export function PageTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h1 id={id} className="text-[24px] leading-8 font-semibold text-ink">
      {children}
    </h1>
  );
}

/** Sub-page header: grey round back button pops in, then the large title eases up. */
export function SubPageHeader({ title, fallback }: { title: string; fallback?: string }) {
  return (
    <header className="px-4 pt-3">
      <Pop as="div" className="w-fit">
        <BackButton fallback={fallback} />
      </Pop>
      <Rise y={10} delay={dur(0.04)} className="mt-2 px-1">
        <PageTitle>{title}</PageTitle>
      </Rise>
    </header>
  );
}
