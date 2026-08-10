'use client';
import { useState } from 'react';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { AppShell } from '@/components/AppShell';
import { useRecurringRules } from '../hooks/useRecurringRules';
import { useSetRuleActive } from '../hooks/useSetRuleActive';
import { useDeleteRule } from '../hooks/useDeleteRule';
import { RecurringRuleModal } from './RecurringRuleModal';
import { useRunCatchup } from '../hooks/useRunCatchup';
import { formatCurrency } from '@/lib/formatCurrency';
import type { RecurringRule, Frequency } from '@/types/recurring';

import { FREQUENCIES } from '../constants/frequencies';

const FREQUENCY_LABEL = Object.fromEntries(
  FREQUENCIES.map((f) => [f.value, f.label])
) as Record<Frequency, string>;

function nextRunLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function RecurringPage() {
  const { data: rules, isLoading } = useRecurringRules();
  const setActive = useSetRuleActive();
  const deleteRule = useDeleteRule();
  const runCatchup = useRunCatchup();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RecurringRule | undefined>(
    undefined
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditTarget(undefined);
    setModalOpen(true);
  }

  function openEdit(rule: RecurringRule) {
    setEditTarget(rule);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteRule.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell title='Recurring' subtitle='Automated income and expenses'>
      {/* Top bar */}
      <div className='flex items-center justify-between'>
        <p className='text-sm text-text-muted'>
          {isLoading
            ? '—'
            : `${rules?.length ?? 0} rule${(rules?.length ?? 0) !== 1 ? 's' : ''}`}
        </p>
        <div className='flex items-center gap-2'>
          <Button
            label='Run now'
            icon={runCatchup.isPending ? 'pi pi-spinner pi-spin' : 'pi pi-play'}
            disabled={runCatchup.isPending}
            onClick={() => runCatchup.mutate()}
            pt={{
              root: {
                className:
                  'flex items-center gap-2 h-9 px-4 rounded-md border border-border text-sm font-semibold text-text hover:bg-raised transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              },
              icon: { className: 'text-sm' },
            }}
          />
          <Button
            label='New rule'
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
      </div>

      {/* Loading */}
      {isLoading && (
        <div role='status' aria-busy='true' className='flex flex-col gap-3'>
          {[...Array(3)].map((_, i) => (
            <Skeleton
              key={i}
              height='72px'
              pt={{ root: { className: 'rounded-xl' } }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!rules || rules.length === 0) && (
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
            <i className='pi pi-refresh text-xl' aria-hidden='true' />
          </div>
          <span className='text-sm font-semibold'>
            Create your first recurring rule
          </span>
        </Button>
      )}

      {/* Rule list */}
      {!isLoading && rules && rules.length > 0 && (
        <ul className='flex flex-col gap-3'>
          {rules.map((rule) => {
            const isExpense = rule.kind === 'EXPENSE';
            const color =
              rule.category?.color ??
              (isExpense ? 'var(--color-danger)' : 'var(--color-success)');
            const icon =
              rule.category?.icon ??
              (isExpense ? 'pi-arrow-up' : 'pi-arrow-down');

            return (
              <li
                key={rule.id}
                className={`bg-surface border rounded-xl px-4 py-3 flex items-center gap-3 transition-colors ${
                  rule.isActive ? 'border-border' : 'border-border opacity-60'
                }`}
              >
                {/* Icon chip */}
                <div
                  className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0'
                  style={{ background: `${color}22`, color }}
                  aria-hidden='true'
                >
                  <i className={`pi ${icon} text-sm`} />
                </div>

                {/* Info */}
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-semibold text-text truncate'>
                    {rule.note ||
                      rule.category?.name ||
                      (isExpense ? 'Expense' : 'Income')}
                  </p>
                  <p className='text-xs text-text-muted truncate'>
                    {FREQUENCY_LABEL[rule.frequency]} · Next{' '}
                    {nextRunLabel(rule.nextRunDate)} · {rule.account.name}
                  </p>
                </div>

                {/* Amount */}
                <span
                  className='text-sm font-bold tabular-nums shrink-0'
                  style={{
                    color: isExpense
                      ? 'var(--color-text)'
                      : 'var(--color-success)',
                  }}
                >
                  {isExpense ? '-' : '+'}
                  {formatCurrency(rule.amount)}
                </span>

                {/* Actions */}
                <div
                  role='group'
                  aria-label='Rule actions'
                  className='flex items-center gap-1 shrink-0'
                >
                  {/* Pause / Resume */}
                  <Button
                    type='button'
                    icon={rule.isActive ? 'pi pi-pause' : 'pi pi-play'}
                    disabled={setActive.isPending}
                    aria-label={rule.isActive ? 'Pause rule' : 'Resume rule'}
                    onClick={() =>
                      setActive.mutate({
                        id: rule.id,
                        isActive: !rule.isActive,
                      })
                    }
                    pt={{
                      root: {
                        className:
                          'w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-primary hover:bg-primary-tint transition-colors',
                      },
                      icon: { className: 'text-xs' },
                    }}
                  />
                  {/* Edit */}
                  <Button
                    type='button'
                    icon='pi pi-pencil'
                    aria-label='Edit rule'
                    onClick={() => openEdit(rule)}
                    pt={{
                      root: {
                        className:
                          'w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-primary hover:bg-primary-tint transition-colors',
                      },
                      icon: { className: 'text-xs' },
                    }}
                  />
                  {/* Delete */}
                  <Button
                    type='button'
                    icon={
                      deletingId === rule.id
                        ? 'pi pi-spinner pi-spin'
                        : 'pi pi-trash'
                    }
                    disabled={deletingId === rule.id}
                    aria-label='Delete rule'
                    onClick={() => handleDelete(rule.id)}
                    pt={{
                      root: {
                        className:
                          'w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-danger hover:bg-danger-tint transition-colors disabled:opacity-50',
                      },
                      icon: { className: 'text-xs' },
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <RecurringRuleModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditTarget(undefined);
        }}
        rule={editTarget}
      />
    </AppShell>
  );
}
