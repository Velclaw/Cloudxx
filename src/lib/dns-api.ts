import { NextResponse } from 'next/server';
import { auth } from '../auth';

export async function requireDnsUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { userId: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  return { userId, response: null };
}

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
}

export function validDomainName(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 253) return false;
  const name = value.trim().toLowerCase().replace(/\.$/, '');
  return name.length > 0 && name.split('.').length >= 2 &&
    name.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
}

export function validRecordType(value: unknown): value is string {
  return typeof value === 'string' && ['A','AAAA','CNAME','MX','TXT','NS','SRV','CAA','PTR','SOA','ALIAS'].includes(value.toUpperCase());
}

export function auditPayload(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as object;
}
