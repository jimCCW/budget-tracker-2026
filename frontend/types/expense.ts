import type { Account } from './account';
import type { Category } from './category';

export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  accountId: string;
  amount: number;
  description: string | null;
  date: string;
  isRecurring: boolean;
  recurrence: string | null;
  createdAt: string;
  account: Account;
  category: Category;
}
