import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';

vi.mock('@/components/AppShell', () => ({
  AppShell: ({
    children,
    title,
    subtitle,
  }: {
    children: React.ReactNode;
    title: string;
    subtitle: string;
  }) => (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/StatCard', () => ({
  StatCard: ({ label, value }: { label: string; value: string }) => (
    <div data-testid='stat-card'>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}));

vi.mock('primereact/skeleton', () => ({
  Skeleton: () => <div data-testid='skeleton' />,
}));

vi.mock('@/features/dashboard/components/IncomeExpenseChart', () => ({
  IncomeExpenseChart: () => <div data-testid='income-expense-chart' />,
}));

vi.mock('@/features/dashboard/components/CategoryDonutChart', () => ({
  CategoryDonutChart: () => <div data-testid='category-donut-chart' />,
}));

vi.mock('@/features/dashboard/components/RecentActivityCard', () => ({
  RecentActivityCard: () => <div data-testid='recent-activity' />,
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('@/features/dashboard/hooks/useDashboardSummary');

import { useSession } from 'next-auth/react';
import { useDashboardSummary } from '@/features/dashboard/hooks/useDashboardSummary';

const mockUseSession = vi.mocked(useSession);
const mockUseDashboardSummary = vi.mocked(useDashboardSummary);

const stubSummary = {
  balance: 5000,
  accountsCount: 2,
  income: { total: 3000, count: 2, trendPct: 5 },
  expense: { total: 1200, count: 8, trendPct: -3 },
  saved: { amount: 1800, pctOfIncome: 60 },
  categoryBreakdown: [
    { name: 'Food', icon: 'pi-cart', color: '#FF0000', value: 400 },
  ],
};

function setupMocks({
  isLoading = false,
  summary = stubSummary,
  userName = 'Alex Tan',
}: {
  isLoading?: boolean;
  summary?: typeof stubSummary | undefined;
  userName?: string | null;
} = {}) {
  mockUseSession.mockReturnValue({
    data: userName ? { user: { name: userName } } : null,
    status: 'authenticated',
  } as never);
  mockUseDashboardSummary.mockReturnValue({
    data: summary,
    isLoading,
  } as never);
}

describe('DashboardPage', () => {
  it("renders a greeting using the session user's first name", () => {
    setupMocks({ userName: 'Alex Tan' });
    render(<DashboardPage />);
    expect(screen.getByText('Hi, Alex')).toBeInTheDocument();
  });

  it('falls back to a generic greeting when there is no session name', () => {
    setupMocks({ userName: null });
    render(<DashboardPage />);
    expect(screen.getByText('Hi, there')).toBeInTheDocument();
  });

  it('renders four stat cards once loaded', () => {
    setupMocks();
    render(<DashboardPage />);
    expect(screen.getAllByTestId('stat-card')).toHaveLength(4);
  });

  it('renders the Balance stat card', () => {
    setupMocks();
    render(<DashboardPage />);
    expect(screen.getByText('Balance')).toBeInTheDocument();
  });

  it('renders chart and activity sections', () => {
    setupMocks();
    render(<DashboardPage />);
    expect(screen.getByTestId('income-expense-chart')).toBeInTheDocument();
    expect(screen.getByTestId('category-donut-chart')).toBeInTheDocument();
    expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
  });

  it('renders recent activity alone in its row (no goals card)', () => {
    setupMocks();
    render(<DashboardPage />);
    expect(screen.queryByTestId('goals-card')).not.toBeInTheDocument();
  });

  describe('loading state', () => {
    it('renders skeleton placeholders instead of stat cards while loading', () => {
      setupMocks({ isLoading: true, summary: undefined });
      render(<DashboardPage />);
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
      expect(screen.queryByTestId('stat-card')).not.toBeInTheDocument();
    });
  });
});
