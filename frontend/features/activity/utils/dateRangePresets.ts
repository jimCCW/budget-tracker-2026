import dayjs from 'dayjs';

export type DateRangePreset = 'today' | 'week' | 'month' | '3months' | 'all';

export const DATE_RANGE_PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: '3months', label: 'Last 3 months' },
  { key: 'all', label: 'All time' },
];

export function resolveDateRangePreset(preset: DateRangePreset): {
  startDate?: string;
  endDate?: string;
} {
  const now = dayjs();
  switch (preset) {
    case 'today':
      return {
        startDate: now.startOf('day').toISOString(),
        endDate: now.endOf('day').toISOString(),
      };
    case 'week':
      return {
        startDate: now.startOf('week').toISOString(),
        endDate: now.endOf('week').toISOString(),
      };
    case 'month':
      return {
        startDate: now.startOf('month').toISOString(),
        endDate: now.endOf('month').toISOString(),
      };
    case '3months':
      return {
        startDate: now.subtract(3, 'month').startOf('day').toISOString(),
        endDate: now.endOf('day').toISOString(),
      };
    case 'all':
    default:
      return {};
  }
}
