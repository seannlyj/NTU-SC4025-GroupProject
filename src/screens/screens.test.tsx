/**
 * Screen tests: every number on screen tallies with the seed data, the three
 * status labels are the only ones used, and the main flows work.
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setMockLatency } from '../api/mockApi';
import { resetScenario } from '../api/scenario';
import { renderApp } from '../test/renderApp';

let current: ReturnType<typeof renderApp>;
function renderAt(path: string) {
  current = renderApp(path);
  return current;
}

/** Matches an element by its full text, even when the text is split across child elements. */
const fullText = (text: string) => (_: string, el: Element | null) =>
  el?.tagName === 'P' && el.textContent === text;

const money = (text: string) => Math.round(Number(text.replace(/[^0-9.]/g, '')) * 100);
const location = () => current.location();

beforeEach(() => {
  setMockLatency(0);
  resetScenario();
  window.sessionStorage.clear();
});

describe('Dashboard (/rewards)', () => {
  it('shows the seed figures', async () => {
    renderAt('/rewards');
    expect(await screen.findByText('S$1.55')).toBeInTheDocument();
    expect(screen.getByText('OCBC 365 Credit Card')).toBeInTheDocument();
    expect(screen.getByText('S$160.00 monthly cap')).toBeInTheDocument();
    expect(screen.getByText('S$180.00 to go')).toBeInTheDocument();
    expect(screen.getByText('S$620.00')).toBeInTheDocument();
    expect(screen.getByText('Updated 12 Oct, 22:10')).toBeInTheDocument();
    expect(screen.getByText('S$2,100.00')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Eligible spend towards the minimum' }),
    ).toHaveAttribute('aria-valuetext', 'S$620.00 of S$800.00');
    expect(
      screen.getByRole('img', {
        name: 'Total card spending S$2,100.00: Eligible S$620.00, Pending S$300.00, Not eligible S$1,180.00',
      }),
    ).toBeInTheDocument();
  });

  it('lists the three most recent transactions', async () => {
    renderAt('/rewards');
    const list = within((await screen.findByRole('heading', { name: 'Recent transactions' })).closest('section')!);
    const rows = list.getAllByTestId('transaction-row');
    expect(rows.map((r) => within(r).getAllByText(/^Merchant /)[0].textContent)).toEqual([
      'Merchant A',
      'Merchant B',
      'Merchant C',
    ]);
    expect(list.getByText('+S$0.11')).toBeInTheDocument();
    expect(list.getByRole('link', { name: /why is merchant c/i })).toHaveAttribute('href', '/eligibility?rule=payments-and-top-ups');
  });

  it('shows the category cashback tiles', async () => {
    renderAt('/rewards');
    const section = (await screen.findByRole('heading', { name: 'By category' })).closest('section')!;
    const tiles = within(section).getAllByRole('listitem');
    expect(tiles.map((t) => t.textContent)).toEqual([
      'Category 1Cashback S$0.62',
      'Category 2Cashback S$0.48',
      'Category 3Cashback S$0.45',
      'Category 4Cashback S$0.00',
      'Category 5Cashback S$0.00',
      'Category 6Cashback S$0.00',
      'Category 7Cashback S$0.00',
      'Category 8Cashback S$0.00',
    ]);
  });

  it('links to History, Eligibility and Report', async () => {
    renderAt('/rewards');
    const nav = await screen.findByRole('navigation', { name: 'Rewards tools' });
    expect(within(nav).getByRole('link', { name: 'History' })).toHaveAttribute('href', '/history');
    expect(within(nav).getByRole('link', { name: 'Eligibility' })).toHaveAttribute('href', '/eligibility');
    expect(within(nav).getByRole('link', { name: 'Report' })).toHaveAttribute('href', '/report');
  });
});

describe('Dashboard states', () => {
  it('/no-card shows the no-card message', async () => {
    renderAt('/no-card');
    expect(await screen.findByText('No eligible OCBC credit cards are available')).toBeInTheDocument();
  });

  it('/unavailable shows Unavailable, and Retry recovers', async () => {
    renderAt('/unavailable');
    expect(await screen.findAllByText('Unavailable')).toHaveLength(3);
    expect(screen.getByText('OCBC 365 Credit Card')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(location()).toBe('/rewards'));
    expect(screen.getByText('S$1.55')).toBeInTheDocument();
  });

  it('?state=loading keeps the skeletons on screen', async () => {
    renderAt('/rewards?state=loading');
    expect(await screen.findByText('Loading your rewards')).toBeInTheDocument();
    expect(screen.queryByText('S$1.55')).not.toBeInTheDocument();
  });
});

