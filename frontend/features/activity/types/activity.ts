export type ActivityType = 'EXPENSE' | 'INCOME';

export type ActivityItem = {
  id: string;
  type: ActivityType;
  date: string;
  amount: number;
  note: string | null;
  isRecurring: boolean;
  createdAt: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
  account: { id: string; name: string };
};

export type ActivityListResponse = {
  items: ActivityItem[];
  nextCursor: string | null;
  hasNextPage: boolean;
  total: number;
  totalPages: number;
};

export type ActivityFilters = {
  type: 'ALL' | ActivityType;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
};
