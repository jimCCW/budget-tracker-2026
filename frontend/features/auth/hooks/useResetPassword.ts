'use client';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { ResetPasswordFormValues } from '@/features/auth/schemas/resetPasswordSchema';

async function resetPasswordFn(
  values: ResetPasswordFormValues & { email: string; token: string }
): Promise<{ message: string }> {
  const body = await apiClient.post<
    never,
    { success: boolean; data: { message: string } }
  >('/api/auth/reset-password', {
    email: values.email,
    token: values.token,
    password: values.password,
  });
  return body.data;
}

export function useResetPassword() {
  return useMutation({ mutationFn: resetPasswordFn });
}
