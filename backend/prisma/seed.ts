import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  'Housing',
  'Food & Dining',
  'Transport',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Education',
  'Travel',
  'Subscriptions',
  'Personal Care',
  'Other',
];

async function main() {
  for (const name of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: name },
      update: {},
      create: { id: name, name, isDefault: true, userId: null },
    });
  }
  console.log('Seeded default categories');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
