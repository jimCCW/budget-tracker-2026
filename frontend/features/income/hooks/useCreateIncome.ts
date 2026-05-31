'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Income } from '@/types/income';
import type { IncomeFormValues } from '@/features/income/schemas/incomeSchema';

async function createIncomeFn(values: IncomeFormValues): Promise<Income> {
  const body = await apiClient.post<never, { success: boolean; data: Income }>(
    '/api/income',
    values
  );
  return body.data;
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createIncomeFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
