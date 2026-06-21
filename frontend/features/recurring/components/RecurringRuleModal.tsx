'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Modal } from '@/components/ui/Modal';
import {
  recurringSchema,
  type RecurringFormValues,
} from '../schemas/recurringSchema';
import { useCreateRule } from '../hooks/useCreateRule';
import { useUpdateRule } from '../hooks/useUpdateRule';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { formatCurrency } from '@/lib/formatCurrency';
import { todayISO } from '@/lib/dateUtils';
import type {
  RecurringRule,
  RecurringKind,
  Frequency,
} from '@/types/recurring';
import { FREQUENCIES } from '../constants/frequencies';

export type RecurringRuleModalProps = {
  open: boolean;
  onClose: () => void;
  rule?: RecurringRule;
};

const inputBase =
  'h-[46px] w-full rounded-md bg-surface border text-sm text-text outline-none transition-shadow focus:border-primary focus:ring-[3px] focus:ring-primary/13';

export function RecurringRuleModal({
  open,
  onClose,
  rule,
}: RecurringRuleModalProps) {
  const isEdit = !!rule;
  const createRule = useCreateRule();
  const updateRule = useUpdateRule();
  const mutation = isEdit ? updateRule : createRule;

  const [kind, setKind] = useState<RecurringKind>(rule?.kind ?? 'EXPENSE');

  const { data: accounts = [] } = useAccounts();
  const { data: allCategories } = useCategories();
  const expenseCategories = (allCategories ?? []).filter(
    (c) => c.type === 'EXPENSE'
  );
  const incomeCategories = (allCategories ?? []).filter(
    (c) => c.type === 'INCOME'
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      kind: rule?.kind ?? 'EXPENSE',
      amount: rule?.amount ?? ('' as unknown as number),
      accountId: rule?.accountId ?? '',
      categoryId: rule?.categoryId ?? '',
      note: rule?.note ?? '',
      frequency: rule?.frequency ?? 'MONTHLY',
      startDate: rule?.startDate ? rule.startDate.split('T')[0] : todayISO(),
      endDate: rule?.endDate ? rule.endDate.split('T')[0] : '',
    },
  });

  const watchedAccountId = watch('accountId');
  const watchedCategoryId = watch('categoryId');
  const watchedFrequency = watch('frequency');
  const watchedAmount = watch('amount');

  useEffect(() => {
    if (!open) return;
    const k = rule?.kind ?? 'EXPENSE';
    setKind(k);
    reset({
      kind: k,
      amount: rule?.amount ?? ('' as unknown as number),
      accountId: rule?.accountId ?? accounts[0]?.id ?? '',
      categoryId:
        rule?.categoryId ??
        (k === 'EXPENSE'
          ? expenseCategories[0]?.id
          : incomeCategories[0]?.id) ??
        '',
      note: rule?.note ?? '',
      frequency: rule?.frequency ?? 'MONTHLY',
      startDate: rule?.startDate ? rule.startDate.split('T')[0] : todayISO(),
      endDate: rule?.endDate ? rule.endDate.split('T')[0] : '',
    });
    createRule.reset();
    updateRule.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rule]);

  function handleKindChange(next: RecurringKind) {
    setKind(next);
    setValue('kind', next);
    const defaultCategory =
      next === 'EXPENSE' ? expenseCategories[0]?.id : incomeCategories[0]?.id;
    setValue('categoryId', defaultCategory ?? '');
  }

  async function onSubmit(values: RecurringFormValues) {
    const payload = {
      ...values,
      endDate: values.endDate || undefined,
      categoryId: values.categoryId,
    };
    if (isEdit && rule) {
      await updateRule.mutateAsync({ id: rule.id, values: payload });
    } else {
      await createRule.mutateAsync(payload);
    }
    onClose();
  }

  const isExpense = kind === 'EXPENSE';
  const visibleCategories = isExpense ? expenseCategories : incomeCategories;
  const displayAmount = isNaN(Number(watchedAmount))
    ? 0
    : Number(watchedAmount);
  const accentClass = isExpense
    ? 'bg-danger hover:opacity-90 text-white'
    : 'bg-success hover:opacity-90 text-white';

  return (
    <Modal open={open} onClose={onClose} maxWidth='max-w-2xl'>
      {/* Header */}
      <div className='flex items-center justify-between px-6 py-4 border-b border-border'>
        <h2 className='text-base font-extrabold text-text tracking-tight'>
          {isEdit ? 'Edit recurring rule' : 'New recurring rule'}
        </h2>
        <Button
          type='button'
          icon='pi pi-times'
          onClick={onClose}
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
        className='p-6 flex flex-col gap-5'
      >
        {/* Kind toggle */}
        <div className='flex rounded-lg border border-border bg-bg p-1 gap-1'>
          {(['EXPENSE', 'INCOME'] as RecurringKind[]).map((k) => (
            <Button
              key={k}
              type='button'
              label={k === 'EXPENSE' ? 'Expense' : 'Income'}
              onClick={() => handleKindChange(k)}
              pt={{
                root: {
                  className: `flex-1 h-9 rounded-md text-sm font-semibold transition-all ${
                    kind === k
                      ? k === 'EXPENSE'
                        ? 'bg-surface text-danger shadow-sm'
                        : 'bg-surface text-success shadow-sm'
                      : 'text-text-muted hover:text-text'
                  }`,
                },
              }}
            />
          ))}
        </div>

        {/* Amount */}
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
            Amount
          </label>
          <div className='relative'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none font-medium'>
              S$
            </span>
            <InputText
              {...register('amount', { valueAsNumber: true })}
              type='number'
              step='0.01'
              min='0'
              placeholder='0.00'
              className={`${inputBase} pl-10 tabular-nums ${
                isExpense ? '' : 'text-success'
              } ${errors.amount ? 'border-danger' : 'border-border'}`}
            />
          </div>
          {errors.amount && (
            <p className='text-xs text-danger'>{errors.amount.message}</p>
          )}
          {displayAmount > 0 && (
            <p className='text-xs text-text-muted'>
              {isExpense ? '-' : '+'}
              {formatCurrency(displayAmount)} per occurrence
            </p>
          )}
        </div>

        {/* Frequency */}
        <div className='flex flex-col gap-2'>
          <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
            Frequency
          </label>
          <div className='flex gap-2'>
            {FREQUENCIES.map(({ value, label, icon }) => (
              <Button
                key={value}
                type='button'
                onClick={() => setValue('frequency', value)}
                pt={{
                  root: {
                    className: `flex items-center gap-2 px-4 h-9 rounded-full border text-sm font-semibold transition-all ${
                      watchedFrequency === value
                        ? 'bg-primary-tint border-primary text-primary'
                        : 'bg-surface border-border text-text hover:bg-raised'
                    }`,
                  },
                }}
              >
                <i className={`pi ${icon} text-xs`} />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Category — expense only */}
        <div className='flex flex-col gap-2'>
          <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
            Category
          </label>
          <div className='flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1'>
            {visibleCategories.map((cat) => {
              const selected = cat.id === watchedCategoryId;
              const color = cat.color ?? 'var(--color-primary)';
              return (
                <Button
                  key={cat.id}
                  type='button'
                  onClick={() => setValue('categoryId', cat.id)}
                  pt={{
                    root: {
                      className:
                        'flex items-center gap-1.5 px-3 h-8 rounded-full border text-xs font-semibold transition-all',
                      style: selected
                        ? {
                            background: `${color}18`,
                            borderColor: color,
                            color,
                          }
                        : {
                            background: 'var(--color-surface)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text)',
                          },
                    },
                  }}
                >
                  <i className={`pi ${cat.icon ?? 'pi-tag'} text-[11px]`} />
                  {cat.name}
                </Button>
              );
            })}
          </div>
          {errors.categoryId && (
            <p className='text-xs text-danger'>{errors.categoryId.message}</p>
          )}
        </div>

        {/* Account */}
        <div className='flex flex-col gap-2'>
          <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
            {isExpense ? 'Pay from' : 'Deposit to'}
          </label>
          <div className='flex flex-wrap gap-2'>
            {accounts.map((acc) => {
              const selected = acc.id === watchedAccountId;
              return (
                <Button
                  key={acc.id}
                  type='button'
                  onClick={() => setValue('accountId', acc.id)}
                  pt={{
                    root: {
                      className: `flex items-center gap-1.5 px-3 h-8 rounded-full border text-xs font-semibold transition-all ${
                        selected
                          ? isExpense
                            ? 'bg-danger-tint border-danger text-danger'
                            : 'bg-success-tint border-success text-success'
                          : 'bg-surface border-border text-text hover:bg-raised'
                      }`,
                    },
                  }}
                >
                  <i className='pi pi-wallet text-[11px]' />
                  {acc.name}
                </Button>
              );
            })}
          </div>
          {errors.accountId && (
            <p className='text-xs text-danger'>{errors.accountId.message}</p>
          )}
        </div>

        {/* Start + End date */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
              Start date
            </label>
            <div className='relative'>
              <i className='pi pi-calendar absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm' />
              <InputText
                {...register('startDate')}
                type='date'
                className={`${inputBase} pl-10 pr-3 ${errors.startDate ? 'border-danger' : 'border-border'}`}
              />
            </div>
            {errors.startDate && (
              <p className='text-xs text-danger'>{errors.startDate.message}</p>
            )}
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
              End date{' '}
              <span className='font-normal normal-case text-text-dim'>
                (optional)
              </span>
            </label>
            <div className='relative'>
              <i className='pi pi-calendar absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm' />
              <InputText
                {...register('endDate')}
                type='date'
                className={`${inputBase} pl-10 pr-3 border-border`}
              />
            </div>
          </div>
        </div>

        {/* Note */}
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
            Note{' '}
            <span className='font-normal normal-case text-text-dim'>
              (optional)
            </span>
          </label>
          <div className='relative'>
            <i className='pi pi-pencil absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm' />
            <InputText
              {...register('note')}
              placeholder={isExpense ? 'e.g. Monthly rent' : 'e.g. Salary'}
              autoComplete='off'
              className={`${inputBase} pl-10 border-border`}
            />
          </div>
        </div>

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

        {/* Actions */}
        <div className='flex gap-3 pt-1'>
          <Button
            type='button'
            label='Cancel'
            onClick={onClose}
            pt={{
              root: {
                className:
                  'flex-1 h-11 rounded-md border border-border text-sm font-semibold text-text hover:bg-raised transition-colors',
              },
            }}
          />
          <Button
            type='submit'
            loading={mutation.isPending}
            disabled={mutation.isPending}
            label={
              mutation.isPending
                ? 'Saving…'
                : isEdit
                  ? 'Save changes'
                  : 'Create rule'
            }
            pt={{
              root: {
                className: `flex-1 h-11 text-sm font-semibold rounded-md transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${accentClass}`,
              },
              loadingIcon: { className: 'animate-spin text-sm' },
            }}
          />
        </div>
      </form>
    </Modal>
  );
}
