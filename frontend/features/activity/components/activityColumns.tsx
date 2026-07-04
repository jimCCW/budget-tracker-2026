import type { ColumnDef } from '@/components/ui/DataTable';
import { formatCurrency } from '@/lib/formatCurrency';
import type { ActivityItem } from '../types/activity';
import {
  resolveCategoryStyle,
  formatActivityDate,
} from '../utils/activityUtils';

export const activityColumns: ColumnDef<ActivityItem>[] = [
  {
    accessorKey: 'note',
    header: 'Description',
    cell: ({ row }) => {
      const item = row.original;
      const style = resolveCategoryStyle(item.category);
      const label = item.note || item.category.name;
      return (
        <div className='flex items-center gap-2.5'>
          <div
            className='w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0'
            style={style}
          >
            <i className={`pi ${item.category.icon ?? 'pi-tag'} text-sm`} />
          </div>
          <span className='font-semibold truncate max-w-[180px]'>{label}</span>
          {item.isRecurring && (
            <i
              className='pi pi-refresh text-[11px] text-text-muted shrink-0'
              title='Recurring'
            />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const item = row.original;
      const style = resolveCategoryStyle(item.category);
      return (
        <span
          className='inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold'
          style={style}
        >
          {item.category.name}
        </span>
      );
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ getValue }) => (
      <span className='text-text-muted'>
        {formatActivityDate(getValue() as string)}
      </span>
    ),
  },
  {
    id: 'account',
    header: 'Account',
    cell: ({ row }) => (
      <span className='text-text-muted'>{row.original.account.name}</span>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    meta: { align: 'right' },
    cell: ({ row }) => {
      const item = row.original;
      const signed = item.type === 'INCOME' ? item.amount : -item.amount;
      return (
        <span
          className={`font-bold tabular-nums ${signed > 0 ? 'text-success' : 'text-text'}`}
        >
          {signed > 0 ? '+' : '-'}
          {formatCurrency(Math.abs(signed))}
        </span>
      );
    },
  },
];
