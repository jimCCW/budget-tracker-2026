import { SAMPLE, fmt } from '../data';

export function RecentActivityCard() {
  return (
    <div className='bg-surface rounded-lg border border-border shadow-sm p-5'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <div className='text-[15px] font-bold'>Recent activity</div>
          <div className='text-xs text-text-muted mt-0.5'>
            Latest transactions
          </div>
        </div>
        <a
          href='/expenses'
          className='text-sm font-semibold text-text-muted hover:text-text flex items-center gap-1 transition-colors'
        >
          See all <i className='pi pi-arrow-right text-xs' />
        </a>
      </div>

      {/* Desktop table */}
      <div className='hidden lg:block overflow-x-auto'>
        <table className='w-full border-collapse text-[13px]'>
          <thead>
            <tr>
              {['Description', 'Category', 'Date', 'Amount'].map((h, i) => (
                <th
                  key={h}
                  className={[
                    'pb-2 text-[10.5px] font-bold uppercase tracking-wider text-text-muted border-b border-border',
                    i === 3 ? 'text-right pr-0' : 'text-left pr-4',
                  ].join(' ')}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE.recent.map((tx, i) => (
              <tr
                key={i}
                className={
                  i < SAMPLE.recent.length - 1 ? 'border-b border-border' : ''
                }
              >
                <td className='py-3 pr-4'>
                  <div className='flex items-center gap-2.5'>
                    <div
                      className='w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0'
                      style={{ background: tx.color + '22', color: tx.color }}
                    >
                      <i className={`pi ${tx.icon} text-sm`} />
                    </div>
                    <span className='font-semibold truncate max-w-[160px]'>
                      {tx.name}
                    </span>
                  </div>
                </td>
                <td className='py-3 pr-4'>
                  <span
                    className='inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold'
                    style={{ background: tx.color + '22', color: tx.color }}
                  >
                    {tx.cat}
                  </span>
                </td>
                <td className='py-3 pr-4 text-text-muted'>{tx.when}</td>
                <td
                  className={[
                    'py-3 text-right font-bold tabular-nums',
                    tx.amt > 0 ? 'text-success' : 'text-text',
                  ].join(' ')}
                >
                  {tx.amt > 0 ? '+' : ''}
                  {fmt(tx.amt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className='lg:hidden flex flex-col'>
        {SAMPLE.recent.map((tx, i) => (
          <div
            key={i}
            className={[
              'flex items-center gap-3 py-3',
              i < SAMPLE.recent.length - 1 ? 'border-b border-border' : '',
            ].join(' ')}
          >
            <div
              className='w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0'
              style={{ background: tx.color + '22', color: tx.color }}
            >
              <i className={`pi ${tx.icon} text-sm`} />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-[13px] font-semibold truncate'>
                {tx.name}
              </div>
              <div className='text-[11px] text-text-muted'>{tx.when}</div>
            </div>
            <div
              className={[
                'text-[13px] font-bold tabular-nums',
                tx.amt > 0 ? 'text-success' : 'text-text',
              ].join(' ')}
            >
              {tx.amt > 0 ? '+' : ''}
              {fmt(tx.amt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
