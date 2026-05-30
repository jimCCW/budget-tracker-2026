import type { ColumnDef } from '@/components/ui/DataTable';
import { fmt } from './data';

export type TxRow = {
  name: string;
  cat: string;
  icon: string;
  color: string;
  amt: number;
  when: string;
};

export const recentActivityColumns: ColumnDef<TxRow>[] = [
  {
    accessorKey: 'name',
    header: 'Description',
    cell: ({ row }) => {
      const tx = row.original;
      return (
        <div className='flex items-center gap-2.5'>
          <div
            className='w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0'
            style={{ background: tx.color + '22', color: tx.color }}
          >
            <i className={`pi ${tx.icon} text-sm`} />
          </div>
          <span className='font-semibold truncate max-w-[160px]'>
            {tx.name}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'cat',
    header: 'Category',
    cell: ({ row }) => {
      const tx = row.original;
      return (
        <span
          className='inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold'
          style={{ background: tx.color + '22', color: tx.color }}
        >
          {tx.cat}
        </span>
      );
    },
  },
  {
    accessorKey: 'when',
    header: 'Date',
    cell: ({ getValue }) => (
      <span className='text-text-muted'>{getValue() as string}</span>
    ),
  },
  {
    accessorKey: 'amt',
    header: 'Amount',
    meta: { align: 'right' },
    cell: ({ row }) => {
      const tx = row.original;
      return (
        <span
          className={`font-bold tabular-nums ${tx.amt > 0 ? 'text-success' : 'text-text'}`}
        >
          {tx.amt > 0 ? '+' : ''}
          {fmt(tx.amt)}
        </span>
      );
    },
  },
];
