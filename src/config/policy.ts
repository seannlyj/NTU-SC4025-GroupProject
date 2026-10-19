import type { CashbackPolicy } from '../domain/cashback';

/**
 * OCBC 365 cashback rules used by the MVP. See ASSUMPTIONS.md (items 1 and 2).
 *
 * - The minimum is S$800 of *eligible* spend per calendar month.
 * - Cashback is capped at S$160 per month.
 * - Only the flat 0.25% rate is modelled. Tiers above the minimum are not
 *   decided yet: add them to `tiers` (for example
 *   `{ minMonthlyEligibleCents: 80_000, rateBps: 500, categoryRateBps: { 1: 600 } }`)
 *   and the calculator picks them up without other changes.
 */
export const CASHBACK_POLICY: CashbackPolicy = {
  minSpendCents: 80_000,
  capCents: 16_000,
  tiers: [{ minMonthlyEligibleCents: 0, rateBps: 25 }],
};
