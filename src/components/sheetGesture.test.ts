import { describe, expect, it } from 'vitest';
import { releaseVelocity, settleSheet } from './sheetGesture';

// An 800px screen with a 600px sheet: full at 0, natural at 200, closed at 800.
const at = (top: number, velocity = 0) => settleSheet({ top, velocity, full: 0, natural: 200, closed: 800 });

describe('settleSheet', () => {
  it('stays at its own height after a small drag either way', () => {
    expect(at(200)).toBe('natural');
    expect(at(260)).toBe('natural');
    expect(at(140)).toBe('natural');
  });

  it('fills the screen once dragged more than halfway up', () => {
    expect(at(99)).toBe('full');
    expect(at(0)).toBe('full');
  });

  it('closes once pulled down past 30% of its height', () => {
    expect(at(379)).toBe('natural');
    expect(at(381)).toBe('close');
  });

  it('follows a flick even over a short distance', () => {
    expect(at(240, 1000)).toBe('close'); // 40px down, fast
    expect(at(170, -600)).toBe('full'); // 30px up, fast
    expect(at(60, 500)).toBe('natural'); // from full, flicked down
  });
});

describe('releaseVelocity', () => {
  it('measures the last stretch of the drag in px/s', () => {
    expect(releaseVelocity([{ t: 0, y: 0 }, { t: 20, y: 10 }, { t: 40, y: 30 }])).toBe(750);
  });

  it('is zero when the pointer was held still before release', () => {
    expect(releaseVelocity([{ t: 0, y: 0 }, { t: 30, y: 60 }, { t: 400, y: 60 }])).toBe(0);
  });

  it('is zero without movement', () => {
    expect(releaseVelocity([{ t: 0, y: 5 }])).toBe(0);
  });
});
