import { PrismaClient, CategoryType } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES: {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
}[] = [
  { name: 'Housing', icon: 'pi-home', color: '#6366F1', type: 'EXPENSE' },
  {
    name: 'Food & Dining',
    icon: 'pi-shopping-cart',
    color: '#F59E0B',
    type: 'EXPENSE',
  },
  { name: 'Transport', icon: 'pi-car', color: '#06B6D4', type: 'EXPENSE' },
  { name: 'Utilities', icon: 'pi-bolt', color: '#475569', type: 'EXPENSE' },
  { name: 'Healthcare', icon: 'pi-heart', color: '#10B981', type: 'EXPENSE' },
  { name: 'Entertainment', icon: 'pi-star', color: '#A855F7', type: 'EXPENSE' },
  {
    name: 'Shopping',
    icon: 'pi-shopping-bag',
    color: '#EC4899',
    type: 'EXPENSE',
  },
  { name: 'Education', icon: 'pi-book', color: '#14B8A6', type: 'EXPENSE' },
  { name: 'Travel', icon: 'pi-globe', color: '#FF6363', type: 'EXPENSE' },
  {
    name: 'Subscriptions',
    icon: 'pi-refresh',
    color: '#8B5CF6',
    type: 'EXPENSE',
  },
  { name: 'Personal Care', icon: 'pi-user', color: '#84CC16', type: 'EXPENSE' },
  { name: 'Other', icon: 'pi-tag', color: '#94A3B8', type: 'EXPENSE' },
  { name: 'Salary', icon: 'pi-briefcase', color: '#10B981', type: 'INCOME' },
  {
    name: 'Investment',
    icon: 'pi-chart-line',
    color: '#6366F1',
    type: 'INCOME',
  },
];

async function main() {
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.name },
      update: { icon: cat.icon, color: cat.color, type: cat.type },
      create: {
        id: cat.name,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
        isDefault: true,
        userId: null,
      },
    });
  }
  console.log('Seeded default categories');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
