import { z } from 'zod';
import { passwordSchema } from './authSchemas';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  name: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(80, 'Full name must be at most 80 characters'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});
