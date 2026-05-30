'use client';
import { useState, useRef, useEffect } from 'react';
import type { Account } from '@/types/account';
import { ACCOUNT_TYPE_META } from '@/features/accounts/constants';
import { formatCurrency } from '@/lib/formatCurrency';

type Props = {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
};

export function AccountCard({ account, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const meta = ACCOUNT_TYPE_META[account.type];
  const color = account.color ?? meta.color;
  const icon = account.icon ?? meta.icon;

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <div className='bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow'>
      <div className='flex items-center gap-3'>
        <div
          className='w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white'
          style={{ backgroundColor: color }}
        >
          <i className={`pi ${icon} text-lg`} />
        </div>

        <div className='flex-1 min-w-0'>
          <div className='text-sm font-bold text-text truncate'>
            {account.name}
          </div>
          <div className='text-xs text-text-muted mt-0.5'>{meta.label}</div>
        </div>

        <div ref={menuRef} className='relative'>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className='w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-raised transition-colors'
            aria-label='Account options'
          >
            <i className='pi pi-ellipsis-v text-sm' />
          </button>

          {menuOpen && (
            <div className='absolute right-0 top-8 z-10 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-32'>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(account);
                }}
                className='w-full text-left px-3 py-2 text-sm text-text hover:bg-raised flex items-center gap-2 transition-colors'
              >
                <i className='pi pi-pencil text-xs' />
                Edit
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(account);
                }}
                className='w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger-tint flex items-center gap-2 transition-colors'
              >
                <i className='pi pi-trash text-xs' />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className={`text-xl font-extrabold tabular-nums ${account.type === 'CREDIT' ? 'text-danger' : 'text-text'}`}
      >
        {formatCurrency(account.balance)}
      </div>

      {/* Color accent bar */}
      <div
        className='h-1 rounded-full opacity-30'
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
