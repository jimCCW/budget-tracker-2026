import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountCard } from '@/features/accounts/components/AccountCard';
import type { Account } from '@/types/account';

vi.mock('primereact/button', () => ({
  Button: ({
    icon,
    onClick,
    'aria-label': ariaLabel,
    children,
  }: {
    icon?: string;
    onClick?: (e: React.MouseEvent) => void;
    'aria-label'?: string;
    children?: React.ReactNode;
  }) => (
    <button onClick={onClick as React.MouseEventHandler} aria-label={ariaLabel}>
      {icon && <i className={icon} />}
      {children}
    </button>
  ),
}));

vi.mock('primereact/menu', () => ({
  Menu: ({
    model,
  }: {
    model?: Array<{ label?: string; command?: (...args: unknown[]) => void }>;
  }) => (
    <div data-testid='menu'>
      {model?.map((item, i) => (
        <button key={i} onClick={() => item.command?.()}>
          {item.label}
        </button>
      ))}
    </div>
  ),
}));

const baseAccount: Account = {
  id: 'acc-1',
  userId: 'user-1',
  name: 'DBS Savings',
  type: 'BANK',
  balance: 5000,
  icon: null,
  color: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('AccountCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the account name', () => {
    render(
      <AccountCard account={baseAccount} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText('DBS Savings')).toBeInTheDocument();
  });

  it('renders the account type label', () => {
    render(
      <AccountCard account={baseAccount} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText('Bank')).toBeInTheDocument();
  });

  it('renders the formatted balance', () => {
    render(
      <AccountCard account={baseAccount} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText(/5,000/)).toBeInTheDocument();
  });

  it('applies danger text class to balance for CREDIT accounts', () => {
    const credit: Account = { ...baseAccount, type: 'CREDIT', balance: -1000 };
    const { container } = render(
      <AccountCard account={credit} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    const balanceEl = container.querySelector('.text-danger.text-xl');
    expect(balanceEl).toBeInTheDocument();
  });

  it('does not apply danger class to balance for non-CREDIT accounts', () => {
    const { container } = render(
      <AccountCard account={baseAccount} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    const balanceEl = container.querySelector('.text-xl');
    expect(balanceEl?.className).not.toContain('text-danger');
  });

  it('uses account.color when provided instead of the type default', () => {
    const withColor: Account = { ...baseAccount, color: '#FF0000' };
    const withNull: Account = { ...baseAccount, color: null };
    const { container: c1 } = render(
      <AccountCard account={withColor} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    const { container: c2 } = render(
      <AccountCard account={withNull} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    const iconWithColor = (c1.querySelector('.w-11.h-11') as HTMLElement).style
      .backgroundColor;
    const iconWithDefault = (c2.querySelector('.w-11.h-11') as HTMLElement)
      .style.backgroundColor;
    expect(iconWithColor).not.toBe(iconWithDefault);
  });

  it('falls back to the type meta color when account.color is null', () => {
    const { container } = render(
      <AccountCard account={baseAccount} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    const iconEl = container.querySelector('.w-11.h-11') as HTMLElement;
    // BANK default is #6366F1 — JSDOM serialises hex as rgb(99, 102, 241)
    expect(iconEl.style.backgroundColor).toBe('rgb(99, 102, 241)');
  });

  it('calls onEdit with the account when the Edit menu item is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <AccountCard account={baseAccount} onEdit={onEdit} onDelete={vi.fn()} />
    );
    await user.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith(baseAccount);
  });

  it('calls onDelete with the account when the Delete menu item is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <AccountCard account={baseAccount} onEdit={vi.fn()} onDelete={onDelete} />
    );
    await user.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith(baseAccount);
  });
});
