export type AccountType = 'BANK' | 'INVESTMENT' | 'CRYPTO' | 'CASH' | 'CREDIT';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  icon: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSummary {
  netWorth: number;
  liquidAmount: number;
  investmentAmount: number;
  creditAmount: number;
  accounts: Account[];
}
