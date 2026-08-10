'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import {
  updateProfileSchema,
  type UpdateProfileFormValues,
} from '@/features/settings/schemas/updateProfileSchema';
import { useProfile } from '@/features/settings/hooks/useProfile';
import { useUpdateProfile } from '@/features/settings/hooks/useUpdateProfile';

const inputBase =
  'h-11.5 w-full rounded-md bg-surface border text-sm text-text pl-10.5 pr-3 outline-none transition-shadow focus:border-primary focus:ring-3 focus:ring-primary/13';

export function PersonalInfoCard() {
  const { data: profile, isLoading } = useProfile();
  const mutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { firstName: '', lastName: '', name: '' },
  });

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        name: profile.name ?? '',
      });
    }
  }, [profile, reset]);

  async function onSubmit(values: UpdateProfileFormValues) {
    await mutation.mutateAsync(values);
  }

  if (isLoading) {
    return (
      <div
        role='status'
        aria-busy='true'
        className='bg-surface rounded-xl border border-border p-6 flex flex-col gap-4'
      >
        <Skeleton height='1.25rem' width='10rem' />
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <Skeleton
            height='2.875rem'
            pt={{ root: { className: 'rounded-md' } }}
          />
          <Skeleton
            height='2.875rem'
            pt={{ root: { className: 'rounded-md' } }}
          />
        </div>
        <Skeleton
          height='2.875rem'
          pt={{ root: { className: 'rounded-md' } }}
        />
        <Skeleton
          height='2.875rem'
          pt={{ root: { className: 'rounded-md' } }}
        />
      </div>
    );
  }

  return (
    <section
      aria-labelledby='personal-info-heading'
      className='bg-surface rounded-xl border border-border p-6'
    >
      <h2
        id='personal-info-heading'
        className='text-base font-extrabold text-text tracking-tight mb-1'
      >
        Personal info
      </h2>
      <p className='text-sm text-text-muted mb-5'>
        Update your name and view your account email.
      </p>

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
            <p className='text-sm text-text-muted mt-0.5'>
              {mutation.error instanceof Error
                ? mutation.error.message
                : 'Something went wrong.'}
            </p>
          </div>
        )}

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='profile-first-name'
              className='text-xs font-bold text-text-muted uppercase tracking-wide'
            >
              First name
            </label>
            <div className='relative'>
              <i
                className='pi pi-user absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm'
                aria-hidden='true'
              />
              <InputText
                id='profile-first-name'
                {...register('firstName')}
                placeholder='First name'
                autoComplete='given-name'
                aria-invalid={!!errors.firstName}
                aria-describedby={
                  errors.firstName ? 'profile-first-name-error' : undefined
                }
                className={`${inputBase} ${errors.firstName ? 'border-danger' : 'border-border'}`}
              />
            </div>
            {errors.firstName && (
              <p id='profile-first-name-error' className='text-xs text-danger'>
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div className='flex flex-col gap-1'>
            <label
              htmlFor='profile-last-name'
              className='text-xs font-bold text-text-muted uppercase tracking-wide'
            >
              Last name
            </label>
            <div className='relative'>
              <i
                className='pi pi-user absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm'
                aria-hidden='true'
              />
              <InputText
                id='profile-last-name'
                {...register('lastName')}
                placeholder='Last name'
                autoComplete='family-name'
                aria-invalid={!!errors.lastName}
                aria-describedby={
                  errors.lastName ? 'profile-last-name-error' : undefined
                }
                className={`${inputBase} ${errors.lastName ? 'border-danger' : 'border-border'}`}
              />
            </div>
            {errors.lastName && (
              <p id='profile-last-name-error' className='text-xs text-danger'>
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div className='flex flex-col gap-1'>
          <label
            htmlFor='profile-name'
            className='text-xs font-bold text-text-muted uppercase tracking-wide'
          >
            Full name
          </label>
          <div className='relative'>
            <i
              className='pi pi-id-card absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm'
              aria-hidden='true'
            />
            <InputText
              id='profile-name'
              {...register('name')}
              placeholder='Full name'
              autoComplete='name'
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'profile-name-error' : undefined}
              className={`${inputBase} ${errors.name ? 'border-danger' : 'border-border'}`}
            />
          </div>
          {errors.name && (
            <p id='profile-name-error' className='text-xs text-danger'>
              {errors.name.message}
            </p>
          )}
        </div>

        <div className='flex flex-col gap-1'>
          <label
            htmlFor='profile-email'
            className='text-xs font-bold text-text-muted uppercase tracking-wide'
          >
            Email
          </label>
          <div className='relative'>
            <i
              className='pi pi-envelope absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm'
              aria-hidden='true'
            />
            <InputText
              id='profile-email'
              value={profile?.email ?? ''}
              disabled
              className={`${inputBase} border-border opacity-60 cursor-not-allowed`}
            />
          </div>
        </div>

        <div>
          <Button
            type='submit'
            loading={mutation.isPending}
            disabled={mutation.isPending}
            label={
              mutation.isPending
                ? 'Saving…'
                : mutation.isSuccess
                  ? 'Saved!'
                  : 'Save changes'
            }
            pt={{
              root: {
                className:
                  'h-11 px-5 bg-primary hover:bg-primary-strong text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2',
              },
              loadingIcon: { className: 'animate-spin text-sm' },
            }}
          />
        </div>
      </form>
    </section>
  );
}
