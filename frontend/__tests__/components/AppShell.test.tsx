import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from '@/components/AppShell';
import { useSession } from 'next-auth/react';
import { logout } from '@/lib/logout';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('@/lib/logout', () => ({
  logout: vi.fn(),
}));

vi.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid='theme-toggle' />,
}));

vi.mock('@/features/transactions/components/AddTransactionModal', () => ({
  AddTransactionModal: () => null,
}));

vi.mock('@/features/recurring/hooks/useScheduledCatchup', () => ({
  useScheduledCatchup: () => {},
}));

vi.mock('@/features/notifications/hooks/useUnreadCount', () => ({
  useUnreadCount: () => ({ data: 0 }),
}));

vi.mock('primereact/button', () => ({
  Button: ({
    label,
    icon,
    onClick,
    'aria-label': ariaLabel,
  }: {
    label?: string;
    icon?: string;
    onClick?: () => void;
    'aria-label'?: string;
  }) => (
    <button onClick={onClick} aria-label={ariaLabel}>
      {icon && <i className={icon} />}
      {label}
    </button>
  ),
}));

const mockUseSession = vi.mocked(useSession);
const mockLogout = vi.mocked(logout);

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: {
        user: {
          firstName: 'Jane',
          lastName: 'Doe',
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      },
      status: 'authenticated',
    } as never);
  });

  it('links the desktop sidebar "Settings" item to /settings', () => {
    render(
      <AppShell title='Dashboard'>
        <div />
      </AppShell>
    );

    const settingsLinks = screen.getAllByRole('link', { name: /settings/i });
    expect(settingsLinks.some((el) => el.getAttribute('href') === '/settings')).toBe(
      true
    );
  });

  it('points the mobile bottom-nav tab to /settings', () => {
    render(
      <AppShell title='Dashboard'>
        <div />
      </AppShell>
    );

    const settingsLinks = screen.getAllByRole('link', {
      name: /settings/i,
    });
    // desktop sidebar + mobile tab both point to /settings
    const hrefs = settingsLinks.map((el) => el.getAttribute('href'));
    expect(hrefs.filter((h) => h === '/settings').length).toBeGreaterThanOrEqual(
      2
    );
  });

  it('does not render a "Profile" nav item', () => {
    render(
      <AppShell title='Dashboard'>
        <div />
      </AppShell>
    );

    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
  });

  it('calls the shared logout() helper when the sidebar sign-out button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AppShell title='Dashboard'>
        <div />
      </AppShell>
    );

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(mockLogout).toHaveBeenCalledOnce();
  });
});
