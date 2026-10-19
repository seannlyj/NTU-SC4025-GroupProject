import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { splitByStatus, splitSegments } from '../domain/summary';
import { OCTOBER_TABLE, tx } from '../test/fixtures';
import { AccordionItem } from './Accordion';
import { BottomSheet } from './BottomSheet';
import { CheckboxTile } from './CheckboxTile';
import { FilterChip } from './Chip';
import { ProgressBar } from './ProgressBar';
import { SplitBar } from './SplitBar';
import { StatusLabel } from './StatusLabel';
import { TransactionRow, merchantInitial } from './TransactionRow';

describe('StatusLabel', () => {
  it('uses exactly the three short labels', () => {
    render(
      <>
        <StatusLabel status="eligible" />
        <StatusLabel status="pending" />
        <StatusLabel status="not_eligible" />
      </>,
    );
    expect(screen.getByText('Eligible')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Not eligible')).toBeInTheDocument();
  });
});

describe('TransactionRow', () => {
  const renderRow = (t = OCTOBER_TABLE[1], cashback = 11, showDate = false) =>
    render(
      <MemoryRouter>
        <TransactionRow transaction={t} cashbackCents={cashback} showDate={showDate} />
      </MemoryRouter>,
    );

  it('shows amount and +cashback for an Eligible row', () => {
    renderRow();
    expect(screen.getByText('Merchant B')).toBeInTheDocument();
    expect(screen.getByText('S$44.00')).toBeInTheDocument();
    expect(screen.getByText('+S$0.11')).toBeInTheDocument();
  });

  it('shows a Why? link to the eligibility rule for a Not eligible row', () => {
    renderRow({ ...tx('c', '2026-10-10', 120, 'N', 3), ineligibleRuleId: 'payments-and-top-ups' }, 0);
    const link = screen.getByRole('link', { name: /why is merchant c not eligible/i });
    expect(link).toHaveAttribute('href', '/eligibility?rule=payments-and-top-ups');
    expect(screen.queryByText(/\+S\$/)).not.toBeInTheDocument();
  });

  it('shows "12 Oct · Pending" on the Dashboard variant', () => {
    renderRow(OCTOBER_TABLE[0], 0, true);
    expect(screen.getByText(/12 Oct ·/)).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('uses the merchant letter for the avatar', () => {
    expect(merchantInitial('Merchant A')).toBe('A');
    expect(merchantInitial('cold storage')).toBe('C');
  });
});

describe('ProgressBar', () => {
  it('exposes value and readable text', () => {
    render(<ProgressBar value={0.775} label="Minimum spend progress" valueText="S$620.00 of S$800.00" />);
    const bar = screen.getByRole('progressbar', { name: 'Minimum spend progress' });
    expect(bar).toHaveAttribute('aria-valuenow', '77.5');
    expect(bar).toHaveAttribute('aria-valuetext', 'S$620.00 of S$800.00');
  });
});

describe('SplitBar', () => {
  it('describes every segment with its amount', () => {
    render(<SplitBar segments={splitSegments(splitByStatus(OCTOBER_TABLE))} totalCents={210_000} />);
    expect(
      screen.getByRole('img', {
        name: 'Total card spending S$2,100.00: Eligible S$620.00, Pending S$300.00, Not eligible S$1,180.00',
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('segment-eligible').style.flexGrow).toBe(String(62_000 / 210_000));
  });
});

describe('FilterChip', () => {
  it('removes itself', async () => {
    const onRemove = vi.fn();
    render(<FilterChip label="Posted" onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Posted filter' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});

describe('CheckboxTile', () => {
  it('is a real checkbox', async () => {
    const onChange = vi.fn();
    render(<CheckboxTile label="Category 1" name="category" value="1" checked={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Category 1' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('AccordionItem', () => {
  it('toggles its panel', async () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <AccordionItem title="Rule 2" open={false} onToggle={onToggle}>
        Body
      </AccordionItem>,
    );
    const button = screen.getByRole('button', { name: 'Rule 2' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Body')).not.toBeVisible();
    await userEvent.click(button);
    expect(onToggle).toHaveBeenCalled();
    rerender(
      <AccordionItem title="Rule 2" open onToggle={onToggle}>
        Body
      </AccordionItem>,
    );
    await waitFor(() => expect(screen.getByText('Body')).toBeVisible());
    expect(screen.getByRole('region')).not.toHaveAttribute('aria-hidden', 'true');
  });
});

describe('BottomSheet', () => {
  it('is a modal dialog that closes on Escape and on the backdrop', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet titleId="t" onClose={onClose}>
        <h2 id="t">Filter</h2>
        <button type="button">Clear all</button>
      </BottomSheet>,
    );
    expect(screen.getByRole('dialog', { name: 'Filter' })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('dialog', { name: 'Filter' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByTestId('sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
