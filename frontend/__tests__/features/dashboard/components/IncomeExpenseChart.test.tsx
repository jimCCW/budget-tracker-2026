import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IncomeExpenseChart } from '@/features/dashboard/components/IncomeExpenseChart';

vi.mock('primereact/skeleton', () => ({
  Skeleton: () => <div data-testid='skeleton' />,
}));

vi.mock('@/features/dashboard/hooks/useDashboardTrend');

import { useDashboardTrend } from '@/features/dashboard/hooks/useDashboardTrend';

const mockUseDashboardTrend = vi.mocked(useDashboardTrend);

const stubData = [{ month: 'May 26', income: 3000, expenses: 1200 }];

describe('IncomeExpenseChart', () => {
  it('fetches the trend for the default 1Y range', () => {
    mockUseDashboardTrend.mockReturnValue({
      data: stubData,
      isLoading: false,
    } as never);
    render(<IncomeExpenseChart />);
    expect(mockUseDashboardTrend).toHaveBeenCalledWith('1Y');
  });

  it('re-invokes the hook with the new range when a toggle is clicked', () => {
    mockUseDashboardTrend.mockReturnValue({
      data: stubData,
      isLoading: false,
    } as never);
    render(<IncomeExpenseChart />);

    fireEvent.click(screen.getByText('6M'));

    expect(mockUseDashboardTrend).toHaveBeenCalledWith('6M');
  });

  it('renders a skeleton while loading', () => {
    mockUseDashboardTrend.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never);
    render(<IncomeExpenseChart />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });
});
