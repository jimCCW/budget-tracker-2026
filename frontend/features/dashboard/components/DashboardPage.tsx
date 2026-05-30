import { AppShell } from '@/components/AppShell';
import { StatCard } from '@/components/ui/StatCard';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import { CategoryDonutChart } from './CategoryDonutChart';
import { BudgetProgressSection } from './BudgetProgressSection';
import { RecentActivityCard } from './RecentActivityCard';
import { GoalsCard } from './GoalsCard';
import { SAMPLE, fmt } from '../data';

export function DashboardPage() {
  const saved = SAMPLE.monthIncome - SAMPLE.monthExpense;

  return (
    <AppShell title='Hi, Alex' subtitle='May 2026'>
      {/* Row 1 — 4 stat tiles */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          label='Balance'
          value={fmt(SAMPLE.balance)}
          sub='across 4 accounts'
          icon='pi-wallet'
          tintClass='bg-primary-tint'
          iconColorClass='text-primary'
          trend={{ tone: 'success', label: '+S$1,240' }}
        />
        <StatCard
          label='Income · May'
          value={fmt(SAMPLE.monthIncome)}
          sub='3 sources'
          icon='pi-arrow-up-right'
          tintClass='bg-success-tint'
          iconColorClass='text-success'
          trend={{ tone: 'success', label: '+8.4%' }}
        />
        <StatCard
          label='Expenses · May'
          value={fmt(SAMPLE.monthExpense)}
          sub='12 transactions'
          icon='pi-arrow-down-right'
          tintClass='bg-danger-tint'
          iconColorClass='text-danger'
          trend={{ tone: 'danger', label: '+4.1%' }}
        />
        <StatCard
          label='Saved · May'
          value={fmt(saved)}
          sub='44% of income'
          icon='pi-star'
          tintClass='bg-warn-tint'
          iconColorClass='text-warn'
          trend={{ tone: 'success', label: 'On track' }}
        />
      </div>

      {/* Row 2 — Chart + Donut */}
      <div className='grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4'>
        <IncomeExpenseChart />
        <CategoryDonutChart />
      </div>

      {/* Row 3 — Budget progress */}
      <BudgetProgressSection />

      {/* Row 4 — Recent activity + Goals */}
      <div className='grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4'>
        <RecentActivityCard />
        <GoalsCard />
      </div>
    </AppShell>
  );
}
