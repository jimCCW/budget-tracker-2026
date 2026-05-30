'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

async function deleteAccountFn(id: string): Promise<void> {
  await apiClient.delete(`/api/accounts/${id}`);
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAccountFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });
}
