'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { RecurringRule } from '@/types/recurring';

async function setRuleActiveFn({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}): Promise<RecurringRule> {
  const body = await apiClient.patch<
    never,
    { success: boolean; data: RecurringRule }
  >(`/api/recurring/${id}/active`, { isActive });
  return body.data;
}

export function useSetRuleActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setRuleActiveFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });
}
