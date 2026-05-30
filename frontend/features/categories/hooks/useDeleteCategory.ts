'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

async function deleteCategoryFn(id: string): Promise<void> {
  await apiClient.delete(`/api/categories/${id}`);
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategoryFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}
