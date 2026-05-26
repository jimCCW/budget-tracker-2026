'use client';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { ForgotPasswordFormValues } from '@/features/auth/schemas/forgotPasswordSchema';

async function forgotPasswordFn(
  values: ForgotPasswordFormValues
): Promise<{ message: string }> {
  const body = await apiClient.post<
    never,
    { success: boolean; data: { message: string } }
  >('/api/auth/forgot-password', { email: values.email });
  return body.data;
}

export function useForgotPassword() {
  return useMutation({ mutationFn: forgotPasswordFn });
}
