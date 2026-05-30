'use client';
import { useEffect } from 'react';
import { Button } from 'primereact/button';
import { Modal } from '@/components/ui/Modal';
import { useDeleteAccount } from '@/features/accounts/hooks/useDeleteAccount';
import type { Account } from '@/types/account';

type Props = {
  open: boolean;
  onClose: () => void;
  account: Account | null;
};

export function DeleteAccountModal({ open, onClose, account }: Props) {
  const mutation = useDeleteAccount();

  useEffect(() => {
    if (open) mutation.reset();
  }, [open]);

  async function handleDelete() {
    if (!account) return;
    await mutation.mutateAsync(account.id);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth='max-w-sm'>
      <div className='p-6 flex flex-col gap-4'>
        {/* Icon */}
        <div className='w-12 h-12 rounded-full bg-danger-tint flex items-center justify-center mx-auto'>
          <i className='pi pi-trash text-danger text-xl' />
        </div>

        {/* Text */}
        <div className='text-center'>
          <h2 className='text-base font-extrabold text-text'>
            Delete account?
          </h2>
          <p className='text-sm text-text-muted mt-1'>
            <span className='font-semibold text-text'>{account?.name}</span>{' '}
            will be permanently removed.
          </p>
        </div>

        {/* Error */}
        {mutation.isError && (
          <div className='bg-danger-tint border border-danger/30 rounded-md p-3 flex gap-2 items-start'>
            <i className='pi pi-times-circle text-danger mt-px shrink-0 text-base' />
            <p className='text-sm text-text-muted mt-0.5'>
              {mutation.error instanceof Error
                ? mutation.error.message
                : 'Something went wrong.'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className='flex gap-3'>
          <Button
            type='button'
            label='Cancel'
            onClick={onClose}
            pt={{
              root: {
                className:
                  'flex-1 h-10.5 rounded-md border border-border text-sm font-semibold text-text hover:bg-raised transition-colors',
              },
            }}
          />
          <Button
            onClick={handleDelete}
            loading={mutation.isPending}
            disabled={mutation.isPending}
            label={mutation.isPending ? 'Deleting…' : 'Delete'}
            pt={{
              root: {
                className:
                  'flex-1 h-10.5 bg-danger hover:bg-red-600 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2',
              },
              loadingIcon: { className: 'animate-spin text-sm' },
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
