import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteAccountModal } from '@/features/settings/components/DeleteAccountModal';
import { useDeleteAccount } from '@/features/settings/hooks/useDeleteAccount';
import { signOut } from 'next-auth/react';

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
    onClose: () => void;
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
  }: {
    type?: 'button' | 'submit' | 'reset';
    label?: string;
    icon?: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    'aria-label'?: string;
  }) => (
    <button
      type={type ?? 'button'}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
    >
      {icon && <i className={icon} />}
      {label}
    </button>
  ),
}));

vi.mock('primereact/password', () => ({
  Password: ({
    value,
    onChange,
    onBlur,
    inputRef,
    placeholder,
    autoComplete,
  }: {
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    onBlur: React.FocusEventHandler<HTMLInputElement>;
    inputRef: React.Ref<HTMLInputElement>;
    placeholder: string;
    autoComplete?: string;
  }) => (
    <input
      ref={inputRef}
      type='password'
      value={value ?? ''}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      autoComplete={autoComplete}
    />
  ),
}));

vi.mock('@/features/settings/hooks/useDeleteAccount');
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

const mockUseDeleteAccount = vi.mocked(useDeleteAccount);
const mockSignOut = vi.mocked(signOut);

function makeMutation(overrides = {}) {
  return {
    mutateAsync: vi.fn().mockResolvedValue({ deleted: true }),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useDeleteAccount>;
}

describe('DeleteAccountModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDeleteAccount.mockReturnValue(makeMutation());
  });

  it('renders nothing when closed', () => {
    render(<DeleteAccountModal open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders the password field and warning copy when open', () => {
    render(<DeleteAccountModal open={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText('Current password')).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it('shows a validation error when submitted with no password', async () => {
    const user = userEvent.setup();
    render(<DeleteAccountModal open={true} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Delete my account' }));

    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('deletes the account then signs out on successful submit', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({ deleted: true });
    mockUseDeleteAccount.mockReturnValue(makeMutation({ mutateAsync }));

    render(<DeleteAccountModal open={true} onClose={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText('Current password'),
      'MyPassw0rd!'
    );
    await user.click(screen.getByRole('button', { name: 'Delete my account' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ password: 'MyPassw0rd!' });
      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
    });
  });

  it('shows an error banner when deletion fails', () => {
    mockUseDeleteAccount.mockReturnValue(
      makeMutation({
        isError: true,
        error: new Error('Password is incorrect.'),
      })
    );

    render(<DeleteAccountModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Password is incorrect.')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<DeleteAccountModal open={true} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
