import dayjs from 'dayjs';
import type { ActivityItem } from '../types/activity';

export function resolveCategoryStyle(category: ActivityItem['category']) {
  const color = category.color ?? '#6b7280';
  return {
    background: color + '22',
    color,
  };
}

export function formatActivityDate(iso: string): string {
  const date = dayjs(iso);
  const today = dayjs().startOf('day');
  if (date.isSame(today, 'day')) return 'Today';
  if (date.isSame(today.subtract(1, 'day'), 'day')) return 'Yesterday';
  return date.format('MMM D');
}
