import { mockApi } from './mockApi';
import type { RewardsApi } from './types';

/**
 * The one place the app gets its data from. To use a real backend, write a
 * client that implements RewardsApi (for example with fetch) and export it here.
 */
export const api: RewardsApi = mockApi;

export * from './types';
