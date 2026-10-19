import { useCallback, type ComponentProps } from 'react';
import { Link, useNavigate, type NavigateOptions, type To } from 'react-router';

/**
 * Screen transitions.
 *
 * Navigations run through the browser's View Transitions API (React Router's
 * `viewTransition` option): the old screen is snapshotted and animated out
 * while the new one animates in. Which animation plays is decided here and
 * written to <html data-nav="…">; the keyframes live in src/index.css.
 * Browsers without the API simply change screens instantly.
 */
export type NavKind = 'forward' | 'back' | 'fade' | 'sheet-open' | 'sheet-close' | 'none';

const NAV_KINDS: readonly NavKind[] = ['forward', 'back', 'fade', 'sheet-open', 'sheet-close', 'none'];

const SHEET_PATH = '/transactions/filter';
/** Same screen in two states: switching between them crossfades instead of sliding. */
const SAME_SCREEN = new Set(['/transactions', '/transactions/empty']);

export interface NavigationChange {
  from: string;
  to: string;
  action: 'PUSH' | 'POP' | 'REPLACE';
  /** Change in history position: negative when going back. */
  delta: number;
  /** A kind asked for by the link itself (location state `nav`). */
  requested?: NavKind;
}

export function classifyNavigation({ from, to, action, delta, requested }: NavigationChange): NavKind {
  if (requested && action !== 'POP') return requested;
  if (from === to) return 'none';
  if (to === SHEET_PATH) return 'sheet-open';
  if (from === SHEET_PATH) return 'sheet-close';
  if (SAME_SCREEN.has(from) && SAME_SCREEN.has(to)) return 'fade';
  if (action === 'REPLACE') return 'fade';
  if (action === 'POP') return delta < 0 ? 'back' : 'forward';
  return 'forward';
}

interface RouterLike {
  state: { location: { pathname: string }; navigation: { state: string } };
  subscribe(fn: (state: RouterLike['state'] & { historyAction: string; location: { state: unknown } }) => void): () => void;
}

const historyIndex = (): number => {
  const idx = (window.history.state as { idx?: unknown } | null)?.idx;
  return typeof idx === 'number' ? idx : 0;
};

/**
 * Keeps <html data-nav> in step with the router. Must subscribe before
 * <RouterProvider> does, so the attribute is set before a transition starts.
 */
export function installNavigationKinds(router: RouterLike): () => void {
  let lastPath = router.state.location.pathname;
  let lastIdx = historyIndex();
  return router.subscribe((state) => {
    if (state.navigation.state !== 'idle') return;
    const to = state.location.pathname;
    const idx = historyIndex();
    const raw = (state.location.state as { nav?: unknown } | null)?.nav;
    const kind = classifyNavigation({
      from: lastPath,
      to,
      action: state.historyAction as NavigationChange['action'],
      delta: idx - lastIdx,
      requested: NAV_KINDS.includes(raw as NavKind) ? (raw as NavKind) : undefined,
    });
    document.documentElement.dataset.nav = kind;
    lastPath = to;
    lastIdx = idx;
  });
}

function withNav(state: unknown, nav?: NavKind): unknown {
  if (!nav) return state;
  return { ...(state && typeof state === 'object' ? state : {}), nav };
}

type AppLinkProps = ComponentProps<typeof Link> & { nav?: NavKind };

/** A Link that animates the screen change. `nav` overrides the automatic choice. */
export function AppLink({ nav, state, viewTransition = true, ...rest }: AppLinkProps) {
  return <Link viewTransition={viewTransition} state={withNav(state, nav)} {...rest} />;
}

/** navigate() that animates the screen change unless told not to. */
export function useAppNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (to: To, options: NavigateOptions & { nav?: NavKind } = {}) => {
      const { nav, state, viewTransition = true, ...rest } = options;
      return navigate(to, { ...rest, viewTransition, state: withNav(state, nav) });
    },
    [navigate],
  );
}
