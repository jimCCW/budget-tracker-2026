import { SAMPLE } from '../data';
import { formatCurrency } from '@/lib/formatCurrency';

export function BudgetProgressSection() {
  return (
    <div className='bg-surface rounded-lg border border-border shadow-sm p-5'>
      <div className='flex items-center justify-between mb-4'>
        <div className='text-[15px] font-bold'>Budget progress</div>
        <a
          href='/categories'
          className='text-sm font-semibold text-text-muted hover:text-text flex items-center gap-1 transition-colors'
        >
          Manage <i className='pi pi-arrow-right text-xs' />
        </a>
      </div>
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {SAMPLE.budgets.map((b, i) => {
          const pct = (b.spent / b.limit) * 100;
          const over = b.spent > b.limit;
          return (
            <div
              key={i}
              className='p-3.5 bg-bg rounded-md border border-border'
            >
              <div className='flex justify-between items-baseline mb-1.5'>
                <div className='text-[12.5px] font-semibold'>{b.name}</div>
                <span
                  className={[
                    'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                    over
                      ? 'bg-danger-tint text-danger'
                      : 'bg-border text-text-muted',
                  ].join(' ')}
                >
                  {Math.round(pct)}%
                </span>
              </div>
              <div
                className={[
                  'text-[17px] font-extrabold tabular-nums',
                  over ? 'text-danger' : 'text-text',
                ].join(' ')}
              >
                {formatCurrency(b.spent)}
              </div>
              <div className='text-[11px] text-text-muted mb-2'>
                of {formatCurrency(b.limit)} limit
              </div>
              <div className='w-full h-1.5 bg-border rounded-full overflow-hidden'>
                <div
                  className='h-full rounded-full transition-all'
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    background: over ? '#EF4444' : b.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
