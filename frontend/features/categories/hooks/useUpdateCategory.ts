'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Category } from '@/types/category';
import type { CategoryFormValues } from '@/features/categories/schemas/categorySchema';

async function updateCategoryFn({
  id,
  values,
}: {
  id: string;
  values: CategoryFormValues;
}): Promise<Category> {
  const body = await apiClient.patch<
    never,
    { success: boolean; data: Category }
  >(`/api/categories/${id}`, values);
  return body.data;
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCategoryFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}
