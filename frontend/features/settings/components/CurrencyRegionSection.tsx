'use client';
import { Skeleton } from 'primereact/skeleton';
import { useProfile } from '@/features/settings/hooks/useProfile';

export function CurrencyRegionSection() {
  const { data: profile, isLoading } = useProfile();

  return (
    <section aria-labelledby='currency-region-heading' className='bg-surface rounded-xl border border-border p-6'>
      <h2 id='currency-region-heading' className='text-base font-extrabold text-text tracking-tight mb-1'>
        Currency & region
      </h2>
      <p className='text-sm text-text-muted mb-5'>
        Only one option is available for each right now.
      </p>

      {isLoading ? (
        <div role='status' aria-busy='true' className='flex flex-col gap-3'>
          <Skeleton
            height='2.5rem'
            pt={{ root: { className: 'rounded-md' } }}
          />
          <Skeleton
            height='2.5rem'
            pt={{ root: { className: 'rounded-md' } }}
          />
        </div>
      ) : (
        <dl className='flex flex-col'>
          <div className='flex items-center justify-between py-2.5 border-b border-border'>
            <div>
              <dt className='text-sm font-semibold text-text'>
                Display currency
              </dt>
              <dd className='text-xs text-text-muted mt-0.5'>
                {profile?.currency}
              </dd>
            </div>
            <i className='pi pi-check text-primary text-base' aria-hidden='true' />
          </div>
          <div className='flex items-center justify-between py-2.5'>
            <div>
              <dt className='text-sm font-semibold text-text'>Language</dt>
              <dd className='text-xs text-text-muted mt-0.5'>
                {profile?.language}
              </dd>
            </div>
            <i className='pi pi-check text-primary text-base' aria-hidden='true' />
          </div>
        </dl>
      )}
    </section>
  );
}
