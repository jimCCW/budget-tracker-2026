import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SecuritySection } from '@/features/settings/components/SecuritySection';
import { useSessions } from '@/features/settings/hooks/useSessions';
import { useRevokeSession } from '@/features/settings/hooks/useRevokeSession';

vi.mock('@/features/settings/hooks/useSessions');
vi.mock('@/features/settings/hooks/useRevokeSession');

vi.mock('@/features/settings/components/ChangePasswordModal', () => ({
  ChangePasswordModal: ({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid='change-password-modal'>
        <button onClick={onClose}>close-modal</button>
      </div>
    ) : null,
}));

vi.mock('@/features/notifications/utils/notificationUtils', () => ({
  formatRelativeTime: () => '2h ago',
}));

vi.mock('primereact/button', () => ({
  Button: ({
    label,
    onClick,
    loading,
  }: {
    label?: string;
    onClick?: () => void;
    loading?: boolean;
  }) => (
    <button onClick={onClick} disabled={loading}>
      {label}
    </button>
  ),
}));

vi.mock('primereact/skeleton', () => ({
  Skeleton: () => <div data-testid='skeleton' />,
}));

const mockUseSessions = vi.mocked(useSessions);
const mockUseRevokeSession = vi.mocked(useRevokeSession);

const sessions = [
  {
    id: 'session-1',
    device: 'Chrome · Windows',
    createdAt: '2026-01-02T00:00:00.000Z',
    current: true,
  },
  {
    id: 'session-2',
    device: 'Safari · Mac',
    createdAt: '2026-01-01T00:00:00.000Z',
    current: false,
  },
];

function makeRevokeMutation(overrides = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    variables: undefined,
    ...overrides,
  } as unknown as ReturnType<typeof useRevokeSession>;
}

describe('SecuritySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRevokeSession.mockReturnValue(makeRevokeMutation());
  });

  it('shows loading skeletons while sessions are loading', () => {
    mockUseSessions.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useSessions>);

    render(<SecuritySection />);
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('lists each session with its device label', () => {
    mockUseSessions.mockReturnValue({
      data: sessions,
      isLoading: false,
    } as ReturnType<typeof useSessions>);

    render(<SecuritySection />);
    expect(screen.getByText('Chrome · Windows')).toBeInTheDocument();
    expect(screen.getByText('Safari · Mac')).toBeInTheDocument();
  });

  it('tags the current session and shows Revoke only for other sessions', () => {
    mockUseSessions.mockReturnValue({
      data: sessions,
      isLoading: false,
    } as ReturnType<typeof useSessions>);

    render(<SecuritySection />);
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Revoke' })).toHaveLength(1);
  });

  it('calls revokeMutation.mutate with the session id when Revoke is clicked', async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    mockUseSessions.mockReturnValue({
      data: sessions,
      isLoading: false,
    } as ReturnType<typeof useSessions>);
    mockUseRevokeSession.mockReturnValue(makeRevokeMutation({ mutate }));

    render(<SecuritySection />);
    await user.click(screen.getByRole('button', { name: 'Revoke' }));

    expect(mutate).toHaveBeenCalledWith('session-2');
  });

  it('opens the change-password modal when Change is clicked', async () => {
    const user = userEvent.setup();
    mockUseSessions.mockReturnValue({
      data: sessions,
      isLoading: false,
    } as ReturnType<typeof useSessions>);

    render(<SecuritySection />);
    expect(
      screen.queryByTestId('change-password-modal')
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Change' }));

    await waitFor(() => {
      expect(screen.getByTestId('change-password-modal')).toBeInTheDocument();
    });
  });
});
