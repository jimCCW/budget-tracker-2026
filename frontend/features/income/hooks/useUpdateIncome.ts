'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Income } from '@/types/income';
import type { IncomeFormValues } from '@/features/income/schemas/incomeSchema';

async function updateIncomeFn({
  id,
  values,
}: {
  id: string;
  values: Partial<IncomeFormValues>;
}): Promise<Income> {
  const body = await apiClient.patch<never, { success: boolean; data: Income }>(
    `/api/income/${id}`,
    values
  );
  return body.data;
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateIncomeFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
