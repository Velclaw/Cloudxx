import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL ??
  process.env.DIRECT_URL ??
  (process.env.NODE_ENV === 'production' ? undefined : 'postgresql://build:build@127.0.0.1:5432/cloudxx');

if (!connectionString) {
  throw new Error('Database configuration missing: set DATABASE_URL or POSTGRES_PRISMA_URL.');
}

const adapter = new PrismaPg({ connectionString });
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
