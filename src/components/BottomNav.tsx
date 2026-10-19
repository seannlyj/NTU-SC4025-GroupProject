import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { AppLink } from '../app/navigation';
import { GiftIcon, HomeIcon, MoreIcon, SproutIcon, TransferIcon } from './icons';

interface Tab {
  label: string;
  icon: ReactNode;
  /** Home (a filler screen) and Rewards lead somewhere; the rest are not part of this prototype. */
  to?: string;
}

const TABS: Tab[] = [
  { label: 'Home', icon: <HomeIcon size={26} />, to: '/' },
  { label: 'Plan', icon: <SproutIcon size={26} /> },
  {
    label: 'Pay & Transfer',
    icon: (
      <span className="grid size-8 place-items-center rounded-full border-[1.5px] border-current">
        <TransferIcon size={18} />
      </span>
    ),
  },
  { label: 'Rewards', icon: <GiftIcon size={26} />, to: '/rewards' },
  { label: 'More', icon: <MoreIcon size={24} /> },
];

export const BOTTOM_NAV_HEIGHT = 72;

export function BottomNav() {
  const { pathname } = useLocation();
  const current = pathname === '/' ? 'Home' : 'Rewards';
  return (
    <nav
      aria-label="Main"
      className="vt-bottom-nav no-print fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-tabbar-border bg-page pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid h-[72px] grid-cols-5">
        {TABS.map((tab) => {
          const content = (
            <>
              <span className="grid h-8 place-items-center">{tab.icon}</span>
              <span className="mt-[3px] text-[11px] leading-[14px] whitespace-nowrap">{tab.label}</span>
            </>
          );
          const base = 'flex h-full w-full flex-col items-center justify-start pt-[7px]';
          return (
            <li key={tab.label}>
              {tab.to ? (
                <AppLink
                  to={tab.to}
                  nav="fade"
                  aria-current={current === tab.label ? 'page' : undefined}
                  className={`${base} transition-colors duration-200 ${current === tab.label ? 'text-brand-strong' : 'text-ink-avatar'}`}
                >
                  {content}
                </AppLink>
              ) : (
                <button
                  type="button"
                  aria-disabled="true"
                  title="Not part of this prototype"
                  className={`${base} text-ink-avatar`}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
