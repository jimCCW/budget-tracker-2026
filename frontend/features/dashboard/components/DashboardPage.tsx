'use client';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { Skeleton } from 'primereact/skeleton';
import { AppShell } from '@/components/AppShell';
import { StatCard } from '@/components/ui/StatCard';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import { CategoryDonutChart } from './CategoryDonutChart';
import { RecentActivityCard } from './RecentActivityCard';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { formatCurrency } from '@/lib/formatCurrency';

export function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.firstName || 'there';
  const monthLabel = dayjs().format('MMMM YYYY');

  const { data: summary, isLoading } = useDashboardSummary();

  return (
    <AppShell title={`Hi, ${firstName}`} subtitle={monthLabel}>
      {/* Row 1 — 4 stat tiles */}
      {isLoading || !summary ? (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton
              key={i}
              height='9.5rem'
              pt={{ root: { className: 'rounded-xl' } }}
            />
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <StatCard
            label='Balance'
            value={formatCurrency(summary.balance)}
            sub={`across ${summary.accountsCount} account${summary.accountsCount === 1 ? '' : 's'}`}
            icon='pi-wallet'
            tintClass='bg-primary-tint'
            iconColorClass='text-primary'
          />
          <StatCard
            label={`Income · ${dayjs().format('MMM')}`}
            value={formatCurrency(summary.income.total)}
            sub={`${summary.income.count} source${summary.income.count === 1 ? '' : 's'}`}
            icon='pi-arrow-up-right'
            tintClass='bg-success-tint'
            iconColorClass='text-success'
            trend={
              summary.income.trendPct == null
                ? undefined
                : {
                    tone: summary.income.trendPct >= 0 ? 'success' : 'danger',
                    label: `${summary.income.trendPct >= 0 ? '+' : ''}${summary.income.trendPct.toFixed(1)}%`,
                  }
            }
          />
          <StatCard
            label={`Expenses · ${dayjs().format('MMM')}`}
            value={formatCurrency(summary.expense.total)}
            sub={`${summary.expense.count} transaction${summary.expense.count === 1 ? '' : 's'}`}
            icon='pi-arrow-down-right'
            tintClass='bg-danger-tint'
            iconColorClass='text-danger'
            trend={
              summary.expense.trendPct == null
                ? undefined
                : {
                    tone: summary.expense.trendPct >= 0 ? 'danger' : 'success',
                    label: `${summary.expense.trendPct >= 0 ? '+' : ''}${summary.expense.trendPct.toFixed(1)}%`,
                  }
            }
          />
          <StatCard
            label={`Saved · ${dayjs().format('MMM')}`}
            value={formatCurrency(summary.saved.amount)}
            sub={
              summary.saved.pctOfIncome == null
                ? 'No income yet'
                : `${Math.round(summary.saved.pctOfIncome)}% of income`
            }
            icon='pi-star'
            tintClass='bg-warn-tint'
            iconColorClass='text-warn'
            trend={{
              tone: summary.saved.amount >= 0 ? 'success' : 'danger',
              label: summary.saved.amount >= 0 ? 'Positive' : 'Negative',
            }}
          />
        </div>
      )}

      {/* Row 2 — Chart + Donut */}
      <div className='grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4'>
        <IncomeExpenseChart />
        <CategoryDonutChart
          categories={summary?.categoryBreakdown ?? []}
          total={summary?.expense.total ?? 0}
        />
      </div>

      {/* Row 3 — Recent activity */}
      <div className='grid grid-cols-1 gap-4'>
        <RecentActivityCard />
      </div>
    </AppShell>
  );
}
