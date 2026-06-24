import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { todayISO } from '@/lib/dateUtils';

describe('todayISO', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns today as YYYY-MM-DD', () => {
    vi.setSystemTime(new Date('2026-06-21T15:30:00.000Z'));
    expect(todayISO()).toBe('2026-06-21');
  });

  it('zero-pads single-digit months and days', () => {
    vi.setSystemTime(new Date('2026-03-05T00:00:00.000Z'));
    expect(todayISO()).toBe('2026-03-05');
  });
});
