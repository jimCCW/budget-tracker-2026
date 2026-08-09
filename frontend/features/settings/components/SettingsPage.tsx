'use client';
import { AppShell } from '@/components/AppShell';
import { PersonalInfoCard } from '@/features/settings/components/PersonalInfoCard';
import { SecuritySection } from '@/features/settings/components/SecuritySection';
import { CurrencyRegionSection } from '@/features/settings/components/CurrencyRegionSection';
import { SignOutCard } from '@/features/settings/components/SignOutCard';
import { DeleteAccountCard } from '@/features/settings/components/DeleteAccountCard';

export function SettingsPage() {
  return (
    <AppShell title='Settings' subtitle='Manage your account'>
      <div className='flex flex-col gap-4'>
        <PersonalInfoCard />
        <SecuritySection />
        <CurrencyRegionSection />
        <SignOutCard />
        <DeleteAccountCard />
      </div>
    </AppShell>
  );
}
