'use client';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

async function activateFn(data: {
  email: string;
  code: string;
}): Promise<{ message: string }> {
  return apiClient.post('/api/auth/activate', data);
}

export function useActivate() {
  return useMutation({ mutationFn: activateFn });
}
