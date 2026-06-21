import { describe, it, expect } from 'vitest';
import { expenseSchema } from '@/features/expenses/schemas/expenseSchema';

const valid = {
  accountId: 'acc-1',
  categoryId: 'cat-1',
  amount: 50.5,
  date: '2026-06-01',
};

describe('expenseSchema', () => {
  it('accepts valid expense', () => {
    expect(expenseSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional description', () => {
    expect(
      expenseSchema.safeParse({ ...valid, description: 'Lunch' }).success
    ).toBe(true);
  });

  it('accepts when description is omitted', () => {
    expect(expenseSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing accountId', () => {
    const result = expenseSchema.safeParse({ ...valid, accountId: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Account is required');
    }
  });

  it('rejects missing categoryId', () => {
    const result = expenseSchema.safeParse({ ...valid, categoryId: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Category is required');
    }
  });

  it('rejects zero amount', () => {
    const result = expenseSchema.safeParse({ ...valid, amount: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Amount must be greater than 0'
      );
    }
  });

  it('rejects negative amount', () => {
    const result = expenseSchema.safeParse({ ...valid, amount: -5 });
    expect(result.success).toBe(false);
  });

  it('rejects description over 255 characters', () => {
    const result = expenseSchema.safeParse({
      ...valid,
      description: 'a'.repeat(256),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/255/);
    }
  });

  it('rejects missing date', () => {
    const result = expenseSchema.safeParse({ ...valid, date: '' });
    expect(result.success).toBe(false);
  });
});
