import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationDetailModal } from '@/features/notifications/components/NotificationDetailModal';
import { useMarkAsRead } from '@/features/notifications/hooks/useMarkAsRead';
import { formatDateTime } from '@/features/notifications/utils/notificationUtils';
import type { Notification } from '@/types/notification';

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
    onClick,
    children,
    'aria-label': ariaLabel,
  }: {
    onClick?: () => void;
    children?: React.ReactNode;
    'aria-label'?: string;
  }) => (
    <button onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

vi.mock('@/features/notifications/hooks/useMarkAsRead');

const mockUseMarkAsRead = vi.mocked(useMarkAsRead);

const unreadNotification: Notification = {
  id: 'n1',
  recurringRuleId: 'rule-1',
  type: 'EXPENSE_DEBITED',
  title: 'Rent processed',
  body: 'Your rent of $1,500 has been processed.',
  isRead: false,
  createdAt: '2026-06-21T10:00:00.000Z',
};

const readNotification: Notification = {
  ...unreadNotification,
  id: 'n2',
  isRead: true,
};

const notificationWithCategory: Notification = {
  ...unreadNotification,
  id: 'n3',
  recurringRule: {
    category: { icon: 'pi-home', color: '#10B981' },
  },
};

describe('NotificationDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMarkAsRead.mockReturnValue({
      mutate: vi.fn(),
    } as ReturnType<typeof useMarkAsRead>);
  });

  it('returns null when notification is null', () => {
    render(<NotificationDetailModal notification={null} onClose={vi.fn()} />);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders the notification title', () => {
    render(
      <NotificationDetailModal
        notification={unreadNotification}
        onClose={vi.fn()}
      />
    );
    expect(
      screen.getByRole('heading', { name: 'Rent processed' })
    ).toBeInTheDocument();
  });

  it('renders the notification body', () => {
    render(
      <NotificationDetailModal
        notification={unreadNotification}
        onClose={vi.fn()}
      />
    );
    expect(
      screen.getByText('Your rent of $1,500 has been processed.')
    ).toBeInTheDocument();
  });

  it('renders the formatted creation date', () => {
    render(
      <NotificationDetailModal
        notification={unreadNotification}
        onClose={vi.fn()}
      />
    );
    expect(
      screen.getByText(formatDateTime(unreadNotification.createdAt))
    ).toBeInTheDocument();
  });

  it('calls markAsRead on mount for an unread notification', async () => {
    const mutate = vi.fn();
    mockUseMarkAsRead.mockReturnValue({
      mutate,
    } as ReturnType<typeof useMarkAsRead>);

    render(
      <NotificationDetailModal
        notification={unreadNotification}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith('n1');
    });
  });

  it('does not call markAsRead for an already-read notification', async () => {
    const mutate = vi.fn();
    mockUseMarkAsRead.mockReturnValue({
      mutate,
    } as ReturnType<typeof useMarkAsRead>);

    render(
      <NotificationDetailModal
        notification={readNotification}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(mutate).not.toHaveBeenCalled();
    });
  });

  it('calls onClose when the × button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <NotificationDetailModal
        notification={unreadNotification}
        onClose={onClose}
      />
    );
    // First close button (header ×)
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the footer Close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <NotificationDetailModal
        notification={unreadNotification}
        onClose={onClose}
      />
    );
    await user.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('uses the default type icon when notification has no category', () => {
    const { container } = render(
      <NotificationDetailModal
        notification={unreadNotification}
        onClose={vi.fn()}
      />
    );
    // EXPENSE_DEBITED → pi-refresh
    expect(container.querySelector('.pi-refresh')).toBeInTheDocument();
  });

  it('uses the category icon when notification has a recurringRule with category', () => {
    const { container } = render(
      <NotificationDetailModal
        notification={notificationWithCategory}
        onClose={vi.fn()}
      />
    );
    expect(container.querySelector('.pi-home')).toBeInTheDocument();
  });

  it('applies inline color style when using category icon', () => {
    const { container } = render(
      <NotificationDetailModal
        notification={notificationWithCategory}
        onClose={vi.fn()}
      />
    );
    const iconWrapper = container.querySelector('.w-12.h-12') as HTMLElement;
    expect(iconWrapper.style.color).toBeTruthy();
  });
});
