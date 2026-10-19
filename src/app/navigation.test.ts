import { describe, expect, it } from 'vitest';
import { classifyNavigation, type NavigationChange } from './navigation';

const nav = (change: Partial<NavigationChange> & Pick<NavigationChange, 'from' | 'to'>) =>
  classifyNavigation({ action: 'PUSH', delta: 1, ...change });

describe('classifyNavigation', () => {
  it('slides forward when going deeper', () => {
    expect(nav({ from: '/', to: '/transactions' })).toBe('forward');
    expect(nav({ from: '/transactions', to: '/eligibility' })).toBe('forward');
    expect(nav({ from: '/report', to: '/report/pdf' })).toBe('forward');
  });

  it('slides back on history back, forward on history forward', () => {
    expect(nav({ from: '/transactions', to: '/', action: 'POP', delta: -1 })).toBe('back');
    expect(nav({ from: '/', to: '/transactions', action: 'POP', delta: 1 })).toBe('forward');
  });

  it('crossfades replacements: tabs, retry, redirects', () => {
    expect(nav({ from: '/history', to: '/history/month', action: 'REPLACE', delta: 0 })).toBe('fade');
    expect(nav({ from: '/unavailable', to: '/rewards', action: 'REPLACE', delta: 0 })).toBe('fade');
  });

  it('crossfades between the list and its no-match state', () => {
    expect(nav({ from: '/transactions', to: '/transactions/empty' })).toBe('fade');
    expect(nav({ from: '/transactions/empty', to: '/transactions', action: 'POP', delta: -1 })).toBe('fade');
  });

  it('opens and closes the filter sheet without moving the page', () => {
    expect(nav({ from: '/transactions', to: '/transactions/filter' })).toBe('sheet-open');
    expect(nav({ from: '/transactions/filter', to: '/transactions', action: 'REPLACE', delta: 0 })).toBe('sheet-close');
    expect(nav({ from: '/transactions/filter', to: '/transactions/empty', action: 'REPLACE', delta: 0 })).toBe(
      'sheet-close',
    );
    expect(nav({ from: '/transactions/filter', to: '/transactions', action: 'POP', delta: -1 })).toBe('sheet-close');
  });

  it('does nothing when only the search changes', () => {
    expect(nav({ from: '/transactions', to: '/transactions' })).toBe('none');
  });

  it('honours a kind the link asks for, except on history back/forward', () => {
    expect(nav({ from: '/eligibility', to: '/', requested: 'back', action: 'REPLACE', delta: 0 })).toBe('back');
    expect(nav({ from: '/history', to: '/', requested: 'fade' })).toBe('fade');
    expect(nav({ from: '/', to: '/history', requested: 'fade', action: 'POP', delta: -1 })).toBe('back');
  });
});
