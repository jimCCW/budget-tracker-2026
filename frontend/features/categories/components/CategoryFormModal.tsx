'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Modal } from '@/components/ui/Modal';
import {
  categorySchema,
  type CategoryFormValues,
  type CategoryType,
} from '@/features/categories/schemas/categorySchema';
import { useCreateCategory } from '@/features/categories/hooks/useCreateCategory';
import { useUpdateCategory } from '@/features/categories/hooks/useUpdateCategory';
import {
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  DEFAULT_COLOR,
  DEFAULT_ICON,
  DEFAULT_TYPE,
} from '@/features/categories/constants';
import type { Category } from '@/types/category';

type Props = {
  open: boolean;
  onClose: () => void;
  /** When provided the modal operates in edit mode. */
  category?: Category;
  /** Pre-selects the type when opening in create mode. */
  defaultType?: CategoryType;
};

const inputBase =
  'h-[46px] w-full rounded-md bg-surface border text-sm text-text pl-[42px] pr-3 outline-none transition-shadow focus:border-primary focus:ring-[3px] focus:ring-primary/[0.13]';

const TYPE_OPTIONS = [
  {
    value: 'EXPENSE' as CategoryType,
    label: 'Expense',
    desc: 'Money going out',
    icon: 'pi-arrow-down',
    activeBg: 'var(--color-danger-tint)',
    activeBorder: 'var(--color-danger)',
    activeColor: 'var(--color-danger)',
  },
  {
    value: 'INCOME' as CategoryType,
    label: 'Income',
    desc: 'Money coming in',
    icon: 'pi-arrow-up',
    activeBg: 'var(--color-success-tint)',
    activeBorder: 'var(--color-success)',
    activeColor: 'var(--color-success)',
  },
] as const;

