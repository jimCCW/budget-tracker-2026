'use client';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency } from '@/lib/formatCurrency';

type Props = {
  netWorth: number;
  liquidAmount: number;
  investmentAmount: number;
  creditAmount: number;
  isLoading: boolean;
};

export function NetWorthHeader({
  netWorth,
  liquidAmount,
  investmentAmount,
  creditAmount,
  isLoading,
}: Props) {
  if (isLoading) {
    return (
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='bg-surface border border-border rounded-lg h-28 animate-pulse' />
        ))}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
      <StatCard
        label='Net Worth'
        value={formatCurrency(netWorth)}
        icon='pi-chart-bar'
        tintClass='bg-primary-tint'
        iconColorClass='text-primary'
      />
      <StatCard
        label='Liquid'
        value={formatCurrency(liquidAmount)}
        sub='Bank & cash'
        icon='pi-wallet'
        tintClass='bg-success-tint'
        iconColorClass='text-success'
      />
      <StatCard
        label='Investments'
        value={formatCurrency(investmentAmount)}
        sub='Stocks & crypto'
        icon='pi-chart-line'
        tintClass='bg-warn-tint'
        iconColorClass='text-warn'
      />
      <StatCard
        label='Credit'
        value={formatCurrency(creditAmount)}
        sub='Total owed'
        icon='pi-credit-card'
        tintClass='bg-danger-tint'
        iconColorClass='text-danger'
      />
    </div>
  );
}
