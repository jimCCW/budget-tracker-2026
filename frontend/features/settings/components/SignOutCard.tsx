'use client';
import { useState } from 'react';
import { Button } from 'primereact/button';
import { logout } from '@/lib/logout';

export function SignOutCard() {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await logout();
  }

  return (
    <section
      aria-labelledby='sign-out-heading'
      className='bg-surface rounded-xl border border-border p-6 flex items-center justify-between'
    >
      <div>
        <h2 id='sign-out-heading' className='text-sm font-bold text-text'>
          Sign out
        </h2>
        <p className='text-xs text-text-muted mt-0.5'>
          End your session on this device
        </p>
      </div>
      <Button
        label={signingOut ? 'Signing out…' : 'Sign out'}
        icon='pi pi-sign-out'
        loading={signingOut}
        disabled={signingOut}
        onClick={handleSignOut}
        pt={{
          root: {
            className:
              'h-9 px-4 rounded-md border border-border text-sm font-semibold text-danger hover:bg-danger-tint transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2',
          },
          icon: { className: 'text-sm' },
          loadingIcon: { className: 'animate-spin text-sm' },
        }}
      />
    </section>
  );
}
