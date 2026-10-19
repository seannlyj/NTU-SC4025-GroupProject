import type { ReactNode } from 'react';
import { Outlet } from 'react-router';
import { BottomNav } from '../components/BottomNav';

/** The phone-width column. On wider screens it sits centred on a warm grey backdrop. */
export function AppColumn({ children }: { children: ReactNode }) {
  return <div className="relative mx-auto min-h-dvh w-full max-w-[480px] bg-page">{children}</div>;
}

/**
 * Screens with the bottom tab bar (every screen in the wireframes except the PDF).
 * Scroll position is handled by <ScrollRestoration> in the root layout: new
 * screens start at the top, Back returns to where you were.
 */
export function TabLayout() {
  return (
    <AppColumn>
      <main id="main" className="pb-[112px]">
        <Outlet />
      </main>
      <BottomNav />
    </AppColumn>
  );
}
