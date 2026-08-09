import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  name: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(80, 'Full name must be at most 80 characters'),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
