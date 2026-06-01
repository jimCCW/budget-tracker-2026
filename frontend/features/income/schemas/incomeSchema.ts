import { z } from 'zod';

export const incomeSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().min(1, 'Category is required'),
  amount: z
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().max(255, 'Note must be at most 255 characters').optional(),
});

export type IncomeFormValues = z.infer<typeof incomeSchema>;
