import { describe, it, expect } from 'vitest';
import { resetPasswordSchema } from '@/features/auth/schemas/resetPasswordSchema';

describe('resetPasswordSchema', () => {
  it('accepts matching strong passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Secure1!',
      confirmPassword: 'Secure1!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when passwords do not match', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Secure1!',
      confirmPassword: 'Different1!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmErr = result.error.issues.find(
        (i) => i.path[0] === 'confirmPassword'
      );
      expect(confirmErr?.message).toBe("Passwords don't match");
    }
  });

  it('rejects a weak password', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'short',
      confirmPassword: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Use at least 8 characters');
    }
  });

  it('rejects empty confirmPassword', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Secure1!',
      confirmPassword: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmErr = result.error.issues.find(
        (i) => i.path[0] === 'confirmPassword'
      );
      expect(confirmErr).toBeDefined();
    }
  });
});
