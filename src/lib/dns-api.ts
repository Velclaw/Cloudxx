import { NextResponse } from 'next/server';
import { auth } from '../auth';
import type { Prisma } from '../../generated/prisma/client';
export { validDomainName, validRecordType } from './dns-validation';
import { validDomainName, validRecordType } from './dns-validation';

export async function requireDnsUser(): Promise<{ userId: string; response: null } | { userId: null; response: NextResponse }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { userId: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  return { userId, response: null };
}

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
}

export function auditPayload(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
