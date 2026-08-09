import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignOutCard } from '@/features/settings/components/SignOutCard';
import { logout } from '@/lib/logout';

vi.mock('@/lib/logout', () => ({
  logout: vi.fn(),
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

const mockLogout = vi.mocked(logout);

describe('SignOutCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls logout() when the sign-out button is clicked', async () => {
    const user = userEvent.setup();
    mockLogout.mockResolvedValue(undefined);

    render(<SignOutCard />);
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it('disables the button while signing out', async () => {
    const user = userEvent.setup();
    let resolveLogout: () => void = () => {};
    mockLogout.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveLogout = resolve;
      })
    );

    render(<SignOutCard />);
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Signing out…' })
      ).toBeDisabled();
    });

    resolveLogout();
  });
});
