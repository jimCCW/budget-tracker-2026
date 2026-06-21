'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Modal } from '@/components/ui/Modal';
import {
  incomeSchema,
  type IncomeFormValues,
} from '@/features/income/schemas/incomeSchema';
import {
  expenseSchema,
  type ExpenseFormValues,
} from '@/features/expenses/schemas/expenseSchema';
import { useCreateIncome } from '@/features/income/hooks/useCreateIncome';
import { useCreateExpense } from '@/features/expenses/hooks/useCreateExpense';
import { useCreateRule } from '@/features/recurring/hooks/useCreateRule';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { todayISO } from '@/lib/dateUtils';
import type { Frequency } from '@/types/recurring';
import { FREQUENCIES as REPEAT_FREQUENCIES } from '@/features/recurring/constants/frequencies';

type TxType = 'Expense' | 'Income';

type AddTransactionModalProps = {
  open: boolean;
  onClose: () => void;
  defaultType?: TxType;
};

const inputBase =
  'h-[46px] w-full rounded-md bg-surface border text-sm text-text outline-none transition-shadow focus:border-primary focus:ring-[3px] focus:ring-primary/13';

export function AddTransactionModal({
  open,
  onClose,
  defaultType = 'Expense',
}: AddTransactionModalProps) {
  const [type, setType] = useState<TxType>(defaultType);
  const [repeat, setRepeat] = useState(false);
  const [repeatFreq, setRepeatFreq] = useState<Frequency>('MONTHLY');

  const createIncome = useCreateIncome();
  const createExpense = useCreateExpense();
  const createRule = useCreateRule();
  const activeMutation = repeat
    ? createRule
    : type === 'Expense'
      ? createExpense
      : createIncome;

  const { data: accounts = [] } = useAccounts();

  const { data: allCategories } = useCategories();
  const expenseCategories = (allCategories ?? []).filter(
    (c) => c.type === 'EXPENSE'
  );
  const incomeCategories = (allCategories ?? []).filter(
    (c) => c.type === 'INCOME'
  );

  const expenseForm = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      accountId: '',
      categoryId: '',
      amount: '' as unknown as number,
      date: todayISO(),
      description: '',
    },
  });

  const incomeForm = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      accountId: '',
      categoryId: '',
      amount: '' as unknown as number,
      date: todayISO(),
      note: '',
    },
  });

  // Reset both forms when the modal opens.
  useEffect(() => {
    if (!open) return;
    const defaultAccountId = accounts[0]?.id ?? '';
    expenseForm.reset({
      accountId: defaultAccountId,
      categoryId: expenseCategories[0]?.id ?? '',
      amount: '' as unknown as number,
      date: todayISO(),
      description: '',
    });
    incomeForm.reset({
      accountId: defaultAccountId,
      categoryId: incomeCategories[0]?.id ?? '',
      amount: '' as unknown as number,
      date: todayISO(),
      note: '',
    });
    setType(defaultType);
    setRepeat(false);
    setRepeatFreq('MONTHLY');
    createExpense.reset();
    createIncome.reset();
    createRule.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleTypeChange(next: TxType) {
    // Carry the selected account across the toggle.
    const currentAccountId =
      type === 'Expense'
        ? expenseForm.getValues('accountId')
        : incomeForm.getValues('accountId');
    setType(next);
    if (next === 'Expense') {
      expenseForm.setValue('accountId', currentAccountId);
    } else {
      incomeForm.setValue('accountId', currentAccountId);
    }
    createExpense.reset();
    createIncome.reset();
  }

  async function onExpenseSubmit(values: ExpenseFormValues) {
    if (repeat) {
      await createRule.mutateAsync({
        kind: 'EXPENSE',
        amount: values.amount,
        accountId: values.accountId,
        categoryId: values.categoryId,
        note: values.description,
        frequency: repeatFreq,
        startDate: values.date,
      });
    } else {
      await createExpense.mutateAsync(values);
    }
    onClose();
  }

  async function onIncomeSubmit(values: IncomeFormValues) {
    if (repeat) {
      await createRule.mutateAsync({
        kind: 'INCOME',
        amount: values.amount,
        accountId: values.accountId,
        categoryId: values.categoryId,
        note: values.note,
        frequency: repeatFreq,
        startDate: values.date,
      });
    } else {
      await createIncome.mutateAsync(values);
    }
    onClose();
  }

  const isExpense = type === 'Expense';
  const watchedAccountId = isExpense
    ? expenseForm.watch('accountId')
    : incomeForm.watch('accountId');
  const watchedCategoryId = expenseForm.watch('categoryId');
  const watchedIncomeCategoryId = incomeForm.watch('categoryId');
  const accentClass = isExpense
    ? 'bg-danger hover:opacity-90 text-white'
    : 'bg-success hover:opacity-90 text-white';

  return (
    <Modal open={open} onClose={onClose} maxWidth='max-w-xl'>
      {/* Header */}
      <div className='flex items-center justify-between px-6 py-4 border-b border-border'>
        <h2 className='text-base font-extrabold text-text tracking-tight'>
          New transaction
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

      {/* Body — two separate forms rendered/hidden by type */}
      <div className='p-6 flex flex-col gap-5'>
        {/* Type toggle */}
        <div className='flex rounded-lg border border-border bg-bg p-1 gap-1'>
          {(['Expense', 'Income'] as TxType[]).map((t) => (
            <Button
              key={t}
              type='button'
              onClick={() => handleTypeChange(t)}
              label={t}
              pt={{
                root: {
                  className: `flex-1 h-9 rounded-md text-sm font-semibold transition-all ${
                    type === t
                      ? t === 'Expense'
                        ? 'bg-surface text-danger shadow-sm'
                        : 'bg-surface text-success shadow-sm'
                      : 'text-text-muted hover:text-text'
                  }`,
                },
              }}
            />
          ))}
        </div>

        {/* Expense form */}
        {isExpense && (
          <form
            onSubmit={expenseForm.handleSubmit(onExpenseSubmit)}
            noValidate
            className='flex flex-col gap-5'
          >
            <AmountField
              registration={expenseForm.register('amount', {
                valueAsNumber: true,
              })}
              error={expenseForm.formState.errors.amount?.message}
              className={`${inputBase} pl-10 tabular-nums`}
            />

            {/* Category */}
            <div className='flex flex-col gap-2'>
              <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
                Category
              </label>
              <div className='flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1'>
                {expenseCategories.map((cat) => {
                  const selected = cat.id === watchedCategoryId;
                  const color = cat.color ?? 'var(--color-primary)';
                  return (
                    <Button
                      key={cat.id}
                      type='button'
                      onClick={() => expenseForm.setValue('categoryId', cat.id)}
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
              {expenseForm.formState.errors.categoryId && (
                <p className='text-xs text-danger'>
                  {expenseForm.formState.errors.categoryId.message}
                </p>
              )}
            </div>

            <AccountPicker
              accounts={accounts}
              selectedId={watchedAccountId}
              onSelect={(id) => expenseForm.setValue('accountId', id)}
              label='Pay from'
              accent='danger'
              error={expenseForm.formState.errors.accountId?.message}
            />

            <DateField
              registration={expenseForm.register('date')}
              error={expenseForm.formState.errors.date?.message}
            />

            <RepeatSection
              repeat={repeat}
              onRepeatChange={setRepeat}
              frequency={repeatFreq}
              onFrequencyChange={setRepeatFreq}
            />

            <NoteField
              registration={expenseForm.register('description')}
              placeholder='e.g. Grocery run'
            />

            <FormActions
              mutation={createExpense}
              accentClass={accentClass}
              onClose={onClose}
            />
          </form>
        )}

        {/* Income form */}
        {!isExpense && (
          <form
            onSubmit={incomeForm.handleSubmit(onIncomeSubmit)}
            noValidate
            className='flex flex-col gap-5'
          >
            <AmountField
              registration={incomeForm.register('amount', {
                valueAsNumber: true,
              })}
              error={incomeForm.formState.errors.amount?.message}
              className={`${inputBase} pl-10 tabular-nums text-success`}
            />

            {/* Category */}
            <div className='flex flex-col gap-2'>
              <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
                Category
              </label>
              <div className='flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1'>
                {incomeCategories.map((cat) => {
                  const selected = cat.id === watchedIncomeCategoryId;
                  const color = cat.color ?? 'var(--color-success)';
                  return (
                    <Button
                      key={cat.id}
                      type='button'
                      onClick={() =>
                        incomeForm.setValue('categoryId', cat.id, {
                          shouldValidate: true,
                        })
                      }
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
              {incomeForm.formState.errors.categoryId && (
                <p className='text-xs text-danger'>
                  {incomeForm.formState.errors.categoryId.message}
                </p>
              )}
            </div>

            <AccountPicker
              accounts={accounts}
              selectedId={watchedAccountId}
              onSelect={(id) => incomeForm.setValue('accountId', id)}
              label='Deposit to'
              accent='success'
              error={incomeForm.formState.errors.accountId?.message}
            />

            <DateField
              registration={incomeForm.register('date')}
              error={incomeForm.formState.errors.date?.message}
            />

            <RepeatSection
              repeat={repeat}
              onRepeatChange={setRepeat}
              frequency={repeatFreq}
              onFrequencyChange={setRepeatFreq}
            />

            <NoteField
              registration={incomeForm.register('note')}
              placeholder='e.g. Monthly salary'
            />

            <FormActions
              mutation={createIncome}
              accentClass={accentClass}
              onClose={onClose}
            />
          </form>
        )}

        {/* Error banner (outside both forms, shown when either has an API error) */}
        {activeMutation.isError && (
          <div className='bg-danger-tint border border-danger/30 rounded-md p-3 flex gap-2 items-start -mt-2'>
            <i className='pi pi-times-circle text-danger mt-px shrink-0 text-lg' />
            <p className='text-sm text-text-muted mt-0.5'>
              {activeMutation.error instanceof Error
                ? activeMutation.error.message
                : 'Something went wrong.'}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ── Sub-components (private to this file) ── */

function AmountField({
  registration,
  error,
  className,
}: {
  registration: object;
  error?: string;
  className: string;
}) {
  return (
    <div className='flex flex-col gap-1'>
      <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
        Amount
      </label>
      <div className='relative'>
        <span className='absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none font-medium'>
          S$
        </span>
        <InputText
          {...(registration as Parameters<typeof InputText>[0])}
          type='number'
          step='0.01'
          min='0'
          placeholder='0.00'
          className={`${className} ${error ? 'border-danger' : 'border-border'}`}
        />
      </div>
      {error && <p className='text-xs text-danger'>{error}</p>}
    </div>
  );
}

function AccountPicker({
  accounts,
  selectedId,
  onSelect,
  label,
  accent,
  error,
}: {
  accounts: { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  label: string;
  accent: 'danger' | 'success';
  error?: string;
}) {
  const selectedClass =
    accent === 'danger'
      ? 'bg-danger-tint border-danger text-danger'
      : 'bg-success-tint border-success text-success';

  return (
    <div className='flex flex-col gap-2'>
      <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
        {label}
      </label>
      <div className='flex flex-wrap gap-2'>
        {accounts.map((acc) => (
          <Button
            key={acc.id}
            type='button'
            onClick={() => onSelect(acc.id)}
            pt={{
              root: {
                className: `flex items-center gap-1.5 px-3 h-8 rounded-full border text-xs font-semibold transition-all ${
                  acc.id === selectedId
                    ? selectedClass
                    : 'bg-surface border-border text-text hover:bg-raised'
                }`,
              },
            }}
          >
            <i className='pi pi-wallet text-[11px]' />
            {acc.name}
          </Button>
        ))}
      </div>
      {error && <p className='text-xs text-danger'>{error}</p>}
    </div>
  );
}

function DateField({
  registration,
  error,
}: {
  registration: object;
  error?: string;
}) {
  return (
    <div className='flex flex-col gap-1'>
      <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
        Date
      </label>
      <div className='relative'>
        <i className='pi pi-calendar absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm' />
        <InputText
          {...(registration as Parameters<typeof InputText>[0])}
          type='date'
          className={`h-[46px] w-full rounded-md bg-surface border text-sm text-text pl-10 pr-3 outline-none transition-shadow focus:border-primary focus:ring-[3px] focus:ring-primary/13 ${
            error ? 'border-danger' : 'border-border'
          }`}
        />
      </div>
      {error && <p className='text-xs text-danger'>{error}</p>}
    </div>
  );
}

function NoteField({
  registration,
  placeholder,
}: {
  registration: object;
  placeholder: string;
}) {
  return (
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
          {...(registration as Parameters<typeof InputText>[0])}
          placeholder={placeholder}
          autoComplete='off'
          className='h-[46px] w-full rounded-md bg-surface border border-border text-sm text-text pl-10 outline-none transition-shadow focus:border-primary focus:ring-[3px] focus:ring-primary/13'
        />
      </div>
    </div>
  );
}

function RepeatSection({
  repeat,
  onRepeatChange,
  frequency,
  onFrequencyChange,
}: {
  repeat: boolean;
  onRepeatChange: (v: boolean) => void;
  frequency: Frequency;
  onFrequencyChange: (v: Frequency) => void;
}) {
  return (
    <div className='flex flex-col gap-3'>
      {/* Checkbox row */}
      <label className='flex items-center gap-2.5 cursor-pointer select-none'>
        <Checkbox
          checked={repeat}
          onChange={(e) => onRepeatChange(!!e.checked)}
          pt={{
            box: {
              className: `w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                repeat
                  ? 'bg-primary border-primary'
                  : 'bg-surface border-border'
              }`,
            },
            icon: { className: 'text-white text-[10px]' },
            input: { className: 'sr-only' },
          }}
        />
        <span className='text-sm font-medium text-text'>
          Repeat this transaction
        </span>
      </label>

      {/* Frequency pills — shown when checked */}
      {repeat && (
        <div className='flex gap-2 pl-6'>
          {REPEAT_FREQUENCIES.map(({ value, label }) => (
            <Button
              key={value}
              type='button'
              label={label}
              onClick={() => onFrequencyChange(value)}
              pt={{
                root: {
                  className: `px-3 h-8 rounded-full border text-xs font-semibold transition-all ${
                    frequency === value
                      ? 'bg-primary-tint border-primary text-primary'
                      : 'bg-surface border-border text-text hover:bg-raised'
                  }`,
                },
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FormActions({
  mutation,
  accentClass,
  onClose,
}: {
  mutation: { isPending: boolean };
  accentClass: string;
  onClose: () => void;
}) {
  return (
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
        label={mutation.isPending ? 'Saving…' : 'Save transaction'}
        pt={{
          root: {
            className: `flex-1 h-11 text-sm font-semibold rounded-md transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${accentClass}`,
          },
          loadingIcon: { className: 'animate-spin text-sm' },
        }}
      />
    </div>
  );
}
