-- Align existing Supabase database (already had tables; no _prisma_migrations history)
-- Safe for re-run: uses IF NOT EXISTS / duplicate_object guards where possible.

-- Issue.verifier (matches prisma Issue.verifiedBy -> User)
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "verifiedBy" INTEGER;

DO $$
BEGIN
  ALTER TABLE "Issue"
    ADD CONSTRAINT "Issue_verifiedBy_fkey"
    FOREIGN KEY ("verifiedBy") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Comment.userId + Comment.updatedAt (required by Prisma schema)
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "userId" INTEGER;
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

UPDATE "Comment" AS c
SET "userId" = i."userId"
FROM "Issue" AS i
WHERE c."issueId" = i.id
  AND c."userId" IS NULL;

UPDATE "Comment"
SET "userId" = (SELECT "id" FROM "User" ORDER BY "id" ASC LIMIT 1)
WHERE "userId" IS NULL;

UPDATE "Comment"
SET "updatedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP)
WHERE "updatedAt" IS NULL;

ALTER TABLE "Comment" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Comment" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Comment" ALTER COLUMN "updatedAt" SET NOT NULL;

DO $$
BEGIN
  ALTER TABLE "Comment"
    ADD CONSTRAINT "Comment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Notification.issueId -> Issue (nullable FK)
DO $$
BEGIN
  ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_issueId_fkey"
    FOREIGN KEY ("issueId") REFERENCES "Issue"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
