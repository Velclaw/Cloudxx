CREATE TABLE IF NOT EXISTS "AuthRateLimit" (
  "key" TEXT NOT NULL,
  "windowStartedAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("key")
);
CREATE INDEX IF NOT EXISTS "AuthRateLimit_updatedAt_idx"
  ON "AuthRateLimit"("updatedAt");
