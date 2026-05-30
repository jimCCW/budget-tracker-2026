export type CategoryType = 'EXPENSE' | 'INCOME';

export interface Category {
  id: string;
  userId: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  type: CategoryType;
  isDefault: boolean;
}
