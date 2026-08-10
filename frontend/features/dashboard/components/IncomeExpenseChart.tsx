'use client';
import { useState } from 'react';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrencyShort } from '@/lib/formatCurrency';
import { useDashboardTrend } from '../hooks/useDashboardTrend';
import type { DashboardTrendRange } from '../types/dashboard';

type Range = DashboardTrendRange;

export function IncomeExpenseChart() {
  const [range, setRange] = useState<Range>('1Y');
  const { data = [], isLoading } = useDashboardTrend(range);

  return (
    <section
      aria-labelledby='cashflow-heading'
      className='bg-surface rounded-lg border border-border shadow-sm p-6'
    >
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h2 id='cashflow-heading' className='text-[15px] font-bold'>
            Cashflow
          </h2>
          <p className='text-xs text-text-muted mt-0.5'>Income vs expenses</p>
        </div>
        <RangeToggle value={range} onChange={setRange} />
      </div>
      <div
        className='h-64'
        role={isLoading ? undefined : 'img'}
        aria-label={
          isLoading ? undefined : 'Chart of monthly income vs expenses'
        }
      >
        {isLoading ? (
          <Skeleton
            width='100%'
            height='100%'
            pt={{ root: { className: 'rounded-xl' } }}
          />
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart
              data={data}
              margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id='incomeGrad' x1='0' x2='0' y1='0' y2='1'>
                  <stop offset='5%' stopColor='#10B981' stopOpacity={0.24} />
                  <stop offset='95%' stopColor='#10B981' stopOpacity={0} />
                </linearGradient>
                <linearGradient id='expensesGrad' x1='0' x2='0' y1='0' y2='1'>
                  <stop offset='5%' stopColor='#EF4444' stopOpacity={0.18} />
                  <stop offset='95%' stopColor='#EF4444' stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray='3 6'
                stroke='var(--color-border)'
                vertical={false}
              />
              <XAxis
                dataKey='month'
                tick={{
                  fontSize: 10.5,
                  fill: 'var(--color-text-muted)',
                  fontWeight: 500,
                }}
                axisLine={false}
                tickLine={false}
                interval='preserveStartEnd'
              />
              <YAxis
                tickFormatter={(v: number) => formatCurrencyShort(v)}
                tick={{
                  fontSize: 10,
                  fill: 'var(--color-text-muted)',
                  fontWeight: 500,
                }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  fontSize: 12,
                  color: 'var(--color-text)',
                }}
                formatter={(value, name) => [
                  value != null && typeof value === 'number'
                    ? formatCurrencyShort(value)
                    : String(value ?? ''),
                  name === 'income' ? 'Income' : 'Expenses',
                ]}
              />
              <Area
                type='monotone'
                dataKey='income'
                stroke='#10B981'
                strokeWidth={2.4}
                fill='url(#incomeGrad)'
                dot={false}
                activeDot={{
                  r: 4,
                  fill: '#10B981',
                  stroke: 'var(--color-surface)',
                  strokeWidth: 2,
                }}
              />
              <Area
                type='monotone'
                dataKey='expenses'
                stroke='#EF4444'
                strokeWidth={2}
                fill='url(#expensesGrad)'
                dot={false}
                activeDot={{
                  r: 4,
                  fill: '#EF4444',
                  stroke: 'var(--color-surface)',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <ul className='flex items-center gap-4 mt-3'>
        <li className='flex items-center gap-1.5'>
          <span
            aria-hidden='true'
            className='w-3 h-0.5 rounded-full bg-success'
          />
          <span className='text-[11px] text-text-muted font-medium'>
            Income
          </span>
        </li>
        <li className='flex items-center gap-1.5'>
          <span
            aria-hidden='true'
            className='w-3 h-0.5 rounded-full bg-danger'
          />
          <span className='text-[11px] text-text-muted font-medium'>
            Expenses
          </span>
        </li>
      </ul>
    </section>
  );
}

function RangeToggle({
  value,
  onChange,
}: {
  value: Range;
  onChange: (r: Range) => void;
}) {
  const options: Range[] = ['6M', '1Y', 'All'];
  return (
    <div className='flex items-center p-0.5 gap-0 bg-border rounded-md'>
      {options.map((o) => (
        <Button
          key={o}
          label={o}
          onClick={() => onChange(o)}
          pt={{
            root: {
              className: [
                'px-3.5 py-1.5 rounded-sm text-[12.5px] font-semibold transition-all',
                value === o
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-muted',
              ].join(' '),
            },
          }}
        />
      ))}
    </div>
  );
}
