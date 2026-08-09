import { describe, it, expect } from 'vitest';
import { updateProfileSchema } from '@/features/settings/schemas/updateProfileSchema';

describe('updateProfileSchema', () => {
  const valid = { firstName: 'Jane', lastName: 'Doe', name: 'Jane Q. Doe' };

  it('accepts a valid first name, last name, and full name', () => {
    expect(updateProfileSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an empty firstName', () => {
    const result = updateProfileSchema.safeParse({ ...valid, firstName: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('First name is required');
    }
  });

  it('rejects an empty lastName', () => {
    const result = updateProfileSchema.safeParse({ ...valid, lastName: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Last name is required');
    }
  });

  it('rejects an empty full name', () => {
    const result = updateProfileSchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Full name is required');
    }
  });

  it('trims the full name', () => {
    const result = updateProfileSchema.safeParse({
      ...valid,
      name: '  Jane Q. Doe  ',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('Jane Q. Doe');
  });

  it('rejects a full name over 80 characters', () => {
    const result = updateProfileSchema.safeParse({
      ...valid,
      name: 'a'.repeat(81),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/80/);
    }
  });
});
