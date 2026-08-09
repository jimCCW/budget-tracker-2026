'use client';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { ChangePasswordFormValues } from '@/features/settings/schemas/changePasswordSchema';

async function changePasswordFn(
  values: ChangePasswordFormValues
): Promise<{ message: string }> {
  const body = await apiClient.post<
    never,
    { success: boolean; data: { message: string } }
  >('/api/users/change-password', values);
  return body.data;
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePasswordFn });
}
