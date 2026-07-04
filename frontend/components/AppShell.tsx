'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from 'primereact/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AddTransactionModal } from '@/features/transactions/components/AddTransactionModal';
import { useScheduledCatchup } from '@/features/recurring/hooks/useScheduledCatchup';
import { useUnreadCount } from '@/features/notifications/hooks/useUnreadCount';

type NavItem = {
  key: string;
  label: string;
  icon: string;
  href?: string;
  badge?: number;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'pi-home', href: '/dashboard' },
  { key: 'activity', label: 'Activity', icon: 'pi-list', href: '/activity' },
  // { key: 'goals', label: 'Goals', icon: 'pi-bullseye' }, // Temp disabled until we implement it
  { key: 'accounts', label: 'Accounts', icon: 'pi-wallet', href: '/accounts' },
  {
    key: 'recurring',
    label: 'Recurring',
    icon: 'pi-refresh',
    href: '/recurring',
  },
  {
    key: 'categories',
    label: 'Categories',
    icon: 'pi-tag',
    href: '/categories',
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: 'pi-bell',
    href: '/notifications',
  },
];

const FOOTER_ITEMS: NavItem[] = [
  { key: 'profile', label: 'Profile', icon: 'pi-user' },
  { key: 'settings', label: 'Settings', icon: 'pi-cog' },
];

const MOBILE_TABS: NavItem[] = [
  { key: 'dashboard', label: 'Home', icon: 'pi-home', href: '/dashboard' },
  { key: 'activity', label: 'Activity', icon: 'pi-list', href: '/activity' },
  { key: 'goals', label: 'Goals', icon: 'pi-bullseye' },
  { key: 'profile', label: 'Profile', icon: 'pi-user' },
];

type AppShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
};

