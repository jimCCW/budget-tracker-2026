import { z } from 'zod';

export const ACCOUNT_TYPES = [
  'BANK',
  'INVESTMENT',
  'CRYPTO',
  'CASH',
  'CREDIT',
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const accountSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(60, 'Name must be at most 60 characters'),
  type: z.enum(ACCOUNT_TYPES),
  balance: z.number({ error: 'Balance must be a number' }),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
