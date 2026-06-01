import { z } from 'zod';

const FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;
const KINDS = ['INCOME', 'EXPENSE'] as const;

export const recurringSchema = z.object({
  kind: z.enum(KINDS),
  amount: z
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().min(1, 'Category is required'),
  note: z.string().max(255).optional(),
  frequency: z.enum(FREQUENCIES),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
});

export type RecurringFormValues = z.infer<typeof recurringSchema>;
