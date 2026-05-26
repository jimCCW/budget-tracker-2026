import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[a-zA-Z]/, 'Must contain at least one letter')
  .regex(/\d/, 'Must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character');
