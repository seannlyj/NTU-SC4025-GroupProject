/**
 * Where a bottom sheet settles after the user lets go of it.
 *
 * Positions are the sheet's top edge in px from the top of the screen:
 * `full` (covers the screen), `natural` (its own height) and `closed`
 * (just off the bottom). `velocity` is in px/s, positive when moving down.
 */
export type SheetRest = 'full' | 'natural' | 'close';

/** How far ahead a flick is projected, in seconds (like a native scroll view's deceleration). */
const PROJECTION = 0.25;
/** Share of the sheet's own height it must be pulled below its natural position to close. */
const CLOSE_SHARE = 0.3;

export function settleSheet({
  top,
  velocity,
  full,
  natural,
  closed,
}: {
  top: number;
  velocity: number;
  full: number;
  natural: number;
  closed: number;
}): SheetRest {
  const projected = top + velocity * PROJECTION;
  if (projected > natural + (closed - natural) * CLOSE_SHARE) return 'close';
  if (projected < (full + natural) / 2) return 'full';
  return 'natural';
}

/** Speed of the last stretch of a drag, in px/s, from timestamped pointer positions. */
export function releaseVelocity(samples: { t: number; y: number }[], windowMs = 80): number {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1];
  const first = samples.find((s) => last.t - s.t <= windowMs) ?? samples[0];
  const dt = last.t - first.t;
  return dt > 0 ? ((last.y - first.y) / dt) * 1000 : 0;
}
