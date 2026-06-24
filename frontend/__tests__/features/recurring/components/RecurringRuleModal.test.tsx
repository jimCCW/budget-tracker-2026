import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecurringRuleModal } from '@/features/recurring/components/RecurringRuleModal';
import { useCreateRule } from '@/features/recurring/hooks/useCreateRule';
import { useUpdateRule } from '@/features/recurring/hooks/useUpdateRule';
import type { RecurringRule } from '@/types/recurring';

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
    onClose: () => void;
    maxWidth?: string;
  }) => (open ? <div data-testid='modal'>{children}</div> : null),
}));

vi.mock('primereact/button', () => ({
  Button: ({
    type,
    label,
    icon,
    onClick,
    disabled,
    loading,
    'aria-label': ariaLabel,
    children,
  }: {
    type?: 'button' | 'submit' | 'reset';
    label?: string;
    icon?: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    'aria-label'?: string;
    children?: React.ReactNode;
  }) => (
    <button
      type={type ?? 'button'}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
    >
      {icon && <i className={icon} />}
      {label}
      {children}
    </button>
  ),
}));

vi.mock('primereact/inputtext', () => ({
  InputText: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock('@/features/recurring/hooks/useCreateRule');
vi.mock('@/features/recurring/hooks/useUpdateRule');

vi.mock('@/features/accounts/hooks/useAccounts', () => ({
  useAccounts: () => ({
    data: [
      {
        id: 'acc-1',
        userId: 'u1',
        name: 'DBS Bank',
        type: 'BANK',
        balance: 5000,
        icon: null,
        color: null,
        createdAt: '',
        updatedAt: '',
      },
    ],
  }),
}));

vi.mock('@/features/categories/hooks/useCategories', () => ({
  useCategories: () => ({
    data: [
      {
        id: 'cat-expense-1',
        userId: 'u1',
        name: 'Rent',
        type: 'EXPENSE',
        icon: 'pi-home',
        color: null,
        isDefault: false,
      },
      {
        id: 'cat-income-1',
        userId: 'u1',
        name: 'Salary',
        type: 'INCOME',
        icon: 'pi-briefcase',
        color: null,
        isDefault: false,
      },
    ],
  }),
}));

const mockUseCreate = vi.mocked(useCreateRule);
const mockUseUpdate = vi.mocked(useUpdateRule);

const existingRule: RecurringRule = {
  id: 'rule-1',
  userId: 'u1',
  kind: 'EXPENSE',
  amount: 1500,
  accountId: 'acc-1',
  categoryId: 'cat-expense-1',
  note: 'Monthly rent',
  frequency: 'MONTHLY',
  interval: 1,
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: null,
  anchorDay: 1,
  nextRunDate: '2026-07-01T00:00:00.000Z',
  lastRunDate: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  account: {
    id: 'acc-1',
    userId: 'u1',
    name: 'DBS Bank',
    type: 'BANK',
    balance: 5000,
    icon: null,
    color: null,
    createdAt: '',
    updatedAt: '',
  },
  category: {
    id: 'cat-expense-1',
    userId: 'u1',
    name: 'Rent',
    icon: 'pi-home',
    color: null,
    type: 'EXPENSE',
    isDefault: false,
  },
};

function makeCreateMock(overrides = {}) {
  return {
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useCreateRule>;
}

function makeUpdateMock(overrides = {}) {
  return {
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useUpdateRule>;
}

describe('RecurringRuleModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreate.mockReturnValue(makeCreateMock());
    mockUseUpdate.mockReturnValue(makeUpdateMock());
  });

  it('renders nothing when open is false', () => {
    render(<RecurringRuleModal open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders "New recurring rule" heading in create mode', () => {
    render(<RecurringRuleModal open={true} onClose={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: 'New recurring rule' })
    ).toBeInTheDocument();
  });

  it('renders "Edit recurring rule" heading in edit mode', () => {
    render(
      <RecurringRuleModal open={true} onClose={vi.fn()} rule={existingRule} />
    );
    expect(
      screen.getByRole('heading', { name: 'Edit recurring rule' })
    ).toBeInTheDocument();
  });

  it('renders Expense and Income kind toggle buttons', () => {
    render(<RecurringRuleModal open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Expense' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Income' })).toBeInTheDocument();
  });

  it('renders all four frequency buttons', () => {
    render(<RecurringRuleModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Yearly')).toBeInTheDocument();
  });

  it('renders the amount input with placeholder', () => {
    render(<RecurringRuleModal open={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
  });

  it('renders expense categories from useCategories', () => {
    render(<RecurringRuleModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Rent')).toBeInTheDocument();
  });

  it('does not render income categories when kind is Expense', () => {
    render(<RecurringRuleModal open={true} onClose={vi.fn()} />);
    expect(screen.queryByText('Salary')).not.toBeInTheDocument();
  });

  it('renders income categories when Income kind is selected', async () => {
    const user = userEvent.setup();
    render(<RecurringRuleModal open={true} onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Income' }));
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('renders accounts from useAccounts', () => {
    render(<RecurringRuleModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText('DBS Bank')).toBeInTheDocument();
  });

  it('shows "Create rule" submit button in create mode', () => {
    render(<RecurringRuleModal open={true} onClose={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Create rule' })
    ).toBeInTheDocument();
  });

  it('shows "Save changes" submit button in edit mode', () => {
    render(
      <RecurringRuleModal open={true} onClose={vi.fn()} rule={existingRule} />
    );
    expect(
      screen.getByRole('button', { name: 'Save changes' })
    ).toBeInTheDocument();
  });

  it('pre-fills amount field with existing rule amount in edit mode', () => {
    render(
      <RecurringRuleModal open={true} onClose={vi.fn()} rule={existingRule} />
    );
    const amountInput = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    expect(amountInput.value).toBe('1500');
  });

  it('calls createRule.mutateAsync and onClose on successful submit', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();
    mockUseCreate.mockReturnValue(makeCreateMock({ mutateAsync }));

    render(<RecurringRuleModal open={true} onClose={onClose} />);
    await user.type(screen.getByPlaceholderText('0.00'), '100');
    await user.click(screen.getByRole('button', { name: 'Create rule' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('passes amount and kind to createRule.mutateAsync', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseCreate.mockReturnValue(makeCreateMock({ mutateAsync }));

    render(<RecurringRuleModal open={true} onClose={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('0.00'), '250');
    await user.click(screen.getByRole('button', { name: 'Create rule' }));

    await waitFor(() => {
      const [payload] = mutateAsync.mock.calls[0];
      expect(payload).toMatchObject({ amount: 250, kind: 'EXPENSE' });
    });
  });

  it('calls updateRule.mutateAsync with {id, values} in edit mode', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();
    mockUseUpdate.mockReturnValue(makeUpdateMock({ mutateAsync }));

    render(
      <RecurringRuleModal open={true} onClose={onClose} rule={existingRule} />
    );
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledOnce();
      const [calledWith] = mutateAsync.mock.calls[0];
      expect(calledWith).toMatchObject({ id: 'rule-1' });
      expect(calledWith.values).toMatchObject({
        amount: 1500,
        kind: 'EXPENSE',
      });
    });
  });

  it('does not call createRule in edit mode', async () => {
    const user = userEvent.setup();
    const createMutateAsync = vi.fn().mockResolvedValue({});
    mockUseCreate.mockReturnValue(
      makeCreateMock({ mutateAsync: createMutateAsync })
    );

    render(
      <RecurringRuleModal open={true} onClose={vi.fn()} rule={existingRule} />
    );
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(createMutateAsync).not.toHaveBeenCalled();
    });
  });

  it('shows an error banner when the mutation fails', () => {
    mockUseCreate.mockReturnValue(
      makeCreateMock({ isError: true, error: new Error('Rule already exists') })
    );
    render(<RecurringRuleModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Rule already exists')).toBeInTheDocument();
  });

  it('disables the submit button while the mutation is pending', () => {
    mockUseCreate.mockReturnValue(makeCreateMock({ isPending: true }));
    render(<RecurringRuleModal open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  });

  it('calls onClose when the × close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <RecurringRuleModal open={true} onClose={onClose} />
    );
    const closeIcon = container.querySelector('.pi.pi-times');
    await user.click(closeIcon!.closest('button')!);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
