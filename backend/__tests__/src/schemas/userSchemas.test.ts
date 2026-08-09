import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '../../../src/schemas/userSchemas';

describe('updateProfileSchema', () => {
  const valid = { firstName: 'Jane', lastName: 'Doe', name: 'Jane Q. Doe' };

  it('accepts a valid first name, last name, and full name', () => {
    expect(updateProfileSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an empty firstName', () => {
    const r = updateProfileSchema.safeParse({ ...valid, firstName: '' });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(r.error.errors[0].message).toBe('First name is required');
  });

  it('rejects an empty lastName', () => {
    const r = updateProfileSchema.safeParse({ ...valid, lastName: '' });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(r.error.errors[0].message).toBe('Last name is required');
  });

  it('rejects an empty full name', () => {
    const r = updateProfileSchema.safeParse({ ...valid, name: '' });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(r.error.errors[0].message).toBe('Full name is required');
  });

  it('trims the full name', () => {
    const r = updateProfileSchema.safeParse({
      ...valid,
      name: '  Jane Q. Doe  ',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe('Jane Q. Doe');
  });

  it('rejects a full name over 80 characters', () => {
    const r = updateProfileSchema.safeParse({ ...valid, name: 'a'.repeat(81) });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toMatch(/80/);
  });
});

describe('deleteAccountSchema', () => {
  it('accepts a non-empty password', () => {
    expect(
      deleteAccountSchema.safeParse({ password: 'MyPassw0rd!' }).success
    ).toBe(true);
  });

  it('rejects an empty password', () => {
    const r = deleteAccountSchema.safeParse({ password: '' });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(r.error.errors[0].message).toBe('Password is required');
  });
});

describe('changePasswordSchema', () => {
  const valid = {
    currentPassword: 'OldPassw0rd!',
    password: 'NewPassw0rd!23',
    confirmPassword: 'NewPassw0rd!23',
  };

  it('accepts matching, strong passwords', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects when confirmPassword does not match', () => {
    const r = changePasswordSchema.safeParse({
      ...valid,
      confirmPassword: 'Different1!',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.errors[0].message).toBe("Passwords don't match");
      expect(r.error.errors[0].path).toEqual(['confirmPassword']);
    }
  });

  it('rejects an empty currentPassword', () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, currentPassword: '' }).success
    ).toBe(false);
  });

  it('rejects a weak new password (no special character)', () => {
    expect(
      changePasswordSchema.safeParse({
        ...valid,
        password: 'NoSpecial123',
        confirmPassword: 'NoSpecial123',
      }).success
    ).toBe(false);
  });

  it('rejects a new password under 8 characters', () => {
    expect(
      changePasswordSchema.safeParse({
        ...valid,
        password: 'Sh0rt!',
        confirmPassword: 'Sh0rt!',
      }).success
    ).toBe(false);
  });
});
