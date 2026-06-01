'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { RecurringRule } from '@/types/recurring';
import type { RecurringFormValues } from '../schemas/recurringSchema';

async function updateRuleFn({
  id,
  values,
}: {
  id: string;
  values: Partial<RecurringFormValues>;
}): Promise<RecurringRule> {
  const body = await apiClient.patch<
    never,
    { success: boolean; data: RecurringRule }
  >(`/api/recurring/${id}`, values);
  return body.data;
}

export function useUpdateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRuleFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });
}
