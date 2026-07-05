'use client';
import { useState, useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { ActivityFilterPanel } from './ActivityFilterPanel';
import { ActivitySearchExportBar } from './ActivitySearchExportBar';
import { activityColumns } from './activityColumns';
import { useActivity } from '../hooks/useActivity';
import { useExportActivity } from '../hooks/useExportActivity';
import {
  resolveDateRangePreset,
  type DateRangePreset,
} from '../utils/dateRangePresets';
import type { ActivityFilters } from '../types/activity';

type ActivityPageProps = {
  initialType?: ActivityFilters['type'];
  initialCategoryId?: string;
};

export function ActivityPage({
  initialType = 'ALL',
  initialCategoryId,
}: ActivityPageProps = {}) {
  const [type, setType] = useState<ActivityFilters['type']>(initialType);
  const [categoryId, setCategoryId] = useState<string | undefined>(
    initialCategoryId
  );
  const [datePreset, setDatePreset] = useState<DateRangePreset>('month');
  const [search, setSearch] = useState<string | undefined>(undefined);

  const [pageIndex, setPageIndex] = useState(0);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);

  const filters: ActivityFilters = useMemo(() => {
    const { startDate, endDate } = resolveDateRangePreset(datePreset);
    return { type, categoryId, startDate, endDate, search };
  }, [type, categoryId, datePreset, search]);

  const cursor = cursorStack[pageIndex] ?? null;
  const { data } = useActivity(filters, cursor);
  const exportMutation = useExportActivity();

  function resetPagination() {
    setPageIndex(0);
    setCursorStack([null]);
  }

  function handleTypeChange(next: ActivityFilters['type']) {
    setType(next);
    resetPagination();
  }

  function handleCategoryChange(next: string | undefined) {
    setCategoryId(next);
    resetPagination();
  }

  function handleDatePresetChange(next: DateRangePreset) {
    setDatePreset(next);
    resetPagination();
  }

  function handleSearchChange(next: string) {
    setSearch(next || undefined);
    resetPagination();
  }

  function handlePageChange(nextIndex: number) {
    if (nextIndex > pageIndex && data?.nextCursor !== undefined) {
      setCursorStack((prev) => {
        const copy = [...prev];
        copy[nextIndex] = data.nextCursor;
        return copy;
      });
    }
    setPageIndex(nextIndex);
  }

  return (
    <AppShell title='Activity' subtitle={`${data?.total ?? 0} transactions`}>
      <div className='grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 items-start'>
        <ActivityFilterPanel
          filters={filters}
          datePreset={datePreset}
          onTypeChange={handleTypeChange}
          onCategoryChange={handleCategoryChange}
          onDatePresetChange={handleDatePresetChange}
        />
        <div className='bg-surface border border-border rounded-lg p-4 flex flex-col gap-4'>
          <ActivitySearchExportBar
            onSearchChange={handleSearchChange}
            onExport={() => exportMutation.mutate(filters)}
            exporting={exportMutation.isPending}
          />
          <DataTable
            data={data?.items ?? []}
            columns={activityColumns}
            enablePagination
            manualPagination
            pageIndex={pageIndex}
            pageCount={data?.totalPages ?? 0}
            totalCount={data?.total}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </AppShell>
  );
}
