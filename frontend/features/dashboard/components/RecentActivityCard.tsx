'use client';
import Link from 'next/link';
import { Skeleton } from 'primereact/skeleton';
import { DataTable } from '@/components/ui/DataTable';
import { formatCurrency } from '@/lib/formatCurrency';
import { formatActivityDate } from '@/features/activity/utils/activityUtils';
import type { ActivityItem } from '@/features/activity/types/activity';
import { recentActivityColumns, type TxRow } from '../recentActivityColumns';
import { useDashboardRecentActivity } from '../hooks/useDashboardRecentActivity';

function toTxRow(item: ActivityItem): TxRow {
  return {
    name: item.note || item.category.name,
    cat: item.category.name,
    icon: item.category.icon ?? 'pi-tag',
    color: item.category.color ?? '#6b7280',
    amt: item.type === 'INCOME' ? item.amount : -item.amount,
    when: formatActivityDate(item.date),
  };
}

export function RecentActivityCard() {
  const { data, isLoading } = useDashboardRecentActivity();
  const rows = (data?.items ?? []).map(toTxRow);

  return (
    <section
      aria-labelledby='recent-activity-heading'
      className='bg-surface rounded-lg border border-border shadow-sm p-5'
    >
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h2 id='recent-activity-heading' className='text-[15px] font-bold'>
            Recent activity
          </h2>
          <p className='text-xs text-text-muted mt-0.5'>
            Latest transactions
          </p>
        </div>
        <Link
          href='/activity'
          className='text-sm font-semibold text-text-muted hover:text-text flex items-center gap-1 transition-colors'
        >
          See all <i className='pi pi-arrow-right text-xs' aria-hidden='true' />
        </Link>
      </div>

      {isLoading ? (
        <div role='status' aria-busy='true' className='flex flex-col gap-3'>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton
              key={i}
              height='2.5rem'
              pt={{ root: { className: 'rounded-xl' } }}
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className='text-sm text-text-muted text-center py-6'>
          No activity yet
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className='hidden lg:block'>
            <DataTable data={rows} columns={recentActivityColumns} />
          </div>

          {/* Mobile list */}
          <ul className='lg:hidden flex flex-col'>
            {rows.map((tx, i) => (
              <li
                key={i}
                className={[
                  'flex items-center gap-3 py-3',
                  i < rows.length - 1 ? 'border-b border-border' : '',
                ].join(' ')}
              >
                <div
                  className='w-9 h-9 rounded-md flex items-center justify-center shrink-0'
                  style={{ background: tx.color + '22', color: tx.color }}
                  aria-hidden='true'
                >
                  <i className={`pi ${tx.icon} text-sm`} />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-[13px] font-semibold truncate'>
                    {tx.name}
                  </p>
                  <p className='text-[11px] text-text-muted'>{tx.when}</p>
                </div>
                <p
                  className={[
                    'text-[13px] font-bold tabular-nums',
                    tx.amt > 0 ? 'text-success' : 'text-text',
                  ].join(' ')}
                >
                  <span className='sr-only'>
                    {tx.amt > 0 ? 'Income ' : 'Expense '}
                  </span>
                  {tx.amt > 0 ? '+' : ''}
                  {formatCurrency(tx.amt)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
