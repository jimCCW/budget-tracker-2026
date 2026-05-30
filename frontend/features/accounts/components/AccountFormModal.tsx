'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Modal } from '@/components/ui/Modal';
import {
  accountSchema,
  ACCOUNT_TYPES,
  type AccountFormValues,
  type AccountType,
} from '@/features/accounts/schemas/accountSchema';
import { useCreateAccount } from '@/features/accounts/hooks/useCreateAccount';
import { useUpdateAccount } from '@/features/accounts/hooks/useUpdateAccount';
import {
  ACCOUNT_TYPE_META,
  ACCOUNT_COLORS,
  DEFAULT_ACCOUNT_COLOR,
} from '@/features/accounts/constants';
import { formatCurrency } from '@/lib/formatCurrency';
import type { Account } from '@/types/account';

type Props = {
  open: boolean;
  onClose: () => void;
  account?: Account;
};

const inputBase =
  'h-[46px] w-full rounded-md bg-surface border text-sm text-text pl-[42px] pr-3 outline-none transition-shadow focus:border-primary focus:ring-[3px] focus:ring-primary/[0.13]';

export function AccountFormModal({ open, onClose, account }: Props) {
  const isEdit = !!account;
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const mutation = isEdit ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name ?? '',
      type: (account?.type as AccountType) ?? 'BANK',
      balance: account?.balance ?? 0,
      color: account?.color ?? DEFAULT_ACCOUNT_COLOR,
    },
  });

  const watchedName = watch('name');
  const watchedType = watch('type') ?? 'BANK';
  const watchedColor = watch('color') ?? DEFAULT_ACCOUNT_COLOR;
  const watchedBalance = watch('balance') ?? 0;

  useEffect(() => {
    if (open) {
      reset({
        name: account?.name ?? '',
        type: (account?.type as AccountType) ?? 'BANK',
        balance: account?.balance ?? 0,
        color: account?.color ?? DEFAULT_ACCOUNT_COLOR,
      });
      createMutation.reset();
      updateMutation.reset();
    }
  }, [open, account]);

  async function onSubmit(values: AccountFormValues) {
    if (isEdit && account) {
      await updateMutation.mutateAsync({ id: account.id, values });
    } else {
      await createMutation.mutateAsync(values);
    }
    onClose();
  }

  const meta = ACCOUNT_TYPE_META[watchedType];
  const displayName = watchedName.trim() || 'Untitled account';

  return (
    <Modal open={open} onClose={onClose} maxWidth='max-w-4xl'>
      {/* Header */}
      <div className='flex items-center justify-between px-6 py-4 border-b border-border'>
        <h2 className='text-base font-extrabold text-text tracking-tight'>
          {isEdit ? 'Edit account' : 'New account'}
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

      {/* Body: 2-col on lg+, stacked on mobile */}
      <div className='flex flex-col lg:flex-row'>
        {/* ── Preview pane ── */}
        <div className='lg:w-64 lg:shrink-0 p-6 border-b lg:border-b-0 lg:border-r border-border flex flex-col gap-4'>
          <p className='text-[10px] font-bold text-text-dim uppercase tracking-widest'>
            Preview
          </p>

          {/* Hero stamp */}
          <div className='flex flex-col items-center gap-3 py-2'>
            <div
              className='w-20 h-20 rounded-2xl flex items-center justify-center text-white'
              style={{
                backgroundColor: watchedColor,
                boxShadow: `0 10px 24px ${watchedColor}55`,
              }}
            >
              <i className={`pi ${meta.icon} text-3xl`} />
            </div>
            <div
              className='text-base font-extrabold text-center max-w-40 truncate'
              style={{
                color: watchedName
                  ? 'var(--color-text)'
                  : 'var(--color-text-muted)',
              }}
            >
              {displayName}
            </div>
            <span
              className='text-[10.5px] font-bold px-2 py-0.5 rounded-full'
              style={{
                background: `${watchedColor}22`,
                color: watchedColor,
              }}
            >
              {meta.label.toUpperCase()}
            </span>
          </div>

          {/* Balance preview */}
          <div>
            <p className='text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2'>
              Balance
            </p>
            <div className='bg-bg rounded-lg p-3 text-center'>
              <div className='text-xl font-extrabold tabular-nums text-text'>
                {formatCurrency(isNaN(watchedBalance) ? 0 : watchedBalance)}
              </div>
              <div className='text-xs text-text-muted mt-1'>
                {meta.label} account
              </div>
            </div>
          </div>
        </div>

        {/* ── Form pane ── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className='flex-1 p-6 flex flex-col gap-5'
        >
          {/* Error banner */}
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

          {/* Type selector */}
          <div className='flex flex-col gap-2'>
            <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
              Account type
            </label>
            <div className='grid grid-cols-2 gap-3'>
              {ACCOUNT_TYPES.map((type) => {
                const typeMeta = ACCOUNT_TYPE_META[type];
                const selected = watchedType === type;
                return (
                  <Button
                    key={type}
                    type='button'
                    onClick={() => setValue('type', type)}
                    pt={{
                      root: {
                        className:
                          'flex items-center gap-3 p-3.5 rounded-lg border transition-all text-left',
                        style: selected
                          ? {
                              background: `${typeMeta.color}18`,
                              borderColor: typeMeta.color,
                            }
                          : {
                              background: 'var(--color-surface)',
                              borderColor: 'var(--color-border)',
                            },
                      },
                    }}
                  >
                    <div
                      className='w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
                      style={
                        selected
                          ? { background: typeMeta.color, color: '#fff' }
                          : {
                              background: `${typeMeta.color}22`,
                              color: typeMeta.color,
                            }
                      }
                    >
                      <i className={`pi ${typeMeta.icon} text-base`} />
                    </div>
                    <div>
                      <div className='text-sm font-bold text-text'>
                        {typeMeta.label}
                      </div>
                      <div className='text-xs text-text-muted mt-0.5 capitalize'>
                        {typeMeta.group}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
              Account name
            </label>
            <div className='relative'>
              <i className='pi pi-wallet absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm' />
              <InputText
                {...register('name')}
                placeholder='e.g. DBS Savings'
                autoComplete='off'
                className={`${inputBase} ${errors.name ? 'border-danger' : 'border-border'}`}
              />
            </div>
            {errors.name && (
              <p className='text-xs text-danger'>{errors.name.message}</p>
            )}
          </div>

          {/* Balance */}
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
              {isEdit ? 'Balance' : 'Initial balance'}
            </label>
            <div className='relative'>
              <i className='pi pi-dollar absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm' />
              <InputText
                {...register('balance', { valueAsNumber: true })}
                type='number'
                step='0.01'
                placeholder='0.00'
                className={`${inputBase} ${errors.balance ? 'border-danger' : 'border-border'}`}
              />
            </div>
            {errors.balance && (
              <p className='text-xs text-danger'>{errors.balance.message}</p>
            )}
          </div>

          {/* Color picker */}
          <div className='flex flex-col gap-2'>
            <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
              Color
            </label>
            <div className='flex flex-wrap gap-2.5'>
              {ACCOUNT_COLORS.map((c) => {
                const selected = watchedColor === c;
                return (
                  <Button
                    key={c}
                    type='button'
                    aria-label={c}
                    onClick={() => setValue('color', c)}
                    pt={{
                      root: {
                        className:
                          'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                        style: {
                          backgroundColor: c,
                          border: selected
                            ? '2.5px solid var(--color-surface)'
                            : 'none',
                          boxShadow: selected
                            ? `0 0 0 2px ${c}, 0 4px 10px ${c}55`
                            : '0 1px 3px rgba(0,0,0,.15)',
                        },
                      },
                    }}
                  >
                    {selected && (
                      <i className='pi pi-check text-white text-xs font-bold' />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className='flex gap-3 pt-2 mt-auto'>
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
              label={
                mutation.isPending
                  ? isEdit
                    ? 'Saving…'
                    : 'Creating…'
                  : isEdit
                    ? 'Save changes'
                    : 'Create account'
              }
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
      </div>
    </Modal>
  );
}
