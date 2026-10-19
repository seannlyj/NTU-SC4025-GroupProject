import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { getScenarioState, isScenario, setScenario, type Scenario } from '../api/scenario';

/** Routes that always show one demo state (they are real states, not static pages). */
export const ROUTE_SCENARIOS: Record<string, Scenario> = {
  '/no-card': 'no-card',
  '/unavailable': 'unavailable',
  '/history/empty': 'no-history',
};

/** Friendly aliases accepted by ?state= */
const ALIASES: Record<string, Scenario> = {
  nocard: 'no-card',
  'no-card': 'no-card',
  unavailable: 'unavailable',
  error: 'unavailable',
  nohistory: 'no-history',
  'no-history': 'no-history',
  loading: 'loading',
  normal: 'normal',
};

export const DEMO_STATE_KEY = 'rewards-tracker:demo-state';

export function readStoredScenario(): Scenario | null {
  try {
    const value = window.sessionStorage.getItem(DEMO_STATE_KEY);
    return isScenario(value) ? value : null;
  } catch {
    return null;
  }
}

const storedListeners = new Set<() => void>();

/** Saves the Demo panel's choice for this browser tab and re-renders the app. */
export function storeScenario(value: Scenario): void {
  try {
    if (value === 'normal') window.sessionStorage.removeItem(DEMO_STATE_KEY);
    else window.sessionStorage.setItem(DEMO_STATE_KEY, value);
  } catch {
    // Storage can be blocked (private mode); the ?state= param still works.
  }
  storedListeners.forEach((l) => l());
}

function subscribeStored(listener: () => void): () => void {
  storedListeners.add(listener);
  return () => storedListeners.delete(listener);
}

/** Route first, then ?state=, then the Demo panel choice, else normal. */
export function resolveScenario(pathname: string, search: string, stored: Scenario | null): Scenario {
  const forced = ROUTE_SCENARIOS[pathname.replace(/\/+$/, '') || '/'];
  if (forced) return forced;
  const param = new URLSearchParams(search).get('state');
  if (param && ALIASES[param.toLowerCase()]) return ALIASES[param.toLowerCase()];
  return stored ?? 'normal';
}

interface ScenarioValue {
  scenario: Scenario;
  epoch: number;
}

const ScenarioContext = createContext<ScenarioValue>({ scenario: 'normal', epoch: 0 });

/**
 * Works out the demo state for the current URL and hands it to the mock API
 * before any screen below asks for data.
 */
export function ScenarioBoundary({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  const stored = useSyncExternalStore(subscribeStored, readStoredScenario, () => null);
  const scenario = resolveScenario(pathname, search, stored);
  setScenario(scenario);
  const { epoch } = getScenarioState();
  return <ScenarioContext.Provider value={{ scenario, epoch }}>{children}</ScenarioContext.Provider>;
}

export function useScenario(): ScenarioValue {
  return useContext(ScenarioContext);
}
