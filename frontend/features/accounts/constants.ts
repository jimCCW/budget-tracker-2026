import type { AccountType } from '@/types/account';

export const ACCOUNT_TYPE_META: Record<
  AccountType,
  { label: string; icon: string; color: string; group: 'liquid' | 'investment' | 'credit' }
> = {
  BANK: { label: 'Bank', icon: 'pi-building-columns', color: '#6366F1', group: 'liquid' },
  CASH: { label: 'Cash', icon: 'pi-wallet', color: '#F59E0B', group: 'liquid' },
  INVESTMENT: { label: 'Investment', icon: 'pi-chart-line', color: '#10B981', group: 'investment' },
  CRYPTO: { label: 'Crypto', icon: 'pi-bitcoin', color: '#F97316', group: 'investment' },
  CREDIT: { label: 'Credit Card', icon: 'pi-credit-card', color: '#EF4444', group: 'credit' },
};

export const ACCOUNT_COLORS = [
  '#6366F1',
  '#10B981',
  '#F59E0B',
  '#A855F7',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#EF4444',
  '#14B8A6',
  '#84CC16',
  '#8B5CF6',
  '#475569',
] as const;

export const DEFAULT_ACCOUNT_COLOR = '#6366F1';
