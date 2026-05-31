'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Expense } from '@/types/expense';
import type { ExpenseFormValues } from '@/features/expenses/schemas/expenseSchema';

async function createExpenseFn(values: ExpenseFormValues): Promise<Expense> {
  const body = await apiClient.post<never, { success: boolean; data: Expense }>(
    '/api/expenses',
    values
  );
  return body.data;
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExpenseFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
