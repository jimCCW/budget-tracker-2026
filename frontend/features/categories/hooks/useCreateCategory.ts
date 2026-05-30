'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Category } from '@/types/category';
import type { CategoryFormValues } from '@/features/categories/schemas/categorySchema';

async function createCategoryFn(values: CategoryFormValues): Promise<Category> {
  const body = await apiClient.post<
    never,
    { success: boolean; data: Category }
  >('/api/categories', values);
  return body.data;
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategoryFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}
