import {
  createRuleSchema,
  updateRuleSchema,
  setActiveSchema,
} from '../../src/schemas/recurringSchemas';

const validCreate = {
  kind: 'EXPENSE' as const,
  amount: 100,
  accountId: 'acc-1',
  categoryId: 'cat-1',
  frequency: 'MONTHLY' as const,
  startDate: '2026-01-01',
};

describe('createRuleSchema', () => {
  it('accepts valid rule', () => {
    expect(createRuleSchema.safeParse(validCreate).success).toBe(true);
  });

  it('accepts INCOME kind', () => {
    expect(createRuleSchema.safeParse({ ...validCreate, kind: 'INCOME' }).success).toBe(true);
  });

  it('accepts all frequencies', () => {
    const freqs = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
    for (const frequency of freqs) {
      expect(createRuleSchema.safeParse({ ...validCreate, frequency }).success).toBe(true);
    }
  });

  it('accepts optional note and endDate', () => {
    expect(
      createRuleSchema.safeParse({ ...validCreate, note: 'Rent', endDate: '2027-01-01' }).success
    ).toBe(true);
  });

  it('rejects zero amount', () => {
    const r = createRuleSchema.safeParse({ ...validCreate, amount: 0 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toBe('Amount must be greater than 0');
  });

  it('rejects missing accountId', () => {
    const r = createRuleSchema.safeParse({ ...validCreate, accountId: '' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toBe('Account is required');
  });

  it('rejects invalid startDate', () => {
    const r = createRuleSchema.safeParse({ ...validCreate, startDate: 'bad-date' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid frequency', () => {
    expect(createRuleSchema.safeParse({ ...validCreate, frequency: 'HOURLY' }).success).toBe(false);
  });
});

describe('updateRuleSchema', () => {
  it('accepts empty object', () => {
    expect(updateRuleSchema.safeParse({}).success).toBe(true);
  });

  it('accepts partial update', () => {
    expect(updateRuleSchema.safeParse({ amount: 200, frequency: 'WEEKLY' }).success).toBe(true);
  });
});

describe('setActiveSchema', () => {
  it('accepts true', () => {
    expect(setActiveSchema.safeParse({ isActive: true }).success).toBe(true);
  });

  it('accepts false', () => {
    expect(setActiveSchema.safeParse({ isActive: false }).success).toBe(true);
  });

  it('rejects non-boolean', () => {
    expect(setActiveSchema.safeParse({ isActive: 'yes' }).success).toBe(false);
  });
});
