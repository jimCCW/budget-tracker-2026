'use client';
import { Skeleton } from 'primereact/skeleton';
import { useProfile } from '@/features/settings/hooks/useProfile';

export function CurrencyRegionSection() {
  const { data: profile, isLoading } = useProfile();

  return (
    <div className='bg-surface rounded-xl border border-border p-6'>
      <h2 className='text-base font-extrabold text-text tracking-tight mb-1'>
        Currency & region
      </h2>
      <p className='text-sm text-text-muted mb-5'>
        Only one option is available for each right now.
      </p>

      {isLoading ? (
        <div className='flex flex-col gap-3'>
          <Skeleton height='2.5rem' pt={{ root: { className: 'rounded-md' } }} />
          <Skeleton height='2.5rem' pt={{ root: { className: 'rounded-md' } }} />
        </div>
      ) : (
        <div className='flex flex-col'>
          <div className='flex items-center justify-between py-2.5 border-b border-border'>
            <div>
              <div className='text-sm font-semibold text-text'>
                Display currency
              </div>
              <div className='text-xs text-text-muted mt-0.5'>
                {profile?.currency}
              </div>
            </div>
            <i className='pi pi-check text-primary text-base' />
          </div>
          <div className='flex items-center justify-between py-2.5'>
            <div>
              <div className='text-sm font-semibold text-text'>Language</div>
              <div className='text-xs text-text-muted mt-0.5'>
                {profile?.language}
              </div>
            </div>
            <i className='pi pi-check text-primary text-base' />
          </div>
        </div>
      )}
    </div>
  );
}
