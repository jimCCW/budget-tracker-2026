'use client';
import { useState } from 'react';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { AppShell } from '@/components/AppShell';
import { AccountCard } from '@/features/accounts/components/AccountCard';
import { AccountFormModal } from '@/features/accounts/components/AccountFormModal';
import { DeleteAccountModal } from '@/features/accounts/components/DeleteAccountModal';
import { NetWorthHeader } from '@/features/accounts/components/NetWorthHeader';
import { useAccountSummary } from '@/features/accounts/hooks/useAccountSummary';
import type { Account } from '@/types/account';

export function AccountsPage() {
  const { data: summary, isLoading, isError } = useAccountSummary();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(
    undefined
  );
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  function openCreate() {
    setEditingAccount(undefined);
    setFormOpen(true);
  }

  function openEdit(account: Account) {
    setEditingAccount(account);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingAccount(undefined);
  }

  const accounts = summary?.accounts ?? [];

  return (
    <AppShell title='Accounts' subtitle='Manage your accounts'>
      {/* Summary tiles */}
      <NetWorthHeader
        netWorth={summary?.netWorth ?? 0}
        liquidAmount={summary?.liquidAmount ?? 0}
        investmentAmount={summary?.investmentAmount ?? 0}
        creditAmount={summary?.creditAmount ?? 0}
        isLoading={isLoading}
      />

      {/* Top bar */}
      <div className='flex items-center justify-between'>
        <p className='text-sm text-text-muted'>
          {isLoading
            ? '—'
            : `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
        </p>
        <Button
          label='Add Account'
          icon='pi pi-plus'
          onClick={openCreate}
          pt={{
            root: {
              className:
                'flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary-strong transition-colors',
            },
            icon: { className: 'text-sm' },
          }}
        />
      </div>

      {/* Error state */}
      {isError && (
        <div className='bg-danger-tint border border-danger/30 rounded-lg p-4 flex gap-3 items-center'>
          <i className='pi pi-times-circle text-danger text-lg' />
          <p className='text-sm text-text-muted'>
            Failed to load accounts. Please refresh.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              height='7rem'
              pt={{
                root: { className: 'rounded-xl' },
              }}
            />
          ))}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {accounts.length === 0 ? (
            <Button
              onClick={openCreate}
              pt={{
                root: {
                  className:
                    'w-full border-2 border-dashed border-border-strong rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-text-muted hover:border-primary hover:text-primary transition-colors group',
                },
              }}
            >
              <div className='w-11 h-11 rounded-xl bg-raised flex items-center justify-center group-hover:bg-primary-tint transition-colors'>
                <i className='pi pi-plus text-xl' />
              </div>
              <span className='text-sm font-semibold'>
                Add your first account
              </span>
            </Button>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={openEdit}
                  onDelete={setDeletingAccount}
                />
              ))}
              {/* Add new card */}
              <Button
                onClick={openCreate}
                pt={{
                  root: {
                    className:
                      'border-2 border-dashed border-border-strong rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-text-muted hover:border-primary hover:text-primary transition-colors min-h-28 group',
                  },
                }}
              >
                <div className='w-9 h-9 rounded-lg bg-raised flex items-center justify-center group-hover:bg-primary-tint transition-colors'>
                  <i className='pi pi-plus text-base' />
                </div>
                <span className='text-xs font-semibold'>Add account</span>
              </Button>
            </div>
          )}
        </>
      )}

      <AccountFormModal
        open={formOpen}
        onClose={closeForm}
        account={editingAccount}
      />

      <DeleteAccountModal
        open={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        account={deletingAccount}
      />
    </AppShell>
  );
}
