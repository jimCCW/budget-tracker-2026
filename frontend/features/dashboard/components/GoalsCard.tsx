import { SAMPLE } from '../data';
import { formatCurrency, formatCurrencyShort } from '@/lib/formatCurrency';

export function GoalsCard() {
  return (
    <div className='bg-surface rounded-lg border border-border shadow-sm p-5'>
      <div className='flex items-center justify-between mb-4'>
        <div className='text-[15px] font-bold'>Goals</div>
        <a
          href='#'
          className='text-sm font-semibold text-text-muted hover:text-text flex items-center gap-1 transition-colors'
        >
          View <i className='pi pi-arrow-right text-xs' />
        </a>
      </div>
      <div className='flex flex-col gap-4'>
        {SAMPLE.goals.map((g, i) => {
          const pct = (g.saved / g.target) * 100;
          return (
            <div key={i}>
              <div className='flex justify-between items-baseline mb-1.5'>
                <div className='text-[12.5px] font-semibold'>{g.name}</div>
                <div className='text-[12px] text-text-muted tabular-nums'>
                  <span className='text-text font-bold'>
                    {formatCurrencyShort(g.saved)}
                  </span>
                  {' / '}
                  {formatCurrencyShort(g.target)}
                </div>
              </div>
              <div className='w-full h-1.5 bg-border rounded-full overflow-hidden'>
                <div
                  className='h-full rounded-full transition-all'
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    background: g.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total savings hint */}
      <div className='mt-5 p-3.5 bg-primary-tint rounded-md flex justify-between items-center'>
        <div>
          <div className='text-[11px] text-text-muted font-semibold uppercase tracking-wider'>
            Total saved
          </div>
          <div className='text-[18px] font-extrabold text-primary tabular-nums mt-0.5'>
            {formatCurrency(SAMPLE.goals.reduce((acc, g) => acc + g.saved, 0))}
          </div>
        </div>
        <i className='pi pi-star text-primary text-2xl' />
      </div>
    </div>
  );
}
