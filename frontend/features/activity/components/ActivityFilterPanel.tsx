'use client';
import { Button } from 'primereact/button';
import { useCategories } from '@/features/categories/hooks/useCategories';
import {
  DATE_RANGE_PRESETS,
  type DateRangePreset,
} from '../utils/dateRangePresets';
import type { ActivityFilters } from '../types/activity';

type Props = {
  filters: ActivityFilters;
  datePreset: DateRangePreset;
  onTypeChange: (type: ActivityFilters['type']) => void;
  onCategoryChange: (categoryId: string | undefined) => void;
  onDatePresetChange: (preset: DateRangePreset) => void;
};

const TYPE_OPTIONS: { key: ActivityFilters['type']; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'INCOME', label: 'Income' },
  { key: 'EXPENSE', label: 'Expense' },
];

function FilterRow({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      pt={{
        root: {
          className: `w-full text-left px-3 py-2 rounded-md text-[13px] font-medium transition-colors truncate ${
            active
              ? 'bg-primary-tint text-primary font-bold'
              : 'text-text hover:bg-bg'
          }`,
        },
      }}
    >
      {label}
    </Button>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className='text-[10px] text-text-dim font-bold uppercase tracking-widest px-1 pb-2'>
        {title}
      </div>
      <div className='flex flex-col gap-0.5'>{children}</div>
    </div>
  );
}

export function ActivityFilterPanel({
  filters,
  datePreset,
  onTypeChange,
  onCategoryChange,
  onDatePresetChange,
}: Props) {
  const { data: categories = [] } = useCategories();

  return (
    <div className='bg-surface border border-border rounded-lg p-4 flex flex-col gap-5 h-fit'>
      <FilterSection title='Type'>
        {TYPE_OPTIONS.map((opt) => (
          <FilterRow
            key={opt.key}
            label={opt.label}
            active={filters.type === opt.key}
            onClick={() => onTypeChange(opt.key)}
          />
        ))}
      </FilterSection>

      <FilterSection title='Category'>
        <FilterRow
          label='All categories'
          active={!filters.categoryId}
          onClick={() => onCategoryChange(undefined)}
        />
        {categories.map((cat) => (
          <FilterRow
            key={cat.id}
            label={cat.name}
            active={filters.categoryId === cat.id}
            onClick={() => onCategoryChange(cat.id)}
          />
        ))}
      </FilterSection>

      <FilterSection title='Date Range'>
        {DATE_RANGE_PRESETS.map((preset) => (
          <FilterRow
            key={preset.key}
            label={preset.label}
            active={datePreset === preset.key}
            onClick={() => onDatePresetChange(preset.key)}
          />
        ))}
      </FilterSection>
    </div>
  );
}
