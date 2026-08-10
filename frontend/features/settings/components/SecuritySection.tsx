'use client';
import { useState } from 'react';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { ChangePasswordModal } from '@/features/settings/components/ChangePasswordModal';
import { useSessions } from '@/features/settings/hooks/useSessions';
import { useRevokeSession } from '@/features/settings/hooks/useRevokeSession';
import { formatRelativeTime } from '@/features/notifications/utils/notificationUtils';

export function SecuritySection() {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const { data: sessions, isLoading } = useSessions();
  const revokeMutation = useRevokeSession();

  return (
    <section
      aria-labelledby='security-heading'
      className='bg-surface rounded-xl border border-border p-6'
    >
      <h2
        id='security-heading'
        className='text-base font-extrabold text-text tracking-tight mb-1'
      >
        Security
      </h2>
      <p className='text-sm text-text-muted mb-5'>
        Manage your password and active sessions.
      </p>

      <div className='flex items-center justify-between py-3 border-b border-border'>
        <div className='flex items-center gap-3'>
          <div
            className='w-9 h-9 rounded-lg bg-primary-tint text-primary flex items-center justify-center shrink-0'
            aria-hidden='true'
          >
            <i className='pi pi-lock text-base' />
          </div>
          <div>
            <h3 className='text-sm font-bold text-text'>Password</h3>
            <p className='text-xs text-text-muted mt-0.5'>
              Change your account password
            </p>
          </div>
        </div>
        <Button
          label='Change'
          onClick={() => setPasswordModalOpen(true)}
          pt={{
            root: {
              className:
                'h-9 px-4 rounded-md border border-border text-sm font-semibold text-text hover:bg-raised transition-colors',
            },
          }}
        />
      </div>

      <div className='pt-4'>
        <h3 className='text-[10px] font-bold text-text-dim uppercase tracking-widest mb-3'>
          Active sessions
        </h3>

        {isLoading && (
          <div role='status' aria-busy='true' className='flex flex-col gap-3'>
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton
                key={i}
                height='2.75rem'
                pt={{ root: { className: 'rounded-md' } }}
              />
            ))}
          </div>
        )}

        {!isLoading && (
          <ul className='flex flex-col'>
            {(sessions ?? []).map((session, i) => (
              <li
                key={session.id}
                className={`flex items-center gap-3 py-2.5 ${i < (sessions?.length ?? 0) - 1 ? 'border-b border-border' : ''}`}
              >
                <div
                  className='w-9 h-9 rounded-lg bg-bg border border-border flex items-center justify-center shrink-0'
                  aria-hidden='true'
                >
                  <i className='pi pi-desktop text-text-muted text-sm' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-semibold text-text truncate'>
                    {session.device}
                  </p>
                  <p className='text-xs text-text-muted mt-0.5'>
                    {session.current
                      ? 'This device'
                      : `Signed in ${formatRelativeTime(session.createdAt)}`}
                  </p>
                </div>
                {session.current ? (
                  <span className='text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-success-tint text-success shrink-0'>
                    Current
                  </span>
                ) : (
                  <Button
                    label='Revoke'
                    aria-label={`Revoke session on ${session.device}`}
                    loading={
                      revokeMutation.isPending &&
                      revokeMutation.variables === session.id
                    }
                    onClick={() => revokeMutation.mutate(session.id)}
                    pt={{
                      root: {
                        className:
                          'text-xs font-bold text-danger hover:text-danger/80 transition-colors px-2 py-1 shrink-0',
                      },
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </section>
  );
}
