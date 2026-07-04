import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityFilterPanel } from '@/features/activity/components/ActivityFilterPanel';
import { useCategories } from '@/features/categories/hooks/useCategories';
import type { Category } from '@/types/category';
import type { ActivityFilters } from '@/features/activity/types/activity';

vi.mock('primereact/button', () => ({
  Button: ({
    onClick,
    children,
    pt,
  }: {
    onClick?: () => void;
    children?: React.ReactNode;
    pt?: { root?: { className?: string } };
  }) => (
    <button onClick={onClick} className={pt?.root?.className}>
      {children}
    </button>
  ),
}));

vi.mock('@/features/categories/hooks/useCategories');
const mockUseCategories = vi.mocked(useCategories);

const categories: Category[] = [
  {
    id: 'cat-1',
    userId: null,
    name: 'Food & Dining',
    icon: 'pi-shopping-cart',
    color: '#F59E0B',
    type: 'EXPENSE',
    isDefault: true,
  },
  {
    id: 'cat-2',
    userId: null,
    name: 'Salary',
    icon: 'pi-briefcase',
    color: '#10B981',
    type: 'INCOME',
    isDefault: true,
  },
];

const baseFilters: ActivityFilters = { type: 'ALL' };

function setup(
  overrides: Partial<React.ComponentProps<typeof ActivityFilterPanel>> = {}
) {
  const onTypeChange = vi.fn();
  const onCategoryChange = vi.fn();
  const onDatePresetChange = vi.fn();
  render(
    <ActivityFilterPanel
      filters={baseFilters}
      datePreset='month'
      onTypeChange={onTypeChange}
      onCategoryChange={onCategoryChange}
      onDatePresetChange={onDatePresetChange}
      {...overrides}
    />
  );
  return { onTypeChange, onCategoryChange, onDatePresetChange };
}

describe('ActivityFilterPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCategories.mockReturnValue({
      data: categories,
    } as ReturnType<typeof useCategories>);
  });

  it('renders all three Type options', () => {
    setup();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expense')).toBeInTheDocument();
  });

  it('highlights the active type option', () => {
    setup({ filters: { type: 'INCOME' } });
    expect(screen.getByText('Income')).toHaveClass('bg-primary-tint');
    expect(screen.getByText('All')).not.toHaveClass('bg-primary-tint');
  });

  it('renders "All categories" plus every category from both expense and income types', () => {
    setup();
    expect(screen.getByText('All categories')).toBeInTheDocument();
    expect(screen.getByText('Food & Dining')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('highlights "All categories" when no categoryId filter is set', () => {
    setup();
    expect(screen.getByText('All categories')).toHaveClass('bg-primary-tint');
  });

  it('highlights the selected category', () => {
    setup({ filters: { type: 'ALL', categoryId: 'cat-2' } });
    expect(screen.getByText('Salary')).toHaveClass('bg-primary-tint');
    expect(screen.getByText('All categories')).not.toHaveClass(
      'bg-primary-tint'
    );
  });

  it('renders all 5 date range presets', () => {
    setup();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
    expect(screen.getByText('This month')).toBeInTheDocument();
    expect(screen.getByText('Last 3 months')).toBeInTheDocument();
    expect(screen.getByText('All time')).toBeInTheDocument();
  });

  it('highlights the active date preset', () => {
    setup({ datePreset: 'week' });
    expect(screen.getByText('This week')).toHaveClass('bg-primary-tint');
    expect(screen.getByText('This month')).not.toHaveClass('bg-primary-tint');
  });

  it('calls onTypeChange with the clicked type', async () => {
    const user = userEvent.setup();
    const { onTypeChange } = setup();
    await user.click(screen.getByText('Expense'));
    expect(onTypeChange).toHaveBeenCalledWith('EXPENSE');
  });

  it('calls onCategoryChange with undefined when "All categories" is clicked', async () => {
    const user = userEvent.setup();
    const { onCategoryChange } = setup({
      filters: { type: 'ALL', categoryId: 'cat-1' },
    });
    await user.click(screen.getByText('All categories'));
    expect(onCategoryChange).toHaveBeenCalledWith(undefined);
  });

  it('calls onCategoryChange with the category id when a category is clicked', async () => {
    const user = userEvent.setup();
    const { onCategoryChange } = setup();
    await user.click(screen.getByText('Salary'));
    expect(onCategoryChange).toHaveBeenCalledWith('cat-2');
  });

  it('calls onDatePresetChange with the clicked preset key', async () => {
    const user = userEvent.setup();
    const { onDatePresetChange } = setup();
    await user.click(screen.getByText('Last 3 months'));
    expect(onDatePresetChange).toHaveBeenCalledWith('3months');
  });

  it('renders no categories beyond "All categories" when useCategories returns none', () => {
    mockUseCategories.mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useCategories>);
    setup();
    expect(screen.getByText('All categories')).toBeInTheDocument();
    expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument();
  });
});
