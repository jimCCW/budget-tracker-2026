'use client';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { SAMPLE, fmt, fmtShort } from '../data';

export function CategoryDonutChart() {
  const total = SAMPLE.monthExpense;
  const data = SAMPLE.topExpenses.map((e) => ({
    name: e.name,
    value: e.value,
    color: e.color,
  }));

  return (
    <div className='bg-surface rounded-lg border border-border shadow-sm p-5'>
      <div className='flex items-center justify-between mb-4'>
        <div className='text-[15px] font-bold'>Spending by category</div>
        <a
          href='/categories'
          className='text-xs text-primary font-semibold cursor-pointer hover:underline'
        >
          Details
        </a>
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
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
            <div className='text-[10.5px] text-text-muted font-semibold uppercase tracking-wider'>
              Spent
            </div>
            <div className='text-[22px] font-extrabold tracking-tight tabular-nums'>
              {fmtShort(total)}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className='w-full flex flex-col gap-2'>
          {data.map((item, i) => (
            <div key={i} className='flex items-center gap-2.5 text-[12.5px]'>
              <span
                className='w-2.5 h-2.5 rounded-sm flex-shrink-0'
                style={{ background: item.color }}
              />
              <span className='flex-1 text-text font-medium'>{item.name}</span>
              <span className='text-text-muted tabular-nums'>
                {fmt(item.value)}
              </span>
              <span className='text-text-dim tabular-nums w-10 text-right'>
                {Math.round((item.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
