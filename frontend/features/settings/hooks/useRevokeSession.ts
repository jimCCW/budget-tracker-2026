'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

async function revokeSessionFn(id: string): Promise<{ revoked: true }> {
  const body = await apiClient.post<
    never,
    { success: boolean; data: { revoked: true } }
  >(`/api/sessions/${id}/revoke`);
  return body.data;
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeSessionFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });
}
