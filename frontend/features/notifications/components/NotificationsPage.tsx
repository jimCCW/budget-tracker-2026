'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { AppShell } from '@/components/AppShell';
import { useNotifications } from '../hooks/useNotifications';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { useMarkAllAsRead } from '../hooks/useMarkAllAsRead';
import { NotificationDetailModal } from './NotificationDetailModal';
import {
  resolveIcon,
  getDateGroup,
  groupNotifications,
  formatRelativeTime,
  GROUP_ORDER,
} from '../utils/notificationUtils';
import type { Notification } from '@/types/notification';

function NotificationCard({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const cfg = resolveIcon(notification);

  return (
    <button
      onClick={onClick}
      className='w-full text-left p-4 bg-surface border border-border rounded-xl shadow-sm hover:bg-raised transition-colors cursor-pointer'
    >
      <div className='flex gap-3.5'>
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.useStyle ? '' : `${cfg.bgClass} ${cfg.textClass}`}`}
          style={
            cfg.useStyle ? { ...cfg.bgStyle, ...cfg.textStyle } : undefined
          }
          aria-hidden='true'
        >
          <i className={`pi ${cfg.icon} text-lg`} />
        </div>
        <div className='flex-1 min-w-0'>
          <div className='flex items-baseline justify-between gap-2'>
            <span
              className={`text-sm truncate ${notification.isRead ? 'font-semibold' : 'font-bold'} text-text`}
            >
              {notification.title}
            </span>
            {!notification.isRead && (
              <span
                aria-hidden='true'
                className='w-2 h-2 rounded-full bg-primary shrink-0'
              />
            )}
            {!notification.isRead && (
              <span className='sr-only'>Unread</span>
            )}
          </div>
          <p className='text-xs text-text-muted mt-1 leading-relaxed line-clamp-2'>
            {notification.body}
          </p>
          <time
            dateTime={notification.createdAt}
            className='text-[11px] text-text-dim mt-1.5 block'
          >
            {formatRelativeTime(notification.createdAt)}
          </time>
        </div>
      </div>
    </button>
  );
}

export function NotificationsPage() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead();

  const [selected, setSelected] = useState<Notification | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allNotifications: Notification[] =
    data?.pages.flatMap((p) => p.notifications) ?? [];
  const grouped = groupNotifications(allNotifications);

  return (
    <AppShell
      title='Notifications'
      subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
    >
      {/* Toolbar */}
      {allNotifications.length > 0 && (
        <div role='toolbar' className='flex justify-end mb-4'>
          <Button
            onClick={() => markAllAsRead()}
            disabled={unreadCount === 0 || isMarkingAll}
            pt={{
              root: {
                className:
                  'flex items-center gap-2 h-9 px-4 rounded-md border border-border text-sm font-semibold text-text hover:bg-raised transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
              },
            }}
          >
            <i className='pi pi-check text-sm' aria-hidden='true' />
            Mark all read
          </Button>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div role='status' aria-busy='true' className='flex flex-col gap-3'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='p-4 bg-surface border border-border rounded-xl flex gap-3.5'
            >
              <Skeleton width='44px' height='44px' borderRadius='12px' />
              <div className='flex-1 flex flex-col gap-2 pt-1'>
                <Skeleton width='60%' height='14px' />
                <Skeleton width='90%' height='12px' />
                <Skeleton width='30%' height='10px' />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && allNotifications.length === 0 && (
        <div className='flex flex-col items-center justify-center py-20 text-text-dim'>
          <i className='pi pi-bell-slash text-4xl mb-4' aria-hidden='true' />
          <p className='text-sm font-semibold text-text-muted'>
            You&apos;re all caught up
          </p>
          <p className='text-xs text-text-dim mt-1'>
            Notifications will appear here when recurring transactions are
            processed.
          </p>
        </div>
      )}

      {/* Grouped notification list */}
      {!isLoading && allNotifications.length > 0 && (
        <div className='flex flex-col gap-6'>
          {GROUP_ORDER.filter((g) => grouped.has(g)).map((group) => {
            const groupId = `notif-group-${group.toLowerCase().replace(/\s+/g, '-')}`;
            return (
            <section key={group} aria-labelledby={groupId}>
              <h2
                id={groupId}
                className='text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3 px-0.5'
              >
                {group}
              </h2>
              <ul className='flex flex-col gap-2'>
                {grouped.get(group)!.map((n) => (
                  <li key={n.id}>
                    <NotificationCard
                      notification={n}
                      onClick={() => setSelected(n)}
                    />
                  </li>
                ))}
              </ul>
            </section>
            );
          })}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} aria-hidden='true' className='h-1' />

          {isFetchingNextPage && (
            <div
              role='status'
              aria-label='Loading more notifications'
              className='flex justify-center py-4'
            >
              <i
                className='pi pi-spin pi-spinner text-text-muted text-xl'
                aria-hidden='true'
              />
            </div>
          )}

          {!hasNextPage && allNotifications.length >= 100 && (
            <p
              aria-live='polite'
              className='text-center text-xs text-text-dim py-4'
            >
              All notifications loaded
            </p>
          )}
        </div>
      )}

      <NotificationDetailModal
        notification={selected}
        onClose={() => setSelected(null)}
      />
    </AppShell>
  );
}
