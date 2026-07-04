import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import dayjs from 'dayjs';
import {
  DATE_RANGE_PRESETS,
  resolveDateRangePreset,
} from '@/features/activity/utils/dateRangePresets';

const NOW = new Date('2026-06-21T12:00:00.000Z');

describe('DATE_RANGE_PRESETS', () => {
  it('lists the 5 expected presets in order', () => {
    expect(DATE_RANGE_PRESETS.map((p) => p.key)).toEqual([
      'today',
      'week',
      'month',
      '3months',
      'all',
    ]);
  });

  it('gives each preset a human-readable label', () => {
    expect(DATE_RANGE_PRESETS.map((p) => p.label)).toEqual([
      'Today',
      'This week',
      'This month',
      'Last 3 months',
      'All time',
    ]);
  });
});

describe('resolveDateRangePreset', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the start/end of today for "today"', () => {
    const result = resolveDateRangePreset('today');
    expect(result).toEqual({
      startDate: dayjs(NOW).startOf('day').toISOString(),
      endDate: dayjs(NOW).endOf('day').toISOString(),
    });
  });

  it('returns the start/end of the week for "week"', () => {
    const result = resolveDateRangePreset('week');
    expect(result).toEqual({
      startDate: dayjs(NOW).startOf('week').toISOString(),
      endDate: dayjs(NOW).endOf('week').toISOString(),
    });
  });

  it('returns the start/end of the month for "month"', () => {
    const result = resolveDateRangePreset('month');
    expect(result).toEqual({
      startDate: dayjs(NOW).startOf('month').toISOString(),
      endDate: dayjs(NOW).endOf('month').toISOString(),
    });
  });

  it('returns 3 months ago through end of today for "3months"', () => {
    const result = resolveDateRangePreset('3months');
    expect(result).toEqual({
      startDate: dayjs(NOW).subtract(3, 'month').startOf('day').toISOString(),
      endDate: dayjs(NOW).endOf('day').toISOString(),
    });
  });

  it('returns no date bounds for "all"', () => {
    expect(resolveDateRangePreset('all')).toEqual({});
  });
});
