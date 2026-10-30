import { NextResponse } from 'next/server';
import { auth } from '../auth';
import type { Prisma } from '../../generated/prisma/client';
export { validDomainName, validRecordType } from './dns-validation';
import { validDomainName, validRecordType } from './dns-validation';

export async function requireDnsUser(): Promise<string | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  return userId;
}

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
}

export function auditPayload(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
