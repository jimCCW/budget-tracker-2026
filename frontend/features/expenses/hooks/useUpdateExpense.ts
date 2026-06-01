'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Expense } from '@/types/expense';
import type { ExpenseFormValues } from '@/features/expenses/schemas/expenseSchema';

async function updateExpenseFn({
  id,
  values,
}: {
  id: string;
  values: Partial<ExpenseFormValues>;
}): Promise<Expense> {
  const body = await apiClient.patch<
    never,
    { success: boolean; data: Expense }
  >(`/api/expenses/${id}`, values);
  return body.data;
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateExpenseFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
