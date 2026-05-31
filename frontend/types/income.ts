import type { Account } from './account';

export interface Income {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  date: string;
  month: number;
  year: number;
  note: string | null;
  createdAt: string;
  account: Account;
}
