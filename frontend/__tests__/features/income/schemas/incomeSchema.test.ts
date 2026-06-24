import { describe, it, expect } from 'vitest';
import { incomeSchema } from '@/features/income/schemas/incomeSchema';

const valid = {
  accountId: 'acc-1',
  categoryId: 'cat-1',
  amount: 3000,
  date: '2026-06-01',
};

describe('incomeSchema', () => {
  it('accepts valid income', () => {
    expect(incomeSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional note', () => {
    expect(incomeSchema.safeParse({ ...valid, note: 'Salary' }).success).toBe(
      true
    );
  });

  it('rejects missing accountId', () => {
    const result = incomeSchema.safeParse({ ...valid, accountId: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Account is required');
    }
  });

  it('rejects missing categoryId', () => {
    const result = incomeSchema.safeParse({ ...valid, categoryId: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Category is required');
    }
  });

  it('rejects zero amount', () => {
    const result = incomeSchema.safeParse({ ...valid, amount: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Amount must be greater than 0'
      );
    }
  });

  it('rejects negative amount', () => {
    const result = incomeSchema.safeParse({ ...valid, amount: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects note over 255 characters', () => {
    const result = incomeSchema.safeParse({ ...valid, note: 'n'.repeat(256) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/255/);
    }
  });

  it('rejects missing date', () => {
    const result = incomeSchema.safeParse({ ...valid, date: '' });
    expect(result.success).toBe(false);
  });
});
