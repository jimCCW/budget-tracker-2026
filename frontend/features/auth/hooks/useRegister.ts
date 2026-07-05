'use client';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { RegisterFormValues } from '@/features/auth/schemas/registerSchema';

async function registerFn(
  values: RegisterFormValues
): Promise<{ email: string }> {
  const body = await apiClient.post<
    never,
    { success: boolean; data: { email: string } }
  >('/api/auth/register', {
    name: values.name,
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    password: values.password,
  });
  return body.data;
}

export function useRegister() {
  return useMutation({ mutationFn: registerFn });
}
