import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityPage } from '@/features/activity/components/ActivityPage';
import { useActivity } from '@/features/activity/hooks/useActivity';
import { useExportActivity } from '@/features/activity/hooks/useExportActivity';
import type { ActivityFilters } from '@/features/activity/types/activity';

vi.mock('@/components/AppShell', () => ({
  AppShell: ({
    title,
    subtitle,
    children,
  }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
  }) => (
    <div data-testid='app-shell'>
      <div data-testid='title'>{title}</div>
      <div data-testid='subtitle'>{subtitle}</div>
      {children}
    </div>
  ),
}));

type DataTableStubProps = {
  data: unknown[];
  pageIndex?: number;
  pageCount?: number;
  totalCount?: number;
  onPageChange?: (i: number) => void;
};

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({
    data,
    pageIndex,
    pageCount,
    totalCount,
    onPageChange,
  }: DataTableStubProps) => (
    <div data-testid='data-table'>
      <span data-testid='row-count'>{data.length}</span>
      <span data-testid='page-index'>{pageIndex}</span>
      <span data-testid='page-count'>{pageCount}</span>
      <span data-testid='total-count'>{totalCount}</span>
      <button onClick={() => onPageChange?.((pageIndex ?? 0) + 1)}>next</button>
      <button onClick={() => onPageChange?.((pageIndex ?? 0) - 1)}>prev</button>
    </div>
  ),
}));

vi.mock('@/features/activity/components/ActivityFilterPanel', () => ({
  ActivityFilterPanel: ({
    onTypeChange,
    onCategoryChange,
    onDatePresetChange,
  }: {
    onTypeChange: (t: ActivityFilters['type']) => void;
    onCategoryChange: (c: string | undefined) => void;
    onDatePresetChange: (p: string) => void;
  }) => (
    <div data-testid='filter-panel'>
      <button onClick={() => onTypeChange('INCOME')}>set-type-income</button>
      <button onClick={() => onCategoryChange('cat-9')}>set-category</button>
      <button onClick={() => onDatePresetChange('week')}>set-week</button>
    </div>
  ),
}));

vi.mock('@/features/activity/components/ActivitySearchExportBar', () => ({
  ActivitySearchExportBar: ({
    onSearchChange,
    onExport,
    exporting,
  }: {
    onSearchChange: (s: string) => void;
    onExport: () => void;
    exporting: boolean;
  }) => (
    <div data-testid='search-export-bar'>
      <span data-testid='exporting'>{String(exporting)}</span>
      <button onClick={() => onSearchChange('lunch')}>search-lunch</button>
      <button onClick={onExport}>export</button>
    </div>
  ),
}));

vi.mock('@/features/activity/hooks/useActivity');
vi.mock('@/features/activity/hooks/useExportActivity');

const mockUseActivity = vi.mocked(useActivity);
const mockUseExportActivity = vi.mocked(useExportActivity);

function makeActivityData(
  overrides: Partial<ReturnType<typeof useActivity>['data']> = {}
) {
  return {
    items: [],
    nextCursor: null,
    hasNextPage: false,
    total: 0,
    totalPages: 1,
    ...overrides,
  };
}

