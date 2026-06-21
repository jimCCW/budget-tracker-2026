import { createCategorySchema, updateCategorySchema } from '../../src/schemas/categorySchemas';

describe('createCategorySchema', () => {
  it('accepts valid category', () => {
    expect(createCategorySchema.safeParse({ name: 'Food', type: 'EXPENSE' }).success).toBe(true);
  });

  it('accepts without optional type', () => {
    expect(createCategorySchema.safeParse({ name: 'Food' }).success).toBe(true);
  });

  it('accepts optional icon and color', () => {
    expect(
      createCategorySchema.safeParse({ name: 'Food', icon: 'pi-tag', color: '#ff0000' }).success
    ).toBe(true);
  });

  it('rejects empty name', () => {
    const r = createCategorySchema.safeParse({ name: '' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toBe('Name is required');
  });

  it('rejects name over 50 characters', () => {
    const r = createCategorySchema.safeParse({ name: 'a'.repeat(51) });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toMatch(/50/);
  });

  it('rejects invalid type value', () => {
    expect(createCategorySchema.safeParse({ name: 'Food', type: 'OTHER' }).success).toBe(false);
  });
});

describe('updateCategorySchema', () => {
  it('accepts valid update data', () => {
    expect(updateCategorySchema.safeParse({ name: 'Transport' }).success).toBe(true);
  });
});