export function CategoryFormModal({ open, onClose, category, defaultType }: Props) {
  const isEdit = !!category;
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const mutation = isEdit ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      icon: category?.icon ?? DEFAULT_ICON,
      color: category?.color ?? DEFAULT_COLOR,
      type: category?.type ?? defaultType ?? DEFAULT_TYPE,
    },
  });

  const watchedName = watch('name');
  const watchedIcon = watch('icon') ?? DEFAULT_ICON;
  const watchedColor = watch('color') ?? DEFAULT_COLOR;
  const watchedType = watch('type') ?? DEFAULT_TYPE;

  useEffect(() => {
    if (open) {
      reset({
        name: category?.name ?? '',
        icon: category?.icon ?? DEFAULT_ICON,
        color: category?.color ?? DEFAULT_COLOR,
        type: category?.type ?? defaultType ?? DEFAULT_TYPE,
      });
      createMutation.reset();
      updateMutation.reset();
    }
  }, [open, category, defaultType]);

  async function onSubmit(values: CategoryFormValues) {
    if (isEdit && category) {
      await updateMutation.mutateAsync({ id: category.id, values });
    } else {
      await createMutation.mutateAsync(values);
    }
    onClose();
  }

  const displayName = watchedName.trim() || 'Untitled category';
  const activeType = TYPE_OPTIONS.find((o) => o.value === watchedType) ?? TYPE_OPTIONS[0];

  return (
    <Modal open={open} onClose={onClose} maxWidth='max-w-4xl'>
      {/* Header */}
      <div className='flex items-center justify-between px-6 py-4 border-b border-border'>
        <h2 className='text-base font-extrabold text-text tracking-tight'>
          {isEdit ? 'Edit category' : 'New category'}
        </h2>
        <button
          onClick={onClose}
          className='w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-raised transition-colors'
          aria-label='Close'
        >
          <i className='pi pi-times text-sm' />
        </button>
      </div>

      {/* Body: 2-col on lg+, stacked on mobile */}
      <div className='flex flex-col lg:flex-row'>
        {/* ── Preview pane ── */}
        <div className='lg:w-64 lg:shrink-0 p-6 border-b lg:border-b-0 lg:border-r border-border flex flex-col gap-4'>
          <p className='text-[10px] font-bold text-text-dim uppercase tracking-widest'>Preview</p>

          {/* Hero stamp */}
          <div className='flex flex-col items-center gap-3 py-2'>
            <div
              className='w-20 h-20 rounded-2xl flex items-center justify-center text-white'
              style={{ backgroundColor: watchedColor, boxShadow: `0 10px 24px ${watchedColor}55` }}
            >
              <i className={`pi ${watchedIcon} text-3xl`} />
            </div>
            <div
              className='text-base font-extrabold text-center max-w-40 truncate'
              style={{ color: watchedName ? 'var(--color-text)' : 'var(--color-text-muted)' }}
            >
              {displayName}
            </div>
            <span
              className='text-[10.5px] font-bold px-2 py-0.5 rounded-full'
              style={{
                background: activeType.activeBg,
                color: activeType.activeColor,
              }}
            >
              {activeType.label.toUpperCase()}
            </span>
          </div>

          {/* In activity */}
          <div>
            <p className='text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2'>
              In your activity
            </p>
            <div className='bg-bg rounded-lg p-3 flex items-center gap-2.5'>
              <div
                className='w-8 h-8 rounded-lg flex items-center justify-center shrink-0'
                style={{ backgroundColor: `${watchedColor}22`, color: watchedColor }}
              >
                <i className={`pi ${watchedIcon} text-sm`} />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='text-xs font-bold text-text truncate'>Sample merchant</div>
                <div className='text-[10.5px] text-text-muted mt-0.5 truncate'>{displayName}</div>
              </div>
              <div
                className='text-xs font-bold'
                style={{ color: watchedType === 'INCOME' ? 'var(--color-success)' : 'var(--color-text)' }}
              >
                {watchedType === 'INCOME' ? '+' : '-'}$24.50
              </div>
            </div>
          </div>

          {/* In reports */}
          <div>
            <p className='text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2'>
              In reports
            </p>
            <div className='bg-bg rounded-lg p-3 flex items-center gap-2 text-xs'>
              <span className='w-2 h-2 rounded-sm shrink-0' style={{ backgroundColor: watchedColor }} />
              <span className='flex-1 font-medium text-text truncate'>{displayName}</span>
              <span className='text-text-muted'>12%</span>
            </div>
          </div>
        </div>

        {/* ── Form pane ── */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className='flex-1 p-6 flex flex-col gap-5'>
          {/* Error banner */}
          {mutation.isError && (
            <div className='bg-danger-tint border border-danger/30 rounded-md p-3 flex gap-2 items-start'>
              <i className='pi pi-times-circle text-danger mt-px shrink-0 text-lg' />
              <p className='text-sm text-text-muted mt-0.5'>
                {mutation.error instanceof Error ? mutation.error.message : 'Something went wrong.'}
              </p>
            </div>
          )}

          {/* Type selector */}
          <div className='flex flex-col gap-2'>
            <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>Type</label>
            <div className='grid grid-cols-2 gap-3'>
              {TYPE_OPTIONS.map((opt) => {
                const selected = watchedType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type='button'
                    onClick={() => setValue('type', opt.value)}
                    className='flex items-center gap-3 p-3.5 rounded-lg border transition-all text-left'
                    style={
                      selected
                        ? { background: opt.activeBg, borderColor: opt.activeBorder }
                        : { background: 'var(--color-surface)', borderColor: 'var(--color-border)' }
                    }
                  >
                    <div
                      className='w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
                      style={
                        selected
                          ? { background: opt.activeColor, color: '#fff' }
                          : { background: `color-mix(in srgb, ${opt.activeColor} 15%, transparent)`, color: opt.activeColor }
                      }
                    >
                      <i className={`pi ${opt.icon} text-base`} />
                    </div>
                    <div>
                      <div className='text-sm font-bold text-text'>{opt.label}</div>
                      <div className='text-xs text-text-muted mt-0.5'>{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>
              Category name
            </label>
            <div className='relative'>
              <i className='pi pi-tag absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm' />
              <InputText
                {...register('name')}
                placeholder='e.g. Coffee & cafés'
                autoComplete='off'
                className={`${inputBase} ${errors.name ? 'border-danger' : 'border-border'}`}
              />
            </div>
            {errors.name && <p className='text-xs text-danger'>{errors.name.message}</p>}
          </div>

          {/* Icon picker */}
          <div className='flex flex-col gap-2'>
            <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>Icon</label>
            <div className='grid grid-cols-6 gap-2'>
              {CATEGORY_ICONS.map(({ id, label }) => {
                const selected = watchedIcon === id;
                return (
                  <button
                    key={id}
                    type='button'
                    title={label}
                    onClick={() => setValue('icon', id)}
                    className={`aspect-square rounded-lg flex items-center justify-center border transition-all ${
                      selected ? '' : 'bg-surface border-border text-text-muted hover:bg-raised'
                    }`}
                    style={
                      selected
                        ? { backgroundColor: `${watchedColor}22`, borderColor: watchedColor, color: watchedColor }
                        : undefined
                    }
                  >
                    <i className={`pi ${id} text-base`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color picker */}
          <div className='flex flex-col gap-2'>
            <label className='text-xs font-bold text-text-muted uppercase tracking-wide'>Color</label>
            <div className='flex flex-wrap gap-2.5'>
              {CATEGORY_COLORS.map((c) => {
                const selected = watchedColor === c;
                return (
                  <button
                    key={c}
                    type='button'
                    aria-label={c}
                    onClick={() => setValue('color', c)}
                    className='w-8 h-8 rounded-full flex items-center justify-center transition-all'
                    style={{
                      backgroundColor: c,
                      border: selected ? `2.5px solid var(--color-surface)` : 'none',
                      boxShadow: selected
                        ? `0 0 0 2px ${c}, 0 4px 10px ${c}55`
                        : `0 1px 3px rgba(0,0,0,.15)`,
                    }}
                  >
                    {selected && <i className='pi pi-check text-white text-xs font-bold' />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className='flex gap-3 pt-2 mt-auto'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 h-11.5 rounded-md border border-border text-sm font-semibold text-text hover:bg-raised transition-colors'
            >
              Cancel
            </button>
            <Button
              type='submit'
              loading={mutation.isPending}
              disabled={mutation.isPending}
              label={
                mutation.isPending
                  ? isEdit ? 'Saving…' : 'Creating…'
                  : isEdit ? 'Save changes' : 'Create category'
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
