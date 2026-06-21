import { describe, it, expect } from 'vitest';
import { categorySchema } from '@/features/categories/schemas/categorySchema';

describe('categorySchema', () => {
  it('accepts valid EXPENSE category', () => {
    expect(
      categorySchema.safeParse({ name: 'Food', type: 'EXPENSE' }).success
    ).toBe(true);
  });

  it('accepts valid INCOME category', () => {
    expect(
      categorySchema.safeParse({ name: 'Salary', type: 'INCOME' }).success
    ).toBe(true);
  });

  it('accepts optional icon and color', () => {
    expect(
      categorySchema.safeParse({
        name: 'Transport',
        type: 'EXPENSE',
        icon: 'pi-car',
        color: '#ff0000',
      }).success
    ).toBe(true);
  });

  it('rejects empty name', () => {
    const result = categorySchema.safeParse({ name: '', type: 'EXPENSE' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name is required');
    }
  });

  it('rejects name over 50 characters', () => {
    const result = categorySchema.safeParse({
      name: 'a'.repeat(51),
      type: 'EXPENSE',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/50/);
    }
  });

  it('rejects invalid type', () => {
    const result = categorySchema.safeParse({ name: 'Food', type: 'OTHER' });
    expect(result.success).toBe(false);
  });

  it('rejects missing type', () => {
    const result = categorySchema.safeParse({ name: 'Food' });
    expect(result.success).toBe(false);
  });
});
