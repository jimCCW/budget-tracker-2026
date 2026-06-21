import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Notification } from '@/types/notification';
import type React from 'react';

dayjs.extend(relativeTime);

export const TYPE_CONFIG = {
  INCOME_CREDITED: {
    icon: 'pi-arrow-circle-down',
    bg: 'bg-success-tint',
    text: 'text-success',
  },
  EXPENSE_DEBITED: {
    icon: 'pi-refresh',
    bg: 'bg-primary-tint',
    text: 'text-primary',
  },
} as const;

export type IconConfig =
  | {
      useStyle: true;
      icon: string;
      bgStyle: React.CSSProperties;
      textStyle: React.CSSProperties;
    }
  | { useStyle: false; icon: string; bgClass: string; textClass: string };

export function resolveIcon(notification: Notification): IconConfig {
  const cat = notification.recurringRule?.category;
  if (cat?.icon && cat?.color) {
    return {
      useStyle: true,
      icon: cat.icon,
      bgStyle: { backgroundColor: cat.color + '1a' },
      textStyle: { color: cat.color },
    };
  }
  const cfg = TYPE_CONFIG[notification.type];
  return {
    useStyle: false,
    icon: cfg.icon,
    bgClass: cfg.bg,
    textClass: cfg.text,
  };
}

export const GROUP_ORDER = [
  'Today',
  'Yesterday',
  'This Week',
  'Older',
] as const;

export function getDateGroup(iso: string): string {
  const date = dayjs(iso);
  const today = dayjs().startOf('day');
  if (date >= today) return 'Today';
  if (date >= today.subtract(1, 'day')) return 'Yesterday';
  if (date >= today.subtract(6, 'day')) return 'This Week';
  return 'Older';
}

export function groupNotifications(
  notifications: Notification[]
): Map<string, Notification[]> {
  const map = new Map<string, Notification[]>();
  for (const n of notifications) {
    const group = getDateGroup(n.createdAt);
    if (!map.has(group)) map.set(group, []);
    map.get(group)!.push(n);
  }
  return map;
}

export function formatRelativeTime(iso: string): string {
  const date = dayjs(iso);
  const diffMins = dayjs().diff(date, 'minute');
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.format('MMM D, YYYY');
}

export function formatDateTime(iso: string): string {
  return dayjs(iso).format('MMM D, YYYY h:mm A');
}
