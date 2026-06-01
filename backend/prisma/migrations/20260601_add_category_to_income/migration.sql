-- Add categoryId to Income (nullable first to allow backfill)
ALTER TABLE "Income" ADD COLUMN "categoryId" TEXT;

-- Backfill existing rows with first INCOME category (seed creates "Salary")
UPDATE "Income"
SET "categoryId" = (
  SELECT id FROM "Category" WHERE type = 'INCOME' ORDER BY "createdAt" LIMIT 1
);

-- Make NOT NULL
ALTER TABLE "Income" ALTER COLUMN "categoryId" SET NOT NULL;

-- FK — RESTRICT prevents deleting a category that has income records
ALTER TABLE "Income"
  ADD CONSTRAINT "Income_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
