'use client';
import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { fmtShort } from '../data';

type Range = '6M' | '1Y' | 'All';

const RANGES: Record<Range, { months: number; labels: string[] }> = {
  '6M': { months: 6, labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'] },
  '1Y': {
    months: 12,
    labels: [
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
    ],
  },
  All: {
    months: 24,
    labels: Array.from({ length: 24 }, (_, i) =>
      i % 4 === 0
        ? ['Jun', 'Oct', 'Feb', 'Jun', 'Oct', 'Feb'][Math.floor(i / 4)]
        : ''
    ),
  },
};

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function IncomeExpenseChart() {
  const [range, setRange] = useState<Range>('1Y');
  const cfg = RANGES[range];

  const data = useMemo(() => {
    const r = seededRand(42);
    return cfg.labels.map((month, i) => ({
      month: month || `M${i + 1}`,
      income: Math.round(4800 + r() * 1200 + i * 30),
      expenses: Math.round(2400 + r() * 1500 + (i % 4 === 0 ? 600 : 0)),
    }));
  }, [range, cfg.labels]);

  return (
    <div className='bg-surface rounded-lg border border-border shadow-sm p-6'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <div className='text-[15px] font-bold'>Cashflow</div>
          <div className='text-xs text-text-muted mt-0.5'>
            Income vs expenses
          </div>
        </div>
        <RangeToggle value={range} onChange={setRange} />
      </div>
      <div className='h-64'>
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
              tickFormatter={(v: number) => fmtShort(v)}
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
                  ? fmtShort(value)
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
      </div>
      <div className='flex items-center gap-4 mt-3'>
        <div className='flex items-center gap-1.5'>
          <div className='w-3 h-0.5 rounded-full bg-[#10B981]' />
          <span className='text-[11px] text-text-muted font-medium'>
            Income
          </span>
        </div>
        <div className='flex items-center gap-1.5'>
          <div className='w-3 h-0.5 rounded-full bg-[#EF4444]' />
          <span className='text-[11px] text-text-muted font-medium'>
            Expenses
          </span>
        </div>
      </div>
    </div>
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
        <button
          key={o}
          onClick={() => onChange(o)}
          className={[
            'px-3.5 py-1.5 rounded-sm text-[12.5px] font-semibold transition-all',
            value === o ? 'bg-surface text-text shadow-sm' : 'text-text-muted',
          ].join(' ')}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
