'use client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import {
  loginSchema,
  type LoginFormValues,
} from '@/features/auth/schemas/loginSchema';
import { useLogin } from '@/features/auth/hooks/useLogin';

const inputBase =
  'h-11.5 w-full rounded-md bg-surface border text-sm text-text pl-10.5 pr-3 outline-none transition-shadow focus:border-primary focus:ring-3 focus:ring-primary/13';

const iconBase =
  'pi absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm';

const maskIconBase =
  'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text transition-colors';

export function LoginForm() {
  const router = useRouter();
  const mutation = useLogin();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    await mutation.mutateAsync(values);
    router.push('/dashboard');
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className='flex flex-col gap-4'
    >
      {mutation.isError && (
        <div role='alert' className='bg-danger-tint border border-danger/30 rounded-md p-3 flex gap-2 items-start'>
          <i className='pi pi-times-circle text-danger mt-px shrink-0 text-lg' aria-hidden='true' />
          <div>
            <p className='text-sm font-semibold text-danger'>Sign-in failed</p>
            <p className='text-sm text-text-muted mt-0.5'>
              {mutation.error instanceof Error
                ? mutation.error.message
                : 'Something went wrong.'}
            </p>
          </div>
        </div>
      )}

      {/* Email */}
      <div className='flex flex-col gap-1'>
        <label htmlFor='login-email' className='sr-only'>
          Email address
        </label>
        <div className='relative'>
          <i className={`${iconBase} pi-envelope`} aria-hidden='true' />
          <InputText
            id='login-email'
            {...register('email')}
            type='email'
            placeholder='Email address'
            autoComplete='email'
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            className={`${inputBase} ${errors.email ? 'border-danger' : 'border-border'}`}
          />
        </div>
        {errors.email && (
          <p id='login-email-error' className='text-xs text-danger'>{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className='flex flex-col gap-1'>
        <label htmlFor='login-password' className='sr-only'>
          Password
        </label>
        <div className='relative'>
          <i className={`${iconBase} pi-lock`} aria-hidden='true' />
          <Controller
            name='password'
            control={control}
            render={({ field }) => (
              <Password
                inputId='login-password'
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                inputRef={field.ref}
                feedback={false}
                toggleMask
                placeholder='Password'
                autoComplete='current-password'
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

      {/* Forgot password */}
      <div className='flex justify-end'>
        <Link
          href='/forgot-password'
          className='text-sm text-primary hover:text-primary-strong transition-colors'
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit */}
      <Button
        type='submit'
        loading={mutation.isPending}
        disabled={mutation.isPending}
        label={mutation.isPending ? 'Signing in…' : 'Sign in'}
        pt={{
          root: {
            className:
              'w-full h-12.5 bg-primary hover:bg-primary-strong text-white text-[15px] font-semibold rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1 flex items-center justify-center gap-2',
          },
          loadingIcon: { className: 'animate-spin text-base' },
        }}
      />

      {/* Divider */}
      <div className='flex items-center gap-3 my-1'>
        <hr className='flex-1 h-px bg-border border-0' />
        <span className='text-xs text-text-dim'>or</span>
        <hr className='flex-1 h-px bg-border border-0' />
      </div>

      <p className='text-sm text-center text-text-muted'>
        New to Budget Tracker?{' '}
        <Link
          href='/register'
          className='text-primary hover:text-primary-strong font-medium transition-colors'
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
