'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import type { UserProfile } from '@/types/user';
import type { UpdateProfileFormValues } from '@/features/settings/schemas/updateProfileSchema';

async function updateProfileFn(
  values: UpdateProfileFormValues
): Promise<UserProfile> {
  const body = await apiClient.patch<
    never,
    { success: boolean; data: UserProfile }
  >('/api/users/me', values);
  return body.data;
}

/**
 * Updates the user's display name and refreshes the NextAuth session so
 * AppShell's sidebar name/initials reflect the change without a re-login.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { update } = useSession();
  return useMutation({
    mutationFn: updateProfileFn,
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      await update({
        name: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
      });
    },
  });
}
