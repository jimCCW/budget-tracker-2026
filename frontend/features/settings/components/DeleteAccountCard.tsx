'use client';
import { useState } from 'react';
import { Button } from 'primereact/button';
import { DeleteAccountModal } from '@/features/settings/components/DeleteAccountModal';

export function DeleteAccountCard() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className='bg-danger-tint rounded-xl border border-danger/30 p-6'>
      <h2 className='text-base font-extrabold text-danger tracking-tight mb-1'>
        Danger zone
      </h2>
      <p className='text-sm text-text mb-4'>
        Deleting your account permanently removes all data. This cannot be
        undone.
      </p>
      <Button
        label='Delete account'
        onClick={() => setModalOpen(true)}
        pt={{
          root: {
            className:
              'h-9 px-4 rounded-md border border-danger/55 text-sm font-semibold text-danger hover:bg-danger hover:text-white transition-colors',
          },
        }}
      />

      <DeleteAccountModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