export function AppShell({ children, title, subtitle }: AppShellProps) {
  useScheduledCatchup();
  const [txModalOpen, setTxModalOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadCount();
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name ?? 'Alex';
  const userEmail = session?.user?.email ?? '';
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isActive = (item: NavItem) =>
    item.href
      ? pathname === item.href || pathname.startsWith(item.href + '/')
      : false;

  return (
    <div className='flex h-screen overflow-hidden bg-bg text-text'>
      {/* ── Desktop sidebar ── */}
      <aside className='hidden lg:flex w-60 flex-col shrink-0 bg-surface border-r border-border'>
        {/* Logo */}
        <div className='flex items-center gap-2.5 px-5 py-5'>
          <div className='w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white font-extrabold text-base leading-none shadow-sm'>
            B
          </div>
          <div>
            <div className='text-base font-extrabold tracking-tight'>
              Budget Tracker
            </div>
            <div className='text-[11px] text-text-muted font-medium'>
              Budget tracker
            </div>
          </div>
        </div>

        {/* Search */}
        <div className='px-3.5 pb-3'>
          <div className='flex items-center gap-2 h-9 px-2.5 rounded-md bg-bg border border-border'>
            <i className='pi pi-search text-text-muted text-sm' />
            <span className='text-xs text-text-muted flex-1'>Search…</span>
            <kbd className='text-[10px] px-1.5 py-0.5 rounded bg-border text-text-muted font-mono'>
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Nav */}
        <nav className='flex-1 px-2.5 flex flex-col gap-0.5 overflow-y-auto'>
          <div className='text-[10px] text-text-dim font-bold uppercase tracking-widest px-2 py-1.5 mt-1'>
            Menu
          </div>
          {NAV_ITEMS.map((item) => (
            <SideNavItem
              key={item.key}
              item={
                item.key === 'notifications'
                  ? { ...item, badge: unreadCount || undefined }
                  : item
              }
              active={isActive(item)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className='px-2.5 pb-3 pt-2.5 border-t border-border'>
          {FOOTER_ITEMS.map((item) => (
            <SideNavItem key={item.key} item={item} active={false} />
          ))}
          <div className='flex items-center gap-2.5 mt-2 px-2 py-2.5 rounded-md bg-bg border border-border'>
            <div className='w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0'>
              {initials}
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-[12.5px] font-bold truncate'>{userName}</div>
              <div className='text-[10.5px] text-text-muted truncate'>
                {userEmail}
              </div>
            </div>
            <Button
              icon='pi pi-sign-out'
              onClick={() => signOut({ callbackUrl: '/login' })}
              aria-label='Sign out'
              pt={{
                root: {
                  className:
                    'w-7 h-7 flex items-center justify-center text-text-muted hover:text-text hover:bg-raised rounded-md transition-colors',
                },
                icon: { className: 'text-sm' },
              }}
            />
          </div>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className='flex flex-col flex-1 min-w-0 overflow-hidden'>
        {/* Desktop topbar */}
        <header className='hidden lg:flex items-center gap-4 h-16 px-7 shrink-0 bg-surface border-b border-border'>
          <div className='flex-1 min-w-0'>
            {subtitle && (
              <div className='text-[11.5px] text-text-muted font-semibold tracking-wide'>
                {subtitle}
              </div>
            )}
            <div className='text-lg font-extrabold tracking-tight'>{title}</div>
          </div>
          <div className='flex items-center gap-2'>
            <ThemeToggle />
            <Link
              href='/notifications'
              className='relative w-9 h-9 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-raised transition-colors'
            >
              <i className='pi pi-bell text-base' />
              {unreadCount > 0 && (
                <span className='absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center'>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <Button
              label='New Transaction'
              icon='pi pi-plus'
              onClick={() => setTxModalOpen(true)}
              pt={{
                root: {
                  className:
                    'flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary-strong transition-colors',
                },
                icon: { className: 'text-sm' },
              }}
            />
          </div>
        </header>

        {/* Mobile topbar */}
        <header className='lg:hidden shrink-0 bg-surface border-b border-border px-4 py-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div className='w-7 h-7 rounded-md bg-primary flex items-center justify-center text-white font-extrabold text-sm leading-none'>
                B
              </div>
              <span className='font-extrabold tracking-tight'>
                Budget Tracker
              </span>
            </div>
            <div className='flex items-center gap-1'>
              <Link
                href='/notifications'
                className='relative w-9 h-9 flex items-center justify-center rounded-md text-text-muted hover:text-text transition-colors'
              >
                <i className='pi pi-bell text-base' />
                {unreadCount > 0 && (
                  <span className='absolute top-1 right-1 w-3.5 h-3.5 bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center'>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <ThemeToggle />
            </div>
          </div>
          <div className='mt-2'>
            <div className='text-[11px] text-text-muted font-semibold'>
              {subtitle}
            </div>
            <div className='text-lg font-extrabold tracking-tight'>{title}</div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className='flex-1 overflow-y-auto overflow-x-hidden bg-bg p-4 lg:p-7 pb-24 lg:pb-7'>
          <div className='flex flex-col gap-4'>{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className='lg:hidden shrink-0 bg-surface border-t border-border flex items-end justify-around px-1.5 pb-4 pt-2'>
          {MOBILE_TABS.slice(0, 2).map((tab) => (
            <MobileNavTab key={tab.key} tab={tab} active={isActive(tab)} />
          ))}
          {/* FAB */}
          <div className='flex flex-col items-center gap-1 relative -mt-5'>
            <Button
              onClick={() => setTxModalOpen(true)}
              pt={{
                root: {
                  className:
                    'w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg',
                },
              }}
            >
              <i className='pi pi-plus text-xl' />
            </Button>
          </div>
          {MOBILE_TABS.slice(2).map((tab) => (
            <MobileNavTab key={tab.key} tab={tab} active={isActive(tab)} />
          ))}
        </nav>
      </div>

      <AddTransactionModal
        open={txModalOpen}
        onClose={() => setTxModalOpen(false)}
      />
    </div>
  );
}

function SideNavItem({ item, active }: { item: NavItem; active: boolean }) {
  const cls = [
    'flex items-center gap-2.5 px-2.5 py-2.5 rounded-md text-[13px] font-medium transition-colors w-full text-left',
    active ? 'bg-primary-tint text-primary font-bold' : 'text-text hover:bg-bg',
  ].join(' ');

  const inner = (
    <>
      <i className={`pi ${item.icon} text-[17px]`} />
      <span className='flex-1'>{item.label}</span>
      {item.badge != null && (
        <span className='min-w-[18px] h-[18px] px-1 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center'>
          {item.badge}
        </span>
      )}
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} className={cls}>
        {inner}
      </Link>
    );
  }
  return <Button pt={{ root: { className: cls } }}>{inner}</Button>;
}

function MobileNavTab({ tab, active }: { tab: NavItem; active: boolean }) {
  const cls = [
    'flex flex-col items-center gap-0.5 flex-1 py-1 text-[10px] font-semibold transition-colors',
    active ? 'text-primary' : 'text-text-muted',
  ].join(' ');

  const inner = (
    <>
      <i className={`pi ${tab.icon} text-[22px]`} />
      <span>{tab.label}</span>
    </>
  );

  if (tab.href) {
    return (
      <Link href={tab.href} className={cls}>
        {inner}
      </Link>
    );
  }
  return <Button pt={{ root: { className: cls } }}>{inner}</Button>;
}
