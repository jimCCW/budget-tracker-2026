'use client';
import { useEffect } from 'react';
import { Button } from 'primereact/button';
import { Modal } from '@/components/ui/Modal';
import { useMarkAsRead } from '../hooks/useMarkAsRead';
import { resolveIcon, formatDateTime } from '../utils/notificationUtils';
import type { Notification } from '@/types/notification';

type Props = {
  notification: Notification | null;
  onClose: () => void;
};

export function NotificationDetailModal({ notification, onClose }: Props) {
  const { mutate: markAsRead } = useMarkAsRead();

  useEffect(() => {
    if (notification && !notification.isRead) {
      markAsRead(notification.id);
    }
  }, [notification?.id, notification?.isRead, markAsRead]);

  if (!notification) return null;

  const cfg = resolveIcon(notification);

  return (
    <Modal
      open={!!notification}
      onClose={onClose}
      maxWidth='max-w-md'
      ariaLabelledBy='notification-detail-heading'
    >
      <div className='p-6'>
        {/* Header */}
        <div className='flex items-start justify-between gap-4 mb-5'>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cfg.useStyle ? '' : `${cfg.bgClass} ${cfg.textClass}`}`}
            style={
              cfg.useStyle ? { ...cfg.bgStyle, ...cfg.textStyle } : undefined
            }
            aria-hidden='true'
          >
            <i className={`pi ${cfg.icon} text-xl`} />
          </div>
          <Button
            onClick={onClose}
            aria-label='Close'
            pt={{
              root: {
                className:
                  'w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-raised transition-colors shrink-0',
              },
            }}
          >
            <i className='pi pi-times text-sm' aria-hidden='true' />
          </Button>
        </div>

        {/* Content */}
        <h2
          id='notification-detail-heading'
          className='text-base font-bold text-text mb-2'
        >
          {notification.title}
        </h2>
        <p className='text-sm text-text-muted leading-relaxed mb-4'>
          {notification.body}
        </p>
        <p className='text-xs text-text-dim'>
          <time dateTime={notification.createdAt}>
            {formatDateTime(notification.createdAt)}
          </time>
        </p>

        {/* Footer */}
        <div className='mt-6'>
          <Button
            onClick={onClose}
            pt={{
              root: {
                className:
                  'w-full h-10 flex items-center justify-center rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary-strong transition-colors',
              },
            }}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
