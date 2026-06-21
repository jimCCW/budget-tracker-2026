import { PrismaClient } from '@prisma/client';
import { appError } from './appError';

/**
 * Fetches an account by ID and verifies it belongs to the given user.
 * @throws NOT_FOUND (404) if the account does not exist.
 * @throws FORBIDDEN (403) if the account belongs to a different user.
 */
export async function verifyAccountOwnership(
  prisma: PrismaClient,
  userId: string,
  accountId: string
) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw appError('NOT_FOUND', 'Account not found.', 404);
  if (account.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to use this account.',
      403
    );
  return account;
}

/**
 * Fetches a category by ID and verifies it is accessible to the given user.
 * System-default categories (userId === null) are accessible by all users.
 * @throws NOT_FOUND (404) if the category does not exist.
 * @throws FORBIDDEN (403) if the category belongs to a different user.
 */
export async function verifyCategoryOwnership(
  prisma: PrismaClient,
  userId: string,
  categoryId: string
) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) throw appError('NOT_FOUND', 'Category not found.', 404);
  if (category.userId !== null && category.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to use this category.',
      403
    );
  return category;
}
