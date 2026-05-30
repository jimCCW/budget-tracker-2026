import { z } from 'zod';

const ACCOUNT_TYPES = [
  'BANK',
  'INVESTMENT',
  'CRYPTO',
  'CASH',
  'CREDIT',
] as const;

export const createAccountSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(60, 'Name must be at most 60 characters'),
  type: z.enum(ACCOUNT_TYPES).optional(),
  balance: z
    .number({ invalid_type_error: 'Balance must be a number' })
    .optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const updateAccountSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(60, 'Name must be at most 60 characters')
    .optional(),
  type: z.enum(ACCOUNT_TYPES).optional(),
  balance: z
    .number({ invalid_type_error: 'Balance must be a number' })
    .optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});
