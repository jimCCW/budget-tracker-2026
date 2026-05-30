'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Account } from '@/types/account';
import type { AccountFormValues } from '@/features/accounts/schemas/accountSchema';

async function createAccountFn(values: AccountFormValues): Promise<Account> {
  const body = await apiClient.post<never, { success: boolean; data: Account }>(
    '/api/accounts',
    values
  );
  return body.data;
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAccountFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });
}
