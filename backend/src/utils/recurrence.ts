import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { RecurrenceType } from '@prisma/client';

dayjs.extend(utc);

/**
 * Advances a date by one occurrence of the given frequency and interval.
 * For MONTHLY, the anchorDay is restored each month so a rule on the 31st
 * stays correct across shorter months (Jan 31 → Feb 28 → Mar 31).
 * @param current - The current occurrence date (UTC midnight).
 * @param frequency - DAILY, WEEKLY, or MONTHLY.
 * @param interval - Number of units to advance (e.g. 1 = every month, 2 = every 2 weeks).
 * @param anchorDay - The intended day-of-month for MONTHLY rules (1–31).
 * @returns The next occurrence date at UTC midnight.
 */
export function computeNextRunDate(
  current: Date,
  frequency: RecurrenceType,
  interval: number,
  anchorDay?: number | null
): Date {
  const d = dayjs.utc(current);

  if (frequency === 'DAILY') {
    return d.add(interval, 'day').startOf('day').toDate();
  }

  if (frequency === 'WEEKLY') {
    return d
      .add(interval * 7, 'day')
      .startOf('day')
      .toDate();
  }

  if (frequency === 'YEARLY') {
    const next = d.add(interval, 'year');
    const targetDay = Math.min(
      anchorDay ?? next.daysInMonth(),
      next.daysInMonth()
    );
    return next.date(targetDay).startOf('day').toDate();
  }

  // MONTHLY — restore the anchorDay so month-end clamping doesn't drift
  const next = d.add(interval, 'month');
  const targetDay = Math.min(
    anchorDay ?? next.daysInMonth(),
    next.daysInMonth()
  );
  return next.date(targetDay).startOf('day').toDate();
}

/**
 * Returns the first occurrence on or after the given startDate.
 * For MONTHLY rules, the anchorDay is the day-of-month from startDate.
 * @param startDate - The rule's start date.
 * @param frequency - DAILY, WEEKLY, or MONTHLY.
 * @returns The first run date at UTC midnight.
 */
export function firstRunDate(startDate: Date, frequency: RecurrenceType): Date {
  return dayjs.utc(startDate).startOf('day').toDate();
}
