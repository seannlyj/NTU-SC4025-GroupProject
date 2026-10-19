import type { IsoDate, IsoDateTime } from '../domain/dates';

/**
 * The mock clock. The demo always runs as if it is 12 Oct 2026, 22:10 in
 * Singapore, so every number matches the wireframes no matter when it is run.
 * A real backend would send the "last updated" time with the data instead.
 */
export const MOCK_NOW: IsoDateTime = '2026-10-12T22:10';

export const TODAY: IsoDate = MOCK_NOW.slice(0, 10);
