import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(
    /[^a-zA-Z0-9]/,
    'Password must contain at least one special character'
  );

export const registerSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: passwordSchema,
  name: z.string().min(1, 'Full name is required'),
});

export const activateSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  code: z.string().length(5, 'Code must be 5 digits'),
});

export const resendSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

export const verifyResetTokenSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  token: z.string().min(1, 'Reset token is required'),
});
