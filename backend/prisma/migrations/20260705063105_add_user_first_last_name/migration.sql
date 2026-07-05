-- Add firstName/lastName as nullable first (existing `name` column is kept as-is)
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;

-- Backfill from the existing free-text `name` column for pre-existing rows
UPDATE "User"
SET "firstName" = COALESCE(NULLIF(split_part(COALESCE(name, ''), ' ', 1), ''), 'User'),
    "lastName" = COALESCE(
      NULLIF(
        CASE
          WHEN position(' ' in COALESCE(name, '')) = 0 THEN NULL
          ELSE trim(substring(name from position(' ' in name) + 1))
        END,
        ''
      ),
      'User'
    )
WHERE "firstName" IS NULL;

-- Now that every row has a value, enforce NOT NULL
ALTER TABLE "User" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "lastName" SET NOT NULL;
