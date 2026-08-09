import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteAccountCard } from '@/features/settings/components/DeleteAccountCard';

vi.mock('@/features/settings/components/DeleteAccountModal', () => ({
  DeleteAccountModal: ({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid='delete-account-modal'>
        <button onClick={onClose}>close-modal</button>
      </div>
    ) : null,
}));

vi.mock('primereact/button', () => ({
  Button: ({ label, onClick }: { label?: string; onClick?: () => void }) => (
    <button onClick={onClick}>{label}</button>
  ),
}));

describe('DeleteAccountCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the danger-zone copy', () => {
    render(<DeleteAccountCard />);
    expect(screen.getByText('Danger zone')).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it('opens the delete-account modal when the button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteAccountCard />);

    expect(
      screen.queryByTestId('delete-account-modal')
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete account' }));

    await waitFor(() => {
      expect(screen.getByTestId('delete-account-modal')).toBeInTheDocument();
    });
  });
});
