import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddTransactionModal } from '@/features/transactions/components/AddTransactionModal';
import { createWrapper } from '../helpers/createWrapper';

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid='modal'>{children}</div> : null,
}));

vi.mock('@/features/income/hooks/useCreateIncome', () => ({
  useCreateIncome: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    reset: vi.fn(),
  }),
}));

vi.mock('@/features/expenses/hooks/useCreateExpense', () => ({
  useCreateExpense: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    reset: vi.fn(),
  }),
}));

vi.mock('@/features/recurring/hooks/useCreateRule', () => ({
  useCreateRule: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    reset: vi.fn(),
  }),
}));

vi.mock('@/features/accounts/hooks/useAccounts', () => ({
  useAccounts: () => ({
    data: [{ id: 'acc-1', name: 'DBS', type: 'BANK', balance: 1000 }],
  }),
}));

vi.mock('@/features/categories/hooks/useCategories', () => ({
  useCategories: () => ({
    data: [
      {
        id: 'cat-exp-1',
        name: 'Food',
        type: 'EXPENSE',
        icon: 'pi-tag',
        color: null,
      },
      {
        id: 'cat-inc-1',
        name: 'Salary',
        type: 'INCOME',
        icon: 'pi-tag',
        color: null,
      },
    ],
  }),
}));

vi.mock('@/lib/dateUtils', () => ({
  todayISO: () => '2026-06-21',
}));

vi.mock('primereact/inputtext', () => ({
  InputText: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock('primereact/button', () => ({
  Button: ({
    label,
    type,
    disabled,
    loading,
    onClick,
    children,
    icon,
  }: {
    label?: string;
    type?: 'submit' | 'button' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    onClick?: () => void;
    children?: React.ReactNode;
    icon?: string;
  }) => (
    <button
      type={type ?? 'button'}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {label || children || (icon ? <i className={icon} /> : null)}
    </button>
  ),
}));

vi.mock('primereact/checkbox', () => ({
  Checkbox: ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (e: { checked: boolean }) => void;
  }) => (
    <input
      type='checkbox'
      checked={checked ?? false}
      aria-label='Repeat checkbox'
      onChange={(e) => onChange({ checked: e.target.checked })}
    />
  ),
}));

const defaultProps = { open: true, onClose: vi.fn() };

describe('AddTransactionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when open is false', () => {
    render(<AddTransactionModal open={false} onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders the modal when open is true', () => {
    render(<AddTransactionModal {...defaultProps} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('New transaction')).toBeInTheDocument();
  });

  it('shows Expense and Income type toggle buttons', () => {
    render(<AddTransactionModal {...defaultProps} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByRole('button', { name: 'Expense' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Income' })).toBeInTheDocument();
  });

  it('shows expense categories by default', () => {
    render(<AddTransactionModal {...defaultProps} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.queryByText('Salary')).not.toBeInTheDocument();
  });

  it('switches to income categories when Income tab is clicked', async () => {
    const user = userEvent.setup();
    render(<AddTransactionModal {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByRole('button', { name: 'Income' }));

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
      expect(screen.queryByText('Food')).not.toBeInTheDocument();
    });
  });

  it('shows frequency pills when repeat checkbox is checked', async () => {
    const user = userEvent.setup();
    render(<AddTransactionModal {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    const checkbox = screen.getByRole('checkbox', { name: /repeat/i });
    await user.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText('Monthly')).toBeInTheDocument();
    });
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<AddTransactionModal open={true} onClose={onClose} />, {
      wrapper: createWrapper(),
    });

    const closeButtons = screen.getAllByRole('button');
    const closeBtn = closeButtons.find((b) => b.querySelector('i.pi-times'));
    if (closeBtn) await user.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
