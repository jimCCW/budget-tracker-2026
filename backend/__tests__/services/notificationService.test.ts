jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import { prisma } from '../../src/lib/prisma';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../src/services/notificationService';

const db = prisma as unknown as {
  notification: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    deleteMany: jest.Mock;
  };
};

beforeEach(() => {
  jest.clearAllMocks();
});

const USER_ID = 'user-1';

const makeNotification = (id: string) => ({
  id,
  userId: USER_ID,
  isRead: false,
  createdAt: new Date(),
  recurringRule: null,
});

describe('getNotifications', () => {
  it('scopes query to the given userId', async () => {
    db.notification.findMany.mockResolvedValue([]);

    await getNotifications(USER_ID);

    expect(db.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID } })
    );
  });

  it('returns notifications and null nextCursor when there is no next page', async () => {
    const rows = [makeNotification('n-1'), makeNotification('n-2')];
    db.notification.findMany.mockResolvedValue(rows);

    const result = await getNotifications(USER_ID, undefined, 10);

    expect(result.notifications).toEqual(rows);
    expect(result.nextCursor).toBeNull();
  });

  it('returns nextCursor when there are more results than the limit', async () => {
    const rows = [makeNotification('n-1'), makeNotification('n-2'), makeNotification('n-3')];
    db.notification.findMany.mockResolvedValue(rows);

    const result = await getNotifications(USER_ID, undefined, 2);

    expect(result.notifications).toHaveLength(2);
    expect(result.nextCursor).toBe('n-2');
  });

  it('passes cursor to prisma when provided', async () => {
    db.notification.findMany.mockResolvedValue([]);

    await getNotifications(USER_ID, 'cursor-id', 10);

    expect(db.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: 'cursor-id' },
        skip: 1,
      })
    );
  });
});

describe('getUnreadCount', () => {
  it('counts only unread notifications for the user', async () => {
    db.notification.count.mockResolvedValue(5);

    const count = await getUnreadCount(USER_ID);

    expect(db.notification.count).toHaveBeenCalledWith({
      where: { userId: USER_ID, isRead: false },
    });
    expect(count).toBe(5);
  });
});

describe('markAsRead', () => {
  it('throws NOT_FOUND when notification does not exist or belongs to another user', async () => {
    db.notification.findFirst.mockResolvedValue(null);

    await expect(markAsRead(USER_ID, 'n-x')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('marks the notification as read and returns the updated record', async () => {
    const notif = makeNotification('n-1');
    db.notification.findFirst.mockResolvedValue(notif);
    const updated = { ...notif, isRead: true };
    db.notification.update.mockResolvedValue(updated);

    const result = await markAsRead(USER_ID, 'n-1');

    expect(db.notification.findFirst).toHaveBeenCalledWith({
      where: { id: 'n-1', userId: USER_ID },
    });
    expect(db.notification.update).toHaveBeenCalledWith({
      where: { id: 'n-1' },
      data: { isRead: true },
    });
    expect(result).toEqual(updated);
  });
});

describe('markAllAsRead', () => {
  it('updates all unread notifications for the user', async () => {
    db.notification.updateMany.mockResolvedValue({ count: 3 });

    const result = await markAllAsRead(USER_ID);

    expect(db.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, isRead: false },
      data: { isRead: true },
    });
    expect(result).toEqual({ count: 3 });
  });
});

describe('deleteNotification', () => {
  it('throws NOT_FOUND when notification does not exist or belongs to another user', async () => {
    db.notification.deleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteNotification(USER_ID, 'n-x')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('deletes the notification when it belongs to the user', async () => {
    db.notification.deleteMany.mockResolvedValue({ count: 1 });

    await expect(deleteNotification(USER_ID, 'n-1')).resolves.toBeUndefined();

    expect(db.notification.deleteMany).toHaveBeenCalledWith({
      where: { id: 'n-1', userId: USER_ID },
    });
  });
});
