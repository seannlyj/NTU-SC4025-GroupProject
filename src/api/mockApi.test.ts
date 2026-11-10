import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockApi, setMockLatency } from './mockApi';
import { getScenarioState, resetScenario, setScenario } from './scenario';
import { ServiceUnavailableError } from './types';

beforeEach(() => {
  setMockLatency(0);
  resetScenario();
});

afterEach(() => resetScenario());

describe('mockApi (normal)', () => {
  it('returns the card', async () => {
    await expect(mockApi.getCard()).resolves.toMatchObject({ productName: 'OCBC 365 Credit Card', last4: '1234' });
  });

  it('returns the October overview', async () => {
    const overview = await mockApi.getOverview();
    expect(overview.month).toBe('2026-10');
    expect(overview.updatedAt).toBe('2026-10-12T22:10');
    expect(overview.transactions).toHaveLength(13);
    expect(overview.categories).toHaveLength(8);
    // October cashback is expected on Monday 16 Nov 2026.
    expect(overview.expectedCreditDate).toBe('2026-11-16');
  });

  it('returns transactions for any range', async () => {
    await expect(mockApi.getTransactions({ from: '2026-10-01', to: '2026-10-31' })).resolves.toHaveLength(13);
    await expect(mockApi.getTransactions({ from: '2026-04-01', to: '2026-04-30' })).resolves.toHaveLength(14);
  });

  it('returns six months of history plus this month', async () => {
    const history = await mockApi.getHistory();
    expect(history?.months).toHaveLength(6);
    expect(history?.current.categories).toHaveLength(8);
  });

  it('hands out copies, so screens cannot change the seed', async () => {
    const first = await mockApi.getOverview();
    first.transactions[0].amountCents = 1;
    const second = await mockApi.getOverview();
    expect(second.transactions[0].amountCents).toBe(8_200);
  });
});

describe('mockApi scenarios', () => {
  it('no-card: no card, no data', async () => {
    setScenario('no-card');
    await expect(mockApi.getCard()).resolves.toBeNull();
    await expect(mockApi.getHistory()).resolves.toBeNull();
  });

  it('unavailable: fails once, then Retry succeeds', async () => {
    setScenario('unavailable');
    await expect(mockApi.getOverview()).rejects.toBeInstanceOf(ServiceUnavailableError);
    await expect(mockApi.getOverview()).resolves.toMatchObject({ month: '2026-10' });
    await expect(mockApi.getCard()).resolves.not.toBeNull();
  });

  it('unavailable: entering again fails again with a new cache epoch', () => {
    setScenario('unavailable');
    const firstEpoch = getScenarioState().epoch;
    setScenario('normal');
    setScenario('unavailable');
    expect(getScenarioState().epoch).toBe(firstEpoch + 1);
    expect(getScenarioState().outagePending).toBe(true);
  });

  it('no-history: history is empty', async () => {
    setScenario('no-history');
    await expect(mockApi.getHistory()).resolves.toBeNull();
    await expect(mockApi.getOverview()).resolves.toBeTruthy();
  });

  it('loading: requests never settle', async () => {
    setScenario('loading');
    const settled = await Promise.race([
      mockApi.getOverview().then(() => 'settled'),
      new Promise((r) => setTimeout(() => r('pending'), 30)),
    ]);
    expect(settled).toBe('pending');
  });
});
