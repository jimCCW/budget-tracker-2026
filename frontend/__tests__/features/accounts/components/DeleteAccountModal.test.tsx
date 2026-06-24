import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteAccountModal } from '@/features/accounts/components/DeleteAccountModal';
import { useDeleteAccount } from '@/features/accounts/hooks/useDeleteAccount';
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
    label,
    onClick,
    disabled,
    loading,
  }: {
    label?: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled || loading}>
      {label}
    </button>
  ),
}));

vi.mock('@/features/accounts/hooks/useDeleteAccount');

const mockUseDeleteAccount = vi.mocked(useDeleteAccount);

const account: Account = {
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

describe('DeleteAccountModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDeleteAccount.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    } as ReturnType<typeof useDeleteAccount>);
  });

  it('renders nothing when open is false', () => {
    render(
      <DeleteAccountModal open={false} onClose={vi.fn()} account={account} />
    );
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders the account name in the confirmation message', () => {
    render(
      <DeleteAccountModal open={true} onClose={vi.fn()} account={account} />
    );
    expect(screen.getByText('DBS Savings')).toBeInTheDocument();
  });

  it('renders the "Delete account?" heading', () => {
    render(
      <DeleteAccountModal open={true} onClose={vi.fn()} account={account} />
    );
    expect(
      screen.getByRole('heading', { name: 'Delete account?' })
    ).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <DeleteAccountModal open={true} onClose={onClose} account={account} />
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls mutateAsync with the account id and then onClose when Delete is clicked', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();
    mockUseDeleteAccount.mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    } as ReturnType<typeof useDeleteAccount>);

    render(
      <DeleteAccountModal open={true} onClose={onClose} account={account} />
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith('acc-1');
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('disables the Delete button while the mutation is pending', () => {
    mockUseDeleteAccount.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
      isError: false,
      error: null,
      reset: vi.fn(),
    } as ReturnType<typeof useDeleteAccount>);

    render(
      <DeleteAccountModal open={true} onClose={vi.fn()} account={account} />
    );
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
  });

  it('shows an error message when the mutation fails', () => {
    mockUseDeleteAccount.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error('Network error'),
      reset: vi.fn(),
    } as ReturnType<typeof useDeleteAccount>);

    render(
      <DeleteAccountModal open={true} onClose={vi.fn()} account={account} />
    );
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('shows a generic error message for non-Error errors', () => {
    mockUseDeleteAccount.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: true,
      error: 'unknown' as unknown as Error,
      reset: vi.fn(),
    } as ReturnType<typeof useDeleteAccount>);

    render(
      <DeleteAccountModal open={true} onClose={vi.fn()} account={account} />
    );
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });
});
