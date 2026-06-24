import { prisma } from '../lib/prisma';
import { appError } from '../utils/appError';

/**
 * Returns all default categories plus the user's own custom categories.
 * Default categories appear first, then user-created ones sorted by name.
 * @param userId - The authenticated user's ID used to scope custom categories.
 * @returns Array of Category records (defaults + user-owned).
 */
export async function getAll(userId: string) {
  return prisma.category.findMany({
    where: { OR: [{ isDefault: true }, { userId }] },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });
}

/**
 * Creates a new custom category scoped to the given user.
 * @param userId - The authenticated user's ID; set as the category owner.
 * @param data - Category fields: name (required), optional icon, color, and type.
 * @returns The newly created Category record.
 */
export async function create(
  userId: string,
  data: {
    name: string;
    icon?: string;
    color?: string;
    type?: 'EXPENSE' | 'INCOME';
  }
) {
  return prisma.category.create({
    data: {
      name: data.name,
      icon: data.icon,
      color: data.color,
      type: data.type ?? 'EXPENSE',
      userId,
      isDefault: false,
    },
  });
}

/**
 * Updates a user-owned category's name, icon, and color.
 * @param userId - The authenticated user's ID; must match the category owner.
 * @param id - The category ID to update.
 * @param data - Updated fields: name (required), optional icon, color, and type.
 * @returns The updated Category record.
 * @throws NOT_FOUND (404) if no category exists with that ID.
 * @throws FORBIDDEN (403) if the category is a default or belongs to another user.
 */
export async function update(
  userId: string,
  id: string,
  data: {
    name: string;
    icon?: string;
    color?: string;
    type?: 'EXPENSE' | 'INCOME';
  }
) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw appError('NOT_FOUND', 'Category not found.', 404);
  if (category.isDefault)
    throw appError('FORBIDDEN', 'Default categories cannot be edited.', 403);
  if (category.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to edit this category.',
      403
    );

  return prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      icon: data.icon,
      color: data.color,
      type: data.type,
    },
  });
}

/**
 * Permanently deletes a user-owned category.
 * @param userId - The authenticated user's ID; must match the category owner.
 * @param id - The category ID to delete.
 * @returns `{ deleted: true }` on success.
 * @throws NOT_FOUND (404) if no category exists with that ID.
 * @throws FORBIDDEN (403) if the category is a default or belongs to another user.
 * @throws CONFLICT (409) if one or more expenses are still assigned to this category.
 */
export async function remove(userId: string, id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw appError('NOT_FOUND', 'Category not found.', 404);
  if (category.isDefault)
    throw appError('FORBIDDEN', 'Default categories cannot be deleted.', 403);
  if (category.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to delete this category.',
      403
    );

  const expenseCount = await prisma.expense.count({
    where: { categoryId: id },
  });
  if (expenseCount > 0)
    throw appError(
      'CONFLICT',
      `This category has ${expenseCount} expense(s) attached and cannot be deleted.`,
      409
    );

  await prisma.category.delete({ where: { id } });
  return { deleted: true };
}
