'use client';
import { useMutation } from '@tanstack/react-query';
import { signIn } from 'next-auth/react';
import type { LoginFormValues } from '@/features/auth/schemas/loginSchema';

async function loginFn(values: LoginFormValues) {
  const result = await signIn('credentials', {
    redirect: false,
    email: values.email,
    password: values.password,
  });
  if (!result || result.error) {
    throw new Error('Invalid email or password. Please try again.');
  }
  return { ok: true };
}

export function useLogin() {
  return useMutation({ mutationFn: loginFn });
}
