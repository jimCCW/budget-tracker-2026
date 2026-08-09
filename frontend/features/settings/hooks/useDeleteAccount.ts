'use client';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { DeleteAccountFormValues } from '@/features/settings/schemas/deleteAccountSchema';

async function deleteAccountFn(
  values: DeleteAccountFormValues
): Promise<{ deleted: true }> {
  const body = await apiClient.delete<
    never,
    { success: boolean; data: { deleted: true } }
  >('/api/users/me', { data: values });
  return body.data;
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: deleteAccountFn });
}
