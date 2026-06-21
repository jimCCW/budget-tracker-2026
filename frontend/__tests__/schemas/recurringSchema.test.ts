import { describe, it, expect } from 'vitest';
import { recurringSchema } from '@/features/recurring/schemas/recurringSchema';

const valid = {
  kind: 'EXPENSE' as const,
  amount: 100,
  accountId: 'acc-1',
  categoryId: 'cat-1',
  frequency: 'MONTHLY' as const,
  startDate: '2026-01-01',
};

describe('recurringSchema', () => {
  it('accepts valid recurring rule', () => {
    expect(recurringSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts INCOME kind', () => {
    expect(
      recurringSchema.safeParse({ ...valid, kind: 'INCOME' }).success
    ).toBe(true);
  });

  it('accepts all frequencies', () => {
    const freqs = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;
    for (const frequency of freqs) {
      expect(recurringSchema.safeParse({ ...valid, frequency }).success).toBe(
        true
      );
    }
  });

  it('accepts optional note and endDate', () => {
    expect(
      recurringSchema.safeParse({
        ...valid,
        note: 'Rent',
        endDate: '2027-01-01',
      }).success
    ).toBe(true);
  });

  it('rejects zero amount', () => {
    const result = recurringSchema.safeParse({ ...valid, amount: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Amount must be greater than 0'
      );
    }
  });

  it('rejects missing accountId', () => {
    const result = recurringSchema.safeParse({ ...valid, accountId: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Account is required');
    }
  });

  it('rejects missing startDate', () => {
    const result = recurringSchema.safeParse({ ...valid, startDate: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Start date is required');
    }
  });

  it('rejects invalid frequency', () => {
    const result = recurringSchema.safeParse({ ...valid, frequency: 'HOURLY' });
    expect(result.success).toBe(false);
  });

  it('rejects note over 255 characters', () => {
    const result = recurringSchema.safeParse({
      ...valid,
      note: 'n'.repeat(256),
    });
    expect(result.success).toBe(false);
  });
});
