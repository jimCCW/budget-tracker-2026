type TrendTone = 'success' | 'danger' | 'neutral';

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  tintClass: string;
  iconColorClass: string;
  trend?: { tone: TrendTone; label: string };
};

const trendStyles: Record<TrendTone, string> = {
  success: 'bg-success-tint text-success',
  danger: 'bg-danger-tint text-danger',
  neutral: 'bg-border text-text-muted',
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  tintClass,
  iconColorClass,
  trend,
}: StatCardProps) {
  return (
    <div className='bg-surface rounded-lg border border-border shadow-sm p-5 flex flex-col gap-2.5'>
      <div className='flex justify-between items-start'>
        <div
          className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${tintClass} ${iconColorClass}`}
        >
          <i className={`pi ${icon} text-lg`} />
        </div>
        {trend && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${trendStyles[trend.tone]}`}
          >
            {trend.label}
          </span>
        )}
      </div>
      <div>
        <div className='text-[11.5px] font-semibold text-text-muted uppercase tracking-wider'>
          {label}
        </div>
        <div className='text-[28px] font-extrabold tracking-tight tabular-nums text-text mt-0.5'>
          {value}
        </div>
        {sub && <div className='text-[11.5px] text-text-muted mt-1'>{sub}</div>}
      </div>
    </div>
  );
}