describe('Transactions (/transactions)', () => {
  it('shows all 13 rows grouped by date, tallying to S$2,100.00 and S$1.55', async () => {
    renderAt('/transactions');
    await screen.findByText('Merchant M');
    const rows = screen.getAllByTestId('transaction-row');
    expect(rows).toHaveLength(13);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      '12 Oct',
      '11 Oct',
      '10 Oct',
      '09 Oct',
      '08 Oct',
      '07 Oct',
      '06 Oct',
      '05 Oct',
      '04 Oct',
      '03 Oct',
      '02 Oct',
      '01 Oct',
    ]);
    const amounts = rows.map((r) => money(within(r).getAllByText(/^S\$/)[0].textContent!));
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(210_000);
    const cashback = rows.flatMap((r) => within(r).queryAllByText(/^\+S\$/).map((e) => money(e.textContent!)));
    expect(cashback.reduce((a, b) => a + b, 0)).toBe(155);
  });

  it('uses only the three status labels', async () => {
    renderAt('/transactions');
    await screen.findByText('Merchant M');
    const labels = screen
      .getAllByTestId('transaction-row')
      .map((r) => r.querySelector('p:nth-of-type(2)')?.textContent ?? '');
    expect(new Set(labels)).toEqual(new Set(['Eligible', 'Pending', 'Not eligible']));
  });

  it('filters to nothing and lands on /transactions/empty', async () => {
    renderAt('/transactions');
    await screen.findByText('Merchant M');
    await userEvent.click(screen.getByRole('link', { name: 'Filter' }));
    const dialog = await screen.findByRole('dialog', { name: 'Filter' });
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Posted' }));
    expect(await within(dialog).findByText(fullText('10 transactions match'))).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Category 7' }));
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Category 8' }));
    expect(await within(dialog).findByText(fullText('0 transactions match'))).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByText('No transactions match your filters.')).toBeInTheDocument();
    expect(location()).toBe('/transactions/empty?status=posted&category=7%2C8&from=2026-10-01&to=2026-10-12');
    for (const chip of ['Posted', 'Category 7', 'Category 8', '01 Oct – 12 Oct']) {
      expect(screen.getByRole('button', { name: `Remove ${chip} filter` })).toBeInTheDocument();
    }
  });

  it('removing a chip brings results back', async () => {
    renderAt('/transactions/empty?status=pending&category=8');
    await screen.findByText('No transactions match your filters.');
    await userEvent.click(screen.getByRole('button', { name: 'Remove Category 8 filter' }));
    expect(await screen.findByText('Merchant A')).toBeInTheDocument();
    expect(screen.getAllByTestId('transaction-row')).toHaveLength(3);
    expect(location()).toBe('/transactions?status=pending');
  });

  it('/transactions/empty opened directly shows a real empty filter', async () => {
    renderAt('/transactions/empty');
    expect(await screen.findByText('No transactions match your filters.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Posted filter' })).toBeInTheDocument();
  });

  it('closing the sheet steps back, so one Back press leaves Transactions', async () => {
    const { router } = renderAt('/rewards');
    await userEvent.click(await screen.findByRole('link', { name: 'See all' }));
    await userEvent.click(await screen.findByRole('link', { name: 'Filter' }));
    await screen.findByRole('dialog', { name: 'Filter' });
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(location()).toBe('/transactions'));
    await router.navigate(-1);
    await waitFor(() => expect(location()).toBe('/rewards'));
  });

  it('applying filters adds no history step, so Back from a filtered list leaves Transactions', async () => {
    const { router } = renderAt('/rewards');
    await userEvent.click(await screen.findByRole('link', { name: 'See all' }));
    await userEvent.click(await screen.findByRole('link', { name: 'Filter' }));
    const dialog = await screen.findByRole('dialog', { name: 'Filter' });
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Pending' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(location()).toBe('/transactions?status=pending&from=2026-10-01&to=2026-10-12'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getAllByTestId('transaction-row')).toHaveLength(3);
    await router.navigate(-1);
    await waitFor(() => expect(location()).toBe('/rewards'));
  });

  it('removing chips and reaching no matches add no history steps either', async () => {
    const { router } = renderAt('/rewards');
    await userEvent.click(await screen.findByRole('link', { name: 'See all' }));

    // To no matches (/transactions/empty) and back out to results through the sheet.
    await userEvent.click(await screen.findByRole('link', { name: 'Filter' }));
    let dialog = await screen.findByRole('dialog', { name: 'Filter' });
    for (const name of ['Posted', 'Category 7', 'Category 8']) {
      await userEvent.click(within(dialog).getByRole('checkbox', { name }));
    }
    expect(await within(dialog).findByText(fullText('0 transactions match'))).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByText('No transactions match your filters.')).toBeInTheDocument();
    await waitFor(() => expect(location()).toMatch(/^\/transactions\/empty\?status=posted/));

    await userEvent.click(screen.getByRole('link', { name: 'Filter' }));
    dialog = await screen.findByRole('dialog', { name: 'Filter' });
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Category 7' }));
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Category 8' }));
    expect(await within(dialog).findByText(fullText('10 transactions match'))).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(location()).toMatch(/^\/transactions\?status=posted&from=/));

    await userEvent.click(await screen.findByRole('button', { name: 'Remove Posted filter' }));
    await waitFor(() => expect(location()).toMatch(/^\/transactions\?from=/));

    await router.navigate(-1);
    await waitFor(() => expect(location()).toBe('/rewards'));
  });

  it('the sheet handle switches between full screen and the sheet’s own height', async () => {
    renderAt('/transactions/filter');
    const handle = await screen.findByRole('button', { name: 'Full screen' });
    expect(handle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(handle);
    await waitFor(() => expect(handle).toHaveAttribute('aria-pressed', 'true'));
    await userEvent.click(handle);
    await waitFor(() => expect(handle).toHaveAttribute('aria-pressed', 'false'));
    handle.focus();
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(handle).toHaveAttribute('aria-pressed', 'true'));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(handle).toHaveAttribute('aria-pressed', 'false'));
    expect(screen.getByRole('dialog', { name: 'Filter' })).toBeInTheDocument();
  });

  it('dragging the handle up fills the screen, and dragging it down closes the sheet', async () => {
    // jsdom has no layout: an 800px screen and a 600px sheet (all 800px at full screen),
    // so the sheet's top edge rests at 200px.
    const sizes = [
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(800),
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
        return this.style.height === '100%' ? 800 : 600;
      }),
    ];
    try {
      renderAt('/transactions/filter');
      const handle = await screen.findByRole('button', { name: 'Full screen' });
      // jsdom has no PointerEvent; React only needs the event name and the coordinates.
      const pointer = (target: Element | Window, type: string, clientY: number) =>
        fireEvent(target, new MouseEvent(type, { bubbles: true, button: 0, clientY }));
      const dragHandle = async (from: number, to: number) => {
        pointer(handle, 'pointerdown', from);
        pointer(window, 'pointermove', to);
        await new Promise((r) => setTimeout(r, 100)); // hold still: a drag, not a flick
        pointer(window, 'pointerup', to);
      };

      await dragHandle(210, 40);
      await waitFor(() => expect(handle).toHaveAttribute('aria-pressed', 'true'));

      await dragHandle(10, 210);
      await waitFor(() => expect(handle).toHaveAttribute('aria-pressed', 'false'));

      await dragHandle(210, 520);
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(location()).toBe('/transactions');
    } finally {
      sizes.forEach((s) => s.mockRestore());
    }
  });

  it('Clear all in the sheet resets the draft', async () => {
    renderAt('/transactions/filter?status=pending');
    const dialog = await screen.findByRole('dialog', { name: 'Filter' });
    expect(within(dialog).getByRole('checkbox', { name: 'Pending' })).toBeChecked();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Clear all' }));
    expect(within(dialog).getByRole('checkbox', { name: 'Pending' })).not.toBeChecked();
    expect(await within(dialog).findByText(fullText('13 transactions match'))).toBeInTheDocument();
  });
});

