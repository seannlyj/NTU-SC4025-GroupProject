/**
 * Demo states for the mock API. Real data would never need this.
 *
 * - normal       the seed data
 * - no-card      the customer has no eligible OCBC 365 card
 * - unavailable  the rewards service fails once; Retry succeeds
 * - no-history   no spending history yet
 * - loading      requests never finish, so the skeletons stay on screen
 */
export const SCENARIOS = ['normal', 'no-card', 'unavailable', 'no-history', 'loading'] as const;
export type Scenario = (typeof SCENARIOS)[number];

export function isScenario(value: unknown): value is Scenario {
  return SCENARIOS.includes(value as Scenario);
}

export interface ScenarioState {
  scenario: Scenario;
  /** Changes each time "unavailable" is entered, so cached data is not reused. */
  epoch: number;
  /** True until the first failed request in the "unavailable" scenario. */
  outagePending: boolean;
}

let state: ScenarioState = { scenario: 'normal', epoch: 0, outagePending: false };
const listeners = new Set<() => void>();

export function getScenarioState(): ScenarioState {
  return state;
}

/** Safe to call repeatedly; only a change of scenario does anything. */
export function setScenario(next: Scenario): void {
  if (next === state.scenario) return;
  state = {
    scenario: next,
    epoch: next === 'unavailable' ? state.epoch + 1 : state.epoch,
    outagePending: next === 'unavailable',
  };
  listeners.forEach((l) => l());
}

/** Called by the mock when it has served the one failure. */
export function consumeOutage(): boolean {
  if (!state.outagePending) return false;
  state = { ...state, outagePending: false };
  return true;
}

export function subscribeScenario(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** For tests. */
export function resetScenario(): void {
  state = { scenario: 'normal', epoch: 0, outagePending: false };
}
