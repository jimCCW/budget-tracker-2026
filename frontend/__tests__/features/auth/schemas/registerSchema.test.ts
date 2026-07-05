import { describe, it, expect } from 'vitest';
import { registerSchema } from '@/features/auth/schemas/registerSchema';

const valid = {
  name: 'Alice',
  firstName: 'Alice',
  lastName: 'Anderson',
  email: 'alice@example.com',
  password: 'Pass1word!',
  confirmPassword: 'Pass1word!',
  terms: true as const,
};

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = registerSchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Full name is required');
    }
  });

  it('rejects empty firstName', () => {
    const result = registerSchema.safeParse({ ...valid, firstName: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('First name is required');
    }
  });

  it('rejects empty lastName', () => {
    const result = registerSchema.safeParse({ ...valid, lastName: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Last name is required');
    }
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: 'Ab1!',
      confirmPassword: 'Ab1!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/8/);
    }
  });

  it('rejects password without a number', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: 'NoNumber!',
      confirmPassword: 'NoNumber!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without a special character', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: 'NoSpecial1',
      confirmPassword: 'NoSpecial1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      ...valid,
      confirmPassword: 'Different1!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Passwords don't match");
    }
  });

  it('rejects when terms not accepted', () => {
    const result = registerSchema.safeParse({ ...valid, terms: false });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'You must accept the terms to continue'
      );
    }
  });
});
