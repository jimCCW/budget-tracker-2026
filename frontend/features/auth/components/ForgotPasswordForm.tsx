'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/features/auth/schemas/forgotPasswordSchema';
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';

const inputBase =
  'h-11.5 w-full rounded-md bg-surface border text-sm text-text pl-10.5 pr-3 outline-none transition-shadow focus:border-primary focus:ring-3 focus:ring-primary/13';

const iconBase =
  'pi absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm';

export function ForgotPasswordForm() {
  const mutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    await mutation.mutateAsync(values);
  }

  if (mutation.isSuccess) {
    return (
      <div className='flex flex-col gap-4'>
        <div
          role='status'
          className='bg-surface border border-border rounded-md p-4 flex gap-3 items-start'
        >
          <i
            className='pi pi-envelope text-primary mt-px shrink-0 text-lg'
            aria-hidden='true'
          />
          <div>
            <h2 className='text-sm font-semibold text-text'>
              Check your email
            </h2>
            <p className='text-sm text-text-muted mt-0.5'>
              If an account exists for that address, we&apos;ve sent a password
              reset link. Check your inbox (and spam folder).
            </p>
          </div>
        </div>
        <Link
          href='/login'
          className='text-sm text-center text-primary hover:text-primary-strong transition-colors'
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className='flex flex-col gap-4'
    >
      {mutation.isError && (
        <div
          role='alert'
          className='bg-danger-tint border border-danger/30 rounded-md p-3 flex gap-2 items-start'
        >
          <i
            className='pi pi-times-circle text-danger mt-px shrink-0 text-lg'
            aria-hidden='true'
          />
          <div>
            <p className='text-sm font-semibold text-danger'>
              Something went wrong
            </p>
            <p className='text-sm text-text-muted mt-0.5'>
              {mutation.error instanceof Error
                ? mutation.error.message
                : 'Please try again.'}
            </p>
          </div>
        </div>
      )}

      {/* Email */}
      <div className='flex flex-col gap-1'>
        <label htmlFor='forgot-password-email' className='sr-only'>
          Email address
        </label>
        <div className='relative'>
          <i className={`${iconBase} pi-envelope`} aria-hidden='true' />
          <InputText
            id='forgot-password-email'
            {...register('email')}
            type='email'
            placeholder='Email address'
            autoComplete='email'
            aria-invalid={!!errors.email}
            aria-describedby={
              errors.email ? 'forgot-password-email-error' : undefined
            }
            className={`${inputBase} ${errors.email ? 'border-danger' : 'border-border'}`}
          />
        </div>
        {errors.email && (
          <p id='forgot-password-email-error' className='text-xs text-danger'>
            {errors.email.message}
          </p>
        )}
      </div>

      <Button
        type='submit'
        loading={mutation.isPending}
        disabled={mutation.isPending}
        label={mutation.isPending ? 'Sending…' : 'Send reset link'}
        pt={{
          root: {
            className:
              'w-full h-12.5 bg-primary hover:bg-primary-strong text-white text-[15px] font-semibold rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1 flex items-center justify-center gap-2',
          },
          loadingIcon: { className: 'animate-spin text-base' },
        }}
      />

      <p className='text-sm text-center text-text-muted'>
        Remember your password?{' '}
        <Link
          href='/login'
          className='text-primary hover:text-primary-strong font-medium transition-colors'
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
