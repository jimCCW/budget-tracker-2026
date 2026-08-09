-- Both have literal (non-derived) defaults, so a single ADD COLUMN with
-- DEFAULT covers existing rows without a separate backfill step.
ALTER TABLE "User" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'SGD';
ALTER TABLE "User" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'English';

CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserSession_userId_revokedAt_idx" ON "UserSession"("userId", "revokedAt");

ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
