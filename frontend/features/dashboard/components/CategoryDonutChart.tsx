'use client';
import Link from 'next/link';
import { PieChart, Pie, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatCurrencyShort } from '@/lib/formatCurrency';

type CategoryDonutChartProps = {
  categories: { name: string; icon: string; color: string; value: number }[];
  total: number;
};

export function CategoryDonutChart({
  categories,
  total,
}: CategoryDonutChartProps) {
  const data = categories.map((e) => ({
    name: e.name,
    value: e.value,
    fill: e.color,
  }));

  return (
    <div className='bg-surface rounded-lg border border-border shadow-sm p-5'>
      <div className='flex items-center justify-between mb-4'>
        <div className='text-[15px] font-bold'>Spending by category</div>
        <Link
          href='/activity?type=EXPENSE'
          className='text-xs text-primary font-semibold cursor-pointer hover:underline'
        >
          Details
        </Link>
      </div>

      <div className='flex flex-col items-center gap-4'>
        {/* Donut */}
        <div className='relative w-44 h-44'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={data}
                cx='50%'
                cy='50%'
                innerRadius={52}
                outerRadius={76}
                dataKey='value'
                strokeWidth={2}
                stroke='var(--color-surface)'
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
            <div className='text-[10.5px] text-text-muted font-semibold uppercase tracking-wider'>
              Spent
            </div>
            <div className='text-[22px] font-extrabold tracking-tight tabular-nums'>
              {formatCurrencyShort(total)}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className='w-full flex flex-col gap-2'>
          {data.map((item, i) => (
            <div key={i} className='flex items-center gap-2.5 text-[12.5px]'>
              <span
                className='w-2.5 h-2.5 rounded-sm flex-shrink-0'
                style={{ background: item.fill }}
              />
              <span className='flex-1 text-text font-medium'>{item.name}</span>
              <span className='text-text-muted tabular-nums'>
                {formatCurrency(item.value)}
              </span>
              <span className='text-text-dim tabular-nums w-10 text-right'>
                {total > 0 ? Math.round((item.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
          {data.length === 0 && (
            <div className='text-xs text-text-muted text-center py-2'>
              No expenses yet this month
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
