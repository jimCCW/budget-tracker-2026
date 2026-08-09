import { describe, it, expect } from 'vitest';
import { changePasswordSchema } from '@/features/settings/schemas/changePasswordSchema';

const valid = {
  currentPassword: 'OldPassw0rd!',
  password: 'NewPassw0rd!23',
  confirmPassword: 'NewPassw0rd!23',
};

describe('changePasswordSchema', () => {
  it('accepts matching, strong passwords', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects when confirmPassword does not match', () => {
    const result = changePasswordSchema.safeParse({
      ...valid,
      confirmPassword: 'Different1!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Passwords don't match");
      expect(result.error.issues[0].path).toEqual(['confirmPassword']);
    }
  });

  it('rejects an empty currentPassword', () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, currentPassword: '' }).success
    ).toBe(false);
  });

  it('rejects a weak new password', () => {
    expect(
      changePasswordSchema.safeParse({
        ...valid,
        password: 'nospecial123',
        confirmPassword: 'nospecial123',
      }).success
    ).toBe(false);
  });
});
