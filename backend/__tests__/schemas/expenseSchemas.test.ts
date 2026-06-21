import { createExpenseSchema, updateExpenseSchema } from '../../src/schemas/expenseSchemas';

const validCreate = {
  accountId: 'acc-1',
  categoryId: 'cat-1',
  amount: 50.5,
  date: '2026-06-01',
};

describe('createExpenseSchema', () => {
  it('accepts valid expense', () => {
    expect(createExpenseSchema.safeParse(validCreate).success).toBe(true);
  });

  it('accepts optional description', () => {
    expect(createExpenseSchema.safeParse({ ...validCreate, description: 'Lunch' }).success).toBe(true);
  });

  it('rejects missing accountId', () => {
    const r = createExpenseSchema.safeParse({ ...validCreate, accountId: '' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toBe('Account is required');
  });

  it('rejects missing categoryId', () => {
    const r = createExpenseSchema.safeParse({ ...validCreate, categoryId: '' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toBe('Category is required');
  });

  it('rejects zero amount', () => {
    const r = createExpenseSchema.safeParse({ ...validCreate, amount: 0 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toBe('Amount must be greater than 0');
  });

  it('rejects negative amount', () => {
    expect(createExpenseSchema.safeParse({ ...validCreate, amount: -5 }).success).toBe(false);
  });

  it('rejects invalid date string', () => {
    const r = createExpenseSchema.safeParse({ ...validCreate, date: 'not-a-date' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toMatch(/valid ISO date/i);
  });

  it('rejects description over 255 characters', () => {
    const r = createExpenseSchema.safeParse({ ...validCreate, description: 'a'.repeat(256) });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toMatch(/255/);
  });
});

describe('updateExpenseSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    expect(updateExpenseSchema.safeParse({}).success).toBe(true);
  });

  it('accepts partial update', () => {
    expect(updateExpenseSchema.safeParse({ amount: 100 }).success).toBe(true);
  });

  it('rejects negative amount', () => {
    expect(updateExpenseSchema.safeParse({ amount: -1 }).success).toBe(false);
  });
});
