/*
  Warnings:

  - Added the required column `accountId` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `Income` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Income` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add columns as nullable first so existing rows are unaffected
ALTER TABLE "Expense" ADD COLUMN "accountId" TEXT;
ALTER TABLE "Income"  ADD COLUMN "accountId" TEXT;
ALTER TABLE "Income"  ADD COLUMN "date" TIMESTAMP(3);

-- Step 2: Backfill accountId for existing rows using the user's earliest account
UPDATE "Income" i
SET "accountId" = (
  SELECT a.id FROM "Account" a
  WHERE a."userId" = i."userId"
  ORDER BY a."createdAt" ASC
  LIMIT 1
)
WHERE i."accountId" IS NULL;

UPDATE "Expense" e
SET "accountId" = (
  SELECT a.id FROM "Account" a
  WHERE a."userId" = e."userId"
  ORDER BY a."createdAt" ASC
  LIMIT 1
)
WHERE e."accountId" IS NULL;

-- Step 3: Backfill date for existing Income rows (use first day of the stored month/year)
UPDATE "Income"
SET "date" = make_date("year", "month", 1)::timestamp
WHERE "date" IS NULL;

-- Step 4: Set NOT NULL now that all rows have values
ALTER TABLE "Income"  ALTER COLUMN "accountId" SET NOT NULL;
ALTER TABLE "Income"  ALTER COLUMN "date"      SET NOT NULL;
ALTER TABLE "Expense" ALTER COLUMN "accountId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Expense_userId_date_idx" ON "Expense"("userId", "date");

-- CreateIndex
CREATE INDEX "Income_userId_year_month_idx" ON "Income"("userId", "year", "month");

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
