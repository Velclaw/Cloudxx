-- Additive migration: preserves all existing Auth.js and Profile data.
CREATE TABLE "Domain" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "registrar" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "autoRenew" BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3),
  "nameservers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "dnssec" BOOLEAN NOT NULL DEFAULT false,
  "environment" TEXT NOT NULL DEFAULT 'production',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DNSRecord" (
  "id" TEXT NOT NULL,
  "domainId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "ttl" INTEGER NOT NULL DEFAULT 300,
  "ttlAuto" BOOLEAN NOT NULL DEFAULT false,
  "priority" INTEGER,
  "port" INTEGER,
  "weight" INTEGER,
  "proxied" BOOLEAN NOT NULL DEFAULT false,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DNSRecord_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Registrar" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "accountEmail" TEXT,
  "status" TEXT NOT NULL DEFAULT 'disconnected',
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Registrar_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "domainId" TEXT,
  "action" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Domain_userId_name_key" ON "Domain"("userId","name");
CREATE INDEX "Domain_userId_updatedAt_idx" ON "Domain"("userId","updatedAt");
CREATE INDEX "DNSRecord_domainId_name_type_idx" ON "DNSRecord"("domainId","name","type");
CREATE UNIQUE INDEX "Registrar_userId_provider_displayName_key" ON "Registrar"("userId","provider","displayName");
CREATE INDEX "Registrar_userId_idx" ON "Registrar"("userId");
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId","createdAt");
CREATE INDEX "AuditLog_domainId_createdAt_idx" ON "AuditLog"("domainId","createdAt");
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DNSRecord" ADD CONSTRAINT "DNSRecord_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Registrar" ADD CONSTRAINT "Registrar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;
