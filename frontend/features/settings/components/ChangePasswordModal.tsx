'use client';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Modal } from '@/components/ui/Modal';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/settings/schemas/changePasswordSchema';
import { useChangePassword } from '@/features/settings/hooks/useChangePassword';
import { logout } from '@/lib/logout';

const inputBase =
  'h-[46px] w-full rounded-md bg-surface border text-sm text-text pl-[42px] pr-3 outline-none transition-shadow focus:border-primary focus:ring-[3px] focus:ring-primary/[0.13]';

const iconBase =
  'pi absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm';

const maskIconBase =
  'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text transition-colors';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ChangePasswordModal({ open, onClose }: Props) {
  const mutation = useChangePassword();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ currentPassword: '', password: '', confirmPassword: '' });
      mutation.reset();
    }
  }, [open]);

  async function onSubmit(values: ChangePasswordFormValues) {
    await mutation.mutateAsync(values);
    // Force a fresh login with the new password rather than leaving this
    // device's now-stale session implicitly still trusted.
    await logout();
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className='flex items-center justify-between px-6 py-4 border-b border-border'>
        <h2 className='text-base font-extrabold text-text tracking-tight'>
          Change password
        </h2>
        <Button
          type='button'
          icon='pi pi-times'
          onClick={onClose}
          aria-label='Close'
          pt={{
            root: {
              className:
                'w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-raised transition-colors',
            },
            icon: { className: 'text-sm' },
          }}
        />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className='p-6 flex flex-col gap-4'
      >
        {mutation.isError && (
          <div className='bg-danger-tint border border-danger/30 rounded-md p-3 flex gap-2 items-start'>
            <i className='pi pi-times-circle text-danger mt-px shrink-0 text-lg' />
            <p className='text-sm text-text-muted mt-0.5'>
              {mutation.error instanceof Error
                ? mutation.error.message
                : 'Something went wrong.'}
            </p>
          </div>
        )}

        <div className='flex flex-col gap-1'>
          <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
            Current password
          </label>
          <div className='relative'>
            <i className={`${iconBase} pi-lock`} />
            <Controller
              name='currentPassword'
              control={control}
              render={({ field }) => (
                <Password
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  feedback={false}
                  toggleMask
                  placeholder='Current password'
                  autoComplete='current-password'
                  pt={{
                    root: { className: 'block w-full' },
                    input: {
                      className: `${inputBase} pr-10 ${errors.currentPassword ? 'border-danger' : 'border-border'}`,
                    },
                    showIcon: { className: maskIconBase },
                    hideIcon: { className: maskIconBase },
                  }}
                />
              )}
            />
          </div>
          {errors.currentPassword && (
            <p className='text-xs text-danger'>
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className='flex flex-col gap-1'>
          <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
            New password
          </label>
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

        <div className='flex flex-col gap-1'>
          <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
            Confirm new password
          </label>
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

        <div className='flex gap-3 pt-2'>
          <Button
            type='button'
            label='Cancel'
            onClick={onClose}
            pt={{
              root: {
                className:
                  'flex-1 h-11.5 rounded-md border border-border text-sm font-semibold text-text hover:bg-raised transition-colors',
              },
            }}
          />
          <Button
            type='submit'
            loading={mutation.isPending}
            disabled={mutation.isPending}
            label={mutation.isPending ? 'Updating…' : 'Update password'}
            pt={{
              root: {
                className:
                  'flex-1 h-11.5 bg-primary hover:bg-primary-strong text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2',
              },
              loadingIcon: { className: 'animate-spin text-sm' },
            }}
          />
        </div>
      </form>
    </Modal>
  );
}
