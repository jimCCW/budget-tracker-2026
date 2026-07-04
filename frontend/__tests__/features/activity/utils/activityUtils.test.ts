import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolveCategoryStyle,
  formatActivityDate,
} from '@/features/activity/utils/activityUtils';
import type { ActivityItem } from '@/features/activity/types/activity';

const NOW = new Date('2026-06-21T12:00:00.000Z');

function makeCategory(
  overrides: Partial<ActivityItem['category']> = {}
): ActivityItem['category'] {
  return {
    id: 'cat-1',
    name: 'Food & Dining',
    icon: 'pi-shopping-cart',
    color: '#F59E0B',
    ...overrides,
  };
}

describe('resolveCategoryStyle', () => {
  it('derives a tinted background from the category color', () => {
    expect(resolveCategoryStyle(makeCategory({ color: '#F59E0B' }))).toEqual({
      background: '#F59E0B22',
      color: '#F59E0B',
    });
  });

  it('falls back to a neutral gray when color is null', () => {
    expect(resolveCategoryStyle(makeCategory({ color: null }))).toEqual({
      background: '#6b728022',
      color: '#6b7280',
    });
  });
});

describe('formatActivityDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Today" for a timestamp from today', () => {
    expect(formatActivityDate('2026-06-21T02:00:00.000Z')).toBe('Today');
  });

  it('returns "Yesterday" for a timestamp from yesterday', () => {
    expect(formatActivityDate('2026-06-20T10:00:00.000Z')).toBe('Yesterday');
  });

  it('returns a "MMM D" formatted date for anything older', () => {
    expect(formatActivityDate('2026-06-10T10:00:00.000Z')).toBe('Jun 10');
  });
});
