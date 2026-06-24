import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountFormModal } from '@/features/accounts/components/AccountFormModal';
import { useCreateAccount } from '@/features/accounts/hooks/useCreateAccount';
import { useUpdateAccount } from '@/features/accounts/hooks/useUpdateAccount';
import type { Account } from '@/types/account';

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

vi.mock('@/features/accounts/hooks/useCreateAccount');
vi.mock('@/features/accounts/hooks/useUpdateAccount');

const mockUseCreate = vi.mocked(useCreateAccount);
const mockUseUpdate = vi.mocked(useUpdateAccount);

const existingAccount: Account = {
  id: 'acc-1',
  userId: 'user-1',
  name: 'DBS Savings',
  type: 'BANK',
  balance: 5000,
  icon: null,
  color: '#6366F1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function makeCreateMock(overrides = {}) {
  return {
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useCreateAccount>;
}

function makeUpdateMock(overrides = {}) {
  return {
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useUpdateAccount>;
}

describe('AccountFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreate.mockReturnValue(makeCreateMock());
    mockUseUpdate.mockReturnValue(makeUpdateMock());
  });

  it('renders nothing when open is false', () => {
    render(<AccountFormModal open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders "New account" heading in create mode', () => {
    render(<AccountFormModal open={true} onClose={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: 'New account' })
    ).toBeInTheDocument();
  });

  it('renders "Edit account" heading in edit mode', () => {
    render(
      <AccountFormModal
        open={true}
        onClose={vi.fn()}
        account={existingAccount}
      />
    );
    expect(
      screen.getByRole('heading', { name: 'Edit account' })
    ).toBeInTheDocument();
  });

  it('renders buttons for all 5 account types', () => {
    render(<AccountFormModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Bank')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('Investment')).toBeInTheDocument();
    expect(screen.getByText('Crypto')).toBeInTheDocument();
    expect(screen.getByText('Credit Card')).toBeInTheDocument();
  });

  it('renders the name input with placeholder', () => {
    render(<AccountFormModal open={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText('e.g. DBS Savings')).toBeInTheDocument();
  });

  it('renders the balance input with placeholder', () => {
    render(<AccountFormModal open={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
  });

  it('pre-fills the name field with existing account name in edit mode', () => {
    render(
      <AccountFormModal
        open={true}
        onClose={vi.fn()}
        account={existingAccount}
      />
    );
    const nameInput = screen.getByPlaceholderText('e.g. DBS Savings');
    expect((nameInput as HTMLInputElement).value).toBe('DBS Savings');
  });

  it('shows "Create account" submit button in create mode', () => {
    render(<AccountFormModal open={true} onClose={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Create account' })
    ).toBeInTheDocument();
  });

  it('shows "Save changes" submit button in edit mode', () => {
    render(
      <AccountFormModal
        open={true}
        onClose={vi.fn()}
        account={existingAccount}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Save changes' })
    ).toBeInTheDocument();
  });

  it('calls createMutation.mutateAsync and onClose on successful submit', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();
    mockUseCreate.mockReturnValue(makeCreateMock({ mutateAsync }));

    render(<AccountFormModal open={true} onClose={onClose} />);

    await user.type(screen.getByPlaceholderText('e.g. DBS Savings'), 'My Bank');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('passes the account name to createMutation.mutateAsync', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseCreate.mockReturnValue(makeCreateMock({ mutateAsync }));

    render(<AccountFormModal open={true} onClose={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('e.g. DBS Savings'), 'My Bank');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      const [calledWith] = mutateAsync.mock.calls[0];
      expect(calledWith).toMatchObject({ name: 'My Bank' });
    });
  });

  it('calls updateMutation.mutateAsync with {id, values} in edit mode', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();
    mockUseUpdate.mockReturnValue(makeUpdateMock({ mutateAsync }));

    render(
      <AccountFormModal
        open={true}
        onClose={onClose}
        account={existingAccount}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledOnce();
      const [calledWith] = mutateAsync.mock.calls[0];
      expect(calledWith).toMatchObject({ id: 'acc-1' });
      expect(calledWith.values).toMatchObject({ name: 'DBS Savings' });
    });
  });

  it('does not call createMutation in edit mode', async () => {
    const user = userEvent.setup();
    const createMutateAsync = vi.fn().mockResolvedValue({});
    mockUseCreate.mockReturnValue(
      makeCreateMock({ mutateAsync: createMutateAsync })
    );

    render(
      <AccountFormModal
        open={true}
        onClose={vi.fn()}
        account={existingAccount}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(createMutateAsync).not.toHaveBeenCalled();
    });
  });

  it('shows an error banner when the mutation fails', () => {
    mockUseCreate.mockReturnValue(
      makeCreateMock({ isError: true, error: new Error('Account name taken') })
    );

    render(<AccountFormModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Account name taken')).toBeInTheDocument();
  });

  it('disables the submit button while the mutation is pending', () => {
    mockUseCreate.mockReturnValue(makeCreateMock({ isPending: true }));

    render(<AccountFormModal open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Creating…' })).toBeDisabled();
  });

  it('calls onClose when the close (×) button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AccountFormModal open={true} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
