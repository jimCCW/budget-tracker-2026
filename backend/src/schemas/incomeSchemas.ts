import { z } from 'zod';

export const createIncomeSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().min(1, 'Category is required'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  date: z
    .string()
    .min(1, 'Date is required')
    .refine(
      (v) => !isNaN(Date.parse(v)),
      'Date must be a valid ISO date string'
    ),
  note: z.string().max(255, 'Note must be at most 255 characters').optional(),
});

export const updateIncomeSchema = z.object({
  accountId: z.string().min(1, 'Account is required').optional(),
  categoryId: z.string().min(1).optional(),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0')
    .optional(),
  date: z
    .string()
    .refine(
      (v) => !isNaN(Date.parse(v)),
      'Date must be a valid ISO date string'
    )
    .optional(),
  note: z.string().max(255, 'Note must be at most 255 characters').optional(),
});
