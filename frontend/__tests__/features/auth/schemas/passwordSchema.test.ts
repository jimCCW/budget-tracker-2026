import { describe, it, expect } from 'vitest';
import { passwordSchema } from '@/features/auth/schemas/passwordSchema';

describe('passwordSchema', () => {
  it('accepts a strong password', () => {
    const result = passwordSchema.safeParse('Secure1!');
    expect(result.success).toBe(true);
  });

  it('rejects passwords shorter than 8 characters', () => {
    const result = passwordSchema.safeParse('Ab1!');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Use at least 8 characters');
    }
  });

  it('rejects passwords with no letters', () => {
    const result = passwordSchema.safeParse('12345678!');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Must contain at least one letter'
      );
    }
  });

  it('rejects passwords with no digits', () => {
    const result = passwordSchema.safeParse('Password!');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Must contain at least one number'
      );
    }
  });

  it('rejects passwords with no special characters', () => {
    const result = passwordSchema.safeParse('Password1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Must contain at least one special character'
      );
    }
  });
});
