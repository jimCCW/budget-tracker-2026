import { PrismaClient, Prisma, AccountType } from '@prisma/client';
import { appError } from '../utils/appError';

const prisma = new PrismaClient();

const LIQUID_TYPES: AccountType[] = ['BANK', 'CASH'];
const INVESTMENT_TYPES: AccountType[] = ['INVESTMENT', 'CRYPTO'];
const CREDIT_TYPES: AccountType[] = ['CREDIT'];

/**
 * Returns all accounts for the given user, ordered by creation date.
 * @param userId - The authenticated user's ID.
 * @returns Array of Account records.
 */
export async function getAll(userId: string) {
  return prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Returns all accounts plus computed summary figures.
 * netWorth = liquidAmount + investmentAmount − creditAmount (CREDIT is a liability).
 * @param userId - The authenticated user's ID.
 */
export async function getSummary(userId: string) {
  const accounts = await getAll(userId);

  const liquidAmount = accounts
    .filter((a) => LIQUID_TYPES.includes(a.type))
    .reduce((sum, a) => sum + a.balance, 0);
  const investmentAmount = accounts
    .filter((a) => INVESTMENT_TYPES.includes(a.type))
    .reduce((sum, a) => sum + a.balance, 0);
  const creditAmount = accounts
    .filter((a) => CREDIT_TYPES.includes(a.type))
    .reduce((sum, a) => sum + a.balance, 0);
  const netWorth = liquidAmount + investmentAmount - creditAmount;

  return { netWorth, liquidAmount, investmentAmount, creditAmount, accounts };
}

/**
 * Creates a new account for the given user.
 * @param userId - The authenticated user's ID.
 * @param data - Account fields: name (required), optional type, balance, icon, color.
 * @returns The newly created Account record.
 */
export async function create(
  userId: string,
  data: {
    name: string;
    type?: AccountType;
    balance?: number;
    icon?: string;
    color?: string;
  }
) {
  return prisma.account.create({
    data: {
      userId,
      name: data.name,
      type: data.type ?? 'BANK',
      balance: data.balance ?? 0,
      icon: data.icon,
      color: data.color,
    },
  });
}

/**
 * Creates the default "Main Account" for a newly registered user within a transaction.
 * @param userId - The newly created user's ID.
 * @param tx - Prisma transaction client to ensure atomicity with user creation.
 */
export async function createDefault(
  userId: string,
  tx: Prisma.TransactionClient
) {
  return tx.account.create({
    data: {
      userId,
      name: 'Main Account',
      type: 'BANK',
      balance: 0,
    },
  });
}

/**
 * Updates a user-owned account.
 * @param userId - The authenticated user's ID; must match the account owner.
 * @param id - The account ID to update.
 * @param data - Updated fields (all optional).
 * @returns The updated Account record.
 * @throws NOT_FOUND (404) if no account exists with that ID.
 * @throws FORBIDDEN (403) if the account belongs to another user.
 */
export async function update(
  userId: string,
  id: string,
  data: {
    name?: string;
    type?: AccountType;
    balance?: number;
    icon?: string;
    color?: string;
  }
) {
  const account = await prisma.account.findUnique({ where: { id } });
  if (!account) throw appError('NOT_FOUND', 'Account not found.', 404);
  if (account.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to edit this account.',
      403
    );

  return prisma.account.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      balance: data.balance,
      icon: data.icon,
      color: data.color,
    },
  });
}

/**
 * Permanently deletes a user-owned account.
 * @param userId - The authenticated user's ID; must match the account owner.
 * @param id - The account ID to delete.
 * @returns `{ deleted: true }` on success.
 * @throws NOT_FOUND (404) if no account exists with that ID.
 * @throws FORBIDDEN (403) if the account belongs to another user.
 * @throws CONFLICT (409) if this is the user's only account.
 */
export async function remove(userId: string, id: string) {
  const account = await prisma.account.findUnique({ where: { id } });
  if (!account) throw appError('NOT_FOUND', 'Account not found.', 404);
  if (account.userId !== userId)
    throw appError(
      'FORBIDDEN',
      'You do not have permission to delete this account.',
      403
    );

  const count = await prisma.account.count({ where: { userId } });
  if (count === 1)
    throw appError('CONFLICT', 'You must keep at least one account.', 409);

  await prisma.account.delete({ where: { id } });
  return { deleted: true };
}
