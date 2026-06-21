import { describe, it, expect } from 'vitest';
import { accountSchema } from '@/features/accounts/schemas/accountSchema';

const valid = {
  name: 'DBS Savings',
  type: 'BANK' as const,
  balance: 5000,
};

describe('accountSchema', () => {
  it('accepts valid account', () => {
    expect(accountSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts all valid account types', () => {
    const types = ['BANK', 'INVESTMENT', 'CRYPTO', 'CASH', 'CREDIT'] as const;
    for (const type of types) {
      expect(accountSchema.safeParse({ ...valid, type }).success).toBe(true);
    }
  });

  it('accepts zero and negative balance', () => {
    expect(accountSchema.safeParse({ ...valid, balance: 0 }).success).toBe(
      true
    );
    expect(accountSchema.safeParse({ ...valid, balance: -500 }).success).toBe(
      true
    );
  });

  it('accepts optional icon and color', () => {
    expect(
      accountSchema.safeParse({ ...valid, icon: 'pi-bank', color: '#123456' })
        .success
    ).toBe(true);
  });

  it('rejects empty name', () => {
    const result = accountSchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name is required');
    }
  });

  it('rejects name over 60 characters', () => {
    const result = accountSchema.safeParse({ ...valid, name: 'a'.repeat(61) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/60/);
    }
  });

  it('rejects invalid account type', () => {
    const result = accountSchema.safeParse({ ...valid, type: 'SAVINGS' });
    expect(result.success).toBe(false);
  });
});
