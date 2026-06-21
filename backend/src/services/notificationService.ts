import { PrismaClient } from '@prisma/client';
import { appError } from '../utils/appError';

const prisma = new PrismaClient();

const DEFAULT_LIMIT = 100;

/**
 * Returns a paginated list of notifications for the user, newest first.
 * Uses cursor-based pagination: pass the last returned id as `cursor` to fetch the next page.
 * @param userId - The authenticated user's ID.
 * @param cursor - Optional notification id to paginate from.
 * @param limit - Maximum records to return (default 100).
 */
export async function getNotifications(
  userId: string,
  cursor?: string,
  limit: number = DEFAULT_LIMIT
): Promise<{ notifications: object[]; nextCursor: string | null }> {
  const take = limit + 1;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      recurringRule: {
        include: { category: true },
      },
    },
  });

  const hasMore = notifications.length > limit;
  const page = hasMore ? notifications.slice(0, limit) : notifications;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return { notifications: page, nextCursor };
}

/**
 * Returns the count of unread notifications for the user.
 * @param userId - The authenticated user's ID.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

/**
 * Marks a single notification as read. Throws 404 if not found or not owned by the user.
 * Uses findFirst with both id and userId so no separate ownership check is needed.
 * @param userId - The authenticated user's ID.
 * @param id - The notification id.
 */
export async function markAsRead(userId: string, id: string): Promise<object> {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });
  if (!notification) throw appError('NOT_FOUND', 'Notification not found', 404);

  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

/**
 * Marks all unread notifications for the user as read.
 * @param userId - The authenticated user's ID.
 */
export async function markAllAsRead(
  userId: string
): Promise<{ count: number }> {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { count: result.count };
}

/**
 * Deletes a notification. Throws 404 if not found or not owned by the user.
 * Uses deleteMany with both id and userId — single query; no match means not found or wrong user.
 * @param userId - The authenticated user's ID.
 * @param id - The notification id.
 */
export async function deleteNotification(
  userId: string,
  id: string
): Promise<void> {
  const { count } = await prisma.notification.deleteMany({
    where: { id, userId },
  });
  if (count === 0) throw appError('NOT_FOUND', 'Notification not found', 404);
}
