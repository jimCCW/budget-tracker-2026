import {
  computeNextRunDate,
  firstRunDate,
} from '../../../src/utils/recurrence';

describe('computeNextRunDate', () => {
  describe('DAILY', () => {
    it('advances by interval days and returns UTC midnight', () => {
      const current = new Date('2026-03-15T00:00:00.000Z');
      const result = computeNextRunDate(current, 'DAILY', 1);
      expect(result.toISOString()).toBe('2026-03-16T00:00:00.000Z');
    });

    it('advances by multiple days when interval > 1', () => {
      const current = new Date('2026-03-15T00:00:00.000Z');
      const result = computeNextRunDate(current, 'DAILY', 3);
      expect(result.toISOString()).toBe('2026-03-18T00:00:00.000Z');
    });
  });

  describe('WEEKLY', () => {
    it('advances by 7 days for interval=1', () => {
      const current = new Date('2026-03-15T00:00:00.000Z');
      const result = computeNextRunDate(current, 'WEEKLY', 1);
      expect(result.toISOString()).toBe('2026-03-22T00:00:00.000Z');
    });

    it('advances by 14 days for interval=2', () => {
      const current = new Date('2026-03-15T00:00:00.000Z');
      const result = computeNextRunDate(current, 'WEEKLY', 2);
      expect(result.toISOString()).toBe('2026-03-29T00:00:00.000Z');
    });
  });

  describe('MONTHLY', () => {
    it('advances by one month for a normal date', () => {
      const current = new Date('2026-03-15T00:00:00.000Z');
      const result = computeNextRunDate(current, 'MONTHLY', 1, 15);
      expect(result.toISOString()).toBe('2026-04-15T00:00:00.000Z');
    });

    it('clamps to Feb 28 when anchorDay=31 in a non-leap year', () => {
      const current = new Date('2026-01-31T00:00:00.000Z');
      const result = computeNextRunDate(current, 'MONTHLY', 1, 31);
      expect(result.toISOString()).toBe('2026-02-28T00:00:00.000Z');
    });

    it('restores to 31 in March after clamping in February', () => {
      const clamped = new Date('2026-02-28T00:00:00.000Z');
      const result = computeNextRunDate(clamped, 'MONTHLY', 1, 31);
      expect(result.toISOString()).toBe('2026-03-31T00:00:00.000Z');
    });

    it('advances by multiple months when interval > 1', () => {
      const current = new Date('2026-01-15T00:00:00.000Z');
      const result = computeNextRunDate(current, 'MONTHLY', 3, 15);
      expect(result.toISOString()).toBe('2026-04-15T00:00:00.000Z');
    });
  });

  describe('YEARLY', () => {
    it('advances by one year for a normal date', () => {
      const current = new Date('2026-06-15T00:00:00.000Z');
      const result = computeNextRunDate(current, 'YEARLY', 1, 15);
      expect(result.toISOString()).toBe('2027-06-15T00:00:00.000Z');
    });

    it('clamps Feb 29 to Feb 28 in a non-leap year', () => {
      const current = new Date('2024-02-29T00:00:00.000Z');
      const result = computeNextRunDate(current, 'YEARLY', 1, 29);
      expect(result.toISOString()).toBe('2025-02-28T00:00:00.000Z');
    });

    it('restores Feb 29 in the next leap year', () => {
      const current = new Date('2024-02-29T00:00:00.000Z');
      const result = computeNextRunDate(current, 'YEARLY', 4, 29);
      expect(result.toISOString()).toBe('2028-02-29T00:00:00.000Z');
    });
  });
});

describe('firstRunDate', () => {
  it('returns UTC midnight of the given date', () => {
    const start = new Date('2026-03-15T14:30:00.000Z');
    const result = firstRunDate(start, 'MONTHLY');
    expect(result.toISOString()).toBe('2026-03-15T00:00:00.000Z');
  });

  it('preserves the date for any frequency', () => {
    const start = new Date('2026-07-01T00:00:00.000Z');
    expect(firstRunDate(start, 'DAILY').toISOString()).toBe(
      '2026-07-01T00:00:00.000Z'
    );
    expect(firstRunDate(start, 'WEEKLY').toISOString()).toBe(
      '2026-07-01T00:00:00.000Z'
    );
    expect(firstRunDate(start, 'YEARLY').toISOString()).toBe(
      '2026-07-01T00:00:00.000Z'
    );
  });
});
