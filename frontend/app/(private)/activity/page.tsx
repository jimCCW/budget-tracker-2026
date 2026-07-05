import { ActivityPage } from '@/features/activity/components/ActivityPage';
import type { ActivityFilters } from '@/features/activity/types/activity';

interface Props {
  searchParams: Promise<{ type?: string; categoryId?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const { type, categoryId } = await searchParams;
  const initialType: ActivityFilters['type'] =
    type === 'EXPENSE' || type === 'INCOME' ? type : 'ALL';

  return (
    <ActivityPage initialType={initialType} initialCategoryId={categoryId} />
  );
}
