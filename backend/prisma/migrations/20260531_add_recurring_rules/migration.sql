-- AlterEnum: add DAILY and WEEKLY to RecurrenceType
ALTER TYPE "RecurrenceType" ADD VALUE 'DAILY';
ALTER TYPE "RecurrenceType" ADD VALUE 'WEEKLY';

-- CreateEnum: RecurringKind
CREATE TYPE "RecurringKind" AS ENUM ('INCOME', 'EXPENSE');

-- AlterTable: add recurringRuleId to Income (nullable)
ALTER TABLE "Income" ADD COLUMN "recurringRuleId" TEXT;

-- AlterTable: add recurringRuleId to Expense (nullable)
ALTER TABLE "Expense" ADD COLUMN "recurringRuleId" TEXT;

-- CreateTable: RecurringRule
CREATE TABLE "RecurringRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "RecurringKind" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT,
    "note" TEXT,
    "frequency" "RecurrenceType" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "anchorDay" INTEGER,
    "nextRunDate" TIMESTAMP(3) NOT NULL,
    "lastRunDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: RecurringRule lookup
CREATE INDEX "RecurringRule_userId_isActive_nextRunDate_idx" ON "RecurringRule"("userId", "isActive", "nextRunDate");

-- CreateIndex: idempotency constraints on Income and Expense
-- NULLs are distinct in Postgres so manual entries (recurringRuleId = NULL) are unconstrained
CREATE UNIQUE INDEX "Income_recurringRuleId_date_key" ON "Income"("recurringRuleId", "date");
CREATE UNIQUE INDEX "Expense_recurringRuleId_date_key" ON "Expense"("recurringRuleId", "date");

-- AddForeignKey: RecurringRule -> User
ALTER TABLE "RecurringRule" ADD CONSTRAINT "RecurringRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: RecurringRule -> Account
ALTER TABLE "RecurringRule" ADD CONSTRAINT "RecurringRule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: RecurringRule -> Category (nullable)
ALTER TABLE "RecurringRule" ADD CONSTRAINT "RecurringRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Income -> RecurringRule (SET NULL on delete so historical rows survive)
ALTER TABLE "Income" ADD CONSTRAINT "Income_recurringRuleId_fkey" FOREIGN KEY ("recurringRuleId") REFERENCES "RecurringRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Expense -> RecurringRule (SET NULL on delete)
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recurringRuleId_fkey" FOREIGN KEY ("recurringRuleId") REFERENCES "RecurringRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
