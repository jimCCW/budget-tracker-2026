'use client';
import Link from 'next/link';
import { DataTable } from '@/components/ui/DataTable';
import { SAMPLE } from '../data';
import { formatCurrency } from '@/lib/formatCurrency';
import { recentActivityColumns } from '../recentActivityColumns';

export function RecentActivityCard() {
  return (
    <div className='bg-surface rounded-lg border border-border shadow-sm p-5'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <div className='text-[15px] font-bold'>Recent activity</div>
          <div className='text-xs text-text-muted mt-0.5'>
            Latest transactions
          </div>
        </div>
        <Link
          href='/expenses'
          className='text-sm font-semibold text-text-muted hover:text-text flex items-center gap-1 transition-colors'
        >
          See all <i className='pi pi-arrow-right text-xs' />
        </Link>
      </div>

      {/* Desktop table */}
      <div className='hidden lg:block'>
        <DataTable data={SAMPLE.recent} columns={recentActivityColumns} />
      </div>

      {/* Mobile list */}
      <div className='lg:hidden flex flex-col'>
        {SAMPLE.recent.map((tx, i) => (
          <div
            key={i}
            className={[
              'flex items-center gap-3 py-3',
              i < SAMPLE.recent.length - 1 ? 'border-b border-border' : '',
            ].join(' ')}
          >
            <div
              className='w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0'
              style={{ background: tx.color + '22', color: tx.color }}
            >
              <i className={`pi ${tx.icon} text-sm`} />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-[13px] font-semibold truncate'>
                {tx.name}
              </div>
              <div className='text-[11px] text-text-muted'>{tx.when}</div>
            </div>
            <div
              className={[
                'text-[13px] font-bold tabular-nums',
                tx.amt > 0 ? 'text-success' : 'text-text',
              ].join(' ')}
            >
              {tx.amt > 0 ? '+' : ''}
              {formatCurrency(tx.amt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
