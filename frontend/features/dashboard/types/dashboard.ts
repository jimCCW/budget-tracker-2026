export type DashboardSummary = {
  balance: number;
  accountsCount: number;
  income: { total: number; count: number; trendPct: number | null };
  expense: { total: number; count: number; trendPct: number | null };
  saved: { amount: number; pctOfIncome: number | null };
  categoryBreakdown: {
    name: string;
    icon: string;
    color: string;
    value: number;
  }[];
};

export type DashboardTrendRange = '6M' | '1Y' | 'All';

export type DashboardTrendPoint = {
  month: string;
  income: number;
  expenses: number;
};
