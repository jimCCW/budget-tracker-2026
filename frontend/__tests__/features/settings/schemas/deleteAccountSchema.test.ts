import { describe, it, expect } from 'vitest';
import { deleteAccountSchema } from '@/features/settings/schemas/deleteAccountSchema';

describe('deleteAccountSchema', () => {
  it('accepts a non-empty password', () => {
    expect(
      deleteAccountSchema.safeParse({ password: 'MyPassw0rd!' }).success
    ).toBe(true);
  });

  it('rejects an empty password', () => {
    const result = deleteAccountSchema.safeParse({ password: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password is required');
    }
  });
});
