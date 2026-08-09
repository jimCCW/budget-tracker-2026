import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangePasswordModal } from '@/features/settings/components/ChangePasswordModal';
import { useChangePassword } from '@/features/settings/hooks/useChangePassword';

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

vi.mock('@/features/settings/hooks/useChangePassword');
vi.mock('@/lib/logout', () => ({
  logout: vi.fn(),
}));

import { logout } from '@/lib/logout';

const mockUseChangePassword = vi.mocked(useChangePassword);
const mockLogout = vi.mocked(logout);

function makeMutation(overrides = {}) {
  return {
    mutateAsync: vi.fn().mockResolvedValue({ message: 'ok' }),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useChangePassword>;
}

describe('ChangePasswordModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChangePassword.mockReturnValue(makeMutation());
  });

  it('renders nothing when closed', () => {
    render(<ChangePasswordModal open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders all three password fields when open', () => {
    render(<ChangePasswordModal open={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText('Current password')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('New password (8+ characters)')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Confirm new password')
    ).toBeInTheDocument();
  });

  it('shows a validation error when the new passwords do not match', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordModal open={true} onClose={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText('Current password'),
      'OldPassw0rd!'
    );
    await user.type(
      screen.getByPlaceholderText('New password (8+ characters)'),
      'NewPassw0rd!23'
    );
    await user.type(
      screen.getByPlaceholderText('Confirm new password'),
      'Different1!'
    );
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });
  });

  it('calls mutateAsync then logs the user out on successful submit', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({ message: 'ok' });
    mockUseChangePassword.mockReturnValue(makeMutation({ mutateAsync }));

    render(<ChangePasswordModal open={true} onClose={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText('Current password'),
      'OldPassw0rd!'
    );
    await user.type(
      screen.getByPlaceholderText('New password (8+ characters)'),
      'NewPassw0rd!23'
    );
    await user.type(
      screen.getByPlaceholderText('Confirm new password'),
      'NewPassw0rd!23'
    );
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        currentPassword: 'OldPassw0rd!',
        password: 'NewPassw0rd!23',
        confirmPassword: 'NewPassw0rd!23',
      });
      expect(mockLogout).toHaveBeenCalledOnce();
    });
  });

  it('shows an error banner when the current password is wrong', () => {
    mockUseChangePassword.mockReturnValue(
      makeMutation({
        isError: true,
        error: new Error('Current password is incorrect.'),
      })
    );

    render(<ChangePasswordModal open={true} onClose={vi.fn()} />);
    expect(
      screen.getByText('Current password is incorrect.')
    ).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ChangePasswordModal open={true} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
