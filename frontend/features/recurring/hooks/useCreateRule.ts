'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { RecurringRule } from '@/types/recurring';
import type { RecurringFormValues } from '../schemas/recurringSchema';

async function createRuleFn(
  values: RecurringFormValues
): Promise<RecurringRule> {
  const body = await apiClient.post<
    never,
    { success: boolean; data: RecurringRule }
  >('/api/recurring', values);
  return body.data;
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRuleFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
