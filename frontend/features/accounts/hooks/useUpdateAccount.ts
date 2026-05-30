'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Account } from '@/types/account';
import type { AccountFormValues } from '@/features/accounts/schemas/accountSchema';

async function updateAccountFn({
  id,
  values,
}: {
  id: string;
  values: AccountFormValues;
}): Promise<Account> {
  const body = await apiClient.patch<never, { success: boolean; data: Account }>(
    `/api/accounts/${id}`,
    values
  );
  return body.data;
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAccountFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });
}
