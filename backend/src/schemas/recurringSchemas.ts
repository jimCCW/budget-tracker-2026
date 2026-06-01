import { z } from 'zod';

const FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;
const KINDS = ['INCOME', 'EXPENSE'] as const;

export const createRuleSchema = z
  .object({
    kind: z.enum(KINDS),
    amount: z
      .number({ invalid_type_error: 'Amount must be a number' })
      .positive('Amount must be greater than 0'),
    accountId: z.string().min(1, 'Account is required'),
    categoryId: z.string().min(1, 'Category is required').optional(),
    note: z.string().max(255).optional(),
    frequency: z.enum(FREQUENCIES),
    interval: z.number().int().positive().optional(),
    startDate: z
      .string()
      .min(1, 'Start date is required')
      .refine((v) => !isNaN(Date.parse(v)), 'Start date must be a valid date'),
    endDate: z
      .string()
      .refine((v) => !isNaN(Date.parse(v)), 'End date must be a valid date')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['categoryId'],
        message: 'Category is required',
      });
    }
  });

export const updateRuleSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0')
    .optional(),
  accountId: z.string().min(1, 'Account is required').optional(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  note: z.string().max(255).optional(),
  frequency: z.enum(FREQUENCIES).optional(),
  interval: z.number().int().positive().optional(),
  endDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), 'End date must be a valid date')
    .optional(),
});

export const setActiveSchema = z.object({
  isActive: z.boolean(),
});
