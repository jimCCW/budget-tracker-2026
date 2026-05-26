'use client';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/features/auth/schemas/resetPasswordSchema';
import { useResetPassword } from '@/features/auth/hooks/useResetPassword';
import { apiClient } from '@/lib/api';

const inputBase =
  'h-[46px] w-full rounded-md bg-surface border text-sm text-text pl-[42px] pr-3 outline-none transition-shadow focus:border-primary focus:ring-[3px] focus:ring-primary/[0.13]';

const iconBase =
  'pi absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm';

const maskIconBase =
  'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text transition-colors';

interface ResetPasswordFormProps {
  email: string;
  token: string;
}

export function ResetPasswordForm({ email, token }: ResetPasswordFormProps) {
  const router = useRouter();
  const mutation = useResetPassword();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    apiClient
      .get<{ success: boolean }>(
        `/api/auth/verify-reset-token?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
      )
      .catch(() => router.replace('/login'))
      .finally(() => setVerifying(false));
  }, [email, token, router]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    await mutation.mutateAsync({ ...values, email, token });
    router.push('/login');
  }

  if (verifying) {
    return (
      <div className='flex justify-center py-8'>
        <i className='pi pi-spin pi-spinner text-primary text-2xl' />
      </div>
    );
  }

  if (mutation.isError) {
    const message =
      mutation.error instanceof Error
        ? mutation.error.message
        : 'Something went wrong.';
    const isExpired =
      message.toLowerCase().includes('invalid') ||
      message.toLowerCase().includes('expired');

    return (
      <div className='flex flex-col gap-4'>
        <div className='bg-danger-tint border border-danger/30 rounded-md p-3 flex gap-2 items-start'>
          <i className='pi pi-times-circle text-danger mt-px shrink-0 text-lg' />
          <div>
            <p className='text-sm font-semibold text-danger'>
              {isExpired ? 'Link expired' : 'Reset failed'}
            </p>
            <p className='text-sm text-text-muted mt-0.5'>{message}</p>
          </div>
        </div>
        <a
          href='/forgot-password'
          className='text-sm text-center text-primary hover:text-primary-strong transition-colors'
        >
          Request a new reset link
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className='flex flex-col gap-4'
    >
      {/* Password */}
      <div className='flex flex-col gap-1'>
        <div className='relative'>
          <i className={`${iconBase} pi-lock`} />
          <Controller
            name='password'
            control={control}
            render={({ field }) => (
              <Password
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                inputRef={field.ref}
                feedback={false}
                toggleMask
                placeholder='New password (8+ characters)'
                autoComplete='new-password'
                pt={{
                  root: { className: 'block w-full' },
                  input: {
                    className: `${inputBase} pr-10 ${errors.password ? 'border-danger' : 'border-border'}`,
                  },
                  showIcon: { className: maskIconBase },
                  hideIcon: { className: maskIconBase },
                }}
              />
            )}
          />
        </div>
        {errors.password && (
          <p className='text-xs text-danger'>{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className='flex flex-col gap-1'>
        <div className='relative'>
          <i className={`${iconBase} pi-lock`} />
          <Controller
            name='confirmPassword'
            control={control}
            render={({ field }) => (
              <Password
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                inputRef={field.ref}
                feedback={false}
                toggleMask
                placeholder='Confirm new password'
                autoComplete='new-password'
                pt={{
                  root: { className: 'block w-full' },
                  input: {
                    className: `${inputBase} pr-10 ${errors.confirmPassword ? 'border-danger' : 'border-border'}`,
                  },
                  showIcon: { className: maskIconBase },
                  hideIcon: { className: maskIconBase },
                }}
              />
            )}
          />
        </div>
        {errors.confirmPassword && (
          <p className='text-xs text-danger'>
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type='submit'
        loading={mutation.isPending}
        disabled={mutation.isPending}
        label={mutation.isPending ? 'Updating…' : 'Set new password'}
        pt={{
          root: {
            className:
              'w-full h-[50px] bg-primary hover:bg-primary-strong text-white text-[15px] font-semibold rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1 flex items-center justify-center gap-2',
          },
          loadingIcon: { className: 'animate-spin text-base' },
        }}
      />
    </form>
  );
}