describe('Eligibility (/eligibility)', () => {
  it('shows the minimum and cap, with the linked rule open', async () => {
    renderAt('/eligibility?rule=government-and-other');
    expect(screen.getByText('S$800')).toBeInTheDocument();
    expect(screen.getByText('S$160')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Government, charity and other payments' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'How the S$800 minimum and S$160 cap work' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('opens on how the minimum and cap work, with the rules and where they come from', async () => {
    renderAt('/eligibility');
    expect(screen.getByRole('button', { name: 'How the S$800 minimum and S$160 cap work' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText(/dining, groceries, land transport and petrol earn 6% cashback/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { expanded: false }).map((b) => b.textContent)).toEqual([
      'Only posted purchases count',
      'Bank fees, interest and instalment plans',
      'Bill payments, top-ups and transfers',
      'Insurance, education and healthcare',
      'Government, charity and other payments',
      'The merchant’s code decides',
    ]);
    expect(screen.getByRole('link', { name: /OCBC 365 Credit Card Cashback Programme terms/ })).toHaveAttribute(
      'href',
      expect.stringContaining('ocbc.com'),
    );
    expect(screen.getByRole('link', { name: /Transaction Exclusion List/ })).toHaveAttribute('target', '_blank');
  });

  it('is reached from "Why?", which opens the rule that excludes the transaction', async () => {
    renderAt('/transactions');
    await userEvent.click(await screen.findByRole('link', { name: /why is merchant h/i }));
    expect(await screen.findByRole('heading', { name: 'Eligibility' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Insurance, education and healthcare' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Insurance premiums, including insurance sold by direct marketing')).toBeVisible();
  });
});

describe('History', () => {
  it('/history shows six months with September selected', async () => {
    renderAt('/history');
    expect(await screen.findByText('September 2026')).toBeInTheDocument();
    expect(screen.getByText('S$2,226.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'September 2026: S$2,226.00' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('S$840.00')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'April 2026: S$1,370.00' }));
    expect(await screen.findByText('April 2026')).toBeInTheDocument();
    // Amounts tween to the new month's values.
    expect(await screen.findByText('S$420.00')).toBeInTheDocument();
    expect(await screen.findByText('S$1,370.00')).toBeInTheDocument();
  });

  it('a month bar turns red as soon as it is pressed, before the press completes', async () => {
    renderAt('/history');
    const april = await screen.findByRole('button', { name: 'April 2026: S$1,370.00' });
    const bar = april.querySelector('span')!;
    // jsdom has no PointerEvent; React only needs the event name.
    fireEvent(april, new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    await waitFor(() => expect(bar.style.backgroundColor).toBe('var(--color-brand)'));
    expect(april).toHaveAttribute('aria-pressed', 'false');
    // Let go without completing the click (e.g. a scroll took over): it goes back to grey.
    fireEvent(april, new MouseEvent('pointerup', { bubbles: true, button: 0 }));
    await waitFor(() => expect(bar.style.backgroundColor).toBe('var(--color-bar-muted)'));
    await userEvent.click(april);
    expect(april).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(bar.style.backgroundColor).toBe('var(--color-brand)'));
  });

  it('/history/month shows October so far with two categories above usual', async () => {
    renderAt('/history/month');
    expect(await screen.findByText('October so far')).toBeInTheDocument();
    expect(screen.getByText('S$2,100.00')).toBeInTheDocument();
    for (const v of ['S$455.00', 'S$626.00', 'S$300.00', 'S$80.00', 'S$400.00', 'S$100.00', 'S$40.00', 'S$99.00']) {
      expect(screen.getByText(v)).toBeInTheDocument();
    }
    expect(screen.getAllByText('Above your usual spending')).toHaveLength(2);
  });

  it('/history/empty shows the empty state', async () => {
    renderAt('/history/empty');
    expect(await screen.findByText('No spending history yet.')).toBeInTheDocument();
  });
});

describe('Report', () => {
  it('/report defaults to the last six full months', () => {
    renderAt('/report');
    expect(screen.getByText('01 Apr 2026')).toBeInTheDocument();
    expect(screen.getByText('30 Sep 2026')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('/report/error shows the validation error and blocks the PDF', async () => {
    renderAt('/report/error');
    expect(screen.getByRole('alert')).toHaveTextContent("End date can't be before the start date.");
    const button = screen.getByRole('button', { name: 'Get PDF report' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(button);
    expect(location()).toBe('/report/error');
  });

  it('validates as the dates change', async () => {
    renderAt('/report');
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-03-01' } });
    expect(screen.getByRole('alert')).toHaveTextContent("End date can't be before the start date.");
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-04-30' } });
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});

describe('Demo controls', () => {
  it('are hidden unless demo mode is on', async () => {
    renderAt('/rewards');
    await screen.findByText('S$1.55');
    expect(screen.queryByRole('button', { name: /demo controls/i })).not.toBeInTheDocument();
  });

  it('?demo=1 shows them; picking a state changes the data', async () => {
    renderAt('/rewards?demo=1');
    await screen.findByText('S$1.55');
    await userEvent.click(await screen.findByRole('button', { name: /demo controls/i }));
    expect(screen.getAllByRole('link').filter((l) => l.closest('nav[aria-label="All screens"]'))).toHaveLength(14);
    await userEvent.click(screen.getByRole('radio', { name: 'No OCBC 365 card' }));
    expect(await screen.findByText('No eligible OCBC credit cards are available')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Normal (seed data)' }));
    expect(await screen.findByText('S$1.55')).toBeInTheDocument();
  });

  it('?state=nohistory works on any route', async () => {
    renderAt('/history?state=nohistory');
    expect(await screen.findByText('No spending history yet.')).toBeInTheDocument();
  });
});

describe('Home (/, filler)', () => {
  it('is the page the app opens on, and unknown paths land there too', async () => {
    renderAt('/home');
    expect(await screen.findByRole('heading', { name: 'Hey there!' })).toBeInTheDocument();
    expect(location()).toBe('/');
  });

  it('shows the banking home with Rewards Tracker in place of Bill payment', async () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'Hey there!' })).toBeInTheDocument();
    const actions = screen.getByRole('navigation', { name: 'Quick actions' });
    expect(within(actions).getByText('PayNow')).toBeInTheDocument();
    expect(within(actions).getByText('Scan & Pay')).toBeInTheDocument();
    expect(within(actions).queryByText('Bill payment')).not.toBeInTheDocument();
    expect(within(actions).getByRole('link', { name: /rewards tracker/i })).toHaveAttribute('href', '/rewards');
    expect(screen.getByText('30,000.00 SGD')).toBeInTheDocument();
  });

  it('Rewards Tracker opens the product, and Back returns Home', async () => {
    const { router } = renderAt('/');
    await userEvent.click(screen.getByRole('link', { name: /rewards tracker/i }));
    expect(await screen.findByText('S$1.55')).toBeInTheDocument();
    expect(location()).toBe('/rewards');
    await router.navigate(-1);
    expect(await screen.findByRole('heading', { name: 'Hey there!' })).toBeInTheDocument();
    expect(location()).toBe('/');
  });

  it('Rewards Tracker has exactly the same top bar as Home', async () => {
    const topBar = () => screen.getByRole('button', { name: 'Scan' }).closest('header')!.outerHTML;
    renderAt('/');
    const home = topBar();
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: /rewards tracker/i }));
    await screen.findByText('S$1.55');
    expect(topBar()).toBe(home);
    expect(screen.getByRole('heading', { level: 1, name: 'Rewards Tracker' })).toBeInTheDocument();
  });

  it('the Home tab is live and marks the current section', async () => {
    renderAt('/rewards');
    await screen.findByText('S$1.55');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Rewards' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(within(nav).getByRole('link', { name: 'Home' }));
    expect(await screen.findByRole('heading', { name: 'Hey there!' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });

  it('the eye button hides and shows balances', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: 'Hide balances' }));
    await waitFor(() => expect(screen.queryByText('30,000.00 SGD')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Show balances' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('the Cards tab leads to the OCBC 365 card in Rewards Tracker', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('tab', { name: 'Cards' }));
    expect(await screen.findByRole('link', { name: /ocbc 365 credit card/i })).toHaveAttribute('href', '/rewards');
  });
});