describe('ActivityPage', () => {
  const mutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseActivity.mockReturnValue({
      data: makeActivityData(),
    } as ReturnType<typeof useActivity>);
    mockUseExportActivity.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useExportActivity>);
  });

  it('renders inside AppShell with the Activity title', () => {
    render(<ActivityPage />);
    expect(screen.getByTestId('title')).toHaveTextContent('Activity');
  });

  it('shows the total transaction count in the subtitle', () => {
    mockUseActivity.mockReturnValue({
      data: makeActivityData({ total: 7 }),
    } as ReturnType<typeof useActivity>);
    render(<ActivityPage />);
    expect(screen.getByTestId('subtitle')).toHaveTextContent('7 transactions');
  });

  it('calls useActivity with type ALL and no cursor on first render', () => {
    render(<ActivityPage />);
    const [filters, cursor] = mockUseActivity.mock.calls[0];
    expect(filters.type).toBe('ALL');
    expect(filters.categoryId).toBeUndefined();
    expect(cursor).toBeNull();
  });

  it('defaults to the "month" date preset filter (start/end both set)', () => {
    render(<ActivityPage />);
    const [filters] = mockUseActivity.mock.calls[0];
    expect(filters.startDate).toBeDefined();
    expect(filters.endDate).toBeDefined();
  });

  it('passes total/totalPages from useActivity through to DataTable', () => {
    mockUseActivity.mockReturnValue({
      data: makeActivityData({ total: 25, totalPages: 3 }),
    } as ReturnType<typeof useActivity>);
    render(<ActivityPage />);
    expect(screen.getByTestId('total-count')).toHaveTextContent('25');
    expect(screen.getByTestId('page-count')).toHaveTextContent('3');
  });

  describe('filter changes reset pagination', () => {
    it('resets to page 0 and refetches with type INCOME when the type filter changes', async () => {
      const user = userEvent.setup();
      mockUseActivity.mockReturnValue({
        data: makeActivityData({
          totalPages: 5,
          nextCursor: 'c1',
          hasNextPage: true,
        }),
      } as ReturnType<typeof useActivity>);
      render(<ActivityPage />);

      await user.click(screen.getByText('next'));
      expect(screen.getByTestId('page-index')).toHaveTextContent('1');

      await user.click(screen.getByText('set-type-income'));
      expect(screen.getByTestId('page-index')).toHaveTextContent('0');

      const lastCall = mockUseActivity.mock.calls.at(-1)!;
      expect(lastCall[0].type).toBe('INCOME');
      expect(lastCall[1]).toBeNull();
    });

    it('resets to page 0 and refetches with the new categoryId when the category filter changes', async () => {
      const user = userEvent.setup();
      render(<ActivityPage />);
      await user.click(screen.getByText('set-category'));
      const lastCall = mockUseActivity.mock.calls.at(-1)!;
      expect(lastCall[0].categoryId).toBe('cat-9');
      expect(lastCall[1]).toBeNull();
    });

    it('resets to page 0 when the date preset changes', async () => {
      const user = userEvent.setup();
      render(<ActivityPage />);
      await user.click(screen.getByText('set-week'));
      const lastCall = mockUseActivity.mock.calls.at(-1)!;
      expect(lastCall[1]).toBeNull();
    });

    it('resets to page 0 and refetches with the search term when the search box changes', async () => {
      const user = userEvent.setup();
      render(<ActivityPage />);
      await user.click(screen.getByText('search-lunch'));
      const lastCall = mockUseActivity.mock.calls.at(-1)!;
      expect(lastCall[0].search).toBe('lunch');
      expect(lastCall[1]).toBeNull();
    });
  });

  describe('cursor-based pagination', () => {
    it('advances the page index and fetches with the next cursor when "next" is clicked', async () => {
      const user = userEvent.setup();
      mockUseActivity.mockReturnValue({
        data: makeActivityData({
          totalPages: 5,
          nextCursor: 'cursor-2',
          hasNextPage: true,
        }),
      } as ReturnType<typeof useActivity>);
      render(<ActivityPage />);

      await user.click(screen.getByText('next'));

      expect(screen.getByTestId('page-index')).toHaveTextContent('1');
      const lastCall = mockUseActivity.mock.calls.at(-1)!;
      expect(lastCall[1]).toBe('cursor-2');
    });

    it('reuses the already-known cursor (null) when navigating back to page 1', async () => {
      const user = userEvent.setup();
      mockUseActivity.mockReturnValue({
        data: makeActivityData({
          totalPages: 5,
          nextCursor: 'cursor-2',
          hasNextPage: true,
        }),
      } as ReturnType<typeof useActivity>);
      render(<ActivityPage />);

      await user.click(screen.getByText('next')); // page 0 -> 1, cursor-2 recorded
      await user.click(screen.getByText('prev')); // page 1 -> 0

      expect(screen.getByTestId('page-index')).toHaveTextContent('0');
      const lastCall = mockUseActivity.mock.calls.at(-1)!;
      expect(lastCall[1]).toBeNull();
    });
  });

  it('calls useExportActivity().mutate with the current filters when Export is clicked', async () => {
    const user = userEvent.setup();
    render(<ActivityPage />);
    await user.click(screen.getByText('export'));
    expect(mutate).toHaveBeenCalledOnce();
    const passedFilters = mutate.mock.calls[0][0] as ActivityFilters;
    expect(passedFilters.type).toBe('ALL');
  });

  it('shows the exporting state from useExportActivity on the search/export bar', () => {
    mockUseExportActivity.mockReturnValue({
      mutate,
      isPending: true,
    } as unknown as ReturnType<typeof useExportActivity>);
    render(<ActivityPage />);
    expect(screen.getByTestId('exporting')).toHaveTextContent('true');
  });
});
