'use client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import {
  registerSchema,
  type RegisterFormValues,
} from '@/features/auth/schemas/registerSchema';
import { useRegister } from '@/features/auth/hooks/useRegister';

const inputBase =
  'h-11.5 w-full rounded-md bg-surface border text-sm text-text pl-10.5 pr-3 outline-none transition-shadow focus:border-primary focus:ring-3 focus:ring-primary/13';

const iconBase =
  'pi absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm';

const maskIconBase =
  'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text transition-colors';

export function RegisterForm() {
  const router = useRouter();
  const mutation = useRegister();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(values: RegisterFormValues) {
    const { email } = await mutation.mutateAsync(values);
    router.push(`/register/confirm?email=${encodeURIComponent(email)}`);
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
            <p className='text-sm font-semibold text-danger'>
              Registration failed
            </p>
            <p className='text-sm text-text-muted mt-0.5'>
              {mutation.error instanceof Error
                ? mutation.error.message
                : 'Something went wrong.'}
            </p>
          </div>
        </div>
      )}

      {/* Full name */}
      <div className='flex flex-col gap-1'>
        <label htmlFor='register-name' className='sr-only'>
          Full name
        </label>
        <div className='relative'>
          <i className={`${iconBase} pi-user`} aria-hidden='true' />
          <InputText
            id='register-name'
            {...register('name')}
            type='text'
            placeholder='Full name'
            autoComplete='name'
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'register-name-error' : undefined}
            className={`${inputBase} ${errors.name ? 'border-danger' : 'border-border'}`}
          />
        </div>
        {errors.name && (
          <p id='register-name-error' className='text-xs text-danger'>{errors.name.message}</p>
        )}
      </div>

      {/* First / Last name */}
      <div className='flex gap-3'>
        <div className='flex flex-col gap-1 flex-1'>
          <label htmlFor='register-first-name' className='sr-only'>
            First name
          </label>
          <div className='relative'>
            <i className={`${iconBase} pi-user`} aria-hidden='true' />
            <InputText
              id='register-first-name'
              {...register('firstName')}
              type='text'
              placeholder='First name'
              autoComplete='given-name'
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? 'register-first-name-error' : undefined}
              className={`${inputBase} ${errors.firstName ? 'border-danger' : 'border-border'}`}
            />
          </div>
          {errors.firstName && (
            <p id='register-first-name-error' className='text-xs text-danger'>{errors.firstName.message}</p>
          )}
        </div>
        <div className='flex flex-col gap-1 flex-1'>
          <label htmlFor='register-last-name' className='sr-only'>
            Last name
          </label>
          <div className='relative'>
            <i className={`${iconBase} pi-user`} aria-hidden='true' />
            <InputText
              id='register-last-name'
              {...register('lastName')}
              type='text'
              placeholder='Last name'
              autoComplete='family-name'
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? 'register-last-name-error' : undefined}
              className={`${inputBase} ${errors.lastName ? 'border-danger' : 'border-border'}`}
            />
          </div>
          {errors.lastName && (
            <p id='register-last-name-error' className='text-xs text-danger'>{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className='flex flex-col gap-1'>
        <label htmlFor='register-email' className='sr-only'>
          Email address
        </label>
        <div className='relative'>
          <i className={`${iconBase} pi-envelope`} aria-hidden='true' />
          <InputText
            id='register-email'
            {...register('email')}
            type='email'
            placeholder='Email address'
            autoComplete='email'
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            className={`${inputBase} ${errors.email ? 'border-danger' : 'border-border'}`}
          />
        </div>
        {errors.email && (
          <p id='register-email-error' className='text-xs text-danger'>{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className='flex flex-col gap-1'>
        <label htmlFor='register-password' className='sr-only'>
          Password
        </label>
        <div className='relative'>
          <i className={`${iconBase} pi-lock`} aria-hidden='true' />
          <Controller
            name='password'
            control={control}
            render={({ field }) => (
              <Password
                inputId='register-password'
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                inputRef={field.ref}
                feedback={false}
                toggleMask
                placeholder='Password (8+ characters)'
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
        <label htmlFor='register-confirm-password' className='sr-only'>
          Confirm password
        </label>
        <div className='relative'>
          <i className={`${iconBase} pi-lock`} aria-hidden='true' />
          <Controller
            name='confirmPassword'
            control={control}
            render={({ field }) => (
              <Password
                inputId='register-confirm-password'
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                inputRef={field.ref}
                feedback={false}
                toggleMask
                placeholder='Confirm password'
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

      {/* Terms */}
      <div className='flex flex-col gap-1'>
        <Controller
          name='terms'
          control={control}
          render={({ field }) => (
            <label htmlFor='terms' className='flex items-start gap-2 cursor-pointer'>
              <Checkbox
                inputId='terms'
                checked={field.value ?? false}
                onChange={(e) => field.onChange(e.checked)}
                pt={{
                  root: { className: 'flex mt-0.5' },
                  input: { className: 'sr-only' },
                  box: {
                    className: `w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${field.value ? 'bg-primary border-primary' : 'bg-surface border-border'}`,
                  },
                  icon: { className: 'text-white text-[10px]' },
                }}
              />
              <span className='text-sm text-text-muted'>
                I agree to the{' '}
                <Link
                  href='/terms'
                  className='text-primary hover:text-primary-strong transition-colors'
                >
                  Terms of Service
                </Link>
              </span>
            </label>
          )}
        />
        {errors.terms && (
          <p className='text-xs text-danger'>{errors.terms.message}</p>
        )}
      </div>

      {/* Submit */}
      <Button
        type='submit'
        loading={mutation.isPending}
        disabled={mutation.isPending}
        label={mutation.isPending ? 'Creating account…' : 'Create account'}
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
        Already have an account?{' '}
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
