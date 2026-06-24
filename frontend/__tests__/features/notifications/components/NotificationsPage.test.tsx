import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationsPage } from '@/features/notifications/components/NotificationsPage';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { useUnreadCount } from '@/features/notifications/hooks/useUnreadCount';
import { useMarkAllAsRead } from '@/features/notifications/hooks/useMarkAllAsRead';
import type { Notification } from '@/types/notification';

vi.mock('@/components/AppShell', () => ({
  AppShell: ({
    children,
  }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
  }) => <div data-testid='app-shell'>{children}</div>,
}));

vi.mock('primereact/button', () => ({
  Button: ({
    onClick,
    disabled,
    children,
  }: {
    onClick?: () => void;
    disabled?: boolean;
    children?: React.ReactNode;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock('primereact/skeleton', () => ({
  Skeleton: () => <div data-testid='skeleton' />,
}));

vi.mock('@/features/notifications/hooks/useNotifications');
vi.mock('@/features/notifications/hooks/useUnreadCount');
vi.mock('@/features/notifications/hooks/useMarkAllAsRead');

vi.mock('@/features/notifications/components/NotificationDetailModal', () => ({
  NotificationDetailModal: ({
    notification,
    onClose,
  }: {
    notification: Notification | null;
    onClose: () => void;
  }) =>
    notification ? (
      <div data-testid='detail-modal'>
        <p>{notification.title}</p>
        <button onClick={onClose}>Close modal</button>
      </div>
    ) : null,
}));

const mockUseNotifications = vi.mocked(useNotifications);
const mockUseUnreadCount = vi.mocked(useUnreadCount);
const mockUseMarkAllAsRead = vi.mocked(useMarkAllAsRead);

const makeNotification = (
  overrides: Partial<Notification> = {}
): Notification => ({
  id: 'n1',
  recurringRuleId: 'rule-1',
  type: 'EXPENSE_DEBITED',
  title: 'Rent processed',
  body: 'Your rent of $1,500 has been processed.',
  isRead: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

function setupMocks({
  notifications = [] as Notification[],
  isLoading = false,
  unreadCount = 0,
  hasNextPage = false,
} = {}) {
  mockUseNotifications.mockReturnValue({
    data: { pages: [{ notifications, nextCursor: null }] },
    isLoading,
    isFetchingNextPage: false,
    hasNextPage,
    fetchNextPage: vi.fn(),
  } as ReturnType<typeof useNotifications>);

  mockUseUnreadCount.mockReturnValue({
    data: unreadCount,
  } as ReturnType<typeof useUnreadCount>);

  mockUseMarkAllAsRead.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as ReturnType<typeof useMarkAllAsRead>);
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn().mockImplementation(
        class {
          observe = vi.fn();
          disconnect = vi.fn();
          unobserve = vi.fn();
        }
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('loading state', () => {
    it('renders skeleton placeholders while loading', () => {
      setupMocks({ isLoading: true, notifications: [] });
      render(<NotificationsPage />);
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });

    it('does not render empty state while loading', () => {
      setupMocks({ isLoading: true, notifications: [] });
      render(<NotificationsPage />);
      expect(screen.queryByText(/all caught up/i)).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders the empty state when there are no notifications', () => {
      setupMocks({ notifications: [] });
      render(<NotificationsPage />);
      expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    });

    it('does not render the Mark all read button when there are no notifications', () => {
      setupMocks({ notifications: [] });
      render(<NotificationsPage />);
      expect(screen.queryByText(/Mark all read/)).not.toBeInTheDocument();
    });
  });

  describe('notifications list', () => {
    it('renders a notification title', () => {
      setupMocks({ notifications: [makeNotification()] });
      render(<NotificationsPage />);
      expect(screen.getByText('Rent processed')).toBeInTheDocument();
    });

    it('renders a notification body excerpt', () => {
      setupMocks({ notifications: [makeNotification()] });
      render(<NotificationsPage />);
      expect(
        screen.getByText('Your rent of $1,500 has been processed.')
      ).toBeInTheDocument();
    });

    it("renders a date group heading for today's notifications", () => {
      setupMocks({ notifications: [makeNotification()] });
      render(<NotificationsPage />);
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('renders multiple notifications', () => {
      setupMocks({
        notifications: [
          makeNotification({ id: 'n1', title: 'Rent processed' }),
          makeNotification({ id: 'n2', title: 'Salary credited' }),
        ],
      });
      render(<NotificationsPage />);
      expect(screen.getByText('Rent processed')).toBeInTheDocument();
      expect(screen.getByText('Salary credited')).toBeInTheDocument();
    });

    it('shows the unread dot indicator for unread notifications', () => {
      setupMocks({ notifications: [makeNotification({ isRead: false })] });
      const { container } = render(<NotificationsPage />);
      expect(
        container.querySelector('.bg-primary.rounded-full')
      ).toBeInTheDocument();
    });

    it('does not show the unread dot for read notifications', () => {
      setupMocks({ notifications: [makeNotification({ isRead: true })] });
      const { container } = render(<NotificationsPage />);
      expect(
        container.querySelector('.bg-primary.rounded-full')
      ).not.toBeInTheDocument();
    });
  });

  describe('Mark all read button', () => {
    it('renders when there are notifications', () => {
      setupMocks({ notifications: [makeNotification()], unreadCount: 1 });
      render(<NotificationsPage />);
      expect(screen.getByText(/Mark all read/)).toBeInTheDocument();
    });

    it('is disabled when unreadCount is 0', () => {
      setupMocks({ notifications: [makeNotification()], unreadCount: 0 });
      render(<NotificationsPage />);
      const btn = screen.getByRole('button', { name: /Mark all read/ });
      expect(btn).toBeDisabled();
    });

    it('is enabled when unreadCount is greater than 0', () => {
      setupMocks({ notifications: [makeNotification()], unreadCount: 1 });
      render(<NotificationsPage />);
      const btn = screen.getByRole('button', { name: /Mark all read/ });
      expect(btn).not.toBeDisabled();
    });

    it('calls markAllAsRead when clicked', async () => {
      const user = userEvent.setup();
      const mutate = vi.fn();
      mockUseMarkAllAsRead.mockReturnValue({
        mutate,
        isPending: false,
      } as ReturnType<typeof useMarkAllAsRead>);
      setupMocks({ notifications: [makeNotification()], unreadCount: 1 });
      // re-set after setupMocks
      mockUseMarkAllAsRead.mockReturnValue({
        mutate,
        isPending: false,
      } as ReturnType<typeof useMarkAllAsRead>);

      render(<NotificationsPage />);
      await user.click(screen.getByRole('button', { name: /Mark all read/ }));
      expect(mutate).toHaveBeenCalledOnce();
    });
  });

  describe('notification detail modal', () => {
    it('does not show the detail modal initially', () => {
      setupMocks({ notifications: [makeNotification()] });
      render(<NotificationsPage />);
      expect(screen.queryByTestId('detail-modal')).not.toBeInTheDocument();
    });

    it('opens the detail modal when a notification card is clicked', async () => {
      const user = userEvent.setup();
      setupMocks({
        notifications: [makeNotification({ title: 'Rent processed' })],
      });
      render(<NotificationsPage />);

      await user.click(screen.getByText('Rent processed'));
      expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
    });

    it('shows the clicked notification title inside the detail modal', async () => {
      const user = userEvent.setup();
      setupMocks({
        notifications: [makeNotification({ title: 'Rent processed' })],
      });
      render(<NotificationsPage />);

      await user.click(screen.getByText('Rent processed'));
      expect(screen.getByTestId('detail-modal')).toHaveTextContent(
        'Rent processed'
      );
    });

    it('closes the detail modal when onClose is called', async () => {
      const user = userEvent.setup();
      setupMocks({
        notifications: [makeNotification({ title: 'Rent processed' })],
      });
      render(<NotificationsPage />);

      await user.click(screen.getByText('Rent processed'));
      expect(screen.getByTestId('detail-modal')).toBeInTheDocument();

      await user.click(screen.getByText('Close modal'));
      expect(screen.queryByTestId('detail-modal')).not.toBeInTheDocument();
    });
  });
});
