import bcrypt from 'bcrypt';
import { appError } from '../utils/appError';
import { prisma } from '../lib/prisma';

const PROFILE_SELECT = {
  id: true,
  email: true,
  name: true,
  firstName: true,
  lastName: true,
  currency: true,
  language: true,
  createdAt: true,
} as const;

/**
 * Returns the authenticated user's own profile (never includes `passwordHash` or tokens).
 * @param userId - The authenticated user's ID.
 * @throws NOT_FOUND (404) if the user no longer exists.
 */
export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PROFILE_SELECT,
  });
  if (!user) throw appError('NOT_FOUND', 'User not found.', 404);
  return user;
}

/**
 * Updates the authenticated user's first name, last name, and full display
 * name — all three are independently editable (the sidebar avatar initials
 * are derived from firstName/lastName, `name` is the free-text display name).
 * @param userId - The authenticated user's ID.
 * @param data - Object containing the new first name, last name, and full name.
 * @returns The updated profile.
 */
export async function updateProfile(
  userId: string,
  data: { firstName: string; lastName: string; name: string }
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      name: data.name,
    },
    select: PROFILE_SELECT,
  });
}

/**
 * Changes the authenticated user's password after verifying their current one.
 * @param userId - The authenticated user's ID.
 * @param data - Object containing the current plain-text password and the new one.
 * @throws NOT_FOUND (404) if the user no longer exists.
 * @throws FORBIDDEN (403) if the current password does not match.
 * @returns A success message object.
 */
export async function changePassword(
  userId: string,
  data: { currentPassword: string; password: string }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw appError('NOT_FOUND', 'User not found.', 404);

  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!valid)
    // FORBIDDEN, not UNAUTHORIZED — the frontend's apiClient interceptor
    // force-signs-out on any 401 (to drop a JWT that outlived its session),
    // and a wrong password here is a business-logic failure, not a dead token.
    throw appError('FORBIDDEN', 'Current password is incorrect.', 403);

  const passwordHash = await bcrypt.hash(data.password, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { message: 'Password updated successfully.' };
}

/**
 * Permanently deletes the authenticated user's account after verifying their
 * password, including every row they own. Deletes in FK-safe order — rows
 * that reference accounts/categories/recurring rules go first, since Prisma
 * defaults required relations to RESTRICT rather than CASCADE. `Notification`
 * and `UserSession` rows cascade automatically via the `User` FK.
 * @param userId - The authenticated user's ID.
 * @param data - Object containing the current plain-text password.
 * @throws NOT_FOUND (404) if the user no longer exists.
 * @throws FORBIDDEN (403) if the password does not match.
 * @returns `{ deleted: true }` on success.
 */
export async function deleteAccount(
  userId: string,
  data: { password: string }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw appError('NOT_FOUND', 'User not found.', 404);

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  // FORBIDDEN, not UNAUTHORIZED — see the identical note in changePassword().
  if (!valid) throw appError('FORBIDDEN', 'Password is incorrect.', 403);

  await prisma.$transaction(async (tx) => {
    await tx.income.deleteMany({ where: { userId } });
    await tx.expense.deleteMany({ where: { userId } });
    await tx.recurringRule.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });
    await tx.category.deleteMany({ where: { userId } });
    await tx.savingsBase.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  return { deleted: true };
}
