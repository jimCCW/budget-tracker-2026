import { createAccountSchema, updateAccountSchema } from '../../src/schemas/accountSchemas';

describe('createAccountSchema', () => {
  it('accepts minimal valid account', () => {
    expect(createAccountSchema.safeParse({ name: 'DBS' }).success).toBe(true);
  });

  it('accepts all account types', () => {
    const types = ['BANK', 'INVESTMENT', 'CRYPTO', 'CASH', 'CREDIT'];
    for (const type of types) {
      expect(createAccountSchema.safeParse({ name: 'Acc', type }).success).toBe(true);
    }
  });

  it('accepts optional fields', () => {
    expect(
      createAccountSchema.safeParse({
        name: 'DBS',
        type: 'BANK',
        balance: 1000,
        icon: 'pi-bank',
        color: '#123456',
      }).success
    ).toBe(true);
  });

  it('rejects empty name', () => {
    const r = createAccountSchema.safeParse({ name: '' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toBe('Name is required');
  });

  it('rejects name over 60 characters', () => {
    const r = createAccountSchema.safeParse({ name: 'a'.repeat(61) });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toMatch(/60/);
  });

  it('rejects invalid account type', () => {
    expect(createAccountSchema.safeParse({ name: 'Acc', type: 'SAVINGS' }).success).toBe(false);
  });
});

describe('updateAccountSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    expect(updateAccountSchema.safeParse({}).success).toBe(true);
  });

  it('accepts partial update', () => {
    expect(updateAccountSchema.safeParse({ balance: 5000 }).success).toBe(true);
  });

  it('rejects empty name when name is provided', () => {
    expect(updateAccountSchema.safeParse({ name: '' }).success).toBe(false);
  });
});
