import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getDateGroup,
  groupNotifications,
  formatRelativeTime,
  formatDateTime,
  resolveIcon,
  TYPE_CONFIG,
} from '@/features/notifications/utils/notificationUtils';
import type { Notification } from '@/types/notification';

const NOW = new Date('2026-06-21T12:00:00.000Z');

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notif-1',
    type: 'EXPENSE_DEBITED',
    isRead: false,
    createdAt: NOW.toISOString(),
    recurringRule: null,
    ...overrides,
  } as Notification;
}

describe('getDateGroup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Today" for a timestamp from today', () => {
    expect(getDateGroup('2026-06-21T08:00:00.000Z')).toBe('Today');
  });

  it('returns "Yesterday" for a timestamp from yesterday', () => {
    expect(getDateGroup('2026-06-20T10:00:00.000Z')).toBe('Yesterday');
  });

  it('returns "This Week" for a timestamp 3 days ago', () => {
    expect(getDateGroup('2026-06-18T10:00:00.000Z')).toBe('This Week');
  });

  it('returns "Older" for a timestamp more than 6 days ago', () => {
    expect(getDateGroup('2026-06-10T10:00:00.000Z')).toBe('Older');
  });
});

describe('groupNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('groups notifications by date bucket', () => {
    const notifications = [
      makeNotification({ id: 'n1', createdAt: '2026-06-21T08:00:00.000Z' }),
      makeNotification({ id: 'n2', createdAt: '2026-06-20T10:00:00.000Z' }),
      makeNotification({ id: 'n3', createdAt: '2026-06-10T10:00:00.000Z' }),
    ];

    const groups = groupNotifications(notifications);

    expect(groups.get('Today')).toHaveLength(1);
    expect(groups.get('Today')![0].id).toBe('n1');
    expect(groups.get('Yesterday')).toHaveLength(1);
    expect(groups.get('Yesterday')![0].id).toBe('n2');
    expect(groups.get('Older')).toHaveLength(1);
    expect(groups.get('Older')![0].id).toBe('n3');
  });

  it('returns an empty map for an empty array', () => {
    expect(groupNotifications([])).toEqual(new Map());
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for timestamps less than 1 minute ago', () => {
    const iso = new Date(NOW.getTime() - 30_000).toISOString();
    expect(formatRelativeTime(iso)).toBe('Just now');
  });

  it('returns minutes ago for timestamps under 60 minutes', () => {
    const iso = new Date(NOW.getTime() - 15 * 60_000).toISOString();
    expect(formatRelativeTime(iso)).toBe('15m ago');
  });

  it('returns hours ago for timestamps under 24 hours', () => {
    const iso = new Date(NOW.getTime() - 3 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso)).toBe('3h ago');
  });

  it('returns formatted date for timestamps older than 24 hours', () => {
    expect(formatRelativeTime('2026-06-10T10:00:00.000Z')).toMatch(
      /Jun \d+, 2026/
    );
  });
});

describe('formatDateTime', () => {
  it('formats an ISO string as "MMM D, YYYY h:mm A"', () => {
    const result = formatDateTime('2026-06-21T14:30:00.000Z');
    expect(result).toMatch(/Jun 2[01], 2026/);
  });
});

describe('resolveIcon', () => {
  it('returns useStyle:true with inline styles when category has icon and color', () => {
    const notification = makeNotification({
      recurringRule: {
        category: { icon: 'pi-tag', color: '#FF5500' },
      } as Notification['recurringRule'],
    });

    const config = resolveIcon(notification);

    expect(config.useStyle).toBe(true);
    if (config.useStyle) {
      expect(config.icon).toBe('pi-tag');
      expect(config.bgStyle).toEqual({ backgroundColor: '#FF55001a' });
      expect(config.textStyle).toEqual({ color: '#FF5500' });
    }
  });

  it('returns useStyle:false with class names when no category icon/color', () => {
    const notification = makeNotification({
      type: 'EXPENSE_DEBITED',
      recurringRule: null,
    });

    const config = resolveIcon(notification);

    expect(config.useStyle).toBe(false);
    if (!config.useStyle) {
      expect(config.icon).toBe(TYPE_CONFIG.EXPENSE_DEBITED.icon);
      expect(config.bgClass).toBe(TYPE_CONFIG.EXPENSE_DEBITED.bg);
      expect(config.textClass).toBe(TYPE_CONFIG.EXPENSE_DEBITED.text);
    }
  });

  it('returns useStyle:false for INCOME_CREDITED type without category override', () => {
    const notification = makeNotification({
      type: 'INCOME_CREDITED',
      recurringRule: null,
    });

    const config = resolveIcon(notification);

    expect(config.useStyle).toBe(false);
    if (!config.useStyle) {
      expect(config.icon).toBe(TYPE_CONFIG.INCOME_CREDITED.icon);
    }
  });
});
