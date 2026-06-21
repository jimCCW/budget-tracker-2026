import {
  registerSchema,
  loginSchema,
  activateSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../../src/schemas/authSchemas';

describe('registerSchema', () => {
  const valid = {
    email: 'user@example.com',
    password: 'Pass1word!',
    name: 'Alice',
  };

  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid email', () => {
    const r = registerSchema.safeParse({ ...valid, email: 'bad' });
    expect(r.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const r = registerSchema.safeParse({ ...valid, password: 'Ab1!' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toMatch(/8/);
  });

  it('rejects password without a number', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'NoNumber!' }).success).toBe(false);
  });

  it('rejects password without a special character', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'NoSpecial1' }).success).toBe(false);
  });

  it('rejects empty name', () => {
    const r = registerSchema.safeParse({ ...valid, name: '' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toBe('Full name is required');
  });
});

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'u@ex.com', password: 'pw' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'bad', password: 'pw' }).success).toBe(false);
  });

  it('rejects empty password', () => {
    const r = loginSchema.safeParse({ email: 'u@ex.com', password: '' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.errors[0].message).toBe('Password is required');
  });
});

describe('activateSchema', () => {
  it('accepts valid 5-digit code', () => {
    expect(activateSchema.safeParse({ email: 'u@ex.com', code: '12345' }).success).toBe(true);
  });

  it('rejects code with wrong length', () => {
    expect(activateSchema.safeParse({ email: 'u@ex.com', code: '123' }).success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'u@ex.com' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'bad' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  const valid = {
    email: 'u@ex.com',
    token: 'reset-token',
    password: 'NewPass1!',
  };

  it('accepts valid reset data', () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects empty token', () => {
    const r = resetPasswordSchema.safeParse({ ...valid, token: '' });
    expect(r.success).toBe(false);
  });

  it('rejects weak password', () => {
    expect(resetPasswordSchema.safeParse({ ...valid, password: 'weak' }).success).toBe(false);
  });
});
