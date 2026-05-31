import { z } from 'zod';

export const expenseSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().min(1, 'Category is required'),
  amount: z
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  description: z
    .string()
    .max(255, 'Description must be at most 255 characters')
    .optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
