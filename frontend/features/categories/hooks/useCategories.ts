'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Category } from '@/types/category';

async function fetchCategories(): Promise<Category[]> {
  const body = await apiClient.get<
    never,
    { success: boolean; data: Category[] }
  >('/api/categories');
  return body.data;
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
}
