/**
 * Money is always held as whole cents (integers) so sums never drift.
 * The display format is S$1,234.56.
 */

function groupThousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export interface FormatOptions {
  /** 2 (default) for S$1,234.56; 0 for whole dollars, e.g. the S$800 summary tiles. */
  decimals?: 0 | 2;
  /** Prefix a "+" for positive amounts, e.g. "+S$0.11" cashback. */
  signed?: boolean;
}

export function formatSGD(cents: number, options: FormatOptions = {}): string {
  const { decimals = 2, signed = false } = options;
  const rounded = Math.round(cents);
  const abs = Math.abs(rounded);
  const body =
    decimals === 2
      ? `${groupThousands(Math.floor(abs / 100))}.${String(abs % 100).padStart(2, '0')}`
      : groupThousands(Math.floor((abs + 50) / 100));
  const sign = rounded < 0 ? '-' : signed && rounded > 0 ? '+' : '';
  return `${sign}S$${body}`;
}

/** Converts a dollar amount (as written in seed data) to cents. */
export function dollars(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Applies a rate in basis points (25 = 0.25%) and rounds half up to the cent.
 * Integer maths only: S$42.50 at 0.25% = 10.625c -> 11c; S$18.00 -> 4.5c -> 5c.
 */
export function applyRateBps(cents: number, bps: number): number {
  if (cents <= 0 || bps <= 0) return 0;
  return Math.floor((cents * bps + 5_000) / 10_000);
}

export function sumCents(values: Iterable<number>): number {
  let total = 0;
  for (const v of values) total += v;
  return total;
}
