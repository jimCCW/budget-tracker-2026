import { z } from 'zod';

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;
