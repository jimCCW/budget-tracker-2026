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

vi.mock('@/features/dashboard/components/IncomeExpenseChart', () => ({
  IncomeExpenseChart: () => <div data-testid='income-expense-chart' />,
}));

vi.mock('@/features/dashboard/components/CategoryDonutChart', () => ({
  CategoryDonutChart: () => <div data-testid='category-donut-chart' />,
}));

vi.mock('@/features/dashboard/components/BudgetProgressSection', () => ({
  BudgetProgressSection: () => <div data-testid='budget-progress' />,
}));

vi.mock('@/features/dashboard/components/RecentActivityCard', () => ({
  RecentActivityCard: () => <div data-testid='recent-activity' />,
}));

vi.mock('@/features/dashboard/components/GoalsCard', () => ({
  GoalsCard: () => <div data-testid='goals-card' />,
}));

describe('DashboardPage', () => {
  it('renders without crashing', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Hi, Alex')).toBeInTheDocument();
  });

  it('renders four stat cards', () => {
    render(<DashboardPage />);
    const cards = screen.getAllByTestId('stat-card');
    expect(cards).toHaveLength(4);
  });

  it('renders the Balance stat card', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Balance')).toBeInTheDocument();
  });

  it('renders Income and Expenses stat cards', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Income · May')).toBeInTheDocument();
    expect(screen.getByText('Expenses · May')).toBeInTheDocument();
  });

  it('renders chart and activity sections', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('income-expense-chart')).toBeInTheDocument();
    expect(screen.getByTestId('category-donut-chart')).toBeInTheDocument();
    expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
  });
});
