'use client';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { signOut } from 'next-auth/react';
import { Modal } from '@/components/ui/Modal';
import {
  deleteAccountSchema,
  type DeleteAccountFormValues,
} from '@/features/settings/schemas/deleteAccountSchema';
import { useDeleteAccount } from '@/features/settings/hooks/useDeleteAccount';

const inputBase =
  'h-11.5 w-full rounded-md bg-surface border text-sm text-text pl-10.5 pr-3 outline-none transition-shadow focus:border-primary focus:ring-3 focus:ring-primary/13';

const iconBase =
  'pi absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm';

const maskIconBase =
  'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text transition-colors';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function DeleteAccountModal({ open, onClose }: Props) {
  const mutation = useDeleteAccount();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ password: '' });
      mutation.reset();
    }
  }, [open]);

  async function onSubmit(values: DeleteAccountFormValues) {
    await mutation.mutateAsync(values);
    await signOut({ callbackUrl: '/login' });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabelledBy='settings-delete-account-heading'
    >
      <div className='flex items-center justify-between px-6 py-4 border-b border-border'>
        <h2
          id='settings-delete-account-heading'
          className='text-base font-extrabold text-danger tracking-tight'
        >
          Delete account
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
        <p className='text-sm text-text-muted'>
          This permanently deletes your account and all associated data —
          accounts, transactions, categories, and recurring rules. This cannot
          be undone.
        </p>

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

        <div className='flex flex-col gap-1'>
          <label
            htmlFor='delete-account-password'
            className='text-xs font-bold text-text-muted uppercase tracking-wide'
          >
            Confirm your password
          </label>
          <div className='relative'>
            <i className={`${iconBase} pi-lock`} aria-hidden='true' />
            <Controller
              name='password'
              control={control}
              render={({ field }) => (
                <Password
                  inputId='delete-account-password'
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
            label={mutation.isPending ? 'Deleting…' : 'Delete my account'}
            pt={{
              root: {
                className:
                  'flex-1 h-11.5 bg-danger hover:bg-red-600 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2',
              },
              loadingIcon: { className: 'animate-spin text-sm' },
            }}
          />
        </div>
      </form>
    </Modal>
  );
}
