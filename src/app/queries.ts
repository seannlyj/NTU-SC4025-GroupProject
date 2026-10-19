import { QueryClient, useQuery } from '@tanstack/react-query';
import { api, type DateRange } from '../api';
import type { Scenario } from '../api/scenario';
import { TODAY } from '../config/clock';
import { firstDayOf, lastDayOf, monthOf } from '../domain/dates';
import { useScenario } from './scenario';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Mock data never changes; errors are retried only by the Retry button.
        retry: false,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });
}

/** Cache per demo state, so switching state never shows another state's data. */
export function scenarioKey(name: string, scenario: Scenario, epoch = 0, ...rest: unknown[]): unknown[] {
  return scenario === 'unavailable' ? [name, scenario, epoch, ...rest] : [name, scenario, ...rest];
}

function useKey(name: string, ...rest: unknown[]): unknown[] {
  const { scenario, epoch } = useScenario();
  return scenarioKey(name, scenario, epoch, ...rest);
}

export function useCard() {
  const queryKey = useKey('card');
  return useQuery({ queryKey, queryFn: () => api.getCard() });
}

export function useOverview() {
  const queryKey = useKey('overview');
  return useQuery({ queryKey, queryFn: () => api.getOverview() });
}

/**
 * Transactions for whole months covering `range`, so cashback per row is
 * worked out with the full month (tiers depend on the month's total).
 * Screens then narrow to the exact range.
 */
export function useMonthsTransactions(range: DateRange) {
  const from = firstDayOf(monthOf(range.from));
  const to = lastDayOf(monthOf(range.to));
  const queryKey = useKey('transactions', from, to);
  return useQuery({ queryKey, queryFn: () => api.getTransactions({ from, to }) });
}

export function useHistory() {
  const queryKey = useKey('history');
  return useQuery({ queryKey, queryFn: () => api.getHistory() });
}

/** The list's default period: the current calendar month, up to today. */
export const DEFAULT_PERIOD: DateRange = { from: firstDayOf(monthOf(TODAY)), to: TODAY };
