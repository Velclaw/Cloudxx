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
  // Prefer the platform-provided single client IP header; forwarded chains may contain client-supplied values.
  return request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() || null;
}

export function auditPayload(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
