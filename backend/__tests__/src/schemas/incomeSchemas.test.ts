import { createIncomeSchema, updateIncomeSchema } from '../../../src/schemas/incomeSchemas';

const validCreate = {
  accountId: 'acc-1',
  categoryId: 'cat-1',
  amount: 3000,
  date: '2026-06-01',
};

describe('createIncomeSchema', () => {
  it('accepts valid income', () => {
    expect(createIncomeSchema.safeParse(validCreate).success).toBe(true);
  });

  it('accepts optional note', () => {
    expect(createIncomeSchema.safeParse({ ...validCreate, note: 'Salary' }).success).toBe(true);
  });

  it('rejects missing accountId', () => {
    const r = createIncomeSchema.safeParse({ ...validCreate, accountId: '' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toBe('Account is required');
  });

  it('rejects zero amount', () => {
    const r = createIncomeSchema.safeParse({ ...validCreate, amount: 0 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toBe('Amount must be greater than 0');
  });

  it('rejects invalid date', () => {
    const r = createIncomeSchema.safeParse({ ...validCreate, date: 'bad-date' });
    expect(r.success).toBe(false);
  });

  it('rejects note over 255 characters', () => {
    const r = createIncomeSchema.safeParse({ ...validCreate, note: 'n'.repeat(256) });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toMatch(/255/);
  });
});

describe('updateIncomeSchema', () => {
  it('accepts empty object', () => {
    expect(updateIncomeSchema.safeParse({}).success).toBe(true);
  });

  it('accepts partial update', () => {
    expect(updateIncomeSchema.safeParse({ amount: 5000 }).success).toBe(true);
  });

  it('rejects negative amount', () => {
    expect(updateIncomeSchema.safeParse({ amount: -100 }).success).toBe(false);
  });
});
