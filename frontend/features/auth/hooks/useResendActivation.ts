'use client';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

async function resendFn(data: { email: string }): Promise<{ email: string }> {
  return apiClient.post('/api/auth/resend', data);
}

export function useResendActivation() {
  return useMutation({ mutationFn: resendFn });
}
