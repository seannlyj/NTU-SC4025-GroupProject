import { BellIcon, ScanIcon } from './icons';
import { InertButton } from './InertButton';

/**
 * The banking app's top bar (Scan, notifications, Logout), shared by Home and
 * Rewards Tracker. Like the tab bar it is app chrome: it has no entrance of its
 * own and holds still when moving between the two screens (view transition
 * name `top-bar`). Its controls are decorative in this prototype.
 */
export function AppTopBar() {
  return (
    <header className="vt-top-bar relative flex items-center justify-between px-4 pt-1">
      <InertButton label="Scan" className="-ml-1 size-11">
        <ScanIcon size={24} />
      </InertButton>
      <div className="flex items-center gap-1">
        <InertButton label="Notifications" className="size-11">
          <BellIcon size={24} strokeWidth={1.7} />
        </InertButton>
        <InertButton label="Log out" className="h-11 px-2 text-[15px] text-link">
          Logout
        </InertButton>
      </div>
    </header>
  );
}
