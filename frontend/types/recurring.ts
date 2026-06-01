import type { Account } from './account';
import type { Category } from './category';

export type RecurringKind = 'INCOME' | 'EXPENSE';
export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringRule {
  id: string;
  userId: string;
  kind: RecurringKind;
  amount: number;
  accountId: string;
  categoryId: string | null;
  note: string | null;
  frequency: Frequency;
  interval: number;
  startDate: string;
  endDate: string | null;
  anchorDay: number | null;
  nextRunDate: string;
  lastRunDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  account: Account;
  category: Category | null;
}
